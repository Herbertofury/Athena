# Retain long project descriptions without losing the existing projection

2026-10-27. Primary schema source: COL02. Actual public Modrinth responses, isolated local parsing and configured-durable snapshot checks. This is a data-retention improvement, not a speedup claim.

## Change and boundaries

The existing Rust adapter now preserves the long `body` text as an optional field. Absent/legacy remains unknown (`None`), explicitly empty remains an empty string, and wrong-type values fail validation. No HTML is executed, no description-linked asset is fetched and no additional host is authorized. The UI's existing result inspector uses text, not HTML insertion. Gallery order, originals, IDs and every prior projected field remain unchanged.

[Official project schema](https://docs.modrinth.com/api/operations/getproject/) documents the long description separately from the short summary. This is groundwork for a later media inventory, not implemented body-image/video extraction, playable media or complete platform coverage.

## Evidence

`baseline_modrinth.rs` preserves the adapter source from Atlas commit `4d4bd0b4cc82f2060e82948dbcbec69c92352d72`. The example invokes the old and new parser against exactly the same bytes, compares all prior fields, and checks the complete new body against the source response. It alternates order, retains four warmup rounds and 20 measured rounds of 100 parses per case.

Sodium, Lithium and Iris bodies contained 5,422, 2,469 and 1,394 UTF-8 bytes. Projected payloads grew from 5,898 to 11,401; 2,302 to 4,830; and 4,420 to 5,845 bytes respectively. Every prior field matched and every new body was exact. Raw timings and source/body hashes are retained in the initial and durable directories. Original response bodies remain local rather than republishing third-party long-form text.

The durable pass measured old/new median parse times around 23.32/25.07 microseconds (Sodium), 14.79/16.43 (Lithium), and 21.89/24.02 (Iris). The first pass was slower for the new parser too; neither is hidden. Additional allocation/copying has a real cost. These small local numbers do not establish browser responsiveness or a universal ranking.

Each project was saved through the existing SnapshotStore with SQLite synchronous FULL, closed, reopened and compared as a complete object. All matched. Recorded write-plus-commit observations are one sample per project, not a throughput ranking or power-loss durability test; the execution filesystem is not a production storage device.

## Reproduce and remaining gates

Build `cargo build --locked --release --example body_projection_lab`. Run the example with a legitimately collected local project-response JSON path and, optionally, a fresh database path. Existing databases are rejected rather than overwritten. Source responses have a two-MiB bound; job result limits remain intact.

59 Rust unit and three integration tests passed, including large-body roundtrip, single/batch parity, absent versus empty, malformed body and persisted-body checks. Peak memory, high-density UI interaction, media parsing and all-platform collection remain separate work. No target project's implementation, wiki or TODO receives a recommendation from this experiment.

## Live queue confirmation

The actual local HTTP batch path completed 23 checks with Sodium, Lithium and Iris: all long bodies were present, body hashes matched the independently captured single-project responses, prior gallery/version counts were preserved, and complete job results survived reopening. The receipt publishes counts and hashes, not the long-form third-party text. The repeatable helper preserves existing evidence and requires an unused loopback port and fresh output paths.
