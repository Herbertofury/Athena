# Compatibility-preserving offline search candidate

R&D follow-up to #184; **not deployed in Athena**. That comparison retained two
FTS5 compatibility failures. This implementation repairs the behavior with a
preindexed JavaScript candidate: existing contiguous-substring matches and their
ordering always win; only a zero-result query falls back to requiring every token.
Empty queries return the same full ordered lesson list. No model/service required.

`node research/offline-compatible-search-2026-11-15/compare.cjs` executes the actual
Athena app search function twice in the same Node runtime with identical rendering
stubs, substituting only the candidate lesson filter. It compares 98 current lesson
records with 208 cases: the previous 12 author-selected cases and **196 generated
exact-title/reordered-text cases**, not a blind relevance study. Baseline nonempty
results must remain byte-for-byte equal. Successful nominated-target retrieval
anywhere in results: **105/208 baseline, 208/208 candidate**. This uses anywhere
recall rather than #184's top-five metric; these totals are not interchangeable.
The generated portion is a compatibility/metamorphic test, not proof of usefulness.

The receipt includes 101 alternating-order same-runtime samples per query, setup
cost and 26,619 UTF-8 bytes of indexed text. This size is not process memory, and
microtimings are not actual input latency. False-positive relevance, larger corpora,
independent tasks and full persistent-index update/rollback still need evaluation.
The candidate currently rebuilds its index when created, not automatically when
lesson objects mutate. Production adoption would need an explicit update lifecycle.

## Real UI gate

`browser.cjs` runs actual Athena HTML/scripts in Chromium with all requests fulfilled
from local checked-in files; requests to other origins are aborted. The candidate
is a test-only app-response substitution, never a production source edit. It checks
substring parity, reordered discovery, page errors and loaded script hashes, and
records input-to-two-animation-frames samples. This is a bounded signal, not p95
user typing latency or a general UI performance proof.

The first local browser attempt **could not launch**: matching Chromium was absent.
`browser-evidence.json` preserves that failure without local machine paths. No
security flags or alternative binaries were tried. The dedicated CI workflow uses
the pinned repository Playwright dependency and installs its official Chromium,
then retains both comparison/browser receipts even on failure. CI outcome must be
checked separately; this README does not assert an unobserved browser pass.

Rollback is removing the isolated experiment; native app source is unchanged.
Earlier failed candidate evidence remains under `offline-target-search-2026-11-15`.

### Verified hosted receipt

The dedicated hosted run [43669779259](https://github.com/Herbertofury/Athena/actions/runs/43669779259)
on head `0e55d37af74e250b82ffb54b1664d54ac934a1b7` passed in Chromium
151.0.7922.34. `hosted-browser-receipt.json` preserves its real raw browser receipt.
Artifact 14142949266 ZIP SHA-256:
`abc149d3fd4a27cc5ce112bd9e8df69be0f63edbcf0bdf172c1ff5ec8ecc4347`.
Loaded baseline/candidate script hashes verified. Subnet results/order preserved;
reordered database and cryptography queries rendered their expected lessons.
Median input-to-two-frame samples were about 31.7–31.9 ms for both: **no demonstrated
speed advantage**, and frame cadence dominates this measurement. Local missing-browser
failure remains preserved separately. This is a hosted local-app experiment, not a
production deployment or native offline-learning rollout.
