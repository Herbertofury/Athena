use athena_defense_placement::replay::{Battle, Command, Mode, Reward};
use athena_defense_placement::skirmish::{BASE, BOARD, OUTPOST, Outcome, Skirmish, Tower, WIDTH};
use std::io::{self, BufRead, Write};

fn show(battle: &Battle) {
    let s = battle.state();
    println!("Tick {} | ore {} | base {} HP | outpost {} | next wave {}",
        s.clock(), s.ore(), s.base_hp(),
        if s.outpost_held() { "HELD (+2 ore/tick)".into() } else { format!("guarded ({} HP)", s.outpost_garrison()) },
        s.next_wave().map_or_else(|| "none".into(), |t| t.to_string()));
    println!("  012345678");
    for (y, row) in BOARD.iter().enumerate() {
        print!("{y} ");
        for (x, glyph) in row.chars().enumerate() {
            let cell = y * WIDTH + x;
            let icon = if s.squad().is_some_and(|squad| squad.cell == cell) { '@' }
                else if s.invaders().iter().any(|f| f.cell == cell) { '!' }
                else if cell == BASE { 'H' }
                else if cell == OUTPOST { if s.outpost_held() { 'o' } else { 'O' } }
                else if let Some(kind) = s.towers().get(&cell) { match kind { Tower::Bolt => 'B', Tower::Pulse => 'P' } }
                else if Skirmish::is_pad(cell) { '+' }
                else { glyph };
            print!("{icon}");
        }
        println!();
    }
    if let Some(squad) = s.squad() { println!("Squad: {} HP", squad.hp); } else { println!("Squad lost."); }
    if let Some(offer) = battle.offer() {
        println!("Wave cleared. Choose a reward before the next turn:");
        for (i, reward) in offer.options.iter().enumerate() {
            let text = match reward { Reward::Supply => "+5 ore", Reward::Repair => "+1 bastion HP (up to 5)" };
            println!("choose {} {i}: {text}", offer.id);
        }
    }
    match s.outcome() { Outcome::Active => (), Outcome::Won => println!("VICTORY"), Outcome::Lost => println!("BASE LOST") }
}

fn cell(args: &[&str]) -> Option<usize> {
    let x = args.first()?.parse::<usize>().ok()?;
    let y = args.get(1)?.parse::<usize>().ok()?;
    (x < WIDTH && y < BOARD.len()).then(|| y * WIDTH + x)
}

fn main() -> io::Result<()> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    let mode = match args.as_slice() {
        [] => Mode::Classic,
        [flag, seed] if flag == "--run" => Mode::Run {
            seed: seed.parse().map_err(|_| io::Error::new(io::ErrorKind::InvalidInput,"Seed must be an unsigned integer"))?,
        },
        _ => return Err(io::Error::new(io::ErrorKind::InvalidInput,"Use outpost [--run SEED]")),
    };
    let mut battle = Battle::new(mode);
    println!("OUTPOST // Athena's first two-lane skirmish");
    println!("Protect H through three waves. Send @ to guarded O for bonus ore. Build on +.");
    println!("move X Y | bolt X Y (7 ore) | pulse X Y (10 ore) | wait N (1–40) | quit");
    println!("checkpoint | resume CODE | choose OFFER OPTION (run mode only)");
    show(&battle);
    let input = io::stdin();
    let mut stdin = input.lock();
    let mut command = String::new();
    loop {
        print!("> ");
        io::stdout().flush()?;
        command.clear();
        if stdin.read_line(&mut command)? == 0 { break; }
        let args: Vec<_> = command.split_whitespace().collect();
        match args.as_slice() {
            ["quit"] => break,
            [c @ ("move" | "bolt" | "pulse"), xy @ ..] if xy.len() == 2 => {
                if let Some(n) = cell(xy) {
                    let cmd = match *c {
                        "move" => Command::Move(n as u16),
                        "bolt" => Command::Bolt(n as u16),
                        _ => Command::Pulse(n as u16),
                    };
                    let result = battle.apply(cmd);
                    match result { Ok(()) => (), Err(err) => println!("Order refused: {err:?}") }
                } else { println!("Coordinates must be on the board."); }
            }
            ["wait", n] => match n.parse::<u16>() {
                Ok(n @ 1..=40) => if let Err(e) = battle.apply(Command::Advance(n)) { println!("Order refused: {e:?}"); },
                _ => println!("Wait must be between 1 and 40."),
            },
            ["checkpoint"] => println!("Checkpoint: {}", battle.checkpoint().replace(' ', "~").replace('\n', "|")),
            ["resume", code] if code.len() <= 8192 => match Battle::restore(&code.replace('~', " ").replace('|', "\n")) {
                Ok(saved) if saved.mode() == mode => { battle = saved; println!("Checkpoint restored."); }
                Ok(_) => println!("Checkpoint refused: launch with the matching mode and seed."),
                Err(e) => println!("Checkpoint refused: {e:?}"),
            },
            ["resume", _] => println!("Checkpoint refused: size limit"),
            ["choose", offer, option] => match (offer.parse(), option.parse()) {
                (Ok(offer),Ok(option)) => if let Err(e) = battle.apply(Command::Choose { offer, option }) { println!("Choice refused: {e:?}"); },
                _ => println!("Choice needs a numeric offer and option."),
            },
            [] => continue,
            _ => println!("Unknown command."),
        }
        show(&battle);
        if battle.state().outcome() != Outcome::Active { break; }
    }
    Ok(())
}
