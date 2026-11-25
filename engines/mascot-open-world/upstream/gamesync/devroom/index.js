/* ═══════════════════════════════════════════════════════════════════════════
   Dev Room — Index
   Aggregates all shared game systems into window.__gsDevRoom.
   Games import from here non-destructively with per-game config overrides.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.__gsDevRoom) return;

  /* Each module self-registers onto window.__gsDevRoom.
     This file just ensures the namespace exists and provides a version tag. */
  window.__gsDevRoom = {
    version: "1.0.0",
    /* Modules register themselves here:
       Physics, Movement, Camera, Combat, AI, World,
       AnimationBridge, Weather, Vehicle, Dialog, Mission, Presets */
  };
})();
