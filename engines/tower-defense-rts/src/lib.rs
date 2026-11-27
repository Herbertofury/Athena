#![forbid(unsafe_code)]
//! Original deterministic placement and shared navigation slice for a single map.
use std::collections::BTreeSet;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Error {
    InvalidMap, InvalidSave, InvalidCell, Occupied, Missing, Funds, SealsRoute, Stale, Exhausted,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Save {
    pub funds: u32,
    pub revision: u64,
    pub walls: BTreeSet<usize>,
}

pub struct Map {
    width: usize,
    ground: Vec<bool>,
    base: usize,
    spawns: Vec<usize>,
}

impl Map {
    pub fn new(width: usize, ground: Vec<bool>, base: usize, spawns: Vec<usize>) -> Result<Self, Error> {
        if width == 0 || ground.is_empty() || ground.len() > 1_048_576 || ground.len() % width != 0
            || ground.get(base) != Some(&true) || spawns.is_empty() || spawns.iter().any(|&s| ground.get(s) != Some(&true))
        {
            return Err(Error::InvalidMap);
        }
        let mut unique = BTreeSet::new();
        if spawns.iter().any(|&s| s == base || !unique.insert(s)) { return Err(Error::InvalidMap); }
        Ok(Self {width,ground,base,spawns})
    }

    fn field(&self, occupied: &[bool], extra: Option<usize>, removed: Option<usize>,
             dist: &mut [u32], queue: &mut Vec<usize>) -> bool {
        const NONE: u32 = u32::MAX;
        dist.fill(NONE);
        queue.clear();
        dist[self.base] = 0;
        queue.push(self.base);
        let mut i = 0;
        while i < queue.len() {
            let p = queue[i];
            i += 1;
            for n in self.neighbors(p) {
                if dist[n] == NONE && self.ground[n] && extra != Some(n)
                    && (removed == Some(n) || !occupied[n]) {
                    dist[n] = dist[p] + 1;
                    queue.push(n);
                }
            }
        }
        self.spawns.iter().all(|&s| dist[s] != NONE)
    }

    // Stable direction order breaks ties identically on every host.
    fn neighbors(&self, cell: usize) -> impl Iterator<Item = usize> {
        let x = cell % self.width;
        [
            (x > 0).then(|| cell - 1),
            (x + 1 < self.width).then(|| cell + 1),
            (cell >= self.width).then(|| cell - self.width),
            (cell + self.width < self.ground.len()).then(|| cell + self.width),
        ].into_iter().flatten()
    }

    fn buildable(&self, cell: usize) -> bool {
        self.ground.get(cell) == Some(&true) && cell != self.base && !self.spawns.contains(&cell)
    }
}

pub struct Placement {
    map: Map,
    state: Save,
    occupied: Vec<bool>,
    current: Vec<u32>,
    scratch: Vec<u32>,
    queue: Vec<usize>,
    cost: u32,
}

impl Placement {
    pub fn restore(map: Map, state: Save, cost: u32) -> Result<Self, Error> {
        if state.walls.iter().any(|&w| !map.buildable(w)) { return Err(Error::InvalidSave); }
        let n = map.ground.len();
        let mut occupied = vec![false; n];
        for &cell in &state.walls { occupied[cell] = true; }
        let mut result = Self { map, state, occupied, current: vec![0; n], scratch: vec![0; n], queue: Vec::new(), cost };
        if !result.map.field(&result.occupied, None, None, &mut result.current, &mut result.queue) {
            return Err(Error::InvalidSave);
        }
        Ok(result)
    }

    pub fn save(&self) -> &Save { &self.state }

    pub fn distance(&self, cell: usize) -> Option<u32> {
        self.current.get(cell).copied().filter(|&d| d != u32::MAX)
    }

    /// Follow the committed route, not a speculative preview. None means arrival or no route.
    pub fn next_step(&self, cell: usize) -> Option<usize> {
        let next_dist = self.distance(cell)?.checked_sub(1)?;
        self.map.neighbors(cell).find(|&p| self.distance(p) == Some(next_dist))
    }

    /// A valid preview is not a reservation. Pass the current revision at commit.
    pub fn preview(&mut self, cell: usize) -> Result<(), Error> {
        if !self.map.buildable(cell) { return Err(Error::InvalidCell); }
        if self.occupied[cell] { return Err(Error::Occupied); }
        if self.state.funds < self.cost { return Err(Error::Funds); }
        if !self.map.field(&self.occupied, Some(cell), None, &mut self.scratch, &mut self.queue) {
            return Err(Error::SealsRoute);
        }
        Ok(())
    }

    pub fn place(&mut self, cell: usize, revision: u64) -> Result<(), Error> {
        if revision != self.state.revision { return Err(Error::Stale); }
        let next = revision.checked_add(1).ok_or(Error::Exhausted)?;
        self.preview(cell)?;
        self.state.walls.insert(cell);
        self.occupied[cell] = true;
        self.state.funds -= self.cost;
        self.state.revision = next;
        std::mem::swap(&mut self.current, &mut self.scratch);
        Ok(())
    }

    pub fn destroy(&mut self, cell: usize, revision: u64) -> Result<(), Error> {
        if revision != self.state.revision { return Err(Error::Stale); }
        let next = revision.checked_add(1).ok_or(Error::Exhausted)?;
        if !self.state.walls.contains(&cell) { return Err(Error::Missing); }
        self.map.field(&self.occupied, None, Some(cell), &mut self.scratch, &mut self.queue);
        self.state.walls.remove(&cell);
        self.occupied[cell] = false;
        self.state.revision = next;
        std::mem::swap(&mut self.current, &mut self.scratch);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    const UPPER: usize = 10;
    const LOWER: usize = 24;
    fn level() -> Map {
        Map::new(7, ["#######",".......",".#####.",".......","#######"]
            .concat().bytes().map(|b| b == b'.').collect(), 13, vec![7, 21]).unwrap()
    }
    fn start(funds: u32, revision: u64) -> Placement {
        Placement::restore(level(), Save { funds, revision, walls: BTreeSet::new() }, 10).unwrap()
    }
    fn distances(p: &Placement) -> [Option<u32>; 2] { [p.distance(7), p.distance(21)] }

    #[test]
    fn concurrent_previews_do_not_reserve_or_mutate() {
        for (first, second, expected) in [(UPPER, LOWER, [10,8]), (LOWER, UPPER,[6,8])] {
            let mut p = start(30,0);
            let before = p.save().clone();
            assert_eq!(distances(&p), [Some(6),Some(8)]);
            assert_eq!(p.preview(first), Ok(()));
            assert_eq!(p.preview(second), Ok(()));
            assert_eq!(p.save(), &before);
            assert_eq!(p.place(first,0), Ok(()));
            let placed = p.save().clone();
            assert_eq!(p.place(second,0), Err(Error::Stale));
            assert_eq!(p.place(second,1), Err(Error::SealsRoute));
            assert_eq!(p.save(), &placed);
            assert_eq!(p.save().funds, 20);
            assert_eq!(distances(&p), expected.map(Some));
        }
    }

    #[test]
    fn live_routes_follow_the_committed_field_before_and_after_restore() {
        let mut p = start(30,0);
        p.preview(UPPER).unwrap();
        assert_eq!(p.next_step(7), Some(8));
        p.place(UPPER,0).unwrap();
        assert_eq!(p.next_step(7), Some(14));
        let p = Placement::restore(level(), p.save().clone(), 10).unwrap();
        for (spawn, len) in [(7, 10), (21, 8)] {
            let mut cell = spawn;
            for remaining in (1..=len).rev() {
                assert_eq!(p.distance(cell), Some(remaining));
                cell = p.next_step(cell).unwrap();
            }
            assert_eq!(cell, 13);
            assert_eq!(p.next_step(cell), None);
        }
        assert_eq!(p.next_step(UPPER), None);
        assert_eq!(p.next_step(usize::MAX), None);
        assert_eq!(p.next_step(0), None);
    }

    #[test]
    fn restore_and_destroy_open_route_without_spending() {
        let mut p = start(30,0);
        p.place(UPPER,0).unwrap();
        let mut p = Placement::restore(level(),p.save().clone(),10).unwrap();
        assert_eq!(p.place(LOWER,1), Err(Error::SealsRoute));
        p.destroy(UPPER,1).unwrap();
        assert_eq!(distances(&p),[Some(6),Some(8)]);
        assert_eq!(p.save().funds,20);
        p.place(LOWER,2).unwrap();
        assert_eq!((p.save().funds,p.save().revision),(10,3));
    }

    // Independent forward BFS for every small map and individual build attempt.
    #[test]
    fn exhaustive_three_by_three_matches_forward_route_oracle() {
        use std::collections::VecDeque;
        fn forward(ground: &[bool], blocked: Option<usize>, spawn: usize) -> Option<u32> {
            let mut seen = [false; 9];
            let mut todo = VecDeque::from([(spawn, 0)]);
            seen[spawn] = true;
            while let Some((p, d)) = todo.pop_front() {
                if p == 8 { return Some(d); }
                for n in 0_usize..9 {
                    let adjacent = (p / 3).abs_diff(n / 3) + (p % 3).abs_diff(n % 3) == 1;
                    if adjacent && !seen[n] && ground[n] && Some(n) != blocked {
                        seen[n] = true;
                        todo.push_back((n, d + 1));
                    }
                }
            }
            None
        }
        for mask in 0..512 {
            let ground: Vec<bool> = (0..9).map(|i| mask & (1 << i) != 0).collect();
            if !ground[0] || !ground[6] || !ground[8] { continue; }
            let baseline = [forward(&ground, None, 0), forward(&ground, None, 6)];
            let map = Map::new(3, ground.clone(),8,vec![0,6]).unwrap();
            let initial = Save { funds: 2,revision: 0,walls: BTreeSet::new() };
            let restored = Placement::restore(map,initial.clone(),1);
            if baseline.contains(&None) {
                assert!(matches!(restored,Err(Error::InvalidSave)));
                continue;
            }
            let mut p = restored.unwrap();
            assert_eq!([p.distance(0),p.distance(6)],baseline);
            for cell in [1,2,3,4,5,7] {
                let expected = [forward(&ground, Some(cell),0), forward(&ground,Some(cell),6)];
                let status = if !ground[cell] {Err(Error::InvalidCell)}
                    else if expected.contains(&None) {Err(Error::SealsRoute)} else {Ok(())};
                assert_eq!(p.preview(cell),status,"mask {mask} cell {cell}");
                assert_eq!(p.save(),&initial);
            }
        }
    }

    #[test]
    fn rejects_invalid_endpoints_saves_funds_and_overflow() {
        let mut p = start(5,0);
        assert_eq!(p.place(UPPER,0),Err(Error::Funds));
        assert_eq!(p.place(13,0),Err(Error::InvalidCell));
        assert_eq!(p.place(7,0),Err(Error::InvalidCell));
        let mut p = start(30,u64::MAX);
        assert_eq!(p.place(UPPER,u64::MAX),Err(Error::Exhausted));
        assert!(matches!(Placement::restore(level(), Save {funds:1, revision:1, walls:BTreeSet::from([UPPER,LOWER])},10), Err(Error::InvalidSave)));
    }
}

pub mod skirmish;

pub mod replay;
