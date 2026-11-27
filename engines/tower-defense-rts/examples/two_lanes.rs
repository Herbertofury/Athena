use athena_defense_placement::{Error, Map, Placement, Save};
use std::collections::BTreeSet;

fn map() -> Map {
    let cells = ["#######", ".......", ".#####.", ".......", "#######"]
        .concat().bytes().map(|b| b == b'.').collect();
    Map::new(7, cells, 13, vec![7, 21]).expect("valid map")
}

fn main() {
    let empty = Save { funds: 30, revision: 0, walls: BTreeSet::new() };
    let mut fight = Placement::restore(map(), empty, 10).unwrap();
    fight.place(10, 0).unwrap();
    println!("Upper barrier: {:?}; {} resources left",
        [fight.distance(7), fight.distance(21)], fight.save().funds);
    let mut fight = Placement::restore(map(), fight.save().clone(), 10).unwrap();
    assert_eq!(fight.place(24, 1), Err(Error::SealsRoute));
    println!("Lower barrier refused: must leave both spawns a route");
    fight.destroy(10, 1).unwrap();
    fight.place(24, 2).unwrap();
    println!("Removed upper barrier to build lower: {:?}; {} resources left",
        [fight.distance(7), fight.distance(21)], fight.save().funds);
}
