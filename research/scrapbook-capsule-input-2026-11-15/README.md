# Verified capsule to reviewed scene conversion

Native migration capability,2026-11-15. Direct `--capsule` mode connects preserved Foundry scrapbook values to existing scene conversion without manual extraction. Shared `capsule.extract_utf8` validates all entries and bounded selected bytes; MusicHub conversion now reuses it rather than maintaining its own extraction logic. All existing explicit scene review gates remain unchanged.

Six new synthetic CLI regressions prove byte-identical output to raw-input bundles, independent bundle verification, unchanged source bytes, corrupt unrelated-entry rejection, missing/unrepresentable values, original-value hash scope, manual asset review, existing destination preservation and invalid mode rejection. New CLI tests run on both Windows and Linux; full Linux converter suite also runs.

Local27 scrapbook tests,25 music tests and17 capsule tests pass. Real-store portions locally use existing schema15 binary SHA256 `f76da70849bb53aa75f13f28484383bbaa65f089f0de38245515dd1c22c7d6e0`; no local current-source compilation claim (cargo absent). Hosted CI builds current source and must be verified separately. No actual owner data, renderer pixel equivalence, completed migration or repository retirement is claimed. Held runtime patches/manifests and source repositories are untouched.
