# Browser worker preparation: scoped evaluation

Reviewed 2026-10-27. Sources: UI08, UI09. Implementation commit:
`c00528de7295ab411e28e9d9c8e8ceff4dd44920`.

## Question

Does moving generation, serialization, encoding and digest work to a dedicated
worker improve responsiveness enough to justify startup and copying costs for
complete records? This is distinct from faster rendering and from skipping data.

MDN documents worker execution outside the window context and structured cloning
for messages. Plain data records are supported; functions, DOM nodes and general
class/property metadata are not losslessly transferable. Atlas uses plain
records with string fields. No broad object-model parity is inferred.

## Controls and acceptance

- Default main-thread lane remains available and unchanged in responsibility.
- Worker is a pinned same-origin module, terminated after completion or stop;
  startup and structured-clone cost remain in request-to-ready measurements.
- Independently computed SHA-256 and complete field equality are checked in
  Node tests. Browser tests must compare the same canonical dataset and inspect
  the complete rendered records, not only claim success from a worker message.
- Initial preparation only is moved. Rendering and incremental reset setup remain
  main-thread work. The digest timing includes asynchronous elapsed time, not a
  direct measure of main-thread blocking.
- Preserve zero-sample failure receipts and previous complete evidence; do not
  treat stopped, hidden-tab or failed runs as ranking evidence.
- A response-time win, if observed, does not establish peak-memory reduction or
  superiority in another application. Complete-data target comparisons are still
  required before recommending adoption.

Status: implemented optional candidate; 37 Node, 53 Python and 63 Rust tests passed.
Four browser runs retained complete data; worker request-to-ready did not beat
the baseline consistently. Preparation cancellation retained a downloadable
zero-sample receipt and byte-identical last-completed evidence. Browser timeout,
hidden-tab and peak-memory acceptance remain open. Raw measurements are in
`experiments/card-density-lab/`. No performance promotion.
