# Visual guidance and request-planning candidates

Checked October 30, 2026. These are paper/source reviews, not executed Atlas candidates or recommendations for another project. Publication dates differ from this review date.

## WebViSE: visual guidance does not replace functional acceptance

[WebViSE v1](https://arxiv.org/html/2610.33929v1), submitted October 24, extracts visual skills and organizes retrieval through a DAG. Reported visual improvements are not uniform functional gains: Table 9 includes a functional regression from 50.39% to 47.60% for one generator. Its accuracy gives half credit to partial results. The human comparison assigns one judgment to each pair, rather than multiple independent ratings per pair. The headline retrieval-cost figure is estimated model-call cost relative to a flat-catalog baseline, not app frame time, memory or complete generation cost. [WEBVISE30]

The [paper-linked repository checkpoint](https://github.com/YifeiSun-0710/WebViSE/tree/4352970abc3afee5c1a775a876c65c7d2aa45b30) exposes workflow code and skill data. Its README requires a configured model endpoint/key; its clone example names a different owner than the paper link. Repository metadata supplied no detected license and the inspected root listed no license file. That limited inspection does not prove there are no terms elsewhere; reuse rights remain unresolved. No skills, dependencies or model calls were installed or run. [WEBVISESRC30]

Atlas gate: compare any proposed UI implementation against the current app, preserving all cards, complete metadata, keyboard/focus behavior, cancellation, last-good state, autoplay-off and accessibility. Measure actual input/scroll latency, density and memory as well as visual preference. Treat retrieved instructions as untrusted source content. Reject visual gains that hide content or break workflows.

## WaRP: fewer requests can cost more bytes

[WaRP v1](https://arxiv.org/html/2610.29689v1), submitted October 21, plans merged object-store ranges after ANN probe selection. The authors evaluate a Lance integration on S3. Their reordered variant preserves the compared recall, but merging increases fetched bytes; their cross-region cost calculation is worse than Lance despite lower same-region cost. The approximation guarantee concerns the latency surrogate, not every observed end-to-end tail. Their concurrency sweep also reaches a point beyond which additional I/O concurrency no longer helps. [WARP30]

The [linked source repository](https://github.com/wrp-wrp/WaRP/tree/9850c5c1d67a0439ca1bb3e9fc011c7502ce15ff) was reachable at the recorded checkpoint; license compatibility and execution were not evaluated. [WARPSRC30]

Atlas gate: this remote vector-retrieval workload is not the local SQLite snapshot workload. Before considering reuse, establish an actual compatible access pattern, complete output equality, byte/request costs, concurrency contention and retained cold/warm results. No paid object-store run, dependency change, local performance claim or target-project transfer follows.
