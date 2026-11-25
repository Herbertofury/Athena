/* ═══════════════════════════════════════════════════════════════════════════
   Dev Room — Camera
   2D follow camera with smoothing, dead zone, shake, zoom, and bounds.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const DR = window.__gsDevRoom = window.__gsDevRoom || {};
  if (DR.Camera) return;

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const lerp  = (a, b, t) => a + (b - a) * t;

  const DEFAULTS = Object.freeze({
    /* Viewport dimensions */
    width: 640,
    height: 400,
    /* Camera lerp speed (higher = faster follow) */
    smoothing: 5,
    /* Dead zone — camera only moves when target exceeds this from center */
    deadZone: { x: 0, y: 0 },
    /* Camera vertical bias — shifts the focus point (0.5 = center, 0.4 = slightly up) */
    verticalBias: 0.5,
    /* Horizontal bias (0.5 = center) */
    horizontalBias: 0.5,
    /* World bounds — camera won't show beyond these */
    worldWidth: 3200,
    worldHeight: 2200,
    /* Zoom range */
    minZoom: 0.5,
    maxZoom: 3.0,
    defaultZoom: 1.0,
    /* Shake decay speed */
    shakeDecay: 5,
  });

  const Camera = {
    DEFAULTS,

    create(userConfig = {}) {
      const cfg = { ...DEFAULTS, ...userConfig };

      /* Internal state */
      const state = {
        x: 0,
        y: 0,
        zoom: cfg.defaultZoom,
        shakeMagnitude: 0,
        shakeDuration: 0,
        shakeOffsetX: 0,
        shakeOffsetY: 0,
        targetX: 0,
        targetY: 0,
      };

      const rand = (lo, hi) => Math.random() * (hi - lo) + lo;

      return {
        config: cfg,
        state,

        /** Get current camera position (with shake) */
        get x() { return state.x + state.shakeOffsetX; },
        get y() { return state.y + state.shakeOffsetY; },
        get zoom() { return state.zoom; },

        /** Set zoom level */
        setZoom(z) { state.zoom = clamp(z, cfg.minZoom, cfg.maxZoom); },

        /** Trigger screen shake */
        shake(magnitude, duration) {
          state.shakeMagnitude = magnitude;
          state.shakeDuration = duration;
        },

        /**
         * Follow a target entity { x, y }.
         * @param {Object} target — { x, y }
         * @param {number} dt
         */
        follow(target, dt) {
          const vw = cfg.width / state.zoom;
          const vh = cfg.height / state.zoom;

          state.targetX = target.x - vw * cfg.horizontalBias;
          state.targetY = target.y - vh * cfg.verticalBias;

          /* Dead zone */
          const dz = cfg.deadZone;
          const diffX = state.targetX - state.x;
          const diffY = state.targetY - state.y;

          if (Math.abs(diffX) > dz.x || Math.abs(diffY) > dz.y) {
            const t = clamp(dt * cfg.smoothing, 0, 1);
            state.x = lerp(state.x, state.targetX, t);
            state.y = lerp(state.y, state.targetY, t);
          }

          /* Clamp to world bounds */
          const maxX = Math.max(0, cfg.worldWidth - vw);
          const maxY = Math.max(0, cfg.worldHeight - vh);
          state.x = clamp(state.x, 0, maxX);
          state.y = clamp(state.y, 0, maxY);

          /* Update shake */
          if (state.shakeDuration > 0) {
            state.shakeDuration -= dt;
            const m = state.shakeMagnitude;
            state.shakeOffsetX = rand(-m, m);
            state.shakeOffsetY = rand(-m, m);
          } else {
            state.shakeOffsetX = 0;
            state.shakeOffsetY = 0;
          }
        },

        /** Snap camera to target instantly (no lerp) */
        snapTo(target) {
          const vw = cfg.width / state.zoom;
          const vh = cfg.height / state.zoom;
          state.x = clamp(target.x - vw * cfg.horizontalBias, 0, Math.max(0, cfg.worldWidth - vw));
          state.y = clamp(target.y - vh * cfg.verticalBias, 0, Math.max(0, cfg.worldHeight - vh));
          state.targetX = state.x;
          state.targetY = state.y;
        },

        /** Convert world coords to screen coords */
        worldToScreen(wx, wy) {
          return {
            x: (wx - this.x) * state.zoom,
            y: (wy - this.y) * state.zoom
          };
        },

        /** Convert screen coords to world coords */
        screenToWorld(sx, sy) {
          return {
            x: sx / state.zoom + this.x,
            y: sy / state.zoom + this.y
          };
        },

        /** Check if a world-space rect is visible on screen */
        isVisible(wx, wy, ww, wh) {
          const vw = cfg.width / state.zoom;
          const vh = cfg.height / state.zoom;
          return wx + ww > state.x && wx < state.x + vw &&
                 wy + wh > state.y && wy < state.y + vh;
        },

        /** Apply camera transform to a Canvas2D context */
        applyTransform(ctx) {
          ctx.save();
          ctx.scale(state.zoom, state.zoom);
          ctx.translate(-(state.x + state.shakeOffsetX), -(state.y + state.shakeOffsetY));
        },

        /** Restore camera transform */
        restoreTransform(ctx) {
          ctx.restore();
        },

        /** Get the visible world rectangle */
        getViewRect() {
          const vw = cfg.width / state.zoom;
          const vh = cfg.height / state.zoom;
          return {
            x: state.x,
            y: state.y,
            w: vw,
            h: vh
          };
        },
      };
    }
  };

  DR.Camera = Camera;
})();
