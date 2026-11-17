# Creative companion

Goal: Athena should be an inventive project companion, not a passive archive.
Retain the user's vision and ideas, actively explore unusual combinations and
expansions, and turn promising directions into small testable designs. Inspiration
must be sourced; suggestions are hypotheses, not claims of unprecedented novelty.

## Native implemented slice

Open an active owned project in Projects. The creative panel offers combination,
rule inversion, long-term payoff, cross-mode rewards and simplification lenses.
Choose an optional recorded reference project (required for combination). The
local brief includes exact project IDs/revisions, original goal and decisions,
reference goal/source, a question, hypothesis, baseline experiment, success and
failure signals, constraints and a user-owned keep/revise/park/reject decision.
Nothing goes to a provider. These are deterministic creative scaffolds, not an
LLM, autonomous agent, novelty search or a completed experiment.

Users edit the brief before explicitly saving. A save appends Resources and
inspiration in a new immutable project revision; original goals, decisions and
prior revisions remain unchanged. Repeated generation never overwrites a draft.
Drafts survive collection filtering while mounted, but not leaving the workspace.
Save failures leave an exportable in-memory project draft and say Not saved.
The existing 10,000-character resource limit refuses overflow atomically, never
silently truncates. Users can shorten or separately retain a larger experiment.
Project JSON export/import retains saved experiments using the existing schema.

## Remaining acceptance / backlog

- Structured ideas with independent statuses, sources, comparisons and outcomes.
- Provider-assisted suggestions with explicit private-data boundaries and opt-in.
- Proactive resurfacing and consent-based capture; no background monitor yet.
- Consume sourced game/catalog observations, including Steam reviews/features,
  keeping observed facts, review opinions and our design hypotheses distinct.
- Match suggestions to constraints and test results; recommend rather than silently
  alter the user's priorities or original vision. Rejected ideas stay recoverable.
- Integrate existing isolated wishlist/tone work after review, without replacing it.
- Installed-app, accessibility and visual review, before claiming polished delivery.

No source retirement, cross-device durability or automatic project execution is
claimed. The initial experiments can support games or non-game applications.

## Pillar: independent capabilities, useful composition

Every optional feature should work independently where its purpose permits, avoid
conflicting state ownership, and gain value through explicit composition. Disabling,
missing or breaking one optional feature must not disable unrelated work. Shared
mandatory infrastructure can still fail: state that dependency honestly rather
than claiming absolute fault immunity. The owner referenced Apex/Dynamic CAS as
motivation; this document makes no claims about their historical implementation.

Acceptance for each feature includes standalone use, combined use, disabled sibling,
failed sibling and recovery, with checks for data retention and duplicate effects.
Creative briefs now include these design/test prompts. In Projects, the companion
is dynamically imported behind a failure boundary; missing/invalid optional code
shows a local unavailable message while project tools continue. A session toggle
hides the companion without deleting its drafts or changing project data. Ordinary
project editing does not depend on creative code. Loading completion after unmount
is ignored. Existing save errors and project-editor conflict guards still apply.

This is one concrete boundary, not certification that all Athena features or all
other repositories already meet the pillar. Cross-product dependency and shared
state audits remain open acceptance work.
