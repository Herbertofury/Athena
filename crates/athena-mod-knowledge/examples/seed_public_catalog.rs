//! Small reviewed factual catalog, not scraped compatibility or a complete corpus.
use athena_mod_knowledge::{Observation, Result, Store};
fn main() -> Result<()> {
    let path = std::env::args()
        .nth(1)
        .ok_or("Supply a new output SQLite path")?;
    if std::path::Path::new(&path).exists() {
        return Err("Output exists; refusing to overwrite".into());
    }
    let mut s = Store::open(&path)?;
    s.register_game("minecraft-java", "Minecraft Java Edition")?;
    s.register_game("skyrim-se", "Skyrim Special Edition")?;
    // Permission applies to original short factual descriptions and source links only,
    // not copying repository code, artwork, README bodies or full third-party databases.
    let revision = "reviewed-public-facts-2026-11-14";
    for (id, game, kind, name, url, value) in [
        (
            "github:CaffeineMC/sodium",
            "minecraft-java",
            "mod",
            "Sodium",
            "https://github.com/CaffeineMC/sodium",
            "Minecraft rendering optimization project; catalog identity only, no measured performance or compatibility claim.",
        ),
        (
            "github:CaffeineMC/lithium",
            "minecraft-java",
            "mod",
            "Lithium",
            "https://github.com/CaffeineMC/lithium",
            "Minecraft game-performance optimization project; exact release compatibility remains unverified here.",
        ),
        (
            "github:ianpatt/skse64",
            "skyrim-se",
            "tool",
            "Skyrim Script Extender (SKSE64)",
            "https://github.com/ianpatt/skse64",
            "Script extender project for Skyrim Special Edition; official project links to https://skse.silverlock.org. Match a supported runtime before use.",
        ),
    ] {
        s.set_source_policy(id, url, true, true, revision)?;
        s.register_entity(id, game, kind, name)?;
        s.import(&[Observation {
            id: format!("{id}:catalog:2026-11-14"),
            entity_id: id.into(),
            source_id: id.into(),
            source_url: url.into(),
            predicate: "catalog_description".into(),
            value: value.into(),
            observed_unix: 1794697913,
            applicable_build: "unverified".into(),
            mod_version: "unverified".into(),
            completeness: "partial".into(),
            policy_revision: revision.into(),
        }])?;
    }
    println!(
        "Created 3 source-attributed public catalog records. Compatibility coverage is unverified."
    );
    Ok(())
}
