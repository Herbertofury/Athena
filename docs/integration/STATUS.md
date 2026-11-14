# One Athena: native integration status

## Current implementation and public delivery (reviewed November 14, 2026)

Learning, Engineering and reviewed Foundry authoring are native modules under one Athena shell, not embedded applications. Engineering includes Research, Media, Cards, Audio, Receiver, Diagnostics and the local R&D Lab. The local Lab retains its Rust queue, SQLite journal, archived JSON and bounded experiments. Public Pages never probes localhost; privileged loopback mode disables external media.

Foundry is **included** in the reviewed runtime. [#87](https://github.com/Herbertofury/Athena/pull/87) integrated authoring, optional local SQLite/bridge adapters, environment/ecology/weather and explicit local video; [#88](https://github.com/Herbertofury/Athena/pull/88) added portable recovery/conversion tools. [#89](https://github.com/Herbertofury/Athena/pull/89) repaired startup draft loss and registry-dependent MIME types, with actual Ubuntu and Windows browser→bridge→Rust acceptance. [#90](https://github.com/Herbertofury/Athena/pull/90) preserves original theme/music preference values; [#91](https://github.com/Herbertofury/Athena/pull/91) respects authored ecology instances/deletions; [#92](https://github.com/Herbertofury/Athena/pull/92) routes explicit session-local video into selected authored objects. All six changes are merged; later main includes further independently reviewed improvements.

[Public Athena](https://herbertofury.github.io/Athena/) is served. The historical November 7 Pages setup failure below is not a current deployment blocker. A fresh November 14 check against main `144cdcf1bf2a37797bfcf91f67e82040b0284cd9` fetched `app.js` and `workspaces/foundry/index.mjs` with HTTP200; their SHA-256 values exactly matched that revision's reviewed manifest:

- `app.js`: `80ba9b56a8462f22ed03054841bdf3ec87dd46cf8ccbf2f0a3dcc008dfb6078b`
- `workspaces/foundry/index.mjs`: `1d1986c5fa8168d102feac23ee2536e376e3c569d69037f23ee86b71e6ae12a8`

This two-file live identity check is not a new whole-site visual test or proof that every historical source behavior is reproduced.

## Acceptance and remaining limits

- The #89 [native CI run43588181995](https://github.com/Herbertofury/Athena/actions/runs/43588181995), tied to head `cd2d44150e3f45579a9f67299a867d0e3d6cc411`, reports Ubuntu and Windows compilation/tests/lint and actual Chromium→Python loopback→Rust SQLite checks. This is not a packaged desktop installer or the owner's PC acceptance.
- Engineering source reconciliation and fresh Linux acceptance at `1bb931c73abefd5e9cd9646ab365e9794fd6f44a` covered196 Rust tests,23 static Chromium checks and8 actual engine/browser checks, including exact archives, one durable job and controlled restart integrity. A first renderer crash is retained; an unchanged serial rerun passed, without a proven root-cause diagnosis. These local audit results do not certify later revisions.
- Positive synthetic local audio/video playback is distinct from actual source-provider playback. The pinned public audio source returned403 during the audit; it was not bypassed. Private/authenticated providers, arbitrary codecs and real collection completeness remain unverified by those tests.
- Original Foundry full rendering, physics, artist-world and media fidelity, lossless private user-data migration, and all native platform behaviors are **not complete**. Recovery tools preserve/inspect selected formats under explicit constraints; they do not demonstrate a completed real-user import. Eight historical-writer compatibility tests require their matching old binaries and remain visibly ignored when absent.
- Local storage requires explicit startup and a selected private database; public Pages cannot offer SQLite persistence. Controlled restart tests do not establish crash/power-loss durability. See [native Foundry setup](../../native/foundry/README.md) and [Engineering runtime](../athena-local-runtime.md).
- Full educational coverage, expert assessment and complete manual accessibility remain open. Automated browser checks are revision-specific, not general certification.
- Source repositories remain intact. Native capability acceptance, public deployment, historical metadata preservation, private data reconciliation and retirement authorization are separate gates. No deletion readiness is implied here.

## Reproduce

Run `npm ci --ignore-scripts`, `npm run build`, `npm test`. Use an available supported Playwright Chromium installation for `npm run test:browser`; reports and screenshots go to `browser-results/`. Run Foundry's separate profile using its linked setup instructions. Do not substitute current binaries for historical compatibility inputs.

Package after reviewing the exact runtime set: `python3 scripts/package_app.py --profile public-preview --allowlist config/runtime-public-preview.json --output public`. This reviewed partial profile includes permitted Foundry runtime files and excludes private databases/history/credentials and unreviewed assets. Default `complete` mode's additional entry requirement is separate from full behavioral acceptance.

## Historical evidence: November 7 checkpoints

The local JS suite covers algorithms and DOM-emulated interactions. It is not native rendering evidence. An installed Chromium 155 launch was attempted; it stopped before loading any page with `socket() failed: Operation not permitted`. One approved escalation attempt returned the same restriction. No bypass was attempted. The same test subsequently ran in CI using Chromium 151.0.7922.34. At commit `2f802e4b`, all six functional checks passed: learning persistence, real research catalog, research filters/shortlist/navigation, media metadata without provider requests, explicit pending Foundry state, and mobile width checks. The first failing receipt is retained; its generic view wait was replaced by route-specific waits. Screenshot review then caught a Research dark-theme contrast defect, addressed and tested separately.

The final theme repair at `1482382fa5c6f6eb33276503b956992c6a069629` passed all eight checks in [CI run 42358027074](https://github.com/Herbertofury/Athena/actions/runs/42358027074), including sampled computed text contrast in both themes and the dark placeholder gradient endpoints. Research and Media screenshots were also visually reviewed in both themes and at mobile width. The raw final report is retained at `evidence/integration/2026-11-07/browser-theme-pass.json`. Use that run for the screenshots and loaded-app SHA-256. This limited functional pass does not certify all accessibility or media behavior. The script blocks external requests and does not claim real provider playback, private account tests, native Rust backend or game testing.

The local-engine extension passed [CI run 42360535804](https://github.com/Herbertofury/Athena/actions/runs/42360535804) against commit `74c8191f776838edce29fc56d57c27bf46393a9a`. Its nine static-app checks and eight actual Rust-backed Chromium checks passed using Chromium 151.0.7922.34. The latter verified all 31 served assets against the frozen package, Host/Origin/write-header protections, strict CSP, the real archive dialog and exact download, a bounded experiment through the real queue/journal, cross-workspace state, controlled restart persistence, and final read-only SQLite integrity/count (`ok`, one job). No browser errors, CSP violations or outside requests were recorded. Dark and light Lab screenshots were visually reviewed. The Rust all-target suite passed 191 tests, and all-target clippy passed.

[Retained runtime evidence](../../research/runtime-integration-2026-11-07/README.md) includes exact package, harness and binary identities. The experiment and archive are generated fixtures, not target-project speedup or real provider collection evidence. Controlled restart does not establish crash/power-loss durability. These checks do not claim complete accessibility, Windows acceptance, or private Foundry parity.


The November 7 configure-pages failure (run42360535726) is retained as historical evidence only; current public delivery is described above.
