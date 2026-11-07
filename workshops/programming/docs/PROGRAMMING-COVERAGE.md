# Programming Workshop coverage and limits

## What is included

Eight connected lessons teach typed values and units, explicit contracts, conditions/loops and invariants, focused functions, pure calculation versus I/O, aliasing and shallow copies, lists/dictionaries/identity, deterministic sorting, validation and targeted exceptions, bounded JSON/CSV parsing, simple command-line structure, regression/property examples and reproducible delivery.

Two **editable** projects supply real starter functions, written contracts, visible acceptance suites and separate reference implementations. Four runnable demonstrations show a loop trace, aliasing, a distinguishing regression and an actual temporary-file JSON round trip. All inputs are invented. The worksheet offers a no-execution path and explicitly labels its limitations.

## Evidence and honest interpretation

The reference solutions are tested against 44 named acceptance tests with multiple subcases. Additional pack-level checks validate structure, outputs, boundaries and the supplied examples. The distributed learner starters are deliberately unimplemented and should fail their acceptance tests until edited. Pack integrity checks are not learner grades; they check that the teaching material is distributed consistently.

The content contains 24 original multiple-choice reasoning checks with explanations. They are learning prompts, not official exam questions. The existing Athena schema shows only eight primary checks, one per lesson. Sixteen supplemental checks and eight worked-code snippets need explicit UI support; all are available in this standalone pack. There is no claim of publication or a new live navigation route.

## What is not covered

This does not complete Python or computer-science education. Major gaps include deeper algorithms and complexity analysis, recursion, object-oriented design, type checking, concurrency/async, networking, databases, web/mobile development, packaging and dependency management, version-control practice, deployment, observability, comprehensive accessibility testing and production threat modeling.

The programs are not billing/payment software, live monitoring, robust public upload endpoints, or sandboxes for untrusted Python. Bounds and validation are teaching contracts, not a comprehensive security boundary. No external service, administrator privilege, credential or paid product is needed. There is no credential/exam mapping, exam readiness score, accreditation or job-readiness assertion.

## Verified environment and sources

Execution uses Python 3.12.14 on Linux. Python 3.10+ is a design target, but other interpreter versions and operating systems are not verified. Official Python documentation pages were opened on 2026-11-07; current 3.12 documentation identifies patch version 3.12.16. Used APIs are stable within that series. Original content and tests are not endorsed by the Python Software Foundation.

The [source register](../research/programming-sources.json) records the specific pages and claims supported. Official references support language/library behavior; the project bounds, duplicate policy and fictional data are original instructional choices.
