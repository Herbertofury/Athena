use athena_foundry_store::{Result, Soundtrack, Store};
use std::{io::Read, path::Path};
fn run() -> Result<()> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 3 {
        return Err("Usage: athena-foundry-store init|status|assign|read DB [THEME ROOM]; assign reads JSON on stdin".into());
    }
    let p = Path::new(&args[2]);
    match args[1].as_str() {
        "init" if args.len() == 3 => {
            println!("{}", serde_json::to_string(&Store::create(p)?.summary()?)?)
        }
        "status" if args.len() == 3 => {
            println!("{}", serde_json::to_string(&Store::open(p)?.summary()?)?)
        }
        "assign" if args.len() == 3 => {
            let mut input = String::new();
            std::io::stdin().take(8193).read_to_string(&mut input)?;
            if input.len() > 8192 {
                return Err("Assignment exceeds limit".into());
            }
            let value: Soundtrack = serde_json::from_str(&input)?;
            Store::open(p)?.assign(&value)?;
            println!("{{\"saved\":true}}");
        }
        "read" if args.len() == 5 => println!(
            "{}",
            serde_json::to_string(&Store::open(p)?.soundtrack(&args[3], &args[4])?)?
        ),
        _ => return Err("Unsupported command or argument count".into()),
    }
    Ok(())
}
fn main() {
    if let Err(e) = run() {
        eprintln!("{e}");
        std::process::exit(1);
    }
}
