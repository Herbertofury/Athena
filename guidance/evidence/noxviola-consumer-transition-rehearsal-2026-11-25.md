# Noxviola guidance transition rehearsal

This records a disposable local transition of the exact publicly reviewed
[Noxviola commit](https://github.com/Herbertofury/Noxviola/commit/0be84b3b1f4c9e32cb1c7d4d4e3d1afa3b12ae97),
using the [Athena source snapshot](https://github.com/Herbertofury/Athena/commit/c976a3d35c507e4fe94aefafc3db6f6f97e8eb8e).
Both Git trees matched their remote records. This did not write to the Noxviola
repository, switch a live consumer, install an agent skill, or contact an account.

| Check | Observed |
| --- | --- |
| Reviewed transition | 18 exact writes in the disposable copy: 16 native documents, its lock, and one root router change |
| Root project instructions | Byte-for-byte identical apart from the single legacy reference becoming `.agents/athena/AGENTS-adapter.md` |
| Legacy lock and snapshots | All 17 preserved exactly; the separate native guidance pin read back correctly |
| Exact plan verifier | Confirmed 18 new and 17 preserved files and unchanged Git indexes; refused the untouched control |
| Product source check and tests | Source check passed on both copies. The same locked dependency versions were used; 557 tests passed on the control and 557 on the transitioned copy |
| Electron/native host and live agent discovery | Not run here; no installed-client or fleet acceptance claim |

The unchanged generic adoption guard continues protecting both copies that
retain the legacy lock. The new read-only transition verifier handles
this deliberate coexistence without weakening that guard. This is one
consumer snapshot, not permission to replace a live project's instructions
or retire Agent-Foundry.
