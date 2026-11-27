//! First local Athena playtest: deterministic combat and contested expansion.
use super::{Map, Placement, Save};
use std::collections::{BTreeMap, BTreeSet, VecDeque};

pub const WIDTH: usize = 9;
pub const BOARD: [&str; 5] = ["#########", ".........", ".###.###.", ".........", "#########"];
pub const BASE: usize = 17;
pub const OUTPOST: usize = 22;
const SPAWNS: [usize; 2] = [9, 27];
const PADS: [usize; 8] = [2, 6, 19, 25, 37, 39, 41, 43];
const WAVES: [(u32, u8); 3] = [(5, 4), (13, 6), (21, 8)];

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Tower { Bolt, Pulse }
impl Tower {
    pub fn cost(self) -> u32 {
        match self { Self::Bolt => 7, Self::Pulse => 10 }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Outcome { Active, Won, Lost }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Reject { Finished, InvalidPad, AlreadyBuilt, InsufficientOre, NoSquad, NoRoute }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Invader { pub cell: usize, pub hp: u8 }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Squad { pub cell: usize, pub hp: u8 }

pub struct Skirmish {
    lanes: Placement,
    tick: u32,
    ore: u32,
    base_hp: u8,
    garrison_hp: u8,
    ownership: bool,
    squad: Option<Squad>,
    orders: VecDeque<usize>,
    towers: BTreeMap<usize, Tower>,
    invaders: Vec<Invader>,
    wave: usize,
    outcome: Outcome,
}

fn ground(cell: usize) -> bool {
    BOARD.get(cell / WIDTH).and_then(|row| row.as_bytes().get(cell % WIDTH)) == Some(&b'.')
}
fn reach(a: usize, b: usize) -> usize {
    (a / WIDTH).abs_diff(b / WIDTH) + (a % WIDTH).abs_diff(b % WIDTH)
}

impl Default for Skirmish {
    fn default() -> Self {
        let map = Map::new(WIDTH, BOARD.concat().bytes().map(|b| b == b'.').collect(), BASE, SPAWNS.to_vec()).unwrap();
        Self {
            lanes: Placement::restore(map, Save { funds: 0, revision: 0, walls: BTreeSet::new() }, 0).unwrap(),
            tick: 0, ore: 12, base_hp: 5, garrison_hp: 3, ownership: false,
            squad: Some(Squad { cell: 15, hp: 6 }), orders: VecDeque::new(),
            towers: BTreeMap::new(), invaders: Vec::new(), wave: 0, outcome: Outcome::Active,
        }
    }
}

impl Skirmish {
    pub fn clock(&self) -> u32 { self.tick }
    pub fn ore(&self) -> u32 { self.ore }
    pub fn base_hp(&self) -> u8 { self.base_hp }
    pub fn outpost_held(&self) -> bool { self.ownership }
    pub fn outpost_garrison(&self) -> u8 { self.garrison_hp }
    pub fn squad(&self) -> Option<Squad> { self.squad }
    pub fn towers(&self) -> &BTreeMap<usize, Tower> { &self.towers }
    pub fn invaders(&self) -> &[Invader] { &self.invaders }
    pub fn next_wave(&self) -> Option<u32> { WAVES.get(self.wave).map(|w| w.0) }
    pub fn outcome(&self) -> Outcome { self.outcome }
    pub fn is_pad(cell: usize) -> bool { PADS.contains(&cell) }

    pub fn build(&mut self, cell: usize, kind: Tower) -> Result<(), Reject> {
        if self.outcome != Outcome::Active { return Err(Reject::Finished); }
        if !Self::is_pad(cell) { return Err(Reject::InvalidPad); }
        if self.towers.contains_key(&cell) { return Err(Reject::AlreadyBuilt); }
        if self.ore < kind.cost() { return Err(Reject::InsufficientOre); }
        self.ore -= kind.cost();
        self.towers.insert(cell, kind);
        Ok(())
    }

    pub fn order(&mut self, destination: usize) -> Result<(), Reject> {
        if self.outcome != Outcome::Active { return Err(Reject::Finished); }
        let squad = self.squad.ok_or(Reject::NoSquad)?;
        if !ground(destination) { return Err(Reject::NoRoute); }
        let mut parent = [None; WIDTH * BOARD.len()];
        parent[squad.cell] = Some(squad.cell);
        let mut queue = VecDeque::from([squad.cell]);
        while let Some(cell) = queue.pop_front() {
            if cell == destination { break; }
            // Four-way connectivity; reject horizontal wrapping.
            for n in [cell.checked_sub(1), cell.checked_add(1), cell.checked_sub(WIDTH), cell.checked_add(WIDTH)].into_iter().flatten() {
                if ground(n) && reach(n, cell) == 1 && parent[n].is_none() {
                    parent[n] = Some(cell);
                    queue.push_back(n);
                }
            }
        }
        let mut path = VecDeque::new();
        let mut cell = destination;
        while cell != squad.cell {
            path.push_front(cell);
            cell = parent[cell].ok_or(Reject::NoRoute)?;
        }
        self.orders = path;
        Ok(())
    }

    pub fn advance(&mut self) {
        if self.outcome != Outcome::Active { return; }
        self.tick += 1;
        if let Some(mut squad) = self.squad {
            if let Some(next) = self.orders.pop_front() { squad.cell = next; }
            if squad.cell == OUTPOST && !self.ownership {
                self.garrison_hp -= 1;
                if self.garrison_hp == 0 { self.ownership = true; }
                else { squad.hp -= 1; }
            }
            if let Some(target) = self.invaders.iter_mut().find(|e| e.hp != 0 && reach(e.cell, squad.cell) <= 1) {
                target.hp = target.hp.saturating_sub(1);
                if target.hp != 0 { squad.hp = squad.hp.saturating_sub(1); }
            }
            self.squad = (squad.hp != 0).then_some(squad);
        }
        self.ore += if self.ownership { 3 } else { 1 };
        if let Some(&(due, hp)) = WAVES.get(self.wave).filter(|w| self.tick == w.0) {
            debug_assert_eq!(due, self.tick);
            self.invaders.extend(SPAWNS.map(|cell| Invader { cell, hp }));
            self.wave += 1;
        }
        for (&cell, kind) in &self.towers {
            let range = match kind { Tower::Bolt => 2, Tower::Pulse => 3 };
            match kind {
                Tower::Bolt => {
                    let target = self.invaders.iter_mut().filter(|e| e.hp != 0 && reach(cell, e.cell) <= range)
                        .min_by_key(|e| self.lanes.distance(e.cell).unwrap_or(u32::MAX));
                    if let Some(target) = target { target.hp = target.hp.saturating_sub(3); }
                }
                Tower::Pulse => {
                    for foe in self.invaders.iter_mut().filter(|e| reach(cell, e.cell) <= range) {
                        foe.hp = foe.hp.saturating_sub(1);
                    }
                }
            }
        }
        self.invaders.retain(|e| e.hp != 0);
        for foe in &mut self.invaders {
            foe.cell = self.lanes.next_step(foe.cell).unwrap_or(foe.cell);
            if foe.cell == BASE { self.base_hp = self.base_hp.saturating_sub(1); }
        }
        self.invaders.retain(|e| e.cell != BASE);
        self.outcome = if self.base_hp == 0 { Outcome::Lost } else if self.wave == WAVES.len() && self.invaders.is_empty() { Outcome::Won } else { Outcome::Active };
    }
}
