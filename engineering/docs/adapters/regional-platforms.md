# Regional creator and mod-community platform candidates

[Adapter laboratory](README.md) · [Coverage catalog](coverage-catalog.md) · [Login workflow](authenticated-research.md) · [Validation and adoption](validation-and-adoption.md)

Research date: 2026-10-28. Eight distinct candidate adapters. This is primary-source research and a proposed extraction method, not runtime support. No login, private-body extraction, native follow mutation, purchase or attachment download was tested.

Use official search/RSS only for the content they actually expose. An owner publishing API, own-profile OAuth scope, commerce API or app-internal request is not evidence of an arbitrary-author reader. Public snippets and finite feeds do not establish complete posts/history. The original design proposals below identify implementation evidence still needed. Each row preserves local follow separately from native follow, friendship/access approval, community membership and paid entitlement.

## Matrix

| Adapter ID | Platform | Access / API boundary | Native follow | Evidence |
| --- | --- | --- | --- | --- |
| naver-blog | Naver Blog | Use officially documented Blog Search API for discovery/snippets and public blog RSS for updates. Complete body/media/attachments need public page parsing or an authorized user session where access requires it; RSS/search alone cannot establish full history or private access. | Local author follow. Official Naver support describes subscriptions/neighbors for blog updates. Native neighbor versus mutual-neighbor/request state and API write capability require separate verification; never auto-request private access. | official-current-search-and-rss-help; official-posting-api-retirement; extraction-unverified |
| naver-cafe | Naver Cafe | Official Cafe Article Search API provides public search metadata/snippets. Full article, profile, files, membership/board access and history require publicly available page or legitimate authorized session fixtures. A search hit does not prove complete readable article or attachments. | Native member subscribe/unsubscribe is officially documented; creators can disable member subscriptions. Cafe membership, board permissions, member subscription and local author follow are separate states. Cafe join API is a mutation, not author follow. | official-search-api; official-join-write-api; official-member-profile-and-follow-help; full-reader-unverified |
| fc2-blog | FC2 Blog | Official RSS documentation supports full or partial article feeds; private-mode restrictions and paid Magablo are separate. Public HTML/feed reader is the candidate route; authorized private/paid reading must use legitimate existing access and remains untested. | Local follow/RSS subscription. FC2 Blog documents Bro-tomo relationship and restricted posts; do not equate a friend/access request or paid Magablo subscription with a free social follow. Native simple-follow capability unverified. | official-rss-profile-and-access-help; legacy-owner-publishing-docs; runtime-unverified |
| ameba | Ameba / Ameblo | Official help documents public posts and restricted Amenber updates in native follow feed. Public pages plus legitimate Amenber-authorized session are candidate read routes; no supported arbitrary third-party full-reader API was established. A separate official RSS announcement documents the public HTTPS feed; full body/history still need fixtures. | Native follow exists with public/private notification choices and request statuses. Amenber access is separate from ordinary follow. Local follow independent. Do not automatically request public follow approval or Amenber membership. | official-current-follow-feed-help; official-profile-settings; full-extraction-unverified |
| hatena | Hatena Blog | Official public Atom/RSS feeds support blog/category/author updates; default body can be full or owner-configured summary. Public page parsing fills observed gaps. Owner AtomPub API is a separate authenticated editing route, not an arbitrary follower reader. | Official native Read/Subscribe is free and confirmed through UI. Reader list is public; an account subscription-list feed contains a secret token. Local follow independent. Do not import native follow state from public reader count. | official-feed-atompub-profile-follow-docs; authorized-private-reader-unverified |
| note | note.com | Official ordinary RSS publishes excerpts/recent entries; note pro custom-domain full-text RSS is separately documented and latest-article feed only. Complete paid/member body requires legitimate existing entitlement on site; no general patron-reader API verified. | Native creator follow/unfollow documented in official help. Local author follow separate from paid article purchase, membership and magazine follow. Exact native follow API unverified. | official-rss-fulltext-file-follow-profile-help; reader-api-unverified |
| rednote | Xiaohongshu / Rednote | Official account Open Platform currently exposes basic_info authorization while read_notes/read_followers are marked planned. Separate commerce Open Platform serves merchant/product/order flows. Main Explore fetch redirected to login. Arbitrary creator-note reader is not documented or runtime-verified. | Official privacy UI describes user-selected follow/unfollow. Native automation and follower-list import not verified; read_followers is planned in current account scope page. Local follow should remain primary app behavior. | official-current-scope-and-commerce-docs; official-login-redirect; extraction-unverified |
| arca-live | Arca.live / Tullius candidate | Discovered mod-community candidate. Official root, Tullius channel and notices URLs could not be retrieved by research tool. Current public/authorized read access, API/RSS, attachment semantics and site permissions are unverified. Include as researched candidate, not supported adapter. | Local author follow. Native account follow, channel subscribe and bookmarks must be independently verified; no native follow/API capability established by inaccessible primary pages. | discovery-candidate; official-url-fetch-failed; all-runtime-capabilities-unverified |

## Naver Blog — `naver-blog`

**Identity and author avatar.** Official search fields bloggername/bloggerlink identify blog name/address, not a verified individual author ID/avatar. Official profile help distinguishes blog title, nickname, introduction and profile photo. Proposed resolver retains canonical blog URL, observed blog identifier, post identifier and nickname separately; confirms avatar in profile chrome, not first post image.

**Body, media and attachments.** Proposed parser preserves ordered text/images/video embeds and explicit authorized file controls. Search description is a snippet; search title bold tags mark search matches. Do not label an image CDN preview an original mod download. Linked cloud files require independent access resolution.

**Pagination/history.** Use RSS for incremental discovery and measure coverage; backfill actual public archive pagination after fixtures. HTTPS and HTTP/1.1+ required by current RSS support notice. Record renamed-blog aliases and actual redirects; do not assume indefinite old-URL resolution.

**Official API status.** The old authenticated Blog posting Open API ended 2020-05-06. This did not retire Blog Search or RSS. Current search is discovery, not full arbitrary-author content reader or follow API.

**Implementation caution.** High Korean creator/mod discovery relevance. Namespace identity by service and verified canonical identifier. Blog title is not necessarily author nickname. Current native session selectors and attachments have not been tested.

**Acceptance fixtures (proposed).** Blog title differs from nickname; profile avatar differs from post cover; Public RSS item with full page containing more media; Mobile/desktop URLs for same post deduplicate; Renamed blog and expired redirect; HTTP/1.0 426 response becomes protocol fix, not removed author; Private/neighbor-only content remains locked.

**Primary sources and evidence.**

- [검색 > 블로그 - Search API](https://developers.naver.com/docs/serviceapi/search/blog/blog.md) — official source; exact retrieval depth is recorded in the catalog.
- [블로그 오픈 API 종료 안내 - 공지사항](https://developers.naver.com/notice/article/7527) — official source; exact retrieval depth is recorded in the catalog.
- [기존에 구독 중이던 RSS가 갱신되지 않을 경우 : 블로그 고객센터](https://help.naver.com/service/5593/contents/24722?lang=ko&osType=COMMONOS) — official source; exact retrieval depth is recorded in the catalog.
- [프로필 정보 수정 방법 : 블로그 고객센터](https://help.naver.com/service/5593/contents/15208?osType=PC&ostype=pc) — official source; exact retrieval depth is recorded in the catalog.
- [블로그 아이디 변경 유의사항(리다이렉트 기간 안내) : 블로그 고객센터](https://help.naver.com/service/5593/contents/21126?lang=ko&osType=COMMONOS) — official source; exact retrieval depth is recorded in the catalog.
- [모바일에서 받을 수 있는 소식 안내 : 추천·구독 고객센터](https://help.naver.com/service/5628/contents/18863?lang=ko&osType=MOBILE) — official source; exact retrieval depth is recorded in the catalog.

## Naver Cafe — `naver-cafe`

**Identity and author avatar.** Official profile help says profile image and nickname can be cafe-specific. Proposed author key is cafe/community identity plus verified member identity, preserving observed author profile link. cafename/cafeurl in Search API identify the cafe, not article author or avatar. Never use cafe logo as author avatar.

**Body, media and attachments.** Proposed parser extracts article body blocks and author-adjacent profile image from verified chrome, then ordered galleries/embeds and explicit attachment rows with access checks. Preserve board/category and article author. Do not infer internal file download routes from search snippets.

**Pagination/history.** Search pagination covers search results only. Verify author activity history, board list and account feed separately; permission/level/age/login boundaries must not be bypassed. Record partial archive coverage when some boards are inaccessible.

**Official API status.** Official OAuth Cafe Open API documents cafe joining and writing, including multipart images. It is not documented arbitrary read/list-files/follow API. Search API is distinct and read-oriented but snippet-limited.

**Implementation caution.** Important author/avatar pitfall: one Naver user may intentionally present different profiles across cafes. Do not merge cafe identities solely by nickname or photo. Do not join cafes or post during synchronization.

**Acceptance fixtures (proposed).** Same nickname in two cafes remains two provisional identities; Cafe logo, member avatar and comment avatar never swap; Search-visible but member-locked article; Member subscribe disabled; Public post plus authorized archive attachment; Board pagination overlaps or returns permission page.

**Primary sources and evidence.**

- [검색 > 카페글 - Search API](https://developers.naver.com/docs/serviceapi/search/cafearticle/cafearticle.md) — official source; exact retrieval depth is recorded in the catalog.
- [카페 가입 · 글쓰기 API 명세 - LOGIN](https://developers.naver.com/docs/login/cafe-api/cafe-api.md) — official source; exact retrieval depth is recorded in the catalog.
- [프로필 변경 방법 : 카페 고객센터](https://help.naver.com/service/5622/contents/15196?lang=ko&osType=PC) — official source; exact retrieval depth is recorded in the catalog.
- [구독 설정/해제 방법 : 카페 고객센터](https://help.naver.com/service/5622/contents/11421?lang=ko&osType=PC) — official source; exact retrieval depth is recorded in the catalog.
- [멤버 구독 허용 설정/해제 방법 : 카페 고객센터](https://help.naver.com/service/5622/contents/23798?lang=ko&osType=PC) — official source; exact retrieval depth is recorded in the catalog.

## FC2 Blog — `fc2-blog`

**Identity and author avatar.** Use verified blog ID/canonical origin and observed article ID with template-aware author profile module. Official profile manual distinguishes uploaded profile image, introduction and administrator name. Profile module may be absent or vary between mobile/desktop templates; retain null avatar rather than substituting header/first image.

**Body, media and attachments.** Proposed ordered HTML parser preserves main body and read-more continuation, galleries, external video embeds and explicit file links. FC2 allows extensive template/HTML customization, so sanitizer must remove scripts and unrelated plugin/sidebar material. Images rendered as article media stay separate from downloaded archives.

**Pagination/history.** Use discovered RSS link and actual archive/month/category navigation; finite feed is not historical completeness. Validate canonical host changes and feed redirects. Private-mode feeds stop; previously received feed records do not establish present authorization.

**Official API status.** Official FAQ still documents XML-RPC for blog editing with an HTTP endpoint example. Treat as owner publishing integration with legacy transport example, not arbitrary-reader API and not proof it is deprecated or currently operational. Do not send credentials over HTTP or runtime-test writes.

**Implementation caution.** Do not match every *.fc2.com host blindly: confirm Blog identity, because FC2 hosts several services. Custom-domain detection needs evidence. Paid/private content completeness requires separate fixtures.

**Acceptance fixtures (proposed).** Different shared templates and mobile profile absent; Partial RSS plus read-more continuation; Profile avatar hosted externally; Password/private mode and Bro-tomo restricted article; Already entitled Magablo content remains account-specific; HTML/script-heavy sidebar does not contaminate body.

**Primary sources and evidence.**

- [FC2ブログの仕様　FC2ブログでできること | マニュアル | FC2blogヘルプ](https://help.fc2.com/blog/manual/group2/1403?nc=1) — official source; exact retrieval depth is recorded in the catalog.
- [[RSS] ブログのRSS FC2ブログのマニュアル](https://blogfc2manual.blog.fc2.com/blog-entry-16.html) — official source; exact retrieval depth is recorded in the catalog.
- [その他 | Q&A | FC2blogヘルプ](https://help.fc2.com/blog/qa/group242/833) — official source; exact retrieval depth is recorded in the catalog.
- [プロフィールの設定 | マニュアル | FC2blogヘルプ](https://help.fc2.com/blog/manual/Home/kankyou/profile.html) — official source; exact retrieval depth is recorded in the catalog.
- [アクセス制限　プライベートモード | マニュアル | FC2blogヘルプ](https://help.fc2.com/blog/manual/group100/2517?nc=1) — official source; exact retrieval depth is recorded in the catalog.

## Ameba / Ameblo — `ameba`

**Identity and author avatar.** Proposed identity resolver preserves canonical blog/account and verified article ID, nickname and author profile URL. Profile image and cover image are separate official settings. Verify author image from header/profile, not Pigg decoration, post cover, featured blogger or commenter.

**Body, media and attachments.** Proposed parser preserves article text/image order, video/external embeds and named explicit downloads/outbound mod references where actually present. Do not claim native file attachments or original video export without a fixture and supported control.

**Pagination/history.** Native My Feed is not complete history: current official October 2026 help limits it to two recent months and up to 2,000 accounts/articles. Backfill verified blog archive separately. Account feed can fail when login session expires.

**Official API status.** No documented arbitrary full reader API verified. The [official Ameba RSS announcement](https://ameblo.jp/staff/entry-12865036798.html) documents `https://rssblog.ameba.jp/{ameba-id}/rss20.xml`; a 2024 update reversed the proposed old-host retirement. Verify the current feed against full public articles. Native feed docs describe UI behavior, not a public API for restricted Amenber posts.

**Implementation caution.** Newest follow-feed troubleshooting is dated 2026-10-20/22 and supersedes older-only descriptions. Preserve native private/public/approved/pending follow state and Amenber access independently.

**Acceptance fixtures (proposed).** Private follow versus approved/pending public follow; Amenber-only post teaser versus entitled body; Two-month feed boundary not marked full archive; Expired session returns login/feed error; Author profile photo differs from cover/decorative Pigg art; Draft/publish toggle not producing feed update.

**Primary sources and evidence.**

- [Amebaヘルプ｜マイフィードのフォロータブが表示されない・エラーになる](https://helps.ameba.jp/faq/ameba/0211/post_1195.html) — official source; exact retrieval depth is recorded in the catalog.
- [Amebaヘルプ（アプリ版）｜フォローフィードで困ったときは](https://app.helps.ameba.jp/apphelp/help/apptrouble/post_140.html) — official source; exact retrieval depth is recorded in the catalog.
- [Amebaヘルプ｜フォローフィードに追加する（フォローする）](https://helps.ameba.jp/faq/blogrp/2290/post_1261.html) — official source; exact retrieval depth is recorded in the catalog.
- [Amebaヘルプ｜プロフィールの設定方法(スマートフォン)](https://helps.ameba.jp/faq/room/room/post_1290.html) — official source; exact retrieval depth is recorded in the catalog.
- [Amebaヘルプ｜アメブロ以外のお気に入り](https://helps.ameba.jp/qguide/rss/post_162.html) — official-historical-external-feed-subscription-help; not-public-Ameblo-feed-proof.

## Hatena Blog — `hatena`

**Identity and author avatar.** Official profile module documents Hatena ID, nickname and icon. Proposed author resolver uses author/byline ID and verified profile icon; preserve blog owner versus individual author on multi-author blog. Custom domains need proven Hatena origin; do not equate hostname with account ID.

**Body, media and attachments.** Proposed parse uses ordered public feed HTML or article body, sanitizing arbitrary embedded content. Separate article images/embeds from explicit downloadable files or external-host links; do not invent native file library capability.

**Pagination/history.** Official feed patterns: /feed and /rss, optional /category/{category} or /author/{Hatena ID}; default 30 entries and size=1..100. Finite feed remains incomplete archive. Follow actual archive links for history; preserve feed IDs/canonical URLs and strip only tracking parameters from identity, not signed delivery requests.

**Official API status.** Official Hatena Blog AtomPub supports owner entry listing/read/create/edit/delete and authenticated blog collections. Auth API keys are equivalent to passwords and not required for ordinary public RSS reading. Current help documents API; do not label it deprecated without evidence.

**Implementation caution.** Secret subscriber feed must be stored as credential and never published in provenance. Avoid mass native subscribe actions; ordinary reader API scope is not established by owner AtomPub operations.

**Acceptance fixtures (proposed).** 30-entry default and size=100 finite feed; Summary-only Pro feed versus full article; Multi-author blog and author-specific feed; Profile icon versus article/header image; Custom domain plus tracker query deduplication; Private subscriber feed token never enters logs.

**Primary sources and evidence.**

- [更新フィード - はてなブログ ヘルプ](https://help.hatenablog.com/entry/feed) — official source; exact retrieval depth is recorded in the catalog.
- [はてなブログAtomPub - はてなブログ ヘルプ](https://help.hatenablog.com/entry/atompub) — official source; exact retrieval depth is recorded in the catalog.
- [読者機能で更新をチェックする - はてなブログ ヘルプ](https://help.hatenablog.com/entry/reading/subscribe) — official source; exact retrieval depth is recorded in the catalog.
- [サイドバーに「プロフィール」を表示する - はてなブログ ヘルプ](https://help.hatenablog.com/entry/sidebarmodule/profile) — official source; exact retrieval depth is recorded in the catalog.

## note.com — `note`

**Identity and author avatar.** Proposed key uses creator note ID/profile URL and observed article ID; display name and profile icon confirmed at author header. Official help distinguishes article-page profile icon from header/cover. Keep collaborative magazine identity distinct from article byline.

**Body, media and attachments.** Official file-upload help explicitly distinguishes images inserted as displayed media from files, including image files uploaded as downloadable attachments. Parse ordered text/media/file blocks, preserve actual filename and download control; do not turn every visible image into an attachment.

**Pagination/history.** Ordinary/latest RSS has 25 entries, custom-domain note pro 50 per official help. Magazine RSS order differs from article publication order and full-text feature does not cover magazines. Verify archive paging independently and label excerpt/full/paid snapshots separately.

**Official API status.** The [official note API help](https://www.help-note.com/hc/ja/articles/46643492548121), updated October 9, 2026, describes access for note pro enterprise/solution partners. This is not a general patron-reader grant. Ordinary RSS/embed and Pro full-text RSS remain separate routes. Do not label internal `/api/` requests official merely because the website uses them.

**Implementation caution.** Promising regional creator source because explicit downloadable files are documented. App synchronization never buys article, subscribes to membership, tips, joins magazine or starts paid service.

**Acceptance fixtures (proposed).** Ordinary excerpt feed vs full web article; Pro custom-domain full-text latest feed vs magazine excerpt; Same image inserted inline and uploaded as downloadable file; Paid preview vs already purchased complete article; Creator icon vs article heading image; 25/50 entries never treated as entire author history.

**Primary sources and evidence.**

- [iframe、RSSで、自分のサイトにnoteを表示する – noteヘルプセンター](https://www.help-note.com/hc/ja/articles/4402395202841) — official source; exact retrieval depth is recorded in the catalog.
- [記事の全文をRSSで受け取る設定 – noteヘルプセンター](https://www.help-note.com/hc/ja/articles/900001001246) — official source; exact retrieval depth is recorded in the catalog.
- [ファイルアップロード機能について – noteヘルプセンター](https://www.help-note.com/hc/ja/articles/360016349894) — official source; exact retrieval depth is recorded in the catalog.
- [クリエイターをフォローする/外す方法 – noteヘルプセンター](https://www.help-note.com/hc/ja/articles/360010308794) — official source; exact retrieval depth is recorded in the catalog.
- [記事をはじめて公開する前にやっておいてほしいこと – noteヘルプセンター](https://www.help-note.com/hc/ja/articles/360012303194) — official source; exact retrieval depth is recorded in the catalog.

## Xiaohongshu / Rednote — `rednote`

**Identity and author avatar.** Official basic_info scope documents nickname/avatar for the authorizing user, not every requested creator. Proposed public/authorized profile resolver must prove creator identity, canonical profile URL and author avatar separately; account ID format and note IDs are not asserted from this research.

**Body, media and attachments.** Proposed authorized surface parser distinguishes note text, ordered image gallery, video preview/player and outbound references. Native arbitrary mod-file attachments or video-original download support not established. Do not substitute thumbnails for originals or derive undocumented signing/anti-bot headers.

**Pagination/history.** No full creator-history pagination or read scope verified. Treat any user-visible history as partial until normal authorized pagination is observed. Shared short links need safe canonical resolution, with tokens/trackers withheld from public provenance where sensitive.

**Official API status.** Account scopes page updated 2026-03-29 says basic_info open; user_profile/read_notes/write_notes/read_followers planned. Sensitive-permission application text does not prove general availability. Merchant API, miniapp guide-follow and own-profile OAuth are not arbitrary social reader APIs.

**Implementation caution.** Login or challenge means user handoff/manual open-in-site. Do not evade signed-request mechanisms, app restrictions or bot controls. basic_info avatar belongs to the logged-in user and must not be assigned to the creator being followed.

**Acceptance fixtures (proposed).** Authorized user avatar never mistaken for target creator avatar; Login redirect returned as login_required, not empty creator; Share shortlink resolves safely without forwarding session; Gallery preview vs available image detail; Unknown note history cursor retains historyComplete=false; Planned API scope cannot be activated by guessed endpoint.

**Primary sources and evidence.**

- [授权范围（Scope） · 小红书开放平台](https://openaccount.xiaohongshu.com/docs/scope) — official source; exact retrieval depth is recorded in the catalog.
- [开发者文档](https://open.xiaohongshu.com/document/developer/file/17) — official source; exact retrieval depth is recorded in the catalog.
- [小红书](https://fe.xiaohongshu.com/dittossr/vincent/ae18bde7446e4899a08877e1bc47cd33) — official source; exact retrieval depth is recorded in the catalog.
- [小红书 - 你的生活兴趣社区](https://www.xiaohongshu.com/explore) — official-fetch-redirected-to-login; no-note-body-observed.

## Arca.live / Tullius candidate — `arca-live`

**Identity and author avatar.** Proposed model keeps channel ID, canonical article URL/observed ID and poster identity separate. Tullius channel is not an author. Use only verified poster header/profile mapping for nickname/avatar; do not assign channel icon, anonymous poster identity or commenter avatar to author.

**Body, media and attachments.** Proposed parser preserves title/body, ordered images/embeds and explicit download/outbound references only when legitimately visible. Do not claim attachment host, numeric schema, API endpoint or archive availability without observed primary fixture. External mod links need independent entitlement.

**Pagination/history.** Verify normal channel list, article links and author activity pagination before implementing history. Deleted/hidden/age-gated/login/challenge pages must remain explicit partial states. No RSS or history API discovered/verified in this review.

**Official API status.** No official public reader API or feed documentation verified. Do not promote community downloader code or guessed internal endpoints into official platform support.

**Implementation caution.** Tullius mod relevance is a discovery lead, not independently primary-source verified here. This row intentionally reports the evidence gap instead of inventing support. Root can enrich later with current platform sources and legitimately accessible fixture.

**Acceptance fixtures (proposed).** Verified channel/article fixture required before parser claim; Channel icon vs author avatar vs commenter avatar; Anonymous poster retains anonymity and provisional identity; Public mod article with independently authorized external file; Deleted/age/login/challenge response not successful empty body; Native channel subscribe never mislabeled author follow.

**Primary sources and evidence.**

- [Arca.live official root (title unavailable)](https://arca.live/) — official-url-unretrievable.
- [Tullius channel candidate (title unavailable)](https://arca.live/b/tullius) — official-url-unretrievable; discovery relevance unverified.
- [Arca.live notices candidate (title unavailable)](https://arca.live/b/notice) — official-url-unretrievable.

## Cross-platform acceptance and storage rules

Author attribution is the main invariant: blog/cafe/channel title is not automatically author name; cover, logo, first article image and commenter avatar must never become the author avatar. A missing avatar is preferable to a guessed image. Keep evidence for canonical profile, displayed name and avatar mapping. Use verified platform IDs where available; otherwise keep an explicit canonical-URL provisional key. Do not merge identities solely by matching nickname/photo, especially cafe-specific profiles and anonymous community posters.

Normalize body into ordered text/image/gallery/embed/file blocks. A visible video player does not prove downloadable original video; an external archive URL does not prove access. Preserve file label, original filename and size/type only when actually exposed. Separate preview image from original media, and image displayed inline from image offered as a downloadable file. Never invent private JSON key names from these design notes.

Track content completeness separately from history completeness and file-download permission. Keep pagination checkpoints, repeated-cursor/duplicate protection, pinned-post handling and oldest retrieved date. Secret native subscription feed URLs, login cookies, OAuth tokens, receipt links and signed attachment URLs never belong in public provenance or logs. Restrict credentials by origin and user account. Account-authorized body snapshots must not contaminate public/other-account caches.

Stop at access denial, age/account membership gate, bot challenge, unsupported permission or DRM boundary, and show partial/manual/open-in-site state. Do not manufacture official API claims from community scripts, search snippets or inaccessible pages. Local Follow remains useful even when native state and complete reading are unavailable.

## Current interface distinctions

- Naver Blog posting API ended in 2020; its Search API and RSS are separate current capabilities. HTTP/1.0 RSS clients now fail; use current protocol/HTTPS.
- Naver Cafe search returns cafe identity and excerpts, while individual posters may have cafe-specific nicknames/photos. Member subscription and cafe join/write API are separate.
- FC2 XML-RPC is documented for owner editing; a legacy HTTP example is not evidence of safe current transport, arbitrary reading, or API retirement.
- Ameba's current native feed has a two-month/2,000-item bound and includes two separate follow/Amenber relationship types. It cannot stand in for full historical enumeration.
- Hatena offers public feed and authenticated owner AtomPub; its private subscription-list feed has a secret token. Finite public feed and multi-author attribution need special handling.
- note ordinary RSS is excerpt-limited; Pro full-text RSS is a distinct owner setting. Native downloaded file blocks are real and must remain distinct from inline images.
- Xiaohongshu's official current account scope page lists basic_info as open and reading notes/followers as planned. The logged-in user's nickname/avatar is not target creator identity.
- Arca.live/Tullius is intentionally an evidence-gap candidate: official URLs were inaccessible, so no API, native follow, attachment or complete-history behavior is certified.

The catalog also retains the [Naver September 22, 2026 RSS redirect notice](https://developers.naver.com/notice/article/33510): old RSS URLs stop redirecting three months after a blog-ID change. Preserve aliases with dates and verify the new origin.
