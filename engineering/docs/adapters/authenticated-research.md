# Login and authenticated adapter research

[Adapter laboratory](README.md) · Workflow and session observations, updated October 28, 2026

The goal is to test the same post as a guest, a logged-in nonmember and an entitled member, while keeping sign-in secrets outside chat and public research. A successful sign-in is only one prerequisite: the site must expose the requested content to that account, and the chosen integration route must support the operation.

## Signing in during an assisted research session

Where the assistant's browser provides secure authentication, open the exact official site and inspect its visible sign-in methods. The secure sign-in form or a supported browser handoff lets the user enter credentials directly; the assistant should receive only the outcome, not passwords, OTPs or cookies. Verify a positive signed-in signal on the target site and then open a user-selected example post. A blank page or closed login popup is not proof of success.

This capability is environment-dependent, not a feature implemented by Engineering Atlas. A normal link opened on the user's own computer does not automatically authenticate a separate research browser. Likewise, a GitHub connector session is not a Patreon, SubscribeStar, Tumblr or wiki browser session. Record which browser/account context was tested without publishing the account's private identifiers.

If the site rejects the research browser, leave that adapter at `authenticated_fixture_needed` and record the actual visible error. Do not invent a successful session. User-controlled capture/export can be a later alternative when the service permits it; request sanitized samples, not raw cookies, tokens or an unsanitized network archive. Do not work around a bot challenge through alternate identities or endpoints.

## Recommended application connection routes

| Site capability | Proposed connection method | What it establishes |
|---|---|---|
| Documented OAuth reader scope | Provider authorization through the system browser; authorization code plus PKCE where supported | Only the capabilities and account data granted by that scope |
| Official API key | User provides it to the app's protected credential store, scoped to the documented API | API access, which may still exclude paid posts or native follows |
| First-party session only | User signs in on the real site; a permission-compatible local browser integration processes the authorized page | The content actually visible to that session, with per-site acceptance still required |
| Creator-installed integration | Creator authorizes their own campaign/store; ingest approved webhooks or owned records | That creator's integration, not every creator followed by a patron |
| No permitted automated read route | Local follow, source link, official embed or user-authorized export | Useful tracking with the unavailable capability explicitly shown |

For native applications, RFC 8252 recommends external user agents and requires PKCE for public native clients. Do not embed a shared client secret in a distributed desktop app. Use the provider's actual supported authorization flow and registered callback, rather than assuming every legacy OAuth service supports the same modern parameters. [RFC 8252](https://www.rfc-editor.org/info/rfc8252/)

RFC 9700 covers current OAuth security practice, including refresh-token rotation or sender constraints for public clients. The app must handle revoked grants, refresh races, changed scopes and wrong-account connections. Store a credential reference in the content database and keep the secret in an OS-backed vault or an appropriate protected backend. [RFC 9700](https://www.rfc-editor.org/info/rfc9700/)

For a browser extension, Chrome documents `launchWebAuthFlow` and related identity capabilities. The exact provider OAuth flow, redirect URI and permissions still need browser-specific testing; Chrome documentation is not proof of Opera or Firefox acceptance. [Extension identity API](https://developer.chrome.com/docs/extensions/reference/api/identity)

Request host access when a user connects a site. Optional permissions let an extension ask for the relevant origin at runtime. Avoid an all-sites grant when the feature only needs a few selected providers. [Optional permissions](https://developer.chrome.com/docs/extensions/reference/api/permissions)

Host permission allows relevant extension contexts to make cross-origin requests; content scripts still operate under their page's origin restrictions. A background message handler must validate the sender and destination and must not become an arbitrary authenticated fetch proxy. This also means a CORS failure does not justify moving all subscriber traffic through a public proxy. [Cross-origin requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)

Extension local/sync storage is not a replacement for a credential vault. Chrome's storage reference recommends session storage for sensitive data and documents which contexts can access each storage area. Use durable application storage for content only according to the target's requirements; this research does not propose adopting IndexedDB. [Storage reference](https://developer.chrome.com/docs/extensions/reference/api/storage)

## Minimal fixture set for each account-gated site

1. A public creator profile with a custom avatar and an explicit canonical link.
2. A public text post and a public multi-image post, including edited content.
3. A member post accessible to the user's existing account, with mixed body media and a file attachment.
4. The same member post without entitlement, so the parser proves that a preview is not full content.
5. Multiple pages of creator history, including an old edited or newly unlocked post.
6. An expired-session state and an expired attachment link, followed by authorized recovery.
7. An author/uploader/reblogger mismatch and a missing/default avatar.
8. A native follow list or follow control only where the service exposes one; mutation tests require an explicitly selected target.

Do not subscribe, purchase, message a creator or change age/content preferences merely to test extraction. The research task authorizes analysis, not those separate account actions. A user's existing entitlement is enough for a scoped read fixture; there is no need to acquire a new membership to finish public research.

## Capture and publication boundaries

Public artifacts retain the method, site, date, operation, parser version, expected field roles, counts, failures and redacted result hashes when suitable. Private fixtures retain only the minimum data needed for comparison, under the user's account-specific access rules. Do not commit session tokens, signed file URLs, private messages, subscription lists, private media or paid article bodies.

A useful receipt records `guest`, `logged_in`, `entitled` and `expired` as separate cases; the exact provider operation; whether the full body, all ordered media and attachments matched; and which fields remain unknown. Treat a full body or gallery not returned by the provider as a coverage gap, not an extraction success. A standalone cookie export or an HTML page containing embedded credentials is not a safe receipt.

## Priority for the next authenticated pass

| Site family | Why a login fixture changes the decision |
|---|---|
| Patreon / SubscribeStar / SubscribeStar.adult | Distinguish membership metadata from actual post/media access and supported off-platform use |
| Boosty / FANBOX / Fantia / Afdian | Establish accessible body structure, media variants, attachments and subscription-specific behavior |
| LoversLab / TS4 Rebels | Establish forum account permissions, hidden links, attachment behavior and separate uploader/creator identity |
| WCIF / Plumbdex | Verify native favorites/follows and pagination; do not assume an index's creator match is authoritative |
| Tumblr | Verify native following and authenticated post cases alongside the documented public structured-post route |

Use the catalog's evidence state and [validation gate](validation-and-adoption.md) to track subsequent tests. An observed sign-in or individual download does not establish every operation on that platform.

## Observed session outcomes: October 28, 2026 UTC

The [sanitized connection ledger](../../experiments/site-adapter-discovery/authentication-observations-2026-10-28.json) records these environment-specific outcomes without account identifiers or secrets.

| Destination | Observed outcome | Remaining work |
|---|---|---|
| Mod Collective | Secure sign-in completed. The normal free-account download flow delivered one DBPF package; the rendered post yielded its author, avatar, body and three gallery images. | Reusable parser, complete creator history, GIF/video cases, follow import, expired sessions and any separately authorized member fixture. See the [exact receipt and selectors](mod-collective.md). |
| GitHub wiki | Initially signed-in controls only; subsequently all 40 mapped pages were published and read back from the wiki Git repository. | Exact byte equality is recorded in the [publication receipt](../../experiments/site-adapter-discovery/wiki-publication-verified-2026-10-28.json). Later research requires its own projection/publication check. |
| SubscribeStar.com | Secure sign-in succeeded; the same public post matched guest content, author and eight decoded images. | Entitled content, complete history, delivery, native follow import and writes remain untested. See the [observed extraction recipe](subscribestar.md). |
| Patreon | Secure Google sign-in/device approval succeeded. One public post supplied its full visible body, creator/avatar, image and a 932,816-byte ZIP with passing CRC checks; a separate locked post remained gated. | Entitled member content, full history, animation/playback, native follows and expiry recovery remain untested. See [Patreon's exact cases](patreon.md). |
| SimsFinds | Guest item and linked profile supplied body, account identity and decoded preview/profile avatar. The normal link delivered a ZIP containing one DBPF package through the browser file-link helper; the earlier event timeout remains recorded. | Signed-in behavior, complete history, media variants, link expiry and native follow operations remain untested. See [SimsFinds](simsfinds.md). |
| Tumblr | Guest original/reblog pages supplied matching 788-character text and 11 decoded content images each, with distinct publisher/original-author roles and decoded avatars. | HTML/image-src parity differs by theme; API/NPF, signed-in cases, full history and native following remain untested. See [Tumblr](tumblr.md). |
| LoversLab and F95zone | This research browser denied navigation under its site policy before login. | Retain `blocked_by_tool_policy`. A new password, alternate domain, browser or endpoint is not an authorized workaround. |
| Other catalog login routes | Public sign-in routes or account controls were documented where visible. | Authentication and content extraction remain untested unless an independent receipt says otherwise. |

The remote browser initially stopped responding during a creator-profile read. Diagnostic and runtime-reset requests also timed out. Those failed operations remain `browser_backend_unavailable`; they are not site failures or expired-account errors. A later session recovered browser access and completed the wiki publication and SubscribeStar comparison above. Recovery does not retroactively turn the earlier failed operations into successes.

## Connecting Opera or Google Chrome

The available browser inventory in this session exposed a **remote Chrome browser**. A plugin search did not expose a connector to the user's local Opera or Chrome profile. That is a capability limit of this session; it does not establish that local browser integrations are universally unavailable.

A Google sign-in is an identity-provider flow on the destination site. It does not attach the user's local Chrome profile. Likewise, opening a login URL in Opera does not transfer that authenticated session into a remote research browser.

For a permitted site, use an explicitly available local-browser connector if the environment offers one, or the remote browser's secure sign-in/handoff flow. Verify the destination's signed-in state after the callback. Keep login retries attached to the exact observed sign-in screen and return URL; reissue a secure prompt only when the actual failure requires it. Do not export cookies, read browser profile databases or paste passwords/verification codes into research files.

The application connection methods above are implementation candidates. They have not been installed or validated as a local Opera/Chrome connection in this session, and they cannot override an explicit tool policy restriction.
