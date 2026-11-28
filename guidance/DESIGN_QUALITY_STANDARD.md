# Design Quality Standard

This standard applies to user-facing UI changes. It operationalizes product invariants 1, 6, 10, 14, 17 and 18; it does not mandate a framework, aesthetic, or chat skill.

## Establish the design target

Use the user's references, audience, tasks, content density, platform and existing design system to choose a coherent direction. Record the relevant comparison and acceptance criteria before substantial redesign. Preserve brand and customization. A generic dashboard, gradients, animations or a popular component kit are not evidence of good design.

Use deliberate hierarchy, type scale, spacing, alignment, color and interaction states. Reuse accessible primitives and the project's tokens when they fit. For greenfield work, compare suitable current approaches against the actual requirements rather than selecting a fashionable stack by default.

## Inspect and exercise the result

- Inspect the real affected screens at representative narrow and wide viewports, including zoom/reflow, long content, and relevant themes.
- Check loading, empty, error, success, disabled and focus states when applicable. Every affected control must reach its promised result; preserve truthful feedback and state.
- Check keyboard navigation, visible focus, labels/semantics, contrast and reduced-motion behavior. WCAG 2.2 AA is the web acceptance reference unless the project specifies a stronger target; do not claim complete conformance from screenshots alone. See [W3C's criterion reference](https://www.w3.org/WAI/WCAG22/quickref/).
- Review real screenshots against the design brief, content and credible reference. Functional assertions and visual judgment complement each other. A screenshot diff cannot establish that the original design is good.
- When visual regressions are plausible, use controlled screenshot baselines: consistent browser/OS/fonts/viewport/data, narrowly justified masks, and reviewed baseline changes. [Playwright documents environment sensitivity and snapshot review](https://playwright.dev/docs/test-snapshots).
- Protect responsiveness, stability and equivalent-work performance. [Web Vitals distinguishes field measurements from lab regression evidence](https://web.dev/articles/vitals); a lab score alone does not establish field performance or interaction quality.

## Evidence-bound acceptance

Record the inspected screens/states, exercised paths, environment, comparison and remaining defects. Scope verification to the changed or causally affected surface. If runtime inspection is blocked, preserve that evidence gap and its recovery action; do not claim visual approval or flawless design.

The Project Visual QA Showcase chat skill can help a selected chat workflow. Coding agents can perform these checks with their available native tools without activating it.

## Portfolio interface quality contract

Applies to all user-facing apps, sites, games, extensions, installers, and repository-hosted interfaces. Keep product identity and accepted functionality. A feature belongs where it supports the product; an offline utility does not need a forced sign-in, and a project without messaging does not need a typing indicator. Record supported, missing, blocked, or not applicable with a reason. Use the [current comparison and parity evidence](https://github.com/Herbertofury/Athena/blob/main/docs/ui-design-library/profile-motion-media-study.md) and the [adoption worksheet](https://github.com/Herbertofury/Athena/blob/main/guidance/templates/INTERFACE_QUALITY_RECEIPT.md).

### UI and state

- Give users one obvious next action without hiding the rest: compact hierarchy, honest labels, predictable navigation, searchable and interactive collections, direct links to sources, space-aware layouts, useful empty states, inline recovery and reversible changes. Use search, filters, status and completion only when they help. Never use color, animation or sound as the only indication.
- Keep black/dark as the default where the product already uses it; support host tokens, light and system choices where appropriate. Keep identity, tenant/workspace, local accessibility and feature controls independent. A theme changes presentation; it does not grant access or redefine safety settings.
- Keep animation and audio independently controllable. Motion settings are Off/Still, Calm and Full; system reduced motion is an honored default. Offer intensity and local preview/undo. Effects stop when hidden, obscured where detectable, minimized or unmounted; finite effects settle without an idle loop. UI remains usable with GPU, sound, storage and network disabled.
- For tactile feedback, make confirmation earned and truthful. Choice of visual, text, keyboard, or optional sound feedback must not affect a task, account privileges, or game/economic state.

### Accounts and personalization

- Where accounts exist, use a compact **Profile Studio** with a live preview, explicit Save/Cancel/Reset and stable defaults. Offer display name, avatar and supported animation, banner or color, primary/accent theme, bio/pronouns as optional fields, and project-relevant frames, decorations, nameplates, name styles, profile effects and badges. Apply global defaults with explicit per-community or per-workspace overrides only where safe; preview as the owner and as a viewer. Provide static fallbacks and a viewer's own appearance/motion overrides. Never reveal a private email, identifier, repair history or workspace membership merely because a person customized a profile.
- Where a profile is a destination, offer typed, reorderable Showcase widgets, with a visibility preview. Activity is separate and opt-in; offer consent, hide, delete and source disconnect. Use typed fields instead of arbitrary HTML or scripts. Keep uploads, artist attribution, entitlements and earned awards distinct. Awards have a checkable criterion, progress where meaningful, clear ownership/expiry, and toggles for whether to display them. No mandatory monetization, loot boxes or privileges through cosmetics.
- Where collaboration exists, keep reactions reversible with a labeled picker, counts, permitted participant list, workspace policies, reduced-motion alternatives and controls for rich effects. Typing styles can choose icons, animation and neutral words, with an off state and static/multi-user fallback. No keystroke content is sent; do not expose or persist ephemeral presence outside its authorized channel or workspace. Support rate control, block/mute, identity changes and offline/reconnect recovery.

### Background and player parity

- Offer independent, selectable background families rather than mixing everything: **Prism optics** (optical layers, damped spring, bounded pointer ripples, local image/video if the host supports it); **Aether scenes** (animated scenes plus finishes and separately selectable lens, ripple, gravity, parting and wind, with per-scene Auto); **Still/off**. Preserve applied preferences, crisp typography, pointer/touch semantics and source-supported features. The Claude theme reference is evidence-backed only to the exact code and effects inspected. Preserve upstream filenames, commit, license and asset notices. Direct reuse is exact-source and license compatible; otherwise port the permitted behavior independently and label the difference.
- Keep one authoritative media session. On suitable video, offer a visible keyboard/touch pop-out action, then keep position, playback intent, rate, audio, caption/track and queue state on detach and return. Restore focus, offer Back to source, distinguish close-pop-out from stop, and avoid a duplicate audio stream. Use real OS floating-window ownership in native browser/desktop hosts where supported, browser Picture-in-Picture or Document Picture-in-Picture where enabled, and a labeled in-app dock otherwise. Do not promise universal always-on-top, positioning, opacity, automatic pop-out, iframe controls, subscription access or protected-playback parity.

### Optional desktop and taskbar

For suitable app surfaces, offer an optional in-app desktop with clear shortcuts and a compact, keyboard- and touch-operable taskbar. A searchable launcher, stable pins and ordering, running/active signals, and minimize/restore should help users get back to real work. Preserve normal navigation. Ship the new workspace **off by default until the owner explicitly accepts it in that host**. Turning it off must not discard app data, launch external software, or change the system taskbar. Keep window/shortcut state separate from permissions and respect portable mode. Do not add this chrome to code-only packages or surfaces where it crowds the core workflow.

Use the [Desktop Workspace Lab](../experiments/desktop-workspace/) as the portable reference. Verify whichever OS-style behavior the actual host offers, including reload, no lost drafts and small-screen behavior; mark unavailable operations honestly.

### Backend and trust

- Split authentication and sessions from public profile fields, cosmetics, entitlements, private user preferences, short-lived presence, and reactions. Use explicit stable IDs, typed schema/version, server-side authorization for every object and mutation, tenant constraints and a deny-by-default privacy model. Use supported identity libraries and current [OAuth security BCP](https://www.rfc-editor.org/rfc/rfc9700) when applicable. Scope credentials to their service, protect them in OS-approved or server-side storage; never put them into theme packs, screenshots, ordinary logs or exported preferences.
- Media ingest needs declared formats, actual format validation, decode and size/dimension/duration bounds, metadata stripping where appropriate, ownership/rights references and revocable access. Follow [OWASP file-upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html). Declarative themes use typed tokens and whitelisted renderer modes, never untrusted JS/CSS/GLSL or remote fonts/assets without explicit policy. Core use survives missing assets, context loss, and reduced motion using an accessible DOM/static fallback.
- Transactions, idempotent retries, revision checks and portable data separation keep changes recoverable. Test concurrent updates and workspace switching, permission revocation, malformed media, expired sessions, no lost writes after reconnect, data export/delete, safe migration and rollback. User-facing profile settings have honest save/error/offline/retry states. Avoid background polling by default; use local one-shot work or relevant events, and do not treat cosmetic state as authorization or entitlement.

### Acceptance before claiming adoption

- For each applicable capability, retain repository/commit, real host/device/browser, comparable baseline, inputs and limits, screenshot or recording plus assertions, and measured performance. Test keyboard, touch, narrow/wide, long text, zoom, dark/light, static/reduced motion, and safe fallback. Match the reference in tested interactions or list differences; no parity claim from a screenshot, demo or dependency alone.
- Optical QA: replay a fixed pointer/touch path and switch themes repeatedly; verify focus, readability over worst-case moving frames, reduced motion, hidden/idle renders, generated assets, WebGL/context cleanup, restart persistence, and queue/offline behavior. Compare cold startup, p95 input/action latency, dropped frames, heap and GPU/memory with effects off/on on a supported low-tier device. No active render loop is acceptable after a finite effect settles, when effects are disabled, or when hidden. Continuous visible scenes must be explicitly enabled and bounded; otherwise freeze.
- Media QA: detach/return the same player, seek within permitted APIs, test keyboard controls, captions, multimonitor where supported, focus, repeat switches, and closing the owner tab. Prove unsupported/embedded hosts degrade cleanly and document gaps. A project is not deemed migrated until its own acceptance receipt exists.
