# Survivor Arena: native-host acceptance and reuse

The original short run, earlier endurance profiles, rifts and workshops stay
available. The Frontier recipes are opt-in. Offline HTML and the native Play Lab
use the same rules and tape schema; the native shell serves only its pinned
HTML, CSS and JavaScript allowlist on the local origin.

| Scope | Exact evidence or gate |
| --- | --- |
| 30-minute frontier, standalone | Source [a51801d6](https://github.com/Herbertofury/Athena/commit/a51801d6add18dcf64ec0c08ad29dc00147fa4ae), Windows/Linux [Game Systems 45707050131](https://github.com/Herbertofury/Athena/actions/runs/45707050131). |
| 30-minute frontier, native | Head [bba0bfbb](https://github.com/Herbertofury/Athena/commit/bba0bfbb773a9cd271c4185b47adee16835e7183), Windows/Linux [native extracted 45709536166](https://github.com/Herbertofury/Athena/actions/runs/45709536166), including actual withheld-module startup and first click. |
| 60 and 90 minutes, standalone | [Ashglass #447](https://github.com/Herbertofury/Athena/pull/447), [Floodplain #449](https://github.com/Herbertofury/Athena/pull/449); independently evaluated offline HTML. |
| Entire series, native draft | Run `node --test engines/roguelite/tests/*.test.mjs`, then run `node scripts/test_foundry_native_browser.mjs` against the extracted exact portable package as in `athena-foundry-native.yml`. Verify all three additional module routes, 60-minute mirror/vault and 90-minute ferry/remedy tape round trips, Endless choice and completed relay bank, and no external requests. |

This records host evidence, not cross-game adoption or a canonical engine
release. Do not adopt source-only code as a production dependency. Consumers
must pin their exact source digest, keep existing saves and old modes, and
verify their own real host. Individual drafts do not prove parent branches were
merged or an owner's device is ready.

The native bundle is portable. Start with a new test data folder when
evaluating; importing or replacing an existing profile is not necessary.
