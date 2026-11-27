use athena_defense_placement::skirmish::{BASE, BOARD, OUTPOST, Outcome, Reject, Skirmish, Tower, WIDTH};
use std::cell::RefCell;

thread_local! { static GAME: RefCell<Skirmish> = RefCell::new(Skirmish::default()); }

fn code(r: Result<(), Reject>) -> u32 {
    match r {
        Ok(()) => 0, Err(Reject::Finished) => 1, Err(Reject::InvalidPad) => 2,
        Err(Reject::AlreadyBuilt) => 3, Err(Reject::InsufficientOre) => 4,
        Err(Reject::NoSquad) => 5, Err(Reject::NoRoute) => 6,
    }
}

// Each export has a distinct prefix and an integer-only ABI. No pointers cross the host boundary.
#[unsafe(no_mangle)]
pub extern "C" fn outpost_reset() { GAME.with_borrow_mut(|s| *s = Skirmish::default()); }

#[unsafe(no_mangle)]
pub extern "C" fn outpost_view(field: u32) -> u32 {
    GAME.with_borrow(|s| match field {
        0 => WIDTH as u32, 1 => BOARD.len() as u32, 2 => s.clock(), 3 => s.ore(),
        4 => s.base_hp().into(), 5 => s.outpost_garrison().into(), 6 => s.next_wave().unwrap_or(0),
        7 => match s.outcome() { Outcome::Active => 0, Outcome::Won => 1, Outcome::Lost => 2 },
        8 => s.squad().map_or(0, |s| s.hp.into()), _ => 0,
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn outpost_tile(tile: u32) -> u32 {
    let p = tile as usize;
    let Some(row) = BOARD.get(p / WIDTH) else { return 0; };
    GAME.with_borrow(|s| {
        let surface = if p == BASE { 2 } else if p == OUTPOST { if s.outpost_held() { 4 } else { 3 } }
            else if let Some(tower) = s.towers().get(&p) { match tower { Tower::Bolt => 6, Tower::Pulse => 7 } }
            else if Skirmish::is_pad(p) { 5 }
            else if row.as_bytes()[p % WIDTH] == b'.' { 1 } else { 0 };
        let troops = u32::from(s.squad().is_some_and(|squad| squad.cell == p)) << 4;
        let invaders = (s.invaders().iter().filter(|e| e.cell == p).count() as u32) << 8;
        surface | troops | invaders
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn outpost_preview(action: u32, tile: u32) -> u32 {
    GAME.with_borrow(|s| code(match action {
        0 => s.preview_move(tile as usize).map(|_| ()),
        1 => s.preview_build(tile as usize, Tower::Bolt),
        2 => s.preview_build(tile as usize, Tower::Pulse),
        _ => return 7,
    }))
}

#[unsafe(no_mangle)]
pub extern "C" fn outpost_command(action: u32, arg: u32) -> u32 {
    GAME.with_borrow_mut(|s| code(match action {
        0 => s.order(arg as usize),
        1 => s.build(arg as usize, Tower::Bolt),
        2 => s.build(arg as usize, Tower::Pulse),
        3 if (1..=40).contains(&arg) => { for _ in 0..arg { s.advance(); } Ok(()) },
        _ => return 7,
    }))
}
