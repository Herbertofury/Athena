# ticker-core

Content-neutral scrolling for headlines, scores, release notices or other host
content. The dependency-free build exposes `TickerCore` in browsers and CommonJS
in Node. It has no dependency on a feed engine, Athena service or product brand.

```js
const ticker = TickerCore.mountTicker({
  viewport, track, segment,
  options: {speedPxPerSec: 40, direction: 'left', motion: 'system'},
  onStateChange: state => updatePauseButton(state)
});
// Bind real Pause/Resume controls; dispose before the host route is removed.
ticker.pause();
ticker.play();
ticker.update({speedPxPerSec: 70});
ticker.dispose();
```

The host supplies an overflow viewport, a flex track and the original segment.
When the track has only that segment, the core creates one inert, `aria-hidden`
duplicate with focusable descendants removed from tab order and duplicate IDs
removed. When a host supplies its own duplicate it must apply those same rules.
Markup, badge shapes, colors, images, labels and source navigation remain host
presentation concerns. Do not insert untrusted feed HTML into the segment.

`normalizeOptions` validates `enabled`, `speedPxPerSec` (0–500), `direction`
(`left`/`right`), `paused`, `motion` (`system`/`off`/`full`) and `pauseOnHover`.
`durationMs(distancePx, speedPxPerSec)` returns the measured loop duration, or
`Infinity` for stopped/empty content. `mountTicker` (also `createTicker`) returns
`pause`, `play`, `update`, `measure`, `state` and idempotent `dispose` methods.

Motion pauses for an explicit user choice, zero speed, reduced-motion preference,
keyboard focus, optional hover, a hidden document or a nonvisible viewport.
Explicit pause survives temporary hover/focus/visibility changes. Speed/direction
changes preserve the current physical phase. ResizeObserver remeasures the
actual segment. No JavaScript animation-frame polling loop is created.

The full original content remains manually scrollable with motion disabled or
when the Web Animations API is unavailable. A real persistent Pause/Resume
button is required in every host; hover pause alone is insufficient. Disposing
cancels owned animation, disconnects observers, removes listeners and only removes
the duplicate created by this instance.

## Verification and references

Use the [shared tests and browser harness](../README.md#verify). Unit tests cover
speed/distance, explicit pause persistence, hidden/reduced-motion/focus behavior,
phase continuity and cleanup. Those fixtures do not establish a consumer's visual
or assistive-technology conformance. Each host must verify actual desktop/mobile
markup, touch, keyboard, zoom, media dimensions and teardown on route changes.

- [W3C WAI animation controls](https://www.w3.org/WAI/tutorials/carousels/animations/)
- [W3C Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API)

Reviewed November 28, 2026. Native browser animation avoids a separate timer, but
this is not evidence of zero overhead or universal performance superiority.
