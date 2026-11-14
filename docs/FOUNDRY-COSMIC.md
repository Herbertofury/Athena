# Cosmic environment fidelity and explicit storage upgrade

Cosmic now renders within the authored Foundry room or reviewed object surface.
It uses the original MIT `prototype-v24.ts` planet, ring, stars and perspective
floor drawing formulas with original camera defaults (FOV72, yaw0, pitch−5), the
configured horizon and fixed pointer0. Its190 neutral stars use the original
bounds with a deterministic seed instead of source `Math.random`, making reload
stable. This is a documented adaptation, not recovery of an original random
star field. Original camera/parallax controls and custom wallpapers remain gaps.

Start/Stop motion is explicit, session-only and never autoplay, using the same
bounded controller as other procedural environments. Cosmic source operations
are compared at four times against the original function with identical stars
and camera inputs. Actual Chromium verifies painting, motion, reload, reset and
backup export. These are not claims of general performance superiority.

Choosing Cosmic upgrades the room/workspace to JSON12, preserving all JSON11
blend fields. Native saving requires schema16 through explicit
`upgrade-cosmic-environment DB` after schema15 `upgrade-music-precision`.
No bridge or browser action auto-migrates a database. The migration validates
active and historical backup data and checks revision digests before commit;
corrupt data remains untouched. JSON1–11 refuse Cosmic. A genuine prior
schema15 binary rejects schema16 without changing it. Keep a pre-upgrade copy.

No private assets, source database, external API, provider login or grants are
involved. This does not declare the original repository safe to delete.
