# Preview timeout source detachment

2026-10-28. The actual media preview loader previously settled a timeout while leaving the image's source attached. The generated [baseline receipt](baseline.json) reproduces that state using the [retained implementation](baseline-preview-loader.mjs.txt). This is not evidence of a real provider timeout or a measured network leak.

The loader now removes the timed-out image's `src` before releasing its logical worker slot, retaining `dataset.source` for explicit retry. It does not assign an empty URL. Late decode completion stays failed; a stale timeout callback cannot detach a subsequently successful image. If DOM cleanup itself throws, an explicit cleanup-failure observation is retained and the batch still terminates. Earlier decoded images and exact source identities remain untouched.

Primary source [IMGABORT01](../../docs/sources.md#imgabort01): WHATWG's image-source update algorithm aborts current/pending requests when no image source remains. These cards use neither srcset nor picture. This does not prove immediate socket release, strict physical-network concurrency, memory recovery or faster loading. The four-worker and 30-second default budgets are unchanged.

Thirteen focused preview tests include timeout detachment, explicit retry, late completion, cleanup failure and stale callback regression. The [native browser check](../../docs/media-lab/preview-timeout-check.html) uses a deliberately stalled decode wrapper and a generated one-pixel data image. Its result distinguishes actual DOM detachment/native retry from untested live-network cancellation. No provider is contacted by that generated check.

## Native browser result

The deployed `43262c8591f45de1058cf66c1909b95c4e91e46c` check passed actual DOM source detachment, preservation of retry identity, rejection of late success and native decode of the restored one-pixel image. [Complete generated receipt](native-browser.json). All 18 served media asset hashes matched. The real-card page subsequently loaded all five cards with zero preview sources and zero player elements before interaction, preserving explicit loading and autoplay-off behavior. Local full checks passed 160 Node and 95 Python tests; implementation CI passed on Linux and Windows. This does not turn the generated stall into a live-network timeout measurement.
