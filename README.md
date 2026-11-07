# Athena

**Curiosity becomes capability.** An organized home for learning computers, security, coding, infrastructure, data and beyond.

Athena joins a learning academy with an evidence-led engineering research library. Its purpose is deep understanding and demonstrable practical skill, not collecting badges or claiming mastery from a progress bar.

## Start here

- [Learning library](docs/README.md): 13 certificate pathways, shared lessons and guided capstones.
- [Interactive app source](dist/index.html): open this file from a downloaded checkout, or serve `dist/` locally. No build or account is required.
- [GitHub wiki](https://github.com/Herbertofury/Athena/wiki): publication status must be checked separately from repository files.
- [Broader knowledge map](docs/KNOWLEDGE-MAP.md): computers, coding, security and future schools.
- [Engineering research](engineering/README.md): preserved Atlas research and application work when its migration lands.
- [Coverage and quality](docs/quality/COVERAGE.md): what exists, what is verified and what remains.

## Start with The Packet Trail

The [eight-stage networking foundation](docs/paths/packet-trail.md) connects address planning, routes, DNS/DHCP, transport/trust, synthetic incident analysis and an actual loopback HTTP lab. Open **The Packet Trail** in the app. It is a focused applied foundation, not full Network+ or CCNA preparation.

## This release, honestly

- 13 credential pathways with dated exam/version and source notes.
- 74 **domain roadmaps**, not 74 completed courses or exhaustive objective maps.
- 48 original lessons (40 introductions plus eight applied networking foundations), each with explanation, a worked example, a safe exercise and an original concept check.
- Four local interactive learning tools: fixed-table route selection, IPv4 subnetting, simplified policy decisions and filter-context arithmetic.
- Search, pathway selection, read/check tracking, spaced review, local notes and validated progress export/import.
- Matching repository documentation and prepared wiki pages generated from one catalog.

**This does not yet teach everything in every official exam objective.** Deep subobjective coverage, larger original practice banks, independently assessed practical labs, expert review and real-browser accessibility/visual validation remain open. The app awards no official credential and makes no pass guarantee. RHCSA and CKA require genuine hands-on practice, not a browser simulation.

## Run locally

Open `dist/index.html` directly, or run a local static server if your browser restricts file-origin storage. Progress is browser-local and may behave differently for file URLs. Export a backup.

For development:

```sh
npm ci --ignore-scripts
npm run build
npm test
```

The production app has no package dependencies, external fonts, analytics, accounts or backend. The development-only DOM tests use pinned LinkeDOM; they are not real-browser tests.

## Organization

```text
dist/                   Static interactive learning app
src/                    Generated curriculum catalog and lesson data
research/               Official-source certification register
scripts/                Reproducible content generation and validation
tests/                  Data, algorithm and DOM interaction tests
docs/certificates/      One guide per credential
docs/shared/            Shared original lessons
docs/quality/           Coverage, verification and release limitations
wiki/                   Prepared native GitHub wiki pages
labs/                   Disposable local exercises and synthetic data
engineering/            Engineering Atlas migration (separate workstream)
migration/              Migration inventory and preservation evidence
```

## Safety and privacy

Use only authorized disposable lab systems. Do not attack third-party systems, use real customer records, publish secrets or create paid cloud resources without an explicit budget decision. Notes/progress are stored locally, not encrypted by this app; export files can contain private notes. Import validates known fields and replaces progress only after confirmation.

Certification and vendor names belong to their owners. Athena is independent and not endorsed by the issuers. All practice is original; no exam dumps, leaked items or copied paid courseware are included. Official objective links are a source of truth, and exam versions/prices must be rechecked before booking.
