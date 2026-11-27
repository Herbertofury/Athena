use athena_defense_placement::skirmish::{BASE, BOARD, OUTPOST, Outcome, Skirmish, Tower, WIDTH};
use std::io::{self, BufRead, Write};

fn show(s: &Skirmish) {
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
    match s.outcome() { Outcome::Active => (), Outcome::Won => println!("VICTORY"), Outcome::Lost => println!("BASE LOST") }
}

fn cell(args: &[&str]) -> Option<usize> {
    let x = args.first()?.parse::<usize>().ok()?;
    let y = args.get(1)?.parse::<usize>().ok()?;
    (x < WIDTH && y < BOARD.len()).then(|| y * WIDTH + x)
}

fn main() -> io::Result<()> {
    let mut s = Skirmish::default();
    println!("OUTPOST // Athena's first two-lane skirmish");
    println!("Protect H through three waves. Send @ to guarded O for bonus ore. Build on +.");
    println!("move X Y | bolt X Y (7 ore) | pulse X Y (10 ore) | wait N (1–40) | quit");
    show(&s);
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
                    let result = match *c {
                        "move" => s.order(n),
                        "bolt" => s.build(n, Tower::Bolt),
                        _ => s.build(n, Tower::Pulse),
                    };
                    match result { Ok(()) => (), Err(err) => println!("Order refused: {err:?}") }
                } else { println!("Coordinates must be on the board."); }
            }
            ["wait", n] => match n.parse::<u32>() {
                Ok(n @ 1..=40) => for _ in 0..n { s.advance(); },
                _ => println!("Wait must be between 1 and 40."),
            },
            [] => continue,
            _ => println!("Unknown command."),
        }
        show(&s);
        if s.outcome() != Outcome::Active { break; }
    }
    Ok(())
}
