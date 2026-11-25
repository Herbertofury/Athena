# Athena repository guidance

Athena owns the shared engineering core; each consuming project owns its instructions and exceptions. This is an explicit operator tool, not an automatic background writer. Planning and status are read-only.

```sh
python guidance/tools/repository_governance.py check
python guidance/tools/repository_governance.py plan --target /path/to/reviewed-consumer
# Only for an explicitly selected, reviewed consumer:
python guidance/tools/repository_governance.py apply --target /path/to/reviewed-consumer
python guidance/tools/repository_governance.py status --target /path/to/reviewed-consumer
```

New consumers use `.agents/athena/` and `.athena/governance-lock.json`. Existing root, nested and override instructions, and existing CLAUDE.md text, remain unchanged. Read the plan: `review` is unfinished integration, not silent acceptance. Source changes require a versioned manifest. Edited managed snapshots and linked destinations are refused rather than overwritten.

Legacy `.agent-foundry/governance-lock.json` consumers remain untouched. A subsequent reviewed migration must reconcile their previous source pins and local edits, update their import paths and validate each project; this initial port deliberately refuses automatic co-installation. It does not remove the legacy lock or change other repositories.

Policy wording is repository engineering guidance, not a new authorization grant or a replacement for platform controls. Sensitive actions still need the applicable approval. Athena may explain experimental alternatives and user tradeoffs without pretending an unverified result is proven.

## Additive owner directives

When adopting guidance into a new repository, append project-owned root AGENTS.md references to the [CLI-first execution standard](../CLI_FIRST_EXECUTION.md) and [pre-release optimization standard](../PRE_RELEASE_OPTIMIZATION.md), without replacing local instructions or editing pinned snapshots. Apply the CLI-first rule to all tasks and release checks; these additive policies are outside the versioned 16-document snapshot bundle. Existing external host/branch permissions still apply.

### Verify an explicit legacy transition

Save the JSON emitted by `transition_consumer.py plan` and keep its reviewed
digest. After explicitly authorized application, verify the exact result:

```sh
python guidance/tools/transition_consumer.py verify \
  --source guidance --target /path/to/reviewed-consumer \
  --review-file /path/to/transition-plan.json --review-sha256 REVIEWED_DIGEST
```

This read-only command requires the exact clean Athena source revision in the
plan, and the reviewed consumer base or a descendant. It verifies the new
pin, its 16 policy files and root router, and all 17 preserved legacy lock
and snapshot files against the reviewed bytes. It returns counts and commit
identities without exposing instruction contents or private absolute paths.
Keep the generic adoption guard: `repository_governance.py status` still
refuses consumers carrying the legacy lock; it is not the transition verifier.
The report does not certify installed agent discovery, browser runtime, other
consumers, legacy source retirement or untouched files outside the plan.
