# Direct verified capsule input for MusicHub migration

Adds explicit capsule input to existing converter and reconciliation commands, reusing the original capsule validator. This connects two previously separate native migration operations without manual extraction, altered Unicode/hash semantics or importing unrelated original values. No runtime manifest/assets or source repositories changed.

Six new synthetic CLI tests cover conversion/reconciliation, corruption in any entry, missing music, invalid UTF-8 representability, wrong hash scope, exclusive destination and input bounds. All25 music tests pass locally. Local real-store tests use the previously identified schema15 binary `f76da70849bb53aa75f13f28484383bbaa65f089f0de38245515dd1c22c7d6e0`; current-source compilation is not available locally. Hosted Windows/Linux CI must qualify exact source before merge.

An initial local run failed two existing input-limit diagnostic assertions after sanitizing CLI errors. Corrected by preserving the known safe `Input exceeds limit` diagnostic while hiding arbitrary decoder excerpts/paths. This was an interface regression fixed before publication, not a passed first attempt. No private fixtures or original-data migration performed; source retirement remains open.
