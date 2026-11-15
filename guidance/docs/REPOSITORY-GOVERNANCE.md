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
