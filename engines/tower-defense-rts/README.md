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

## Browser playtest

The browser preview compiles the same Rust rules to WebAssembly; JavaScript only renders the board and sends inputs. From this directory with the Rust toolchain already installed:

```sh
rustup target add wasm32-unknown-unknown
cargo build --manifest-path browser/Cargo.toml --target wasm32-unknown-unknown --locked --offline --release
cp browser/target/wasm32-unknown-unknown/release/outpost_browser.wasm browser/web/outpost.wasm
python -m http.server 8080 --bind 127.0.0.1 --directory browser/web
```

Open `http://127.0.0.1:8080/`. PowerShell users can substitute `Copy-Item` for `cp`. The WASM is generated and is not checked in. After the local server opens the page, the playtest makes no external requests. It is not part of the released Athena app and does not save progress or implement optional roguelite runs.

## Terminal checkpoints and optional run draft

Run as before for **Classic**. To explicitly enable the first run-local post-wave draft, launch `cargo run --locked --offline --release --bin outpost -- --run 431` (choose an unsigned seed). At the end of the first wave, pick one offered reward with `choose OFFER OPTION`; the battle will not advance until you choose. No permanent rewards or account/profile data are written.

In either mode, use `checkpoint` and keep the one-line code. Relaunch with the same mode and seed, and type `resume CODE`. The versioned code stores accepted inputs and reconstructs the current battle, including a pending offer or squad movement. It does not contain a file path or write user files. Invalid or incompatible codes do not replace your current battle. The browser preview exposes the same controls under **Mode and checkpoints**. Classic is the default; choose Run draft, enter the same unsigned seed, and select Start selected mode before resuming a Run code. A code can move between the terminal and browser. Nothing is uploaded or saved automatically.
