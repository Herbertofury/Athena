# Native selected-object axis alignment

The retained `feature-foundry/source/src/prototype-v24.ts` function `alignSelected` provides left, center, right, top, middle and bottom commands. Athena previously exposed combined Center/Fit only. Six explicit native controls now address this selected-object capability gap without changing the source snapshot or schema.

Original top-left coordinates are adapted to Athena's normalized center coordinates. Edge placement uses the source's 8px inset and absolute scaled base size; mirroring signs, the other coordinate, rotation, skew, origin, anchor, appearance and saved layouts are retained. Horizontal and vertical centering remain separate commands. Each actual change has an exact session Undo/Redo checkpoint; no-op alignment adds neither history nor persistence write.

Native safety differences are deliberate: position-pinned, hidden/filtered, unavailable-anchor and zero-size surfaces refuse without mutation. Edge commands refuse boxes too large for the inset rather than silently clipping or resizing. Center commands can still center an oversized box. This is **base-box alignment**, not visual-silhouette alignment affected by rotation, skew or a noncentral transform origin or full source rendering parity. No multi-selection or distribution is claimed.

The changes reuse the current measured actor/surface and existing validation, save and undo paths. They introduce no package dependencies, external requests, private content or new storage schema. Source-retirement records and held composition work remain untouched.

Verification includes seven model/DOM tests for all six coordinates, mirrored sizes, invalid/oversized input, actual mount, scoped appearance preservation, pin/filter/zero-size refusal, no-op history and exact Undo/Redo. A separate Chromium harness measures world/UI/sticker surfaces and checks each axis and pin behavior; hosted runtime and screenshot acceptance remain distinct from local model tests.
