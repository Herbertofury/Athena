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


## Roaming creature reward POIs — approved goal, not implemented (2026-11-19)

Add optional moving points of interest on large creatures: airborne birds and eventually colossal roaming giants. Reach an attached, clearly marked object by platforming/climbing, then **hit that object to collect a substantial in-game XP/points reward**. The intended feel mixes playful traversal with roguelite run decisions, especially Megabonk-like experiences; Shadow of the Colossus is a scale/climbing inspiration, not permission to copy characters, art or code. This records a requested goal, not verified capabilities of either reference game.

- [ ] Reconcile existing movement, moving-platform collision, creature rigs, reward ledgers and run lifecycle before implementation; research reusable existing solutions first.
- [ ] Prototype one optional slow ground giant with a marked reward object, two approach routes, safe exit and seed-varied route placement. Reuse suitable authorized assets/data for variation without treating reuse as a ceiling on quality or new features.
- [ ] Make boarding, movement-relative footing, climbing/jumping, hit registration and payoff legible and fun; provide reachable alternatives for differing mobility/builds and accessibility needs. Missing an optional encounter must not block a run.
- [ ] Define meaningful high rewards balanced against time, traversal difficulty and combat risk. Commit one reward per stable run/creature/object identity; repeated hits, reconnect, reload and overlapping collection must not duplicate it.
- [ ] Test missed jumps, safe recovery, camera/readability, creature bounds/despawn, pause/death/restart, simultaneous collection where multiplayer exists, and low/high mobility. Preserve saves, unrelated world/player state and prior progression.
- [ ] Record exact-build performance and actual player enjoyment/playtests; expand to flying creatures and larger multi-stage giants only after the bounded first slice works. Do not mark the goal complete from a mockup, menu, static giant or simulated reward alone.

**Athena scope:** planned Greek-mythology action roguelite, with original mythic creature/companion presentation. Preserve independent RTS depth and optional cross-mode rewards; do not force platforming into RTS or learning missions. These are gameplay rewards, not course-completion, certification or proof of mastery. Existing teaching simulations remain unchanged.


## Long-horizon progression, resources and themed bases — goal only (2026-11-19)

**Owner direction, not implemented or measured playtime:** collect spendable resources such as gold, make between-run upgrades and home/castle building meaningful, and treat roughly the first 100 hours as the beginning rather than the end. Later progression should reveal genuinely new abilities, characters, maps, enemy families and bosses. Support multiple themed bases with resource storage and an eventually scalable open-world mode. Challenge and satisfying new decisions must continue; procedural reshuffling and inflated statistics alone do not meet this goal. The 100-hour figure expresses ambition, not a mandatory wait before fun features or a promise of existing content.

**Reference evidence:** the [official Night Swarm Steam page](https://store.steampowered.com/app/3668370/Night_Swarm/), checked 2026-11-19, describes a castle hub with NPC talent/item shops, gold exchanged at totems, companions and large bosses. This is publisher description, not hands-on verification. It does **not** establish the requested multi-base construction/storage, open world or 100-hour-plus depth; those are the owner's proposals.

- [ ] Audit existing resource/currency, persistence, crafting, base/home and unlock systems; reuse compatible code and authorized assets without reducing quality or preventing genuinely new mechanics.
- [ ] Define distinct run resources and retained resources, explicit earn/spend rules, visible costs and upgrade effects, refunds/respec where suitable, and fair death/abandonment handling. Make one end-to-end earn → return → spend → visibly improved next-run loop playable first.
- [ ] Design home/castle construction as meaningful choices and usable facilities, not a decorative menu or a wall of percentage bonuses. Define ownership, building costs, resource storage and clear progression purpose.
- [ ] Plan staged discoveries with new verbs/build synergies, characters, authored map features, enemy behaviors and boss mechanics. Preserve early accessibility and optional paths; do not gate basic enjoyment behind 100 hours of grind.
- [ ] Extend to multiple themed bases with distinct functions, safe travel/return and explicit storage/transfer rules. Test transaction interruption, concurrent actions, duplication, capacity/overflow, migration and backup/recovery without losing items or existing saves.
- [ ] Prototype a scalable open-world mode separately, with streaming/persistence, encounter scheduling, bounded active simulation and measured frame/memory/save budgets. Preserve distinct run-based modes; do not claim an infinite world or unlimited performance from procedural generation.
- [ ] Prove sustained challenge, meaningful upgrade tradeoffs, late-game novelty and player enjoyment through exact-build playtests across early/mid/late progression. Use accelerated progression tests for correctness but not as proof of 100 hours of authored enjoyment. Keep all milestones open until implemented and accepted.

**Athena adaptation:** original mythic home/sanctuary and companion progression belong to the planned action roguelite. Keep learning mastery evidence separate from spendable resources; no course completion or real-world certification is inferred. Preserve independent RTS depth, optional shared rewards and the playable experiment-lab goal. Existing five teaching missions are not this game.


## Run-unique world discoveries and faction warzones — open goals (2026-11-19)

**Owner direction, not implemented:** make each run richly explorable, with meaningful discoveries rather than empty procedural repetition. As players gain movement capabilities and travel faster or farther, reveal new biomes, distinct enemies, caves, homes, companions and unexpected bosses. Include faction warzones where enemies fight each other and the player can choose to enter. Support satisfying **30-, 60-, 90-minute and endless** experiences without deleting previously requested duration choices. Seed changes or higher enemy statistics alone do not satisfy this goal.

- [ ] Audit existing world generation, authored encounters, movement unlocks, faction AI, run lifecycle and save systems before adding parallel systems. Reuse authorized assets creatively while adding genuinely different interactions, routes and decisions.
- [ ] Define biome identities through traversal, hazards, enemy behavior, resources and discoverable stories, not palette swaps alone. Connect increased speed/range to reachable discoveries, with clear route clues and alternatives for different builds; avoid long empty travel or making low-mobility builds nonviable.
- [ ] Build a first playable discovery chain spanning contrasting regions: an explorable cave or home, a companion opportunity, and a surprising but readable optional boss. Give discoveries consequences, useful choices and safe return/exit rather than empty scenery or unavoidable ambushes.
- [ ] Add faction-versus-faction encounters with readable allegiances, distinct tactics and meaningful player choices to observe, intervene or leave. Specify targeting, aggro transfer, victory consequences, rewards and persistence; prevent offscreen combat, repeated entry or faction kills from duplicating player rewards.
- [ ] Design separate pacing arcs for 30/60/90-minute and endless runs: early discoveries, intermediate changes, later biome/encounter combinations and satisfying conclusions or voluntary exits. Do not simply stretch the same wave schedule. Preserve earlier duration options and portal side-run return continuity where applicable.
- [ ] Combine authored encounter families with seed-aware placement, recent-discovery tracking and variation that changes gameplay. Avoid promises of literally limitless unique content; endless mode needs meaningful ongoing choices and transparent repeat behavior.
- [ ] Test unreachable layouts, high-speed streaming, cave/home entry and return, encounter overlap, faction targeting, companion persistence, unexpected-boss fairness, save/reload and duplicate rewards. Measure frame time, memory and active simulation at long distances and long run durations.
- [ ] Playtest actual short/medium/long/endless builds for discovery density, repeated-content fatigue, travel downtime, risk/reward and enjoyment. Automated seed sweeps or accelerated timers prove correctness only, not satisfying hours of gameplay. Keep implementation and acceptance milestones open until evidenced.

**Athena adaptation:** Apply to the planned mythic action roguelite, with original biome, companion and faction identities. Keep learning missions/mastery evidence separate, preserve optional rewards and independent RTS design; do not claim current teaching simulations already deliver this world.
