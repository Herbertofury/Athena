# Athena training missions

## Implemented

`#simulations` is a native learning view, linked from the main navigation, hub, practice playground and workshop overview. Three original fictional missions share one state-transition engine:

- Systems: inspect boot evidence, verify a backup, roll back a fictional driver, reboot the model, check document and application fixtures.
- Networking: distinguish address/name observations, inspect a fictional resolver baseline, repair that model, retest the user symptom.
- Data: inspect multiplied rows, identify order grain, repair the aggregate, verify total and retained source counts.

The simulations never execute commands, call a device/network API, alter a real OS, or create a sandbox. These are constrained teaching models, not OS emulators, full courses or practical certification. Wrong/out-of-order actions explain their limits without mutating the model. Reset starts a clean mission; navigation retains session work, page reload discards the active mission. Logs retain the latest 100 actions. JSON receipts contain synthetic state and limitations, not user device data.

First verified completion gives 100 **simulation XP** and a mission badge. Replay cannot duplicate that local reward. Rewards use separate versioned per-mission browser-storage keys, so concurrent tabs never overwrite another mission award, do not inflate existing lesson XP or mark courses complete, and remain locally editable rather than tamper-proof. Read failure preserves existing storage; write failure is explicitly session-only. Receipts are export-only at this stage. No cloud/profile sync is claimed.

Success has a static badge, optional one-shot expanding star burst and no sound, rapid flashing or repeating animation. Reduced-motion overrides the celebration toggle. All actions use buttons; feedback is live and receives focus. Completion requires the final evidence check, not merely reaching a changed setting.

## Extension contract

Add reviewed synthetic missions to the mission array: stable ID, descriptive scope, ordered named actions, observations/explanations and rejected-hypothesis feedback. Test every sequence, invalid action, replay, reset and final verification. Scenario schema/version must change deliberately when old receipts no longer match. Do not use dynamic code or eval to load lessons. More advanced branching models can replace ordered actions later with explicit prerequisite transitions, retaining the same evidence and accessibility requirements.

## Planned Greek-mythology roguelite (not implemented)

User direction: Athena is the playable protagonist in an action roguelite. She recruits and trains Greek gods as companions; mythology and their abilities shape progression. Inspiration includes survivor-style gameplay, not copying protected characters/art. Learning course/level milestones should unlock optional gameplay rewards; GameSync Next may eventually carry compatible progress and user-selected mascots/shimeji.

Current mission badges are only a bounded foundation. Future integration should consume a versioned award event containing source, milestone ID, scenario/course version, award kind and stable deduplication ID. Keep completion evidence separate from spendable game power; build an explicit reviewed mapping of milestone to unlock. Do not imply simulation completion proves real mastery. Do not add timers, punitive streaks, endless XP farming, purchases or penalties for taking breaks. Provide gameplay-only and accessible learning routes so academic performance is not a measure of player worth.

Before cross-app delivery: define user-selected profile and consent, minimal data export/import, duplicate handling, revocation, recovery and schema migration. Local receipts can be edited and are not anti-cheat proof. No GameSync deployment, account, persistent grant, game currency or server sync is implemented by this feature. No course/level reward is granted until that course's own explicit completion criteria exist.

## Verification

`node --test tests/simulations.test.cjs` checks all state paths and reward invariants. `node scripts/test_simulations_browser.cjs` exercises real Chromium UI flows, out-of-order completion, three success paths, replay, navigation, refresh, storage failure, receipt download, reduced motion and narrow viewport. Runtime screenshot/report/receipt go to `browser-results/simulations/` in CI; a locally blocked browser launch is not a successful browser result.
