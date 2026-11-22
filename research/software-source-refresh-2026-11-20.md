# Source refresh: nightly expiry and HEAD-only false removal

Reviewed 2026-11-20 after PR306 source audit run 44651964298. This is a source-maintenance correction, not installation, runtime compatibility or security certification. No applications were removed. No strict audit failures were waived.

## Preserved previous provenance

| Record | Previously reviewed source | Original review | Original support | Observation and replacement |
|---|---|---|---|---|
| bottom | https://github.com/ClementTsang/bottom/releases/expanded_assets/nightly-99d586a1-1794557057 | 2026-11-14 | pricing (public application distribution) | Hosted audit GET 404. Replace active evidence with [official stable 0.15.0 release](https://github.com/ClementTsang/bottom/releases/tag/0.15.0); [official release list](https://github.com/ClementTsang/bottom/releases) exposes public release assets. Original MIT license evidence remains unchanged. |
| Webots | https://github.com/cyberbotics/webots/releases/expanded_assets/nightly_13_11_2026 | 2026-11-15 | platforms, downloads | Hosted audit GET 404. Replace active evidence with [official stable R2025a release](https://github.com/cyberbotics/webots/releases/tag/R2025a), which lists Windows, Linux and macOS packages. Preserve the separate dated nightly maintenance observation; it is not a claim that the old nightly is still downloadable. |

Ephemeral nightly asset endpoints are not durable evidence locations. The historical URLs and dates above remain available for provenance but no longer support current distribution claims. Release pages are preferred over transient expanded-assets fragments. No copied binary or changed download destination is introduced.

## VirtualBox: retain original official URLs

The hosted audit observed HEAD 410 for https://www.virtualbox.org/ and https://www.virtualbox.org/wiki/Downloads. A normal bounded GET (same audit User-Agent and Range bytes=0-16383) returned HTTP 206 and the expected Oracle VirtualBox and Downloads HTML on both original URLs. Therefore these sources were **not removed or relabeled as historical/unavailable**. The exact cause of the HEAD/GET disagreement is unknown; anti-bot behavior is not asserted.

[Oracle's official download page](https://www.oracle.com/virtualization/technologies/vm/downloads/virtualbox-downloads.html) independently links the original community Downloads URL and lists base packages and their separate extension-pack route. Web-search fetching the community URLs failed, so the normal GET result, not a search failure, determined the correction.

The audit already confirms HEAD 404 and other method-specific errors using bounded GET. Extend that same confirmation to HEAD 410 and retain `head_status` in the receipt. Actual GET 404/410 still classify as not-found and fail the unchanged strict gate for current sources. The request remains bounded, with normal redirects/public-address checks and no authentication, permission changes or bypasses.

## Acceptance

Regression tests cover HEAD 410 followed by reachable 206, bounded response reads, confirmed GET 404/410, and strict-gate failure for current 410. Regenerate catalog derivatives; verify only the two intended records changed and preserve all other application objects. Hosted CI and live-link audit must be checked on the final commit; local HTTP observations are not universal availability guarantees.
