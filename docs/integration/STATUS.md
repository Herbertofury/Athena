# One Athena: public-preview integration

## Implemented

- One HTML document, sidebar, theme and contextual search control. Learning, engineering Research and Media workbench mount as native modules, without app-wrapper iframes. Official media player embeds remain explicit.
- Actual 283-entry Research catalog and original pure comparison/query algorithms, filters, shortlist, CSV/test-plan exports and same-document routes.
- Media source records and completeness states, explicit provider/player loading, autoplay off, scoped cleanup, fixture-bound retained receipts and bounded-event candidate isolation.
- Serialized async lifecycle: cancelled loads cannot replace current views; state is restored after previous export finishes; failed cleanup cannot orphan the next mount. Learning handlers do not consume workspace actions.
- Exact runtime-file allowlist, staged-byte hash verification, no symlink/hidden/unreviewed inputs, no overwriting existing package directories.

## Verification boundaries

The local JS suite covers algorithms and DOM-emulated interactions. It is not native rendering evidence. An installed Chromium 155 launch was attempted; it stopped before loading any page with `socket() failed: Operation not permitted`. One approved escalation attempt returned the same restriction. No bypass was attempted. The actual-browser script is prepared for CI/another permitted runtime and must produce a passing receipt before native-browser verification is claimed.

Use the CI browser report for loaded-app SHA-256, screenshots and actual result. The script blocks external requests and does not claim real provider playback, private account tests, native Rust backend or game testing.

## Still pending

- Feature Foundry is private while Athena is public. Its source and data are not in this release, pending informed public-publication approval and actual adapter parity work.
- GitHub Pages site setup is not enabled by this change. The workflow uses `enablement: false`; a passing build does not prove a served URL.
- Rust/local API and source runtime features are preserved, not silently replaced by browser controls.
- Full educational coverage, all exam subobjectives, hands-on assessment and larger original practice banks remain open.
- Source repositories are not deleted. Preservation and cutover gates remain separate.

## Reproduce

Run `npm ci --ignore-scripts`, `npm run build`, `npm test`. For actual Chromium use `npx playwright install --with-deps chromium` then `npm run test:browser`. Browser receipts go to `browser-results/`; screenshots and the JSON report are retained by CI.

Package only after reviewing the exact runtime file set: `python3 scripts/package_app.py --profile public-preview --allowlist config/runtime-public-preview.json --output public`. This explicitly partial profile excludes Foundry. Default `complete` mode requires every module.
