# Unicode discovery and text-input research

**Reviewed 2026-11-11; baseline main `44384b809c80e03adbd62f8be9617d01e6ad9922`.** Primary documentation and synthetic runtime/model evidence only.

## Why this contribution

The existing desktop/stack/test-queue material names IME support as a future acceptance gate, but a corpus inspection found no dedicated composition ownership or Unicode discovery-policy guide. The [existing provider identity repair](../experiments/project-identity-lab/README.md) already distinguishes canonical IDs and slugs for a specific provider. This work references that lesson and does not change its parser, storage or provider rules.

The prior [UI/card/media draft #29](https://github.com/Herbertofury/Athena/pull/29) covers responsiveness and accessibility acceptance more broadly. This distinct guide goes deeper on multilingual search and text input. It does not copy that draft's source-index entry or alter its files. Active navigation, media and release drafts remain separate.

## Primary source register

Relevant sections of all thirteen sources below were opened. Stable publication/revision URLs are used where the source supplied them. Current draft status and installed-runtime mismatch are retained instead of treating every latest page as implemented behavior.

| ID | Opened primary source | Observed version/scope |
|---|---|---|
| [TEXT26001] | [Unicode normalization](https://www.unicode.org/reports/tr15/tr15-58.html) | Unicode 18.0.0, revision 58, 2026-08-12 |
| [TEXT26002] | [Unicode segmentation](https://www.unicode.org/reports/tr29/tr29-49.html) | Unicode 18.0.0, revision 49, 2026-09-01 |
| [TEXT26003] | [ICU case mappings](https://unicode-org.github.io/icu/userguide/transforms/casemappings.html) | Current official guide; lowercase versus folding |
| [TEXT26004] | [ECMAScript text operations](https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.normalize) | Current 2027 editor specification; not installed-version proof |
| [TEXT26005] | [ECMA-402 Segmenter](https://tc39.es/ecma402/#sec-intl.segmenter) | Current 2027 editor specification; runtime behavior separate |
| [TEXT26006] | [UI Events](https://www.w3.org/TR/2026/WD-uievents-20260221/) | Working Draft 2026-02-21 |
| [TEXT26007] | [Input Events Level 2](https://www.w3.org/TR/2026/WD-input-events-2-20261015/) | Working Draft 2026-10-15, implementation/test work incomplete |
| [TEXT26008] | [Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html) | WCAG 2.2 informative explanation of Level A criterion |
| [TEXT26009] | [Character Key Shortcuts](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html) | WCAG 2.2 informative explanation of Level A criterion |
| [TEXT26010] | [Inline bidirectional markup](https://www.w3.org/International/articles/inline-bidi-markup/) | Current W3C Internationalization article |
| [TEXT26011] | [Unicode security mechanisms](https://www.unicode.org/reports/tr39/tr39-34.html) | Unicode 18.0.0, revision 34, 2026-08-27 |
| [TEXT26012] | [Historical normalization](https://www.unicode.org/reports/tr15/tr15-57.html) | Unicode 17.0.0, revision 57, 2025-07-30 |
| [TEXT26013] | [Historical segmentation](https://www.unicode.org/reports/tr29/tr29-47.html) | Unicode 17.0.0, revision 47, 2025-08-17 |

The current published UI Events draft places compositionupdate relative to beforeinput differently from the reviewed Input Events draft's composition section. This is a reason to retain version-specific source observations and require real target traces, not to assert one universal event ordering. The model tests two final-input/composition-end observation orderings, not beforeinput/compositionupdate ordering; neither is claimed to represent every browser.

## Practical output

- [Guide](../docs/unicode-search-and-text-input.md): exact identity versus display/discovery, normalization collisions, casing, segmentation, composition ownership, voice-compatible labels, shortcuts, bidirectional display and confusable-version boundaries.
- [Contract lab](../experiments/text-input-contract-lab/README.md): twelve synthetic string pairs, eight segmentation examples, a complete retained report and 33 deterministic tests.
- [Acceptance receipt](../templates/text-input-acceptance.json): twelve real-target scenarios, all `not_run`; no placeholder value means zero latency or accepted accessibility.

The lab executes standard-library primitives and a pure ownership model on Linux/Node. Its recorded Unicode data version is 17.0, while the current sources are 18.0. It does not upgrade any runtime, add dependencies, run Unicode's full conformance files or prove behavior on newly assigned characters. No third-party tables, input logs or text corpora are copied. All examples are invented.

## Verification and scope

All 1,549 baseline Engineering files were checked against main Git blob identities before edits. Only the additive source index changes among existing files. The unique text-input source fragment must be combined with concurrent research fragments during later integration, preserving every prior entry.

Local and independent validation, exact remote identity and hosted-check status are reported in the draft PR. The inherited Lab README cross-root link failure remains unchanged and is not suppressed. No browser launch, sandbox change, production UI edit, private source, provider request, merge or deployment is included.

**Not established:** actual IME/keyboard/paste/dictation behavior, caret/selection preservation, speech or screen-reader acceptance, shaping/bidirectional rendering, real-provider identity compatibility, full Unicode conformance, search relevance or end-to-end performance gain. The source-backed design is a candidate foundation until the real target receipt is completed.
