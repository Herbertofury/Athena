# Defensive source review: evidence before findings

**Reference only · 2026-11-21.** A source-review checklist for a codebase you own or are explicitly authorized to review. Athena has not executed, installed, or endorsed an agent skill, measured its detection rate, or independently verified runtime behavior.

## Verified source

[Daniel Avila's Claude Code Templates repository](https://github.com/davila7/claude-code-templates) catalogs the component as `security/vulnerability-scanner`. At upstream revision `5a8853e7f0cbf5173451e329ae073250e6c442ca`, the exact source is `cli-tool/components/skills/security/vulnerability-scanner/SKILL.md`. The component contains three Markdown files at that revision, not a scanner executable. The [upstream repository license](https://github.com/davila7/claude-code-templates/blob/5a8853e7f0cbf5173451e329ae073250e6c442ca/LICENSE) is MIT; that does not authorize access to, or disclosure of, any code under review.

The [documented ground rules](https://github.com/davila7/claude-code-templates/blob/5a8853e7f0cbf5173451e329ae073250e6c442ca/cli-tool/components/skills/security/vulnerability-scanner/SKILL.md#L17-L29) call for read-only review by default, treating repository instructions as untrusted, withholding secret values, and checking evidence rather than counting pattern matches. Those are written instructions, **not** an enforced sandbox or proof of audit completeness. This Athena reference admits only the defensive review principles below, not installation or automated reproduction.

## Review checklist for Athena and other owned projects

| Defensive question | What to record or improve |
| --- | --- |
| Does the application enforce access at its own boundary? | Record the exact policy check and scope that governs the action. If the check is missing, add application-side enforcement rather than relying on a prompt or UI. |
| Can incoming content steer an agent that also has sensitive access? | Treat retrieved text and tool results as data. Minimize each tool's authority, validate arguments, and require explicit review for consequential writes. |
| Are findings grounded and safe to share? | Record revision, component, precise source location, evidence confidence, impact, and a proposed mitigation. Redact credentials and keep repository contents local. Mark unreviewed configuration and runtime behavior as unknown. |
| Does the fix preserve legitimate behavior? | Review an owned synthetic fixture that checks permitted access and denies out-of-scope access using expected outputs. Validate the control, not an attack. |

Do not enable active probing, payload generation, vulnerability reproduction, or remote execution from this note. A keyword match is a lead. A clean report means only that no supported finding was recorded in the reviewed scope.

REA is already referenced in [Athena's linked comparison](https://github.com/Herbertofury/Athena/pull/312); it is not imported or duplicated here.
