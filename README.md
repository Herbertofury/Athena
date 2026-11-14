# Athena

**Curiosity becomes capability.** An organized home for learning computers, security, coding, infrastructure, data and beyond.

Athena joins a learning academy with an evidence-led engineering research library. Learning, Engineering research and labs, and reviewed Foundry authoring now mount as native workspaces in one Athena document, with shared navigation, search and theme. Foundry also has an explicitly started local SQLite profile; original-feature fidelity and private user-data migration remain separate, unfinished acceptance work. Its purpose is deep understanding and demonstrable practical skill, not collecting badges or claiming mastery from a progress bar.

## Start here

- [Learning library](docs/README.md): 13 certificate pathways, shared lessons and guided capstones.
- [Native Foundry profile](native/foundry/README.md): optional local authoring storage, recovery and explicit local media controls.
- [Local Rust/SQLite evidence engine](docs/athena-local-runtime.md): native collection, archives and bounded experiments in the same shell.
- [Interactive app source](dist/index.html): serve `dist/` locally so workspace modules and JSON assets load. No account is required.
- [GitHub wiki](https://github.com/Herbertofury/Athena/wiki): publication status must be checked separately from repository files.
- [Broader knowledge map](docs/KNOWLEDGE-MAP.md): computers, coding, security and future schools.
- [Creative AI tool observatory](docs/creative-ai/README.md): source-backed web, graphics, audio and video candidates with separate code/model licenses.
- [Engineering research](engineering/README.md): preserved Atlas research, source history and native Research/Media workspaces.
- [Coverage and quality](docs/quality/COVERAGE.md): what exists, what is verified and what remains.

## Start with The Packet Trail

The [eight-stage networking foundation](docs/paths/packet-trail.md) connects address planning, routes, DNS/DHCP, transport/trust, synthetic incident analysis and an actual loopback HTTP lab. Open **The Packet Trail** in the app. It is a focused applied foundation, not full Network+ or CCNA preparation.

## Applied workshops

Open **Applied workshops** in the app. Each route includes prerequisites, ordered lessons, original source attribution and a ZIP of local exercises. Extract the ZIP and read its README before running commands. Primary checks retain the existing local XP/review behavior. Supplemental checks are session practice with no additional XP. Real-cloud labs and Power BI workflows remain unexecuted.

## This release, honestly

- 13 credential pathways with dated exam/version and source notes.
- 74 **domain roadmaps**, not 74 completed courses or exhaustive objective maps.
- 90 original lessons: 48 existing foundations and Packet Trail lessons plus 42 applied workshop lessons.
- Five coherent workshops: Security, Systems, Programming, Cloud and Data/SQL. Their 126 checks comprise 42 primary checks and 84 supplemental checks; 16 lessons include worked Python or SQL snippets.
- Downloadable offline exercises, fixtures, editable programming projects, reference acceptance tests and evidence worksheets. The app does not execute Python or SQL.
- Four local interactive learning tools: fixed-table route selection, IPv4 subnetting, simplified policy decisions and filter-context arithmetic.
- Search, pathway selection, read/check tracking, spaced review, local notes and validated progress export/import.
- Matching repository documentation and prepared wiki pages generated from one catalog.

**This does not yet teach everything in every official exam objective.** Deep subobjective coverage, larger original practice banks, independently assessed practical labs, expert review and real-browser accessibility/visual validation remain open. The app awards no official credential and makes no pass guarantee. RHCSA and CKA require genuine hands-on practice, not a browser simulation.

## Run locally

Serve the app from the repository root with `python3 -m http.server 8000 --bind 127.0.0.1 --directory dist`, then open http://127.0.0.1:8000. Workspace modules fetch local JSON assets and require HTTP; opening a file URL is only a limited learning preview. Progress is browser-local. Export a backup.

For development:

```sh
npm ci --ignore-scripts
npm run build
npm test
```

The public static app has no account, analytics or external font dependency. Learning and research work locally. Media provider requests remain explicit and autoplay stays off; the R&D Lab connects only when this same shell is served by the verified local Rust engine. The public page never probes localhost. See the local-engine instructions above. DOM tests use pinned LinkeDOM. `npm run test:browser` verifies generated adapters, runs static, workshop and accessibility Chromium checks, builds/tests the pinned Rust engine and runs full engine-backed Chromium acceptance with external requests blocked. `npm run test:browser:static` is the smaller static-only check. `npm run test:browser:workshops` is the new real-Chromium acceptance gate for all five workshops, literal code escaping, 84 supplemental checks, downloads, focus, history and desktop/mobile layouts. Browser and engine acceptance has run at identified revisions; see [integration status](docs/integration/STATUS.md) for dated evidence and limits. A historical passing run does not certify a later revision. Read exact-head receipts rather than treating DOM or harness-contract tests as browser evidence.

## Organization

```text
dist/                   One Athena shell and native workspace modules
src/                    Generated curriculum catalog and lesson data
research/               Official-source certification register
scripts/                Reproducible content generation and validation
tests/                  Data, algorithm and DOM interaction tests
docs/certificates/      One guide per credential
docs/shared/            Shared original lessons
docs/quality/           Coverage, verification and release limitations
wiki/                   Prepared native GitHub wiki pages
labs/                   Existing disposable networking exercises
workshops/              Five preserved offline curriculum and exercise packs
engineering/            Preserved Engineering Atlas source and evidence
migration/              Migration inventory and preservation evidence
```

## Keyboard access

Use the skip link, normal Tab/Shift+Tab navigation and Escape to close lessons. Open **Keyboard options** to disable the single-key / search shortcut; this preference is separate from learning-progress exports. Lesson and feedback focus, search announcements, descriptive labels and system color/motion styles have automated DOM coverage. See [accessibility notes](docs/accessibility.md) for controls, evidence and remaining manual/browser work. `npm run test:browser:accessibility` is a separate automated browser gate, not a complete manual accessibility audit. Check the result for the revision being evaluated.

## Safety and privacy

Use only authorized disposable lab systems. Do not attack third-party systems, use real customer records, publish secrets or create paid cloud resources without an explicit budget decision. Notes/progress are stored locally, not encrypted by this app; export files can contain private notes. Import validates known fields and replaces progress only after confirmation.

Certification and vendor names belong to their owners. Athena is independent and not endorsed by the issuers. All practice is original; no exam dumps, leaked items or copied paid courseware are included. Official objective links are a source of truth, and exam versions/prices must be rechecked before booking.

## Unified integration status

Read [the workspace contract](docs/integration/WORKSPACE-CONTRACT.md) and [current integration evidence](docs/integration/STATUS.md). The reviewed public-preview package includes Learning, Engineering workspaces and Foundry authoring, not private databases, credentials or original private assets. Engineering Lab requires `serve-athena`; Foundry's SQLite profile requires its explicit local bridge. Neither connects to a private database from public Pages. `scripts/package_app.py` verifies the exact reviewed hashes in `config/runtime-public-preview.json`. The `public-preview` label does not mean Foundry is absent; it means complete original-source parity is not claimed. Default `complete` mode still requires the additional Foundry entry specified by the packager and is not a retirement certificate.


## Competing apps and alternative workflows

[Comparison hub](COMPETITORS.md): relevant baselines, source-backed alternatives, existing research catalogs and concrete validation priorities. Candidate ideas are not claims of measured superiority.
