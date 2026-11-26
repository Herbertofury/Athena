# Keep repository context useful

**Keep mandatory guardrails at the scope where the agent must always see them.** Prefer repository facts and a discoverable task-specific Skill for the rest. This is not a six-word rule, permission to remove required controls, or a promise about token savings.

## Use on an explicitly selected Git checkout

```sh
python guidance/tools/context_audit.py /path/to/checkout
python guidance/tools/context_audit.py /path/to/checkout --commit FULL_COMMIT_ID
```

The audit counts exact committed UTF-8 bytes, physical lines and whitespace-separated words for recognized instruction filenames at root and nested scopes. It reports cross-file whitespace-normalized repeat locations without printing instruction text. It does not compute tokens or predict what one client loads. Uncommitted, home-level, imported and submodule instructions are out of scope. Do not publish private repository audit output without review.

1. **Keep always-on rules:** safety, privacy, permissions, mandatory gates, acceptance criteria and non-obvious project conventions. Scope nested requirements appropriately. Never remove a rule just to hit a size target.
2. **Check before relocating:** let agents discover facts already maintained in manifests, build scripts and code. Candidate repeated lines can be intentional across scopes; inspect both meanings and client precedence before changing them.
3. **Move optional detail behind discoverable Skills:** give each Skill a short trigger, then link procedures and evidence from there. Rehearse its discovery in each supported client before removing any former pointer. Do not install unreviewed third-party Skills as part of an audit.
4. **Validate the proposed diff:** retain rollback; run identical representative tasks plus negative controls for protected instructions, with the same model, settings, tool access and task fixtures. Report task correctness and actual logged tokens separately, including cache status when known. A byte or word decrease is not a billing result.

## Evidence and limits

- [Shoopy's post](https://x.com/0xShoopy/status/2125566562547499148) prompted this intake. [Matt Pocock's original article](https://www.aihero.dev/never-run-claude-init) argues for reducing discoverable setup duplication and making specialized guidance load on demand. His personal six-word setup is an example, not a universal target.
- [Gloaguen et al.](https://arxiv.org/html/2602.11988v2) found no general success improvement and over 20% higher inference cost in their evaluated settings; developer-written files fared better than generated ones in their comparison. These averages are not Athena measurements. [Khatri's two-agent ablation](https://arxiv.org/abs/2607.27250) found no measurable correctness shift within its task set and equivalence bounds.
- [OpenAI's guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra/) supports concise descriptions and progressive disclosure. Actual discovery and overrides are client-specific, so test discovery instead of assuming that moving a rule preserves enforcement.
