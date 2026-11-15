# Explicit reviewed legacy consumer transition

`tools/transition_consumer.py` is separate from generic adoption. `repository_governance.py apply` **continues to refuse legacy locks**. This tool does not discover repositories, grant authority, install skills, delete legacy snapshots or certify retirement.

An authorized operator selects a clean, trusted, quiescent consumer and a clean Athena guidance source, then prepares a separate reviewed UTF-8 root router file (maximum128KiB). Review every local rule, nested/override instruction and skill before supplying that file. The tool cannot infer semantic preservation from a digest. Do not use it on hostile shared directories or while another writer is active.

```sh
python guidance/tools/transition_consumer.py plan --source /reviewed/athena/guidance --target /reviewed/consumer --reviewed-router /reviewed/AGENTS.proposed.md
python guidance/tools/transition_consumer.py apply --source /reviewed/athena/guidance --target /reviewed/consumer --reviewed-router /reviewed/AGENTS.proposed.md --review-sha256 EXACT_REVIEW_DIGEST
```

The digest binds source/target commits, original router, all proposed payloads and preserved legacy hashes. It is an input-change guard, **not permission or a policy-equivalence verdict**. A new commit, changed router, local edit or destination conflict requires a new reviewed plan. It stages sixteen canonical Athena snapshots, the explicit router and an Athena lock last. All legacy snapshots/lock remain for provenance/rollback; project skills, CLAUDE.md, historical links and other files are untouched. Because the legacy lock remains, generic adoption still refuses subsequent updates: do not remove that lock to work around the guard. Future managed coexistence/update workflow requires separate review.

Exception rollback reuses the established transaction helper. A late failure restores the prior router and removes only this operation's newly created files when their bytes still match. Incomplete rollback retains a local recovery directory for inspection. This is not process-crash atomic, power-loss durable or race-proof against hostile writers. Never publish recovery contents. Successful application is repository routing/snapshot installation only; actual agent-harness behavior, rollback acceptance, skills/propagation and source history/retirement remain separate gates.

Tests cover changed inputs/digest, dirty checkouts, committed legacy drift, unmanaged destinations, links, preservation of project skills and legacy bytes, retained generic guard, and injected final-lock failure rollback. Synthetic tests are not real consumer acceptance.
