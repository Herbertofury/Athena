# Outpost: first Tower Defense + RTS playtest

This experimental Rust crate is the first executable slice of Athena's [Tower Defense + RTS design](../TOWER-DEFENSE-RTS-RESEARCH.md), not a canonical engine package or an Athena app release. All code and map content here are original to this prototype; no external engine code, art, audio or assets are included. There is no network or account dependency.

From this directory with the Rust toolchain installed:

```sh
cargo run --locked --offline --release --bin outpost
cargo test --locked --offline --release
```

Defend H for three telegraphed waves. Build Bolt or Pulse towers on +. Use `move X Y` to send your squad (@) to the guarded outpost (O) for three ore per turn instead of one, or leave it neutral and hold both approaches. The map displays coordinates. `wait N` advances 1–40 deterministic turns; it does not sleep or run in the background. Outcomes stop the simulation. No progression system is needed to win.

The executed acceptance tests drive the real terminal app through capture-and-win and fortify-and-win command traces. Other tests cover a failed defense, placement rejection, route recalculation, stale revisions and navigation restore. Tactical UI is terminal only; the in-memory placement snapshot is not a complete skirmish save. RTS squad orders and tower attacks are currently turn-stepped. Real-time input, replay/save across hosts, a graphical host, declarative scenarios and opt-in roguelite progression are separate milestones. The existing design brief remains authoritative for the broader goals, tracked in [Engine Foundry M5](https://github.com/Herbertofury/Athena/issues/365).

Optional local preview benchmark: `cargo run --locked --offline --release --example placement_bench`. It measures only the synthetic placement workload, not full gameplay or UI timing.
