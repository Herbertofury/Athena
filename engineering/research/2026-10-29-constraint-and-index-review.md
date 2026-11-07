# Constraint enforcement and index-tail review

Reviewed October 29, 2026. These are newly inspected sources, not a claim that both papers were published today. No upstream prototype was built or executed; no application database or default index is replaced.

## Constraint enforcement

[PAPERCONST29] presents a PostgreSQL constraint-index prototype for invariants spanning relations. Its reported comparisons use correctness-preserving alternatives; an unenforced database is not equivalent work. Derived constraint state is rebuilt after database recovery rather than independently WAL-logged. The description covers whole-transaction abort, but does not establish savepoint/subtransaction handling. Reported gains on PostgreSQL 16 and high client concurrency are not SQLite performance evidence. The paper's v1 was submitted October 26.

**Atlas decision:** retain as a research candidate. Atlas already uses ordinary database constraints plus validated readers. The new saved-version read guard is independent Atlas implementation work, not a reproduction of this PostgreSQL prototype. Any schema change needs migration, legacy-data, concurrent-write and recovery tests on copies first; read guards remain necessary for malformed storage. No prototype reuse or execution is authorized merely by a paper link.

## Concurrent-index tails and complete readback

[PAPERWAVE29], metadata revised October 27, investigates synchronized rebuilds and missed tail costs. Its full text describes complete key readback, fixed-threshold latency counts, and temporary buffers/background rebuilding. Limits include spare-core needs, added lookup costs, sorted-insert regressions, and untested scan/update/delete workloads; some competing implementations used a substitute numerical routine. The exact-version PDF request failed; the subsequently retrieved unversioned PDF is recorded separately as [WAVEPDF29], without claiming its byte identity matches v2.

The linked artifact [WAVESRC29] was inspected at `f1a770037f6cf415d71b836af7e5f13125d3a4dd`. Its README distinguishes correctness patches from optional performance flags and retains failed runs. Repository metadata supplied no license identifier and the inspected root had no license file; reuse clearance remains unresolved, not declared impossible. No build/run scripts were executed.

**Atlas decision:** do not replace SQLite or recommend a learned index. Keep full-output checks and raw latency observations, and evaluate resource-equivalent cases rather than spare-core results alone. The current length-hint candidate stays isolated after mixed measurements. A reduced generated workload would be a new Atlas experiment, not reproduction of hundreds-of-millions-of-key results.

## Review limits

A broad date-filtered search initially returned older unrelated papers; the official recent-submission lists provided these leads. Codeberg's earlier access restriction remains unchanged and was not worked around. Official RustSec head was still `ee1a49a2769a24a596afc1c20cb33748d2769586` at this pass; the prior scoped lockfile results are not a universal security clearance.
