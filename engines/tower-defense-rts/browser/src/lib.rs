use athena_defense_placement::skirmish::{BASE, BOARD, OUTPOST, Outcome, Reject, Skirmish, Tower, WIDTH};
use athena_defense_placement::replay::{Battle, Command, Error, Mode, Reward};
use std::cell::RefCell;

const MAX_CHECKPOINT: u32 = 8192;

thread_local! {
    static GAME: RefCell<Battle> = RefCell::new(Battle::default());
    static OUTPUT: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
    static INPUT: RefCell<Option<(usize,Vec<u8>)>> = const { RefCell::new(None) };
}

fn code(r: Result<(), Reject>) -> u32 {
    match r {
        Ok(()) => 0, Err(Reject::Finished) => 1, Err(Reject::InvalidPad) => 2,
        Err(Reject::AlreadyBuilt) => 3, Err(Reject::InsufficientOre) => 4,
        Err(Reject::NoSquad) => 5, Err(Reject::NoRoute) => 6,
    }
}

// Each export has a distinct prefix and an integer-only ABI. No pointers cross the host boundary.
#[unsafe(no_mangle)]
pub extern "C" fn outpost_reset() { GAME.with_borrow_mut(|s| *s = Battle::new(s.mode())); }

#[unsafe(no_mangle)]
pub extern "C" fn outpost_view(field: u32) -> u32 {
    GAME.with_borrow(|battle| { let s = battle.state(); match field {
        0 => WIDTH as u32, 1 => BOARD.len() as u32, 2 => s.clock(), 3 => s.ore(),
        4 => s.base_hp().into(), 5 => s.outpost_garrison().into(), 6 => s.next_wave().unwrap_or(0),
        7 => match s.outcome() { Outcome::Active => 0, Outcome::Won => 1, Outcome::Lost => 2 },
        8 => s.squad().map_or(0, |s| s.hp.into()),
        9 => battle.offer().map_or(0, |o| o.id.into()),
        10 | 11 => battle.offer().map_or(0, |o| match o.options[(field-10) as usize] { Reward::Supply => 1, Reward::Repair => 2 }),
        12 => u32::from(matches!(battle.mode(), Mode::Run { .. })),
        _ => 0,
    } })
}

#[unsafe(no_mangle)]
pub extern "C" fn outpost_tile(tile: u32) -> u32 {
    let p = tile as usize;
    let Some(row) = BOARD.get(p / WIDTH) else { return 0; };
    GAME.with_borrow(|battle| {
        let s = battle.state();
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
    GAME.with_borrow(|battle| {
        if battle.offer().is_some() { return 8; }
        let s = battle.state();
        code(match action {
            0 => s.preview_move(tile as usize).map(|_| ()),
            1 => s.preview_build(tile as usize, Tower::Bolt),
            2 => s.preview_build(tile as usize, Tower::Pulse),
            _ => return 7,
        })
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn outpost_command(action: u32, arg: u32) -> u32 {
    let Ok(arg) = u16::try_from(arg) else { return 7; };
    let cmd = match action {
        0 => Command::Move(arg), 1 => Command::Bolt(arg), 2 => Command::Pulse(arg),
        3 if (1..=40).contains(&arg) => Command::Advance(arg), _ => return 7,
    };
    GAME.with_borrow_mut(|battle| battle_code(battle.apply(cmd)))
}

fn battle_code(result: Result<(), Error>) -> u32 {
    match result {
        Ok(()) => 0, Err(Error::Finished) => 1, Err(Error::Rejected(e)) => code(Err(e)),
        Err(Error::NeedsChoice) => 8, Err(Error::InvalidChoice) => 9, Err(_) => 7,
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn outpost_new(run: u32, seed_lo:u32, seed_hi:u32) -> u32 {
    let mode = match run { 0 => Mode::Classic, 1 => Mode::Run { seed: (u64::from(seed_hi)<<32)|u64::from(seed_lo) }, _ => return 7 };
    GAME.with_borrow_mut(|b| *b = Battle::new(mode)); 0
}

#[unsafe(no_mangle)]
pub extern "C" fn outpost_choose(offer:u32, option:u32) -> u32 {
    let (Ok(offer),Ok(option))=(u16::try_from(offer),u16::try_from(option)) else { return 9; };
    GAME.with_borrow_mut(|b| battle_code(b.apply(Command::Choose { offer, option })))
}

#[unsafe(no_mangle)]
pub extern "C" fn outpost_prepare_save() -> u32 {
    let bytes=GAME.with_borrow(|b| b.checkpoint().into_bytes());
    let len=bytes.len() as u32;
    OUTPUT.with_borrow_mut(|x| *x=bytes); len
}

#[unsafe(no_mangle)]
pub extern "C" fn outpost_save_byte(i:u32) -> u32 {
    OUTPUT.with_borrow(|x| x.get(i as usize).map_or(256,|b| u32::from(*b)))
}

#[unsafe(no_mangle)]
pub extern "C" fn outpost_begin_restore(length:u32) -> u32 {
    INPUT.with_borrow_mut(|buf| *buf=(length>0&&length<=MAX_CHECKPOINT).then(|| (length as usize, Vec::with_capacity(length as usize))));
    if length>0&&length<=MAX_CHECKPOINT { 0 } else { 10 }
}

#[unsafe(no_mangle)]
pub extern "C" fn outpost_restore_byte(byte:u32) -> u32 {
    INPUT.with_borrow_mut(|buf| {
        if let Some((len,data))=buf {
            if byte<=127&&data.len()<*len { data.push(byte as u8); return 0; }
        }
        *buf=None; 10
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn outpost_finish_restore() -> u32 {
    let Some((len,data))=INPUT.with_borrow_mut(Option::take) else { return 10; };
    if len!=data.len(){return 10;}
    let Ok(text)=String::from_utf8(data) else { return 10; };
    let Ok(new)=Battle::restore(&text) else { return 10; };
    GAME.with_borrow_mut(|old| {
        if old.mode()!=new.mode() { return 11; }
        *old=new; 0
    })
}
