# Archive deadline experiment 2026-11-04

Status: isolated candidate, not deployed or proven in a real browser. Base commit 1333c5dd7833573687966c32781ea87b68ec9a14. The earlier per-read-race candidate passed the deadline fixture but was slow on tiny chunks; the new approach races once per request, cancels best-effort, and prevents late chunks from continuing. A permanently noncompliant reader can still retain its underlying pending operation; caller settlement is not resource termination. No browser, real network, UI interaction, or production memory certification is claimed.

An initial full-suite run failed because the temporary copy omitted docs and experiments. After copying the missing fixtures, the complete final suite passed. Results below are synthetic fixtures; timings are noisy and do not establish an end-to-end improvement. The memory fixture measures a Node process using standard streams, not browser memory.

## Focused final tests

```
✔ exact text, UTF-8 bytes and large generation survive without JSON-number conversion (11.118477ms)
✔ invalid identity or deadlines cannot initiate a request (1.152495ms)
✔ header, hash and length mismatches reject rather than become partial success (4.017412ms)
✔ stream budget and invalid UTF-8 reject complete-response acceptance (3.954467ms)
✔ pre-abort and bounded timeout stop the request path (5.992787ms)
✔ late responses cannot overwrite the newer selection even if a loader ignores abort (0.441731ms)
✔ failure and cancellation retain the previous verified result (0.252388ms)
✔ tiny and empty transport chunks preserve exact bytes without chunk aliases (155.91773ms)
✔ fragmented stream accepts exact byte limit and cancels overflow (20.274924ms)
✔ invalid archive headers reject promptly even if body cancellation never settles (0.788039ms)
✔ invalid body chunks reject promptly even when reader cancellation hangs (0.409633ms)
✔ archive deadline settles even if a body read ignores abort (5.076842ms)
✔ late fetch is cancelled and does not start a reader after deadline (15.930819ms)
✔ pending reader receives cancellation once on timeout (5.911436ms)
✔ late read after cancellation does not start another read and releases lock (11.381746ms)
✔ standard stream pending read is cancelled and unlocked on timeout (10.588229ms)
ℹ tests 16
ℹ suites 0
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 397.141862

```

## Full final tests

```
✔ actual YouTube loader recovers after error without extra retries or stale timers (6.147319ms)
✔ actual YouTube loader recovers after timeout without extra retries or stale timers (0.987488ms)
✔ actual YouTube loader recovers after throw without extra retries or stale timers (0.717794ms)
✔ retained v3 loader reproduces permanent rejected-promise caching (1.202289ms)
ℹ tests 288
ℹ suites 0
ℹ pass 288
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2258.157291

```

## Tiny-chunk timings

```
baseline 1 ✔ tiny and empty transport chunks preserve exact bytes without chunk aliases (146.005491ms)
baseline 2 ✔ tiny and empty transport chunks preserve exact bytes without chunk aliases (216.357666ms)
baseline 3 ✔ tiny and empty transport chunks preserve exact bytes without chunk aliases (184.761205ms)
baseline 4 ✔ tiny and empty transport chunks preserve exact bytes without chunk aliases (211.50135ms)
baseline 5 ✔ tiny and empty transport chunks preserve exact bytes without chunk aliases (223.351282ms)
candidate 1 ✔ tiny and empty transport chunks preserve exact bytes without chunk aliases (195.050932ms)
candidate 2 ✔ tiny and empty transport chunks preserve exact bytes without chunk aliases (199.82046ms)
candidate 3 ✔ tiny and empty transport chunks preserve exact bytes without chunk aliases (195.673218ms)
candidate 4 ✔ tiny and empty transport chunks preserve exact bytes without chunk aliases (205.489818ms)
candidate 5 ✔ tiny and empty transport chunks preserve exact bytes without chunk aliases (176.289293ms)

```

## Standard-stream repeated timeout memory

```
before {"rss":41349120,"heapTotal":12111872,"heapUsed":7019320,"external":3939320,"arrayBuffers":146579}
after {"rss":49594368,"heapTotal":12898304,"heapUsed":7852360,"external":4013343,"arrayBuffers":146579}
cancels 500

```

## Earlier per-read candidate and its full raw results

```
✔ exact text, UTF-8 bytes and large generation survive without JSON-number conversion (13.975968ms)
✔ invalid identity or deadlines cannot initiate a request (2.27974ms)
✔ header, hash and length mismatches reject rather than become partial success (4.80617ms)
✔ stream budget and invalid UTF-8 reject complete-response acceptance (5.218917ms)
✔ pre-abort and bounded timeout stop the request path (4.940751ms)
✔ late responses cannot overwrite the newer selection even if a loader ignores abort (0.478306ms)
✔ failure and cancellation retain the previous verified result (0.3407ms)
✔ tiny and empty transport chunks preserve exact bytes without chunk aliases (1093.770795ms)
✔ fragmented stream accepts exact byte limit and cancels overflow (94.397217ms)
✔ invalid archive headers reject promptly even if body cancellation never settles (0.853707ms)
✔ invalid body chunks reject promptly even when reader cancellation hangs (0.429793ms)
✔ archive deadline settles even if a body read ignores abort (5.331325ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1453.192716

```

## Initial incomplete-copy test failure, retained

```
✔ exact text, UTF-8 bytes and large generation survive without JSON-number conversion (36.133593ms)
✔ invalid identity or deadlines cannot initiate a request (5.515524ms)
✔ header, hash and length mismatches reject rather than become partial success (5.659149ms)
✔ stream budget and invalid UTF-8 reject complete-response acceptance (11.328502ms)
✔ pre-abort and bounded timeout stop the request path (10.27716ms)
✔ late responses cannot overwrite the newer selection even if a loader ignores abort (0.815681ms)
✔ failure and cancellation retain the previous verified result (0.905475ms)
✔ tiny and empty transport chunks preserve exact bytes without chunk aliases (287.542809ms)
✔ fragmented stream accepts exact byte limit and cancels overflow (25.579439ms)
✔ invalid archive headers reject promptly even if body cancellation never settles (0.799676ms)
✔ invalid body chunks reject promptly even when reader cancellation hangs (0.344175ms)
node:internal/modules/esm/resolve:272
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/tmp/atlas-outer-candidate/docs/audio-lab/audio-core.mjs' imported from /tmp/atlas-outer-candidate/tests/audio-core.test.mjs
    at finalizeResolution (node:internal/modules/esm/resolve:272:11)
    at moduleResolve (node:internal/modules/esm/resolve:879:10)
    at defaultResolve (node:internal/modules/esm/resolve:1006:11)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:705:20)
    at #resolveAndMaybeBlockOnLoaderThread (node:internal/modules/esm/loader:725:38)
    at ModuleLoader.resolveSync (node:internal/modules/esm/loader:763:56)
    at #resolve (node:internal/modules/esm/loader:687:17)
    at ModuleLoader.getOrCreateModuleJob (node:internal/modules/esm/loader:607:35)
    at ModuleJob.syncLink (node:internal/modules/esm/module_job:276:33)

```
