# Dated locked-dependency advisory checks

The [11:14 UTC provenance](provenance-2026-10-27T1114.json) binds exact lockfile hashes to a freshly fetched, independently checked RustSec revision. Final audits use a separate clean pinned worktree: [application, 185 locked packages](application-clean-2026-10-27T1114.json), [compression, 47](compression-clean-2026-10-27T1114.json), and [parser, 26](parser-clean-2026-10-27T1114.json). All returned zero known matches, no warnings and no ignored advisories.

A cleanliness assertion caught an untracked earlier advisory placeholder in the original checkout. That checkout and its [initial application](application-2026-10-27T1105.json), [compression](compression-2026-10-27T1106.json) and [parser](parser-2026-10-27T1106.json) audit outputs are retained. A separate clean worktree was used instead of deleting the old file or pretending the original checkout was clean. Counts/results did not change; no claim is made about the extra file's effect inside the tool.

The final no-fetch outputs omit the database commit, so provenance records the verified clean Git identity. Earlier failed-fetch and cached audits remain in their original studies. [Security delta and applicability](../../research/2026-10-27-security-delta.md).

This is known-advisory matching for named lockfiles, not a whole-system, other-project, source-code, vendored-patch or zero-day clearance. No dependency or security setting changed.
