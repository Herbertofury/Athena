# Athena training missions

## Implemented

`#simulations` is a native learning view, linked from the main navigation, hub, practice playground and workshop overview. Five original fictional missions share one state-transition engine:

- Systems: inspect boot evidence, verify a backup, roll back a fictional driver, reboot the model, check document and application fixtures.
- Networking: distinguish address/name observations, inspect a fictional resolver baseline, repair that model, retest the user symptom.
- Data: inspect multiplied rows, identify order grain, repair the aggregate, verify total and retained source counts.
- Hardware: gather service and thermal evidence, route safe maintenance, apply a fixture repair and revalidate.
- Access: inspect requirements and permissions, scope a report-reader role, verify permitted and forbidden actions.

The simulations never execute commands, call a device/network API, alter a real OS, or create a sandbox. These are constrained teaching models, not OS emulators, full courses or practical certification. Wrong/out-of-order actions explain their limits without mutating the model. Reset starts a clean mission; navigation retains session work, page reload discards the active mission. Logs retain the latest 100 actions. JSON receipts contain synthetic state and limitations, not user device data.

First verified completion gives 100 **simulation XP** and a mission badge. Replay cannot duplicate that local reward. Rewards use separate versioned per-mission browser-storage keys, so concurrent tabs never overwrite another mission award, do not inflate existing lesson XP or mark courses complete, and remain locally editable rather than tamper-proof. Read failure preserves existing storage; write failure is explicitly session-only. Receipts are export-only at this stage. Other-tab awards appear after reload; live cross-tab synchronization is not claimed. No cloud/profile sync is claimed.

Success has a static badge, optional one-shot expanding star burst and no sound, rapid flashing or repeating animation. Reduced-motion overrides the celebration toggle. All actions use buttons; feedback is live and receives focus. Completion requires the final evidence check, not merely reaching a changed setting.

## Extension contract

Add reviewed synthetic missions to the mission array: stable ID, descriptive scope, ordered named actions, observations/explanations and rejected-hypothesis feedback. Test every sequence, invalid action, replay, reset and final verification. Scenario schema/version must change deliberately when old receipts no longer match. Do not use dynamic code or eval to load lessons. More advanced branching models can replace ordered actions later with explicit prerequisite transitions, retaining the same evidence and accessibility requirements.

## Planned Greek-mythology roguelite (not implemented)

User direction: Athena is the playable protagonist in an action roguelite. She recruits and trains Greek gods as companions; mythology and their abilities shape progression. Inspiration includes survivor-style gameplay, not copying protected characters/art. Learning course/level milestones should unlock optional gameplay rewards; GameSync Next may eventually carry compatible progress and user-selected mascots/shimeji.

Current mission badges are only a bounded foundation. Future integration should consume a versioned award event containing source, milestone ID, scenario/course version, award kind and stable deduplication ID. Keep completion evidence separate from spendable game power; build an explicit reviewed mapping of milestone to unlock. Do not imply simulation completion proves real mastery. Do not add timers, punitive streaks, endless XP farming, purchases or penalties for taking breaks. Provide gameplay-only and accessible learning routes so academic performance is not a measure of player worth.

Before cross-app delivery: define user-selected profile and consent, minimal data export/import, duplicate handling, revocation, recovery and schema migration. Local receipts can be edited and are not anti-cheat proof. No GameSync deployment, account, persistent grant, game currency or server sync is implemented by this feature. No course/level reward is granted until that course's own explicit completion criteria exist.

## Verification

`node --test tests/simulations.test.cjs` checks all state paths and reward invariants. `node scripts/test_simulations_browser.cjs` exercises real Chromium UI flows, out-of-order completion, three success paths, replay, navigation, refresh, storage failure, receipt download, reduced motion and narrow viewport. Runtime screenshot/report/receipt go to `browser-results/simulations/` in CI; a locally blocked browser launch is not a successful browser result.

### Expanded game direction (aspirational, not delivered)

The requested long-term target is 100+ hours of main progression plus expansive endgame, not a measured playtime claim. Survivor-style action inspiration includes Vampire Survivors, HoloCure, Death Must Die and Halls of Torment. A second full RTS mode, inspired by Age of Mythology, should allow recruiting armies and gods. Share an interoperable progression ledger while preserving each mode's independent depth and accessibility; neither mode should require grinding the other. Courses and complete subject pathways may unlock reviewed subject-themed encounters, bosses, perks and rewards. These require designed curricula, explicit completion criteria, original assets, playable prototypes and actual pacing/playtests before any scope or longevity claim. No RTS, roguelite or 100-hour campaign is included in the current training feature.

## Course-linked practice expansion (2026-11-16)

Five missions now link to Athena's existing certificate/course pathways and their supporting lessons. Each pathway has an explicit count of **available simulation missions**, never a percentage of its full course or exam. Three pathways currently have no dedicated mission (Terraform, RHCSA and CKA); their pages disclose this gap and retain access to their lessons and guided plans. No course-completion, subject-completion or game unlock is awarded by filling this partial mission set.

The new hardware mission gathers service-history and telemetry evidence in either order, requires safe maintenance/escalation before a fictional technician repair, and verifies the outcome. The new report-reader mission gathers requirements and permissions in either order, applies narrow scope, requires both positive and negative test results in either order, then verifies. A reusable dependency graph enforces prerequisites, rejects repeated evidence as extra progress, and never invokes commands or cloud APIs. The original three ordered missions use the same engine without changing their award IDs; existing per-mission rewards remain readable. Receipt scenario version is now 2 (export only).

### Reviewed sources and mapping limits

- [CompTIA A+ 220-1201 V15 objectives, document 3.0](https://assets.ctfassets.net/82ripq7fjls2/1oSdlyujpaX3GrM0rir6Ge/91afb2be72785281e8fb4c0d9a70c6f4/CompTIA-A-220-1201-Exam-Objectives-3.0.pdf), retrieved 2026-11-16. Printed page 3 separates workplace troubleshooting methodology from formal exam objectives and assigns 28% to hardware/network troubleshooting. Printed page 12 objective 5.1 includes thermal/shutdown symptoms. Athena's new original hardware mission is partial related practice, not an official question, endorsement or complete objective assessment. The retrieved document revision is recorded exactly; the current product page was unavailable and no latest-revision claim is made. V15 is the exam series, not this document's revision number.
- [AWS IAM security best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html), retrieved 2026-11-16. Least privilege and permission validation inform the new synthetic report-reader model. It does not execute IAM or Azure RBAC, implement all authorization layers, or establish AWS/Azure exam alignment. Other pathway associations are broad introductory curriculum links, not verified objective-by-objective mappings.

All scenarios, observations and feedback are original synthetic material. No exam dumps, vendor course text, OS image or physical repair procedure is bundled. Full course coverage and real practical mastery remain open work.

## Growing playable experiment: primary purpose

The Athena game is intended primarily as an evolving, playable testbed for learning
how to make games better, analogous to Athena testing and improving code, projects
and applications. The existing Greek-mythology action/RTS direction and independent
mode depth remain; this clarification does not replace them or the separate space
ARPG idea. Current teaching missions are not that playable action/RTS runtime.

The improvement loop is: preserve an enjoyable baseline; state a falsifiable
hypothesis; change a bounded mechanic; play both versions under recorded conditions;
retain raw performance observations and qualitative feedback; review regressions;
then explicitly keep, revise, park or reject. Retain rejected results and the original
vision. Shared rewards, endgame and combinations are experiments, not automatically
successful designs. Isolated numeric gains do not establish more enjoyable play.

The Projects creative companion now supports manually recorded baseline/variant
comparisons with build identifiers, units, raw samples, conditions, confounds and a
user decision. Saving appends immutable history. It does not launch a playable build,
capture telemetry, prove statistical significance or automatically adopt a change.
Next acceptance: actual original playable vertical slice, deterministic seeds/build
identity, opt-in local event capture, performance/interaction tests, counterbalanced
playtests and explicit rollback/adoption. No game runtime delivery is claimed here.
