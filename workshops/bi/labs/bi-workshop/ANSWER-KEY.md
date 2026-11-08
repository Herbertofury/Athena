# Answer key and reasoning notes

Read after predicting. These are explanations of local Python computations, not Power BI validation results.

## 1. Transformation

Accepted amounts are F1 2000, F2 3000, F3 1000, F4 6000, F5 2000 and F6 2000 cents, summing to 16000. F7 is rejected at zero-based row index 6 because `many` is not a positive integer string. Its independent `raw_record` preserves `id: "F7"` and `quantity: "many"` without cleaning the rejected evidence. The copy is bounded to the six expected exact-string fields, at most 256 characters each; unsupported objects or shapes are omitted rather than serialized. Editing the original dictionary does not change the saved evidence, and editing the evidence does not change the original. This row is not evidence of zero sales; substituting zero would conceal a quality problem and make the accepted-row population unclear.

Region normalization changes whitespace/case only. Dates, product IDs and numeric strings follow strict rules. Exact-type checks reject booleans instead of relying on Python's `bool` subclassing `int`. An ID is reserved once encountered, even if its row later fails. That conservative choice makes duplicate corrections explicit rather than silently taking the last occurrence. A production workflow could quarantine both duplicates, accept versioned corrections or use a source revision key, but it must define provenance and reconciliation before choosing.

The clean result is not proof that transformations fold to a source. This code has no source query to fold.

## 2. Modeling

There are six sales-line facts, three products, two regions and 365 dates. Product P1 means Supply, P2 Hardware, P3 Service. A fact ID identifies a row; date alone does not. Multiple facts on January 2 are expected and do not make Date's dimension key non-unique.

Duplicating dimension key P1 makes the “one” side ambiguous. A naïve join could produce two copies of every P1 fact and inflate its 3000 cents to 6000, increasing the overall join sum to 19000. This is a possible bad join outcome, not a promised Power BI behavior. The local validator stops at the duplicate instead of calculating a misleading joined sum.

Removing P1 makes F1 and F3 orphan facts. The validator rejects them. It does not create an unknown member, infer a relationship or emulate the engine's blank-row behavior. Full-year calendar coverage is required independently of which days have sales.

## 3. Context

Hardware selects F2 and F4: 3000 + 6000 = 9000. North + Hardware selects only F2: 3000. Replacing the North region predicate with South retains the Hardware predicate and selects only F4: 6000.

Keeping North and South as simultaneous constraints on the same region column computes `{North} ∩ {South}`, the empty set. The aggregate returns `None`/JSON `null`, not a measured zero. This differs from one allowed-value set `{North, South}`, whose membership predicate accepts either region and totals 16000 across all categories. Under Hardware as an additional predicate, that union totals 9000.

F1's row amount is its own quantity × unit price, 2000. The overall aggregate sums six row amounts, 16000. Showing these two numbers distinguishes row-grain arithmetic from an aggregate, but proves nothing about DAX context transition: no DAX interpreter or CALCULATE semantics exists here.

## 4. Dates

The 365-date list passes. Removing January 2 yields one missing date and breaks contiguity. The 59-date January/February list is contiguous but fails full-year coverage, missing March 1 through December 31 (306 dates). Thus “no gaps inside this list” and “covers the intended period” are different invariants. Sorting is not the invariant: the checker can accept a reversed full-year list.

January comprises F1–F3: 2000 + 3000 + 1000 = 6000. February comprises F4–F6: 6000 + 2000 + 2000 = 10000. YTD uses inclusive cutoffs:

- January 2: F1–F3 = 6000.
- February 1: F1–F5 = 14000.
- February 2: F1–F6 = 16000.

The change is 10000 − 6000 = 4000 cents. Growth is change/base = 4000/6000 = 2/3, approximately 66.67%, not 40% (which would divide by February rather than January). March has no observations in this fixture and therefore returns `null`. A stakeholder may ultimately want zero-fill, but that is a reporting/modeling choice requiring a definition, not a discovery from missing rows.

No date table has been marked or configured, and neither classic nor calendar-based time intelligence has executed.

## 5. Report interpretation

All-category shares are Supply 3000/16000 = 3/16 = 18.75%; Hardware 9000/16000 = 9/16 = 56.25%; Service 4000/16000 = 1/4 = 25%. They sum to one. “Hardware as a share of all categories” remains 56.25%; “Hardware as a share of the selected Hardware rows” is 9000/9000 = 100%. The denominator defines the question. An unlabeled 100% could imply complete market coverage or all sales rather than a tautological within-selection share.

A useful candidate description is: “Hardware contributes 9000 of 16000 fictional USD cents (56.25%), ahead of Service at 4000 and Supply at 3000.” A descending-value reading order can support that comparison; another order might fit a different task. A label such as “Sales amount, fictional USD cents” avoids an unexplained money scale. These are suggestions, not verified accessible experiences.

The empty plan flags `alt_text`, `order`, `units`. The declared plan yields an empty missing-field list only because each field is a nonblank string. A useless string would also pass this simple validator. Real checks must examine the rendered report, input methods, focus/navigation, assistive technology and contrast in context.

## 6. Refresh and availability

The invented copied snapshot F1–F4 sums to 12000, whether the simulated source is online or offline. The current source F1–F6 sums to 16000 only for an available source-required read. During the simulated outage that read reports unavailable and a null total. The snapshot is behind by F5 + F6 = 4000 cents.

This is not a race, timer or cache-coherence simulation. The two datasets are fixed teaching states. A successful read of a copy proves only that the model selected the copy; it does not establish source health or currentness. A failed live-dependent read does not invalidate an older copy. In a real system, caching, query routing, credentials, gateway and refresh timing complicate that simple picture. Direct Lake framing and fallback are specifically unmodeled.

## 7. Hypothetical access

North Viewer totals 7000 (F1, F2, F5). Adding Build leaves 7000 under this restricted teaching policy. Member, Contributor and Admin total 16000 because the model deliberately does not apply its Viewer region filter to them. A Viewer assigned North and South receives the union of both allowed sets and totals 16000. A Viewer with no assigned region is denied by this teaching policy with a null total.

Neither the names nor the output decision grant or enforce real permissions. The script includes all data, and `raw_fixture()` exposes it independently of the classification function. A user can inspect the file. Consequently it cannot serve as a security boundary, regardless of how convincing the output label looks.

A real test would use authorized identities with known workspace and item permissions, verify actual effective access to sensitive rows, and test the sharing/export/embedded paths actually used by the deployment. This exercise neither authorizes that work nor claims to cover every combination of real Power BI features.

## 8. Capstone evidence ledger

Local reconciliations:

- Six accepted plus one rejected raw row = seven raw rows.
- North 7000 + South 9000 = 16000.
- Supply 3000 + Hardware 9000 + Service 4000 = 16000.
- January 6000 + February 10000 = 16000.
- Model counts are 6/3/2/365 for facts/products/regions/dates.

Supported: strict synthetic parsing rejects `many`; the two monthly partitions reconcile; the local calendar checker detects full-year coverage and gaps. Unsupported: query folding happens on a real source; the report is accessible; actual RLS prevents disclosure. Next evidence respectively includes a real source/query inspection, rendered accessibility testing, and effective-access testing with authorized identities and deployment-specific paths.

The capstone lists six unexecuted platform work areas rather than issuing a readiness score. Tests establish deterministic behavior and anticipated input rejection in this Python implementation. They cannot establish production performance, operational freshness, real authorization, accessibility compliance, professional competence or exam readiness. A numerically correct local result can coexist with a wrong business definition or a broken real deployment; the evidence ledger keeps those claims separate.
