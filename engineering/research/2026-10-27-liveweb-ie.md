# Live-web extraction: research candidate, not a universal winner

Reviewed 2026-10-27. Sources: LIVE01, LIVE02. This is a newly reviewed March paper, not a release since the previous hourly check.

## Source-reported evidence

[LiveWeb-IE v1](https://arxiv.org/html/2603.13773v1) evaluates text, images and hyperlinks on 15 permission-granted sites across eight domains, with four attribute/cardinality task types. Visual Grounding Scraper narrows rendered regions before producing reusable XPath selectors. The paper reports higher extraction quality than its baselines, but higher initial latency on simple pages, residual image/link errors, English-only coverage and a substantial gap from human results. Historical benchmark evaluation excludes samples with serious rendering problems; that filtering limits generalization.

The [official dataset README](https://github.com/sbY99/LiveWeb-IE) restricts use to non-commercial research, including a restriction on enhancing commercial services. No dataset has been downloaded, copied into Atlas, executed or used to train anything. Its authors' site permissions are not permissions granted to Atlas. The paper's publication license and dataset terms are separate.

## Atlas judgment and rejected shortcut

This is a useful methodology lead for detecting layout drift, not a replacement for official provider APIs or proof that all media can be collected. Reject automatic adoption from the paper's ranking. Image URL extraction is not successful image decoding, a playable stream, authorized access, complete galleries or preserved post attachments.

Before a candidate can be evaluated here, establish the exact implementation license and permitted test routes. Use independently authorized public fixtures with explicit text/image/link/audio/video/attachment expectations. Compare against Atlas's current route on the same source versions. Retain absent, unavailable and authentication-required states rather than manufacturing missing fields. Measure cold and repeated extraction, initial card visibility, interaction latency and memory separately. No third-party prototype is executed by this review and no target-project recommendation follows.

## Hourly delta scope

At 02:43 UTC, the RustSec advisory-db commits endpoint returned no commits since 01:00 UTC. This is a narrow repository check, not a complete security audit. Tokio's observed latest release remains 1.54.1 (October 21), Tauri's listed core release 2.12.5 (October 21), and SQLite's release history remains 3.54.1 (October 16). No dependency was upgraded.

One Codeberg release-page read was denied to the search crawler; no bypass was attempted. Earlier Codeberg repository observations remain historical, not freshly verified. OpenReview presented a verification page; the publicly linked arXiv manuscript was read independently instead, without solving or bypassing that check.
