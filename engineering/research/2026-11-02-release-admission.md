# Fixed-provider release admission, November 2, 2026

## Implemented correction

The hls.js and serde_json observers now check a non-prerelease version tag in addition to the provider's draft/prerelease flags. Previously, a matching release URL and `prerelease:false` admitted an alpha/RC tag. New admission requires three numeric core components, no leading zeroes, and optional valid build metadata. The existing lowercase `v` prefix is supported. This is a fixed-provider policy, not a universal Git tag parser or release recommendation. [REL110201]

The stricter check runs only when saving a new observation. Historical records remain readable under their original validation contract; no stored bytes are rewritten. A rejected new observation leaves the last-good payload intact. RustSec commit observations are unaffected.

## Verification and limits

- Fresh direct-rustc build of the full Atlas library: **145 tests passed**, including last-good preservation and historical alpha-record replay.
- Exact parser-prefix replay: **six tests passed**, including current public hls.js and serde_json bodies, complete byte preservation, build metadata and RustSec identity.
- Initial bounded compilation failures are retained: the linker aborted with `std::system_error` under a 1 GiB address-space cap; full-crate compilation then exhausted that cap. The final build used one codegen unit, one linker thread and a 1.5 GiB address-space cap. This is build-resource control, not a runtime speed result.
- Both affected baseline files were byte-identical to remote commit `de9481e07b31a12918fa2cd53909e706d207b225` before applying this patch.

Raw evidence remains retained privately. Full library tests do not establish native browser, deployed service or loaded-harness acceptance. No dependency upgrade, cross-project recommendation or general autonomous-modification claim follows.

Source: [Semantic Versioning 2.0.0](https://semver.org/). A tag without a prerelease suffix is not a guarantee of API stability, particularly for major version zero.
