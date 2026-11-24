# Site discovery and scoped extraction observations

## Six-game expansion and authenticated fixture

The [six-game manifest](game-research-2026-10-28.json) retains 179 game scope records, actual item/profile observations and 420 new source records. Of those source records, 321 represent primary observations and 99 retain failed, partial, shell or search-only retrieval attempts. The [game guides](../../docs/adapters/games/README.md) explain the extraction boundaries and source-specific identity roles. Shared domains are canonicalized in the 248-entry catalog.

The [Mod Collective browser receipt](modcollective-browser-2026-10-28.json) records a separate user-authorized sign-in and one real creation: a 400-character body, linked creator, decoded creator avatar, three ordered decoded images and a 3,407,157-byte DBPF file delivered through the site's normal free-download flow. The file's hash and magic are retained; its binary, full post body and private account details are not published. This is a scoped observation, not a reusable accepted adapter.

The [connection ledger](authentication-observations-2026-10-28.json) distinguishes successful sign-ins, tool-policy blocks before login and a later browser-backend outage. The [expansion validation receipt](game-expansion-validation-2026-10-28.json) records repository verification. The [wiki publication queue](wiki-publication-queue-2026-10-28.json) retains the historical pending state. A recovered browser subsequently published all 40 mapped pages; the [read-back receipt](wiki-publication-verified-2026-10-28.json) verifies exact equality at wiki commit `b403c4a7b69f56858e61d502882292a33b3ef226`.

## Subsequent browser extraction observations

The [second-round method manifest](method-research-round2-2026-10-28.json) and [method guide](../../docs/adapters/methods-round2.md) expand the catalog to 346 service/scope entries. The [executable lab](../site-extraction-lab/README.md) preserves nine actual sample replays through eight parser families, with 27 normalized records and explicit field/access limitations. These receipts add executable extraction evidence to the source research; they do not grant universal acceptance.

The [round-two validation receipt](methods-validation-2026-10-28.json) records 212 passing Python tests, 24 passing JavaScript contract files, generated/asset checks, catalog/source integrity and the resolved publication audit. The [live read-back receipt](wiki-methods-publication-verified-2026-10-28.json) verifies all 43 managed wiki pages and the additive sidebar. Canonical repository synchronization was subsequently completed after the earlier rejected write.

The [SubscribeStar receipt](subscribestar-browser-2026-10-28.json) records secure sign-in and the same public post before and after authentication: matching body hash, creator and ordered eight-image list, with all eight images decoded. It contains no private account identifier, membership list or paid body. The [SimsFinds receipt](simsfinds-browser-2026-10-28.json) records real item/profile fields, a 204-character body, numeric account 1077254, differing byline/profile display labels, an 800-pixel preview and a 600-pixel profile avatar. An initial download-event timeout remains recorded; a later browser file-link helper transferred a 98,134,687-byte ZIP from the normal countdown-generated link. Its single package has DBPF magic and passed the archive CRC check; nothing was installed or executed.

These are scoped receipts. They do not establish entitled-content access, complete history, native follow operations or universal support. See the [SubscribeStar](../../docs/adapters/subscribestar.md) and [SimsFinds](../../docs/adapters/simsfinds.md) methods for exact field boundaries and remaining fixtures.

The [Patreon receipt](patreon-browser-2026-10-28.json) adds a positive signed-in session, one still-locked preview and one public release with full visible body, creator avatar, image and an actual 932,816-byte ZIP. All six ZIP entries passed CRC validation without extraction/installation/execution. The [Tumblr receipt](tumblr-browser-2026-10-28.json) compares an original/reblog pair: equal body text and ordered image-variant lists, unequal HTML/plain image-source attributes, 11 decoded content images each and 44 unrelated note avatars excluded from the reblog's content.

The Tumblr video fixture reached an embedded YouTube player, but repeated observations stayed at zero decoded video dimensions and zero playback time; playback remains unconfirmed. The [WCIF receipt](wcif-browser-2026-10-28.json) supersedes the earlier loading-only result for the rendered method: 100 directory rows, an actual creator and indexed item, a decoded thumbnail, an explicit missing-portrait fallback, and a 50-to-100-item history continuation. Full original posts still require their source adapters; signed thumbnail query values are excluded.

## Initial public specialist-site pass

The initial pass inspected a few publicly available pages to distinguish a feasible extraction candidate from an assumed implementation. That earlier pass did not run an authenticated adapter, retrieve paid content, download files or benchmark GameSync Next. Its receipts remain unchanged; the later Mod Collective observation is recorded separately above.

[Sanitized receipt](public-observations-2026-10-28.json) records the observed surface, failures and fields not established. Raw HTML is deliberately not published: it can contain volatile guest-session identifiers and unnecessary third-party content.

[Focused source verification](source-verification-2026-10-28.json) records direct review of 34 primary-document URLs, including retained empty/failed results and precise corrections. This distinguishes source-section inspection from broad search discovery; it is not live API or authenticated adapter acceptance.

[Documentation validation receipt](validation-2026-10-28.json) records repository checks, catalog integrity, preserved wiki history and the separate pending wiki-publication step. The Python suite passed 74 tests; the Node command passed all 17 JavaScript contract files. Both existing asset-identity checks passed. None of these checks is an authenticated site fixture.

The useful findings are an actual author/uploader mismatch on Dwemer Mods, a loading shell on WCIF's initial HTML, server-rendered creator/avatar links on Plumbdex, and a public forum/feed-discovery surface on TS4 Rebels. Each needs a separate completeness and authenticated-access test before a working-support claim.

[Dwemer Mods](../../docs/adapters/dwemer-mods.md) · [WCIF](../../docs/adapters/wcif.md) · [Plumbdex](../../docs/adapters/plumbdex.md) · [TS4 Rebels](../../docs/adapters/ts4-rebels.md)
