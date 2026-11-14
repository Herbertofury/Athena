# Living-world and interactive desktop alternatives

## Sources and comparable workflows

[Lively](https://github.com/lively-community/lively) is an open-source animated wallpaper/screensaver project. [Wallpaper Engine](https://store.steampowered.com/app/431960/Wallpaperengine/) is an adjacent animated desktop product, not a full substitute for this studio.

## How this project should earn its place

Compare scene startup, pause/resume, interaction, GPU/CPU cost, media fallback and persisted room state on identical hardware. The differentiating target is an editable living world with dependable persistence and complete interaction, not simply animated wallpaper. This private repository's resources remain private; this page does not approve migration into public Athena.

## Evidence and maintenance

Source review: 2026-11-12. Scope: documented capabilities and proposed evaluation criteria, not installed comparative tests or a latest-version certification. Unknown is not unsupported. No measured superiority is claimed.

For each meaningful upstream change, record the source URL, publication/version date, review date, affected workflow, licensing/access constraints, opportunity and reproducible acceptance test. Preserve last-good findings and failed tests. Recheck primary sources before implementation decisions; do not copy proprietary code/assets or change the product scope merely to match another tool. Proposed features remain proposals until authorized. Daily review should record no change honestly rather than invent updates.

## Next comparison pass

- [ ] Pin exact compared versions and representative workloads.
- [ ] Capture source evidence and verify applicable licenses.
- [ ] Measure current implementation before a replacement or optimization.
- [ ] Record correctness, usability, resource cost and recovery results together.
- [ ] Link only proven improvements to implementation milestones; retain unproven candidates as research.

## Reuse foundations and concrete parts to evaluate

[Lively source](https://github.com/lively-community/lively): inspect media lifecycle and pause/resume boundaries as reusable design references. A whole wallpaper shell is not required for a living-world studio. Wallpaper Engine stays a behavioral reference, not source/assets to copy.

## Integration with our projects

Athena is a potential host, but private-to-public migration remains separately gated. Define a versioned world/room capability contract, asset provenance and persistence snapshot before any transfer. Engineering Atlas can compare synthetic/public workloads without private world assets.

## Target improvement and acceptance boundary

Reduce idle GPU/CPU and recovery failures while preserving full scene, audio, interaction and room-state behavior. Demonstrate before/after identical scenes and pause/resume stress.

## License, access and adoption gate

Status: research candidate, not integrated or benchmark-proven. Before copying code, pin the exact upstream revision and record its LICENSE, dependency licenses, notices and distribution obligations. Missing/ambiguous terms block reuse; behavioral study or a permitted interoperable adapter may remain possible. Service documentation is not a source-code license or API grant. Preserve existing user permissions, private/public boundaries and creator/game asset rights.

Choose reuse, adapter, fork or independent implementation only after a target-workload comparison. Retain raw failures and rollback; share no credentials, private fixtures or account details. Adoption remains blocked until licensing, correctness, performance and maintenance cost are reviewed together. Review delta dated 2026-11-12.
