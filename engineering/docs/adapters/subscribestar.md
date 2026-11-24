# SubscribeStar and SubscribeStar.adult adapter recipe

[Adapter laboratory](README.md) · [Paid-platform recipes](paid-platforms.md) · Checked 2026-10-28 UTC

## Two origins, scoped documented APIs

Both services publish read-only OAuth 2.0/GraphQL documentation. Keep `subscribestar.com` and `subscribestar.adult` separate in provider identity, OAuth registration, sessions, consent, policies and caches. Their account/subscription interfaces are a research starting point; this does not establish a general patron feed with complete paid posts, attachments and media. [SubscribeStar API](https://www.subscribestar.com/api) · [SubscribeStar.adult API](https://www.subscribestar.adult/api)

The API pages restrict using the API to provide benefits outside the platform. Consequently an off-platform full-content reader is not accepted merely because OAuth succeeds; the intended use needs to fit current platform permission. Preserve the distinction between subscription/account metadata and access to creator benefits. Do not substitute undocumented requests or mirrored files as evidence of supported API access. [SubscribeStar API conditions](https://www.subscribestar.com/api) · [Adult API conditions](https://www.subscribestar.adult/api)

## Observed public post and authenticated comparison

On October 28, 2026, the actual [Trinket's Gaming Shenanigans profile](https://www.subscribestar.com/trinket-s-shenanigans) supplied public post [701675](https://www.subscribestar.com/posts/701675). Secure email/password sign-in then completed, and a positive target-site account menu replaced the guest sign-in controls. The same public post was compared in both states. The [sanitized receipt](../../experiments/site-adapter-discovery/subscribestar-browser-2026-10-28.json) retains public identities, hashes and media observations without private account identifiers.

| Field | Actual DOM boundary | Observed result |
|---|---|---|
| Post identity | `.post[data-id="701675"]` | Numeric post ID scoped to `subscribestar.com` |
| Publishing creator | `a.post-user` inside that post | Creator name and canonical profile link |
| Author portrait | `.post-avatar img` | 120 × 120 image decoded by the browser |
| Full visible public body | `.post-content .trix-content` | 416 rendered characters; HTML and text hashes retained |
| Ordered inline images | `img` descendants of the body, in DOM order | Eight images, all decoded; includes promotional graphics and link banners |
| Upload groups | `.post-uploads` and `.post-uploads.for-youtube` | Empty for this fixture; not evidence that the site lacks attachments/video |
| Displayed date | `.post-date a` | Displayed date retained; no precise machine timestamp asserted |

Guest and signed-in body hashes, creator identity and ordered image URLs matched. The profile has a separate large cover and profile avatar; neither should replace the post's author portrait without a verified role relationship. CDN path numbers were observed but are not treated as a documented account-ID API contract.

Keep outgoing `/away?url=...` links as source wrappers with a separately validated destination. A linked CurseForge page or external host requires its own adapter. Preserve body order and image/link relationships: counting eight images does not mean eight mod-gallery screenshots. No GIF animation, audio/video playback, attachment transfer, entitled private post or complete history was tested in this fixture.

## Remaining identity and post mapping

Where an authorized response actually supplies stable creator/account IDs, retain them with the provider origin. Keep the public creator URL, mutable display name, avatar evidence and campaign/profile identity separate. If only a public profile name is available, it is a provisional profile record. Resolve the author portrait from a creator-scoped profile element or documented field; never substitute a tier illustration, post cover or subscriber avatar.

For any permitted reader route, compare further public text and mixed-media posts, an entitled post and a locked preview. Preserve ordered body/media, attachment filenames and access state at both post and file level. Do not label a successful HTML response complete when it is a login screen, preview or challenge. The observed public selectors above do not establish a private API or stable complete post schema.

## Follow versus membership

Local app following records the creator and schedules only the permitted retrieval capability. Native following, subscription tier, billing, supporter entitlement and notifications are different states. Read-only API documentation cannot establish a native follow-write operation. Importing subscriptions must not silently create local subscriptions to unrelated content or initiate payment.

The next proof step is a permitted member-content fixture on each relevant origin, followed by field-level comparison. The successful `.com` session does not authenticate `.adult`. Verify account scope, membership/preview differences, avatar ownership, pagination and expiring delivery links. Test no purchase or follow mutation without an explicitly selected action. [Authenticated research workflow](authenticated-research.md)

## Acceptance status

Documentation reviewed; one public post has actual guest/signed-in parity and eight decoded inline images. Full-content API suitability, entitled post/media extraction, complete follow import and native follow writes are **not accepted**. Useful link/profile tracking can still be designed with those limits visible. Only a candidate that beats the exact private GameSync Next baseline while preserving correct output can be transferred. [Validation and adoption](validation-and-adoption.md)
