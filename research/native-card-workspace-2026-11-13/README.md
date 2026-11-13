# Native Card density workspace

The retained Atlas card experiment now mounts directly at Athena `#cards`, under its shared navigation/theme/search and release package. It is not a standalone-app iframe. Official source behavior is compiled with exact transforms; source files under `engineering/` remain unchanged.

## Retained capabilities

- Full generated records and all metadata; initial, grouped, metadata, cooperative creation/commit and 1% keyed-update lanes remain available.
- Main-thread and dedicated-worker preparation, full SHA-256/byte/field validation, frame calibration, foreground checks, scrolling observations, thresholded Event Timing, exact record inspector and original JSON download.
- Generated-data restrictions, no target-project speedup claim, no winner after interruption, explicit user starts and the original 96 MiB budget.
- Native wrapper has a distinct receipt harness identity (`athena-native-card-density-v1`). Its measured shell/layout must not be conflated with old standalone source-harness measurements.

## Lifecycle and persistence

Navigation cancels the worker and pending timers/frame callbacks, disconnects observers and visibility/focus listeners, closes dialogs and revokes object URLs. Interrupted evidence is explicitly incomplete. Current and last-completed receipts are retained in this tab's module memory, not promised durable storage. Download before reload or closing the page. The shared local-storage state holds only availability flags, never all generated records. Shared search supplies an exact record ID without filtering the measured DOM or dropping metadata.

## Evidence gates

- Five focused DOM-emulated adapter tests cover inert mount, themes/search, listener/observer cleanup, pre-aborted mount, interrupted receipt retention, actual worker termination and reproducible unchanged algorithm copies.
- Full `npm test` passed before publication; all generated runtime hashes were checked by the normal package tool (49 files).
- Local Chromium could not start due to `socket() failed: Operation not permitted`, before any page loaded. This is not browser acceptance. The failed launch is recorded in `local-browser-attempt.json`; no bypass was attempted.
- Normal hosted browser gate now runs actual worker preparation, six complete samples with 200 full records, exact downloaded receipt equality, exact-record metadata, navigation retention and cancellation without replacing the last-good receipt. CI results and screenshots must be inspected on the published commit before acceptance.

No new provider request, account grant, credentials, private Foundry data or source-repository deletion is part of this change. Audio-only and other remaining parity/retirement work is not claimed complete by this card adapter.
