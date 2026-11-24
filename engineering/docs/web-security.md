# Web apps, services and account integration

A static frontend and a trusted backend have different responsibilities. Private API credentials and authoritative account operations belong behind a narrowly scoped server boundary, never in a public bundle. GitHub Pages is static hosting, not a server runtime. [G01](sources.md#g01)

## Identity is not blanket authorization

An identity assertion identifies a user; it does not automatically grant every account action. For example, Steam OpenID identifies a SteamID, while wishlist editing is a separate capability. Google sign-in does not grant Steam permissions. State capability limits honestly and never infer an external mutation from a clicked link. [S01](sources.md#s01)

## Design checklist

Exact callback origins and state binding; replay-resistant one-time grants; scoped short-lived sessions; server-side input validation; bounded bodies/timeouts/queues; revocation; no secrets in URLs/logs; no-store on private responses; explicit error states; last-good data retained only for the same account and labeled stale. A health endpoint reporting key presence is not proof the key works.

Threat-model shared origins, untrusted plugins, cross-account races, popup cancellation, cross-tab state and restart. Authentication fixtures do not prove live-provider behavior. Perform a supervised first real flow before claiming operational success.

Use a versioned security requirement set such as OWASP ASVS as a checklist, then map requirements to actual tests and evidence. Passing a checklist is not a guarantee of zero vulnerabilities. [SEC01](sources.md#sec01)

For asynchronous jobs, separate accepted, running, partial, complete and failed states. Progress should be truthful, resumable and cancelable; do not present queued work as completed.
