# Unicode-safe discovery and text input

**Checked 2026-11-11.** A practical foundation for multilingual mod titles, creator names, asset labels and application search. This is design synthesis plus synthetic primitive/state-model evidence, not a production input patch, language-complete search engine or browser/IME acceptance.

Use with [source identity contracts](adapters/author-post-media-contract.md), the existing [project-identity repair](../experiments/project-identity-lab/README.md), [desktop architecture](desktop.md) and [testing/release guidance](testing-release.md). The new [contract lab](../experiments/text-input-contract-lab/README.md) and [unrun acceptance receipt](../templates/text-input-acceptance.json) make the distinctions below testable.

## 1. Separate identity, original text and discovery policy

Keep three independent representations:

| Representation | Purpose | Rule |
|---|---|---|
| Provider namespace plus canonical ID | Actions, joins, persistence and source binding | Follow the provider's actual identity contract, not a generic text-folding rule |
| Original returned text and source payload | Display, provenance, export and recovery | Preserve it; a derived index does not replace the source |
| Versioned discovery key | Search candidates | Record the transform, locale/data version, collision policy and rebuild path |

This is our application contract. Search similarity must not silently merge accounts, mods, files or permissions. Two identical titles can belong to different items; two differently encoded strings can represent equivalent text without proving the same provider identity. Retain exact source identity on every result and action.

Unicode distinguishes canonical from compatibility equivalence. NFC can unify canonically equivalent spellings such as precomposed versus combining-accent forms. NFKC additionally removes compatibility distinctions. That can help a deliberately broad search, but can also collapse meaningful forms; it must not be applied indiscriminately to original text or opaque identifiers. [TEXT26001](https://www.unicode.org/reports/tr15/tr15-58.html)

**Proposed policy:** preserve originals and exact IDs, use a declared transform only in a rebuildable discovery index, and keep every colliding result. If compatibility folding is useful, expose it as a search policy with known-result tests, not a global data-cleanup operation. No universal normalization choice is recommended for every provider.

## 2. Do not call lowercasing case folding

Case conversion can depend on language/context and change length. Full case folding is a separate operation. Test the intended language policy; a default lowercase comparison is not a language-neutral complete caseless matcher. Turkish dotted/dotless I and German sharp S are useful counterexamples, not an exhaustive internationalization suite. [TEXT26003](https://unicode-org.github.io/icu/userguide/transforms/casemappings.html)

A search index also needs explicit decisions for accents, punctuation, whitespace, script mixing, tokenization and transliteration. Do not strip all combining marks as a shortcut: they can carry language-specific meaning. Preserve the entered query for display and audit which policy produced each candidate. A broad discovery match must still use exact provider identity for opening, installing or saving the item.

The lab intentionally compares NFC/NFKC and two lowercase policies; it does **not** implement full case folding, transliteration, collation-based substring search, ranking or confusable detection. Its twelve invented string pairs only reveal selected policy differences.

## 3. Count the right text units

JavaScript strings expose UTF-16 code-unit operations, while the string iterator advances by code point. Neither is a universal count of user-perceived characters. `String.prototype.normalize` provides the four named normalization forms, with NFC as the default. Keep encoding/resource bounds separate from user-facing length promises. [TEXT26004](https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.normalize)

Unicode grapheme segmentation defines boundaries useful for editing and display, with script/language considerations. Emoji sequences and combining marks can span multiple code points. Do not truncate a title, move a caret or highlight a match by assuming one code unit equals one visible character. [TEXT26002](https://www.unicode.org/reports/tr29/tr29-49.html)

`Intl.Segmenter` supports grapheme, word and sentence granularities. Record the resolved locale and runtime data version. If it is unavailable, report the capability gap rather than presenting a code-point split as equivalent grapheme support. Segment boundaries alone do not establish correct shaping, caret behavior, line wrapping or accessible pronunciation. [TEXT26005](https://tc39.es/ecma402/#sec-intl.segmenter)

The local lab reports Node 24.22.1, ICU 78.3, CLDR 48.0 and Unicode 17.0. Current primary Unicode pages reviewed here describe 18.0.0. The matching historical 17.0 normalization/segmentation annexes are also recorded. A newer specification page is not evidence that the installed engine implements its newly added data. [TEXT26012](https://www.unicode.org/reports/tr15/tr15-57.html) [TEXT26013](https://www.unicode.org/reports/tr29/tr29-47.html)

## 4. Treat composition as an active editing session

Keyboard events are not the only source of text. Paste, speech input, handwriting, mobile keyboards and IMEs need actual input handling. UI Events describes composition events and `isComposing`; reconstructing the field's value from key names is not a reliable text-input architecture. Observe the actual control value after its relevant update, and avoid replacing the active control while composition is in progress. [TEXT26006](https://www.w3.org/TR/2026/WD-uievents-20260221/)

Input Events Level 2 describes composition-related input and cancelability, but remains a Working Draft with implementation/test work in progress. The reviewed UI Events and Input Events drafts do not describe every composition ordering identically. Do not assume one synthesized event sequence proves all target browsers. Capture and test actual sequences for the intended OS, browser/webview and IME. [TEXT26007](https://www.w3.org/TR/2026/WD-input-events-2-20261015/)

### A conservative asynchronous search contract

The following is a proposed model, not a browser standard:

1. Keep the input element and current draft value stable. Do not run destructive normalization back into the field on each event.
2. When composition begins, invalidate any older request's right to publish. Cancelling network work can save resources, but ownership checks are still needed because cancellation may arrive too late.
3. While composing, accept draft value observations without issuing the committed query. Whether a product also offers explicitly labeled partial suggestions is a separate feature, requiring its own UX and network policy.
4. On a verified composition end, submit the current complete field value. If the subsequent input reports the same raw value, do not duplicate the request. If it reports a different final value, issue a new generation and reject the older completion.
5. Only the current request may publish, and only once. An explicit retry can create another generation. Empty input is meaningful, often restoring the full catalog.
6. Dispose the old owner when its field/workspace is unmounted. Do not reuse a closed field's callbacks for a new one.

The lab models this contract without events or a DOM. It tests two input/end orderings, cancellation returning the original value, duplicate completion and disposal. It cannot prove that the browser adapter supplies the correct complete value, receives all composition events, preserves the caret, handles browser-specific blur/cancel behavior or prevents stale DOM events from calling a new owner. Those remain acceptance gates.

## 5. Make multilingual controls operable

Keep visible labels in accessible names so speech-input users can activate controls using the words they see. An unrelated `aria-label` can make a visually clear search box or button harder to operate. Check the localized visible and programmatic names together. [TEXT26008](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)

Character-only shortcuts need the documented off, remap or focus-only option. A shortcut such as a single letter or printable-character sequence can interfere with speech and typing even if it uses multiple physical keys on a particular layout. Separately ensure application shortcuts do not hijack active text/composition. [TEXT26009](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html)

For unknown-direction inline titles or creator names, isolate the inserted text with suitable markup such as `bdi` or a tightly wrapping element with `dir="auto"`. Keep metadata punctuation and surrounding counts outside that isolated field. Directionality is a display concern, not an identity transformation or HTML-sanitization guarantee. [TEXT26010](https://www.w3.org/International/articles/inline-bidi-markup/)

Confusable detection is a separate security mechanism, not another normalization form. Unicode's confusable representations are not intended for display and can change across versions. If used as a warning signal, pin data and plan index migration; never auto-link two identities or remove an entire script merely because names appear similar. The lab implements no such detector. [TEXT26011](https://www.unicode.org/reports/tr39/tr39-34.html)

## 6. Acceptance on the actual app

The [receipt](../templates/text-input-acceptance.json) is a plan, with all scenarios `not_run`. Use at least the languages/input methods the product actually supports, with representative users where possible. Record:

- Target artifact, OS, browser/webview, keyboard layout, IME name/version, locale and runtime Unicode/ICU data.
- Complete original queries and expected records in synthetic or explicitly authorized fixtures; do not record live private keystrokes by default.
- Composition, paste, dictation, dead-key, selection/replacement, undo/redo, blur/cancel, remount and out-of-order-result cases.
- Mixed-direction labels, actual speech activation, screen-reader names/status and caret/focus preservation.
- Discovery collisions, exact identity action binding, full-data preservation, query latency and complete-result timing.

Run semantic correctness before performance comparisons. Keep error attempts and unsupported features visible. Do not combine text from a different normalization/locale policy into the same comparison without naming the change. A new runtime can change segmentation or collation behavior; revalidate persisted indexes and user-visible results deliberately.

**Current outcome:** synthetic primitives and the pure ownership model are verified locally. Actual browser, IME, assistive-technology, bidirectional rendering, search relevance, provider integration and performance acceptance are not established.
