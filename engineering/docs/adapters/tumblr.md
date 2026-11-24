# Tumblr adapter recipe

[Adapter laboratory](README.md) · [Social-platform recipes](social-platforms.md) · Checked 2026-10-28 UTC

## Preferred candidate and evidence

Start with Tumblr's official API and Neue Post Format (NPF). The API and block specification are documented; this research did not execute an authenticated feed import or implement an accepted adapter. An RSS route remains a useful discovery or compatibility input only after measuring its omissions against the API and actual post. [Official API](https://raw.githubusercontent.com/tumblr/docs/master/api.md) · [NPF specification](https://github.com/tumblr/docs/blob/master/npf-spec.md)

## Author and avatar

Prefer the blog UUID as the stable provider identity. Blog name, handle and custom domain are aliases. Resolve profile/avatar through blog information or the documented avatar operation. The publishing blog, original/root creator and contributors in a reblog trail may differ; retain their respective identities and roles. A quoted contributor's avatar must not silently become the publishing author's portrait. The official API and NPF trail describe these relationships; field-level fixtures still need to establish the chosen response representation. [API reference](https://raw.githubusercontent.com/tumblr/docs/master/api.md)

## Body, media and history

Request the NPF representation where supported. Preserve `content`, `layout` and `trail` rather than flattening every image from the page into one gallery. Text formatting, image variants, captions, layout order and embedded audio/video belong to distinct blocks. Treat legacy post output as compatibility data whose completeness must be compared, not assumed. Follow returned pagination/cursor semantics and retain partial-history state. [NPF specification](https://github.com/tumblr/docs/blob/master/npf-spec.md)

Proposed implementation tests should include a custom-domain blog, a renamed blog, an original mixed-media post, a reblog with additional text, a multi-contributor trail, an edited old post, a missing/default avatar and an external Sims File Share or Patreon link. The external destination uses its own adapter and entitlement; Tumblr access does not authorize the linked file. Sanitize renderable text and keep original attribution inspectable.

## Following and sign-in

The official API documents OAuth user operations for following, unfollowing and reading the user's follows. Local app tracking stays independent. An import is read-only; a native mutation needs a deliberate user-selected target and a read-back check. Public key-authenticated reads do not establish every private or restricted blog case. [Official API](https://raw.githubusercontent.com/tumblr/docs/master/api.md)

Acceptance requires the same corpus to produce correct author/avatar, complete accessible body, ordered media and history, plus separate follow/import and expired-session results. No native follow was changed in this research. See [secure login fixtures](authenticated-research.md) and [adoption criteria](validation-and-adoption.md).

## Actual original/reblog comparison: October 28, 2026

The [Maxis Match CC World reblog](https://maxismatchccworld.tumblr.com/post/745485207111680000) and its linked [Qubedesign original](https://qubedesign.tumblr.com/post/745384885786755072/qubedesign-brings-you-rindle-house-a-small) were inspected in the browser. Both initially displayed a browser check and loaded after one ordinary reload each. The [sanitized receipt](../../experiments/site-adapter-discovery/tumblr-browser-2026-10-28.json) preserves that sequence, field boundaries, hashes and image observations. This is a public theme-HTML fixture, not an authenticated API/NPF parity result.

| Operation | Reblog theme | Original theme |
|---|---|---|
| Item identity | Canonical URL, post ID `745485207111680000` | `article[data-post-id="745384885786755072"]` |
| Body boundary | `.post > blockquote` | The matching article's `.post-content .body-text.e-content` |
| Publishing account | Schema.org author `maxismatchccworld` | Schema.org author `qubedesign` |
| Original attribution | `a.tumblr_blog` and explicit original/reblog source links | The original item itself |
| Author avatar | `img.sbimage`, 128 × 128 decoded | Header `a.user-avatar` background matches a decoded 128 × 128 header image |
| Content images | 11, all decoded | 11, all decoded |
| Exclusions | 44 note avatars under `.postnotes` | Notes, comments and other recommended article IDs |

The body text is exactly equal across the two themes: 788 characters with the same SHA-256. The HTML is **not** equal, and the plain `img.src` attributes select different image sizes. The ordered `srcset` lists match. Preserve image variants and ordering; do not infer different media identities from a theme choosing a 500-pixel source instead of the 1280-pixel source. Only the images actually loaded by the browser were decoded in this experiment; larger advertised variants remain untested.

The Schema.org `articleBody` contains only 301 characters on the reblog and 295 on the original. Those summaries cannot replace the full body. Likewise, all images under `.post` would incorrectly include the note avatars. On the original theme, a bare `[data-post-id]` selector also matches the Like control as well as the article, so constrain the element type and exact requested ID.

The body links to a CurseForge project, a Sims File Share file and a credited CC creator. Store those as distinct project/download/dependency relations, keeping the publisher and original creator separate. Post IDs must remain strings through JavaScript and database serialization; these observed IDs exceed the safe integer range of JavaScript numbers.

Native Follow controls were visible but untouched. The anonymous theme output did not establish a stable blog UUID, complete history, native follow import, GIF animation or video playback. Use the documented API candidate above when authorized; this observed theme recipe is a bounded compatibility path whose selector and full-output parity must be revalidated for other themes.

## Actual video-post boundary

A separate [Qubedesign Gothika Hill post](https://qubedesign.tumblr.com/post/749194331882143744/hi-folks-i-have-a-new-build-for-you-a-large?is_related_post=1) supplied a 205-character body and an iframe within the matching article's post-content container. Its `safe.txmblr.com` wrapper identifies YouTube video `o8kFsCsfjFs`, with a source watch-link start parameter. Preserve the wrapper, provider identity and source timing as separate fields; this is an external embed, not a Tumblr-owned video file.

The visible Play control was tested. Three subsequent DOM observations reported time zero, readyState zero and no decoded video dimensions; a screenshot showed a black player with captions. A later unmute text did not resolve to a visible clickable control. Playback therefore remains **unconfirmed**, even though the post body, creator and embed identity were extracted. No media URL probing or alternate client was used to turn that uncertainty into a success claim. The [receipt](../../experiments/site-adapter-discovery/tumblr-browser-2026-10-28.json) preserves the exact separate outcome.
