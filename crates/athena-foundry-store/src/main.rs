use athena_foundry_store::{Result, Soundtrack, Store, import_legacy, inspect_legacy};
use std::{io::Read, path::Path};
fn run() -> Result<()> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 3 {
        return Err("Usage: athena-foundry-store init|status|assign|read DB [THEME ROOM]; assign reads JSON on stdin".into());
    }
    let p = Path::new(&args[2]);
    match args[1].as_str() {
        "upgrade-blend-modes" if args.len() == 3 => {
            Store::open(p)?.migrate_blend_modes()?;
            println!("{}", serde_json::to_string(&Store::open(p)?.summary()?)?);
        }
        "upgrade-filters" if args.len() == 3 => {
            let mut store = Store::open(p)?;
            store.migrate_filters()?;
            println!("{}", serde_json::to_string(&store.summary()?)?);
        }
        "upgrade-environments" if args.len() == 3 => {
            Store::open(p)?.migrate_environments()?;
            println!("{}", serde_json::to_string(&Store::open(p)?.summary()?)?);
        }
        "upgrade-origins" if args.len() == 3 => {
            let mut store = Store::open(p)?;
            store.migrate_origins()?;
            println!("{}", serde_json::to_string(&store.summary()?)?);
        }
        "upgrade-appearance" if args.len() == 3 => {
            let mut store = Store::open(p)?;
            store.migrate_appearance()?;
            println!("{}", serde_json::to_string(&store.summary()?)?);
        }
        "upgrade-instances" if args.len() == 3 => {
            let mut store = Store::open(p)?;
            store.migrate_instances()?;
            println!("{}", serde_json::to_string(&store.summary()?)?);
        }
        "upgrade-targets" if args.len() == 3 => {
            let mut store = Store::open(p)?;
            store.migrate_targets()?;
            println!("{}", serde_json::to_string(&store.summary()?)?);
        }
        "upgrade-environment" if args.len() == 3 => {
            let mut store = Store::open(p)?;
            store.migrate_environment()?;
            println!("{}", serde_json::to_string(&store.summary()?)?);
        }
        "upgrade-scopes" if args.len() == 3 => {
            let mut store = Store::open(p)?;
            store.migrate_scopes()?;
            println!("{}", serde_json::to_string(&store.summary()?)?);
        }
        "upgrade-transforms" if args.len() == 3 => {
            Store::open(p)?.migrate_transforms()?;
            println!("{}", serde_json::to_string(&Store::open(p)?.summary()?)?);
        }
        "upgrade-soundtracks" if args.len() == 3 => {
            Store::open(p)?.migrate_soundtrack_metadata()?;
            println!("{}", serde_json::to_string(&Store::open(p)?.summary()?)?);
        }
        "import-music-json" if args.len() == 3 => {
            let mut text = String::new();
            std::io::stdin().take(1_000_001).read_to_string(&mut text)?;
            if text.len() > 1_000_000 {
                return Err("Music import exceeds limit".into());
            }
            let value =
                serde_json::from_str::<athena_foundry_store::music_import::MusicImport>(&text)?;
            let count = Store::open(p)?.import_music(&value)?;
            println!("{{\"imported\":{count}}}");
        }
        "assign-native" if args.len() == 3 => {
            let mut text = String::new();
            std::io::stdin().take(8193).read_to_string(&mut text)?;
            if text.len() > 8192 {
                return Err("Assignment exceeds limit".into());
            }
            let v =
                serde_json::from_str::<athena_foundry_store::metadata::NativeAssignment>(&text)?;
            println!(
                "{}",
                serde_json::to_string(&Store::open(p)?.assign_native(&v)?)?
            );
        }
        "read-native-versioned" if args.len() == 5 => println!(
            "{}",
            serde_json::to_string(&Store::open(p)?.soundtrack_versioned(&args[3], &args[4])?)?
        ),
        "compare-assign-soundtrack" if args.len() == 3 => {
            #[derive(serde::Deserialize)]
            #[serde(deny_unknown_fields)]
            struct Request {
                expected: String,
                assignment: Soundtrack,
            }
            let mut input = String::new();
            std::io::stdin().take(16385).read_to_string(&mut input)?;
            if input.len() > 16384 {
                return Err("Assignment request exceeds limit".into());
            }
            let req: Request = serde_json::from_str(&input)?;
            println!(
                "{}",
                serde_json::to_string(
                    &Store::open(p)?.compare_assign_soundtrack(&req.expected, &req.assignment)?
                )?
            );
        }
        "read-native" if args.len() == 5 => println!(
            "{}",
            serde_json::to_string(&Store::open(p)?.soundtrack_native(&args[3], &args[4])?)?
        ),
        "upgrade-history" if args.len() == 3 => {
            Store::open(p)?.migrate_history()?;
            println!("{}", serde_json::to_string(&Store::open(p)?.summary()?)?);
        }
        "read-revision" if args.len() == 4 => {
            println!("{}", Store::open(p)?.read_revision(args[3].parse()?)?)
        }
        "revisions" if args.len() == 3 => {
            println!("{}", serde_json::to_string(&Store::open(p)?.revisions()?)?)
        }
        "restore-revision" if args.len() == 4 => {
            let id = Store::open(p)?.restore_revision(args[3].parse()?)?;
            println!("{{\"restored_revision\":{id}}}");
        }
        "upgrade-backups" if args.len() == 3 => {
            Store::open(p)?.migrate_backups()?;
            println!("{}", serde_json::to_string(&Store::open(p)?.summary()?)?);
        }
        "compare-restore-revision" if args.len() == 3 => {
            #[derive(serde::Deserialize)]
            #[serde(deny_unknown_fields)]
            struct Request {
                expected: String,
                id: i64,
            }
            let mut input = String::new();
            std::io::stdin().take(1025).read_to_string(&mut input)?;
            if input.len() > 1024 {
                return Err("Restore request exceeds limit".into());
            }
            let request: Request = serde_json::from_str(&input)?;
            println!(
                "{}",
                serde_json::to_string(
                    &Store::open(p)?.compare_restore_revision(&request.expected, request.id)?
                )?
            );
        }
        "compare-save-backup" if args.len() == 3 => {
            #[derive(serde::Deserialize)]
            #[serde(deny_unknown_fields)]
            struct Request {
                expected: String,
                text: String,
            }
            let mut input = String::new();
            std::io::stdin()
                .take(8_000_001)
                .read_to_string(&mut input)?;
            if input.len() > 8_000_000 {
                return Err("Request exceeds limit".into());
            }
            let request: Request = serde_json::from_str(&input)?;
            let result = Store::open(p)?.compare_save_backup(&request.expected, &request.text)?;
            println!(
                "{}",
                serde_json::json!({"saved":result.is_some(),"version":result})
            );
        }
        "save-backup" if args.len() == 3 => {
            let mut input = String::new();
            std::io::stdin()
                .take(4_000_001)
                .read_to_string(&mut input)?;
            if input.len() > 4_000_000 {
                return Err("Workspace exceeds UTF-8 byte ceiling".into());
            }
            Store::open(p)?.save_backup(&input)?;
            println!("{{\"saved\":true}}");
        }
        "load-backup" if args.len() == 3 => match Store::open(p)?.load_backup()? {
            Some(v) => println!("{v}"),
            None => println!("null"),
        },
        "inspect-legacy" if args.len() == 3 => {
            println!("{}", serde_json::to_string(&inspect_legacy(p)?)?)
        }
        "import-legacy" if args.len() == 4 => println!(
            "{}",
            serde_json::to_string(&import_legacy(p, Path::new(&args[3]))?)?
        ),
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
