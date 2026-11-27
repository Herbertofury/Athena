use athena_defense_placement::{Map, Placement, Save};
use std::{collections::BTreeSet, hint::black_box, time::Instant};

fn main() {
    const W: usize = 256;
    let ground = vec![true; W * W];
    let map = Map::new(W, ground, W * W - 1, vec![0, W - 1, W * (W - 1)]).unwrap();
    let walls = (1..W-1).step_by(2).flat_map(|y| (1..W-1).step_by(3).map(move |x| y * W + x))
        .collect::<BTreeSet<_>>();
    let size = walls.len();
    let mut sample = Placement::restore(map, Save{funds:1000,revision:0,walls},10).unwrap();
    let mut timings = (0..120).map(|i| {
        let cell = (2 + (i % 100) * 2) * W + 120;
        let now = Instant::now();
        black_box(sample.preview(black_box(cell))).unwrap();
        now.elapsed().as_micros()
    }).collect::<Vec<_>>();
    timings.drain(..20);
    timings.sort_unstable();
    println!("{W}x{W}; {size} walls; 100 warmed preview samples; p50={} p95={} microseconds", timings[50],timings[95]);
}
