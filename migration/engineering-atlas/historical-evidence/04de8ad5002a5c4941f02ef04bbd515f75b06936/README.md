# Dated locked-dependency advisory checks

The [11:14 UTC provenance](provenance-2026-10-27T1114.json) binds exact lockfile hashes to a freshly fetched, independently checked RustSec revision. Final audits use a separate clean pinned worktree: [application, 185 locked packages](application-clean-2026-10-27T1114.json), [compression, 47](compression-clean-2026-10-27T1114.json), and [parser, 26](parser-clean-2026-10-27T1114.json). All returned zero known matches, no warnings and no ignored advisories.

A cleanliness assertion caught an untracked earlier advisory placeholder in the original checkout. That checkout and its [initial application](application-2026-10-27T1105.json), [compression](compression-2026-10-27T1106.json) and [parser](parser-2026-10-27T1106.json) audit outputs are retained. A separate clean worktree was used instead of deleting the old file or pretending the original checkout was clean. Counts/results did not change; no claim is made about the extra file's effect inside the tool.

The final no-fetch outputs omit the database commit, so provenance records the verified clean Git identity. Earlier failed-fetch and cached audits remain in their original studies. [Security delta and applicability](../../research/2026-10-27-security-delta.md).

This is known-advisory matching for named lockfiles, not a whole-system, other-project, source-code, vendored-patch or zero-day clearance. No dependency or security setting changed.

## Reproducible guarded runner

[run_pinned_audit.py](run_pinned_audit.py) now turns the manual hygiene check into a repeatable analyst tool. It requires the expected tool SHA-256 and database commit, rejects dirty worktrees and extra advisory Markdown files (including ignored ones), freezes only the three fixed Atlas lockfiles, and checks identities again before/after execution. It does not fetch or choose a supposedly latest revision; the caller must verify that separately. Default registry checks are not disabled.

The driver preserves raw nonzero/error output, partial timeout output and an incomplete receipt rather than turning failure into green status. It rejects target/severity filters, ignored advisories and disabled informational checks. Each audit has a 60-second timeout; lock and receipt sizes are checked. Output limits are post-execution checks, not hard OS isolation. Existing output directories are refused. This trusted analyst CLI is not exposed as an app command endpoint.

[Actual run](guarded-run-2026-10-27.json) · [guard and frozen-input verification](guarded-run-verification-2026-10-27.json) · [application](guarded-audit-0-2026-10-27.json) · [compression](guarded-audit-1-2026-10-27.json) · [parser](guarded-audit-2-2026-10-27.json). A real dirty checkout was rejected before an audit or output creation; a separate clean pinned run completed all three audits. Frozen lock copies and local stderr stay local; hashes bind the already published lockfiles. Seven [fixtures](../../tests/test_pinned_audit.py) cover dirty/mismatched identities, ignored extra files, tool pins, output reuse, filtered results, known matches and retained timeout output. Fixture executables are mocked, never run.
