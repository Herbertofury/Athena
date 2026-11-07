# One Athena: public-preview integration

## Implemented

- One HTML document, sidebar, theme and contextual search control. Learning, engineering Research, Media workbench and the local R&D Lab mount as native modules, without app-wrapper iframes. Official media player embeds remain explicit.
- Actual 283-entry Research catalog and original pure comparison/query algorithms, filters, shortlist, CSV/test-plan exports and same-document routes.
- Media source records and completeness states, explicit provider/player loading, autoplay off, scoped cleanup, fixture-bound retained receipts and bounded-event candidate isolation.
- Native `#lab` retains the Rust queue, SQLite journal, exact saved-JSON inspector and bounded experiments through the loopback same-origin API. Static pages never probe localhost. External media is disabled on the privileged local origin. [Startup and detailed evidence](../athena-local-runtime.md).
- Serialized async lifecycle: cancelled loads cannot replace current views; state is restored after previous export finishes; failed cleanup cannot orphan the next mount. Learning handlers do not consume workspace actions.
- Exact runtime-file allowlist, staged-byte hash verification, no symlink/hidden/unreviewed inputs, no overwriting existing package directories.

## Verification boundaries

The local JS suite covers algorithms and DOM-emulated interactions. It is not native rendering evidence. An installed Chromium 155 launch was attempted; it stopped before loading any page with `socket() failed: Operation not permitted`. One approved escalation attempt returned the same restriction. No bypass was attempted. The same test subsequently ran in CI using Chromium 151.0.7922.34. At commit `2f802e4b`, all six functional checks passed: learning persistence, real research catalog, research filters/shortlist/navigation, media metadata without provider requests, explicit pending Foundry state, and mobile width checks. The first failing receipt is retained; its generic view wait was replaced by route-specific waits. Screenshot review then caught a Research dark-theme contrast defect, addressed and tested separately.

The final theme repair at `1482382fa5c6f6eb33276503b956992c6a069629` passed all eight checks in [CI run 42358027074](https://github.com/Herbertofury/Athena/actions/runs/42358027074), including sampled computed text contrast in both themes and the dark placeholder gradient endpoints. Research and Media screenshots were also visually reviewed in both themes and at mobile width. The raw final report is retained at `evidence/integration/2026-11-07/browser-theme-pass.json`. Use that run for the screenshots and loaded-app SHA-256. This limited functional pass does not certify all accessibility or media behavior. The script blocks external requests and does not claim real provider playback, private account tests, native Rust backend or game testing.

The local-engine extension passed [CI run 42360535804](https://github.com/Herbertofury/Athena/actions/runs/42360535804) against commit `74c8191f776838edce29fc56d57c27bf46393a9a`. Its nine static-app checks and eight actual Rust-backed Chromium checks passed using Chromium 151.0.7922.34. The latter verified all 31 served assets against the frozen package, Host/Origin/write-header protections, strict CSP, the real archive dialog and exact download, a bounded experiment through the real queue/journal, cross-workspace state, controlled restart persistence, and final read-only SQLite integrity/count (`ok`, one job). No browser errors, CSP violations or outside requests were recorded. Dark and light Lab screenshots were visually reviewed. The Rust all-target suite passed 191 tests, and all-target clippy passed.

[Retained runtime evidence](../../research/runtime-integration-2026-11-07/README.md) includes exact package, harness and binary identities. The experiment and archive are generated fixtures, not target-project speedup or real provider collection evidence. Controlled restart does not establish crash/power-loss durability. These checks do not claim complete accessibility, Windows acceptance, or private Foundry parity.

## Still pending

- Feature Foundry is private while Athena is public. Its source and data are not in this release, pending informed public-publication approval and actual adapter parity work.
- GitHub Pages site setup remains blocked. [Run 42360535726](https://github.com/Herbertofury/Athena/actions/runs/42360535726) passed the test and package steps, then `configure-pages` returned `Get Pages site failed` / `Not Found`. The workflow uses `enablement: false`; no Pages settings were changed and no served URL is claimed.
- Full source/runtime parity, live provider collection, Windows acceptance and crash/power-loss durability remain unproven. The native Lab retains actual Rust/SQLite behavior; browser simulations do not replace those gates.
- Full educational coverage, all exam subobjectives, hands-on assessment and larger original practice banks remain open.
- Source repositories are not deleted. Preservation and cutover gates remain separate.

## Reproduce

Run `npm ci --ignore-scripts`, `npm run build`, `npm test`. For actual Chromium use `npx playwright install --with-deps chromium` then `npm run test:browser`. Browser receipts go to `browser-results/`; screenshots and the JSON report are retained by CI.

Package only after reviewing the exact runtime file set: `python3 scripts/package_app.py --profile public-preview --allowlist config/runtime-public-preview.json --output public`. This explicitly partial profile excludes Foundry. Default `complete` mode requires every module.
