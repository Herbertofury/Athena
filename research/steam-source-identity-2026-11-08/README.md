# Bind a Steam card to its original-source action

The existing workbench accepted a Portal 2 card (`steam:620`) whose source action pointed at another app (`/app/730/`), a package (`/sub/620/`) or the storefront root. A synthetic mutation of the retained public card reproduced the misleading action through the actual generated Media mount. The original published fixture is correct; this is validation of malformed inputs, not a claim Valve returned the wrong source.

The narrow repair requires a canonical positive-decimal Steam AppID in both the card identity and the `/app/<AppID>` source-path segment. Existing HTTPS/provider-host checks stay intact. Display slugs, queries, localization and fragments are retained exactly. No mismatched source is rewritten into a guessed URL. Existing whole-fixture rejection is preserved.

## Evidence and boundaries

[Raw evidence](evidence.json) retains baseline failures, DOM output, aggregate commands and the pre-existing research-check error. Six regression groups reproduce four baseline failures and two passing controls. The final candidate passes 142 root JavaScript, 107 standalone Media and 313 Python tests. The exact 37-file runtime allowlist packages successfully. The original ten-file candidate was independently reviewed; its six retained real Steam projection checks preserve 12 screenshots, 17 trailers and 59 supported media references.

The unchanged valid public dataset retains five card identities, 19 gallery entries, 23 unloaded images, exact source actions and completeness labels. No provider request or autoplay occurs. A new additive test in the existing browser lane checks the served core hash, real native Media mounting, three synthetic bad source routes and the unmodified control. Actual browser execution remains pending CI at preparation time; no locally denied browser launch was retried.

This is a namespace join, not proof that an app exists, owns every CDN asset, grants access or plays correctly. It makes no performance claim. Source repositories, learning-progress changes, private Foundry content and prior drafts remain untouched. The known later accessibility gate and cross-root research link check are not weakened.
