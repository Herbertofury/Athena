# Broad site-adapter research and author-following contract

Reviewed October 28, 2026 UTC (October 27, 2026 in America/Denver).

## Decision and scope

Expand the Atlas's original 13 workbenches into a broad, source-backed implementation research catalog for following mod and custom-content creators, reading their accessible posts/media, and resolving correctly attributed releases and files. Cover the named obscure sites alongside paid creator services, social networks, regional blogs, code forges and file hosts. Keep exact implementation acceptance separate from researched coverage.

The [catalog](../docs/adapters/coverage-catalog.md) contains **162 distinct service/scope entries** and three shared feed protocols. Counts include separate platform scopes and explicitly labeled reference-only tools; they are not a count of working adapters or a claim to cover every website. The [machine-readable catalog](../data/site-adapter-catalog.json) retains domains, route/access requirements, identity/avatar handling, body/media, history, follows, files, sources, gaps and next acceptance cases.

Detailed research includes 15 mod-host recipes, 12 paid-platform recipes, 15 social/publishing recipes and eight regional plans, plus dedicated guides for the requested specialist sites, Tumblr and SubscribeStar. [Adapter hub](../docs/adapters/README.md)

## Findings that change the implementation approach

1. **Provider scope matters more than the existence of an API.** Creator commerce/webhook APIs do not automatically offer patron-wide reading. Keep campaign/store administration, account profile, subscription metadata, post reading and authorized download capabilities separate. The paid guide names the documented scope and the fixture still needed.
2. **Identity must preserve roles.** Dwemer Mods supplied an actual public example where the structured original-author name differs from the uploader account. Forum members, rebloggers, credited authors, translators, project teams and publishers cannot be collapsed into one creator with the first available portrait.
3. **Complete content is a field-level property.** A public preview, first gallery image, recent feed window or successful loading-shell response does not establish a complete post, media set or history. NPF/structured blocks and explicit version/file graphs are stronger starting candidates where officially supported.
4. **Following is several operations.** Local app tracking, native author follow, project watch, follow-list import, community membership, notification subscription and paid entitlement need independent state and authorization. Every provider's unsupported native operation remains visible.
5. **Access and policy changes can invalidate old recipes.** The guides retain current API/deprecation/download and access-policy findings, including CurseForge's announced CDN-key requirement, Reddit approval requirements, Patreon v1 retirement research, Polymart/voxel.shop migration, Tistory retirement, and the distinction between documented member-post APIs and merchant APIs. Each claim remains tied to its actual source status; source changes are not runtime acceptance.
6. **The obscure sites need distinct designs.** WCIF's initial creator HTML was a loading shell; Plumbdex exposed server-rendered creator/avatar links and warned of possible match mistakes; TS4 Rebels exposed forum/feed-discovery structure with guest-hidden links. These observations guide the next fixture rather than proving full support.

Primary URLs are adjacent to these findings in the [mod-host](../docs/adapters/mod-hosts.md), [paid-platform](../docs/adapters/paid-platforms.md), [social](../docs/adapters/social-platforms.md), [regional](../docs/adapters/regional-platforms.md), and specialist guides. The catalog's source receipt distinguishes retrieved sections, search extracts, shells and failures. A broad discovery result is not promoted to a verified endpoint solely because its URL is official.

## Public observations and limits

[Sanitized public observation receipt](../experiments/site-adapter-discovery/public-observations-2026-10-28.json) preserves the actual Dwemer Mods author/uploader mismatch, WCIF shell, Plumbdex creator structure and TS4 Rebels forum discovery. It records unsuccessful retrievals and fields not established. It does not contain raw HTML, guest-session parameters, credentials, private bodies, signed downloads or paid media.

This expansion produced no new authenticated content extraction, native follow mutation, paid download, complete-history acceptance or GameSync Next implementation. Earlier Steam playback, YouTube playback failure, Nexus public metadata and Modrinth collection results remain in their original workbenches and receipts. They are neither discarded nor generalized to all content.

The public site/API documents are volatile. The catalog includes inaccessible and historical candidates because discovery itself is useful, but marks them accordingly. Source-register entries are narrower than the discovery catalog: failed pages, shells and unresolved search-only extracts remain outside the register's `primary_documented` evidence class.

## Chosen design and rejected shortcuts

Use the [shared author/post/media contract](../docs/adapters/author-post-media-contract.md), provider-scoped transports/parsers, account-specific credentials and caches, explicit media/file resolvers, and independent follow capabilities. Prefer the documented interface that actually covers the required fields. Evaluate permitted page extraction only for its measured gaps, with scoped selectors, proper attribution, sanitization and drift fixtures.

Rejected shortcuts are a single universal page scraper, matching creators by display name/avatar, treating every image as gallery media, appending a guessed feed URL to every site, assuming an admin API is a patron reader, turning failures into successful empty feeds, and labeling a domain match as full support. These may appear simpler but lose identity, access or completeness and make later regressions difficult to detect.

The authenticated workflow uses the actual official sign-in surface and a protected credential form or supported handoff. It does not ask for passwords/cookies/OTPs in chat or assume an unrelated connector session authenticates a website. Signing in and passing an entitlement fixture are separate milestones. [Login research](../docs/adapters/authenticated-research.md)

## GameSync Next boundary

The target was inspected read-only to understand the comparison scope. No private source code or implementation trace is published here and no target files are changed. A candidate must first beat the exact current baseline on the same permitted corpus, preserving author identity, full content/media, warnings, authentication, durable state and responsiveness. Only that measured result is eligible for a reversible target change. [Adoption gate and correctness corpus](../docs/adapters/validation-and-adoption.md)

## Maintenance and publication

Canonical documents and the catalog belong in this repository. The [wiki page map](../data/wiki-adapter-pages.json) and [projection script](../scripts/export_adapter_wiki.py) prepare 32 mapped pages while retaining unrelated wiki content. The script does not publish, and a main-repository commit is not evidence of a live wiki update. Publication must use an authenticated wiki route and be verified against the actual live page. [Maintenance procedure](../docs/adapters/wiki-sync.md)

Active API/access/download sources have short review intervals; less volatile sources rotate through later reviews. Never refresh a source's checked date without reading it. Preserve prior failures and narrower tests. Scheduled review must report unavailable sources or expired credentials instead of silently declaring the entire catalog current.

## Validation

Run the repository source/link checker, Python tests, JavaScript tests and generated-asset checks. Validate catalog ID/source-reference uniqueness, exact counts, required named sites, guide links and explicit lack of new authenticated acceptance. Compare the prepared wiki projection twice to establish deterministic output; inspect changed links and preserve existing non-adapter wiki pages. Test results and publication state are recorded separately from site capability claims.

## Registered primary sources for this pass

The current list below is generated from the catalog's verified source receipts. Discovery-only and failed sources remain searchable in the catalog without receiving a primary-confirmed register entry.

<!-- SITE_ADAPTER_SOURCE_IDS -->

[ADP01] · [ADP02] · [ADP06] · [ADP07] · [ADP08] · [ADP09] · [ADP10] · [COL01] · [EXT07] · [SA001] · [SA002] · [SA003] · [SA004] · [SA005] · [SA006] · [SA007] · [SA008] · [SA009] · [SA010] · [SA011] · [SA012] · [SA013] · [SA014] · [SA015] · [SA016] · [SA017] · [SA018] · [SA019] · [SA020] · [SA021] · [SA022] · [SA023] · [SA024] · [SA025] · [SA026] · [SA027] · [SA028] · [SA029] · [SA030] · [SA031] · [SA032] · [SA033] · [SA034] · [SA035] · [SA036] · [SA037] · [SA038] · [SA039] · [SA040] · [SA041] · [SA042] · [SA043] · [SA044] · [SA045] · [SA046] · [SA047] · [SA048] · [SA049] · [SA050] · [SA051] · [SA052] · [SA053] · [SA054] · [SA055] · [SA056] · [SA057] · [SA058] · [SA059] · [SA060] · [SA061] · [SA062] · [SA063] · [SA064] · [SA065] · [SA066] · [SA067] · [SA068] · [SA069] · [SA070] · [SA071] · [SA072] · [SA073] · [SA074] · [SA075] · [SA076] · [SA077] · [SA078] · [SA079] · [SA080] · [SA081] · [SA082] · [SA083] · [SA084] · [SA085] · [SA086] · [SA087] · [SA088] · [SA089] · [SA090] · [SA091] · [SA092] · [SA093] · [SA094] · [SA095] · [SA096] · [SA097] · [SA098] · [SA099] · [SA100] · [SA101] · [SA102] · [SA103] · [SA104] · [SA105] · [SA106] · [SA107] · [SA108] · [SA109] · [SA110] · [SA111] · [SA112] · [SA113] · [SA114] · [SA115] · [SA116] · [SA117] · [SA118] · [SA119] · [SA120] · [SA121] · [SA122] · [SA123] · [SA124] · [SA125] · [SA126] · [SA127] · [SA128] · [SA129] · [SA130] · [SA131] · [SA132] · [SA133] · [SA134] · [SA135] · [SA136] · [SA137] · [SA138] · [SA139] · [SA140] · [SA141] · [SA142] · [SA143] · [SA144] · [SA145] · [SA146] · [SA147] · [SA148] · [SA149] · [SA150] · [SA151] · [SA152] · [SA153] · [SA154] · [SA155] · [SA156] · [SA157] · [SA158] · [SA159] · [SA160] · [SA161] · [SA162] · [SA163] · [SA164] · [SA165] · [SA166] · [SA167] · [SA168] · [SA169] · [SA170] · [SA171] · [SA172] · [SA173] · [SA174] · [SA175] · [SA176] · [SA177] · [SA178] · [SA179] · [SA180] · [SA181] · [SA182] · [SA183] · [SA184] · [SA185] · [SA186] · [SA187] · [SA188] · [SA189] · [SA190] · [SA191] · [SA192] · [SA193] · [SA194] · [SA195] · [SA196] · [SA197] · [SA198] · [SA199] · [SA200] · [SA201] · [SA202] · [SA203] · [SA204] · [SA205]
