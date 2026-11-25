/* ═══════════════════════════════════════════════════════════════════════════
   Dev Room — Weather
   Day/night cycle, rain, wind, lightning effects.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const DR = window.__gsDevRoom = window.__gsDevRoom || {};
  if (DR.Weather) return;

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const lerp  = (a, b, t) => a + (b - a) * t;

  const DEFAULTS = Object.freeze({
    /* Day/night cycle duration in real seconds (0 = disabled) */
    dayNightCycleDuration: 300,
    /* Starting time of day (0..1, 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset) */
    startTimeOfDay: 0.35,
    /* Rain intensity range (0..1) */
    rainIntensity: 0,
    /* Rain droplet count max */
    rainMaxDrops: 200,
    /* Wind direction and speed */
    windAngle: 0.25,      // radians, slight rightward
    windSpeed: 30,
    /* Lightning chance per second during rain (0..1) */
    lightningChance: 0.02,
    /* Lightning flash duration */
    lightningDuration: 0.12,
    /* Fog density (0..1, 0=none) */
    fogDensity: 0,
    /* Ambient light multiplier */
    ambientMin: 0.15,
    ambientMax: 1.0,
    /* Weather transition speed (how fast weather changes blend) */
    transitionSpeed: 0.5,
  });

  /** Time-of-day presets */
  const TIME_PRESETS = Object.freeze({
    midnight: 0.0,
    dawn:     0.22,
    sunrise:  0.27,
    morning:  0.35,
    noon:     0.5,
    afternoon: 0.62,
    sunset:   0.73,
    dusk:     0.78,
    night:    0.9,
  });

  /** Weather condition presets */
  const CONDITION_PRESETS = Object.freeze({
    clear:   { rainIntensity: 0, fogDensity: 0, windSpeed: 10 },
    cloudy:  { rainIntensity: 0, fogDensity: 0.1, windSpeed: 25 },
    rain:    { rainIntensity: 0.6, fogDensity: 0.05, windSpeed: 40 },
    storm:   { rainIntensity: 1.0, fogDensity: 0.1, windSpeed: 70, lightningChance: 0.08 },
    fog:     { rainIntensity: 0, fogDensity: 0.5, windSpeed: 5 },
    snow:    { rainIntensity: 0.4, fogDensity: 0.15, windSpeed: 15 },
  });

  const Weather = {
    DEFAULTS,
    TIME_PRESETS,
    CONDITION_PRESETS,

    create(userConfig = {}) {
      const cfg = { ...DEFAULTS, ...userConfig };

      const state = {
        timeOfDay: cfg.startTimeOfDay,
        rainIntensity: cfg.rainIntensity,
        windAngle: cfg.windAngle,
        windSpeed: cfg.windSpeed,
        fogDensity: cfg.fogDensity,
        lightningTimer: 0,
        lightningFlash: 0,
        /* Target values for smooth transitions */
        targetRain: cfg.rainIntensity,
        targetFog: cfg.fogDensity,
        targetWind: cfg.windSpeed,
        /* Rain droplets */
        drops: [],
      };

      const rand = (lo, hi) => Math.random() * (hi - lo) + lo;

      return {
        config: cfg,
        state,

        /** Update weather systems. Call every frame. */
        update(dt) {
          /* Day/night cycle */
          if (cfg.dayNightCycleDuration > 0) {
            state.timeOfDay = (state.timeOfDay + dt / cfg.dayNightCycleDuration) % 1.0;
          }

          /* Smooth weather transitions */
          const ts = cfg.transitionSpeed * dt;
          state.rainIntensity = lerp(state.rainIntensity, state.targetRain, clamp(ts, 0, 1));
          state.fogDensity = lerp(state.fogDensity, state.targetFog, clamp(ts, 0, 1));
          state.windSpeed = lerp(state.windSpeed, state.targetWind, clamp(ts, 0, 1));

          /* Rain particle management */
          if (state.rainIntensity > 0.01) {
            const targetDrops = Math.floor(cfg.rainMaxDrops * state.rainIntensity);
            while (state.drops.length < targetDrops) {
              state.drops.push({
                x: rand(0, 1), // normalized 0..1 (caller scales to viewport)
                y: rand(-0.1, 0),
                speed: rand(400, 800) * state.rainIntensity,
                length: rand(8, 20) * state.rainIntensity,
              });
            }
            while (state.drops.length > targetDrops) {
              state.drops.pop();
            }
            for (const drop of state.drops) {
              drop.y += drop.speed * dt / 600;
              drop.x += Math.cos(state.windAngle) * state.windSpeed * dt / 3000;
              if (drop.y > 1.1) {
                drop.y = rand(-0.1, -0.02);
                drop.x = rand(0, 1);
              }
            }
          } else {
            state.drops.length = 0;
          }

          /* Lightning */
          if (state.rainIntensity > 0.3 && (cfg.lightningChance || 0) > 0) {
            state.lightningTimer -= dt;
            if (state.lightningTimer <= 0) {
              if (Math.random() < cfg.lightningChance) {
                state.lightningFlash = cfg.lightningDuration;
              }
              state.lightningTimer = 1.0; // check once per second
            }
          }
          if (state.lightningFlash > 0) {
            state.lightningFlash -= dt;
          }
        },

        /** Get ambient light multiplier (0..1) based on time of day */
        getAmbientLight() {
          const t = state.timeOfDay;
          /* Simple bell curve: bright at noon, dark at midnight */
          const raw = Math.sin(t * Math.PI);
          return clamp(lerp(cfg.ambientMin, cfg.ambientMax, raw * raw), cfg.ambientMin, cfg.ambientMax);
        },

        /** Get sky color based on time of day */
        getSkyColor() {
          const t = state.timeOfDay;
          if (t < 0.2 || t > 0.85) return { r: 8, g: 8, b: 24 };      // night
          if (t < 0.3) return { r: 60, g: 40, b: 80 };                   // dawn
          if (t < 0.4) return { r: 135, g: 160, b: 220 };                // morning
          if (t < 0.6) return { r: 100, g: 160, b: 255 };                // midday
          if (t < 0.72) return { r: 120, g: 150, b: 210 };               // afternoon
          if (t < 0.8) return { r: 180, g: 100, b: 60 };                 // sunset
          return { r: 30, g: 20, b: 50 };                                 // dusk
        },

        /** Render rain onto a Canvas2D context */
        renderRain(ctx, viewWidth, viewHeight) {
          if (state.drops.length === 0) return;
          ctx.save();
          ctx.strokeStyle = `rgba(180, 200, 255, ${0.3 * state.rainIntensity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (const drop of state.drops) {
            const x = drop.x * viewWidth;
            const y = drop.y * viewHeight;
            ctx.moveTo(x, y);
            ctx.lineTo(
              x + Math.cos(state.windAngle) * drop.length,
              y + drop.length
            );
          }
          ctx.stroke();
          ctx.restore();
        },

        /** Render lightning flash overlay */
        renderLightning(ctx, viewWidth, viewHeight) {
          if (state.lightningFlash <= 0) return;
          ctx.save();
          ctx.globalAlpha = clamp(state.lightningFlash / cfg.lightningDuration * 0.6, 0, 0.6);
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, viewWidth, viewHeight);
          ctx.restore();
        },

        /** Render fog overlay */
        renderFog(ctx, viewWidth, viewHeight) {
          if (state.fogDensity < 0.01) return;
          ctx.save();
          ctx.globalAlpha = state.fogDensity * 0.4;
          ctx.fillStyle = "#8899aa";
          ctx.fillRect(0, 0, viewWidth, viewHeight);
          ctx.restore();
        },

        /** Apply ambient light tint to context */
        applyAmbientTint(ctx, viewWidth, viewHeight) {
          const light = this.getAmbientLight();
          const darkness = 1 - light;
          if (darkness > 0.02) {
            ctx.save();
            ctx.globalAlpha = darkness * 0.7;
            ctx.fillStyle = "#050510";
            ctx.fillRect(0, 0, viewWidth, viewHeight);
            ctx.restore();
          }
        },

        /** Set weather condition (with smooth transition) */
        setCondition(preset) {
          const p = CONDITION_PRESETS[preset];
          if (!p) return;
          state.targetRain = p.rainIntensity ?? state.targetRain;
          state.targetFog = p.fogDensity ?? state.targetFog;
          state.targetWind = p.windSpeed ?? state.targetWind;
          if (p.lightningChance !== undefined) cfg.lightningChance = p.lightningChance;
        },

        /** Set time of day instantly */
        setTime(t) {
          state.timeOfDay = typeof t === "string" ? (TIME_PRESETS[t] ?? 0.35) : clamp(t, 0, 1);
        },

        /** Get current time of day label */
        getTimeLabel() {
          const t = state.timeOfDay;
          if (t < 0.2) return "midnight";
          if (t < 0.27) return "dawn";
          if (t < 0.35) return "morning";
          if (t < 0.55) return "noon";
          if (t < 0.7) return "afternoon";
          if (t < 0.78) return "sunset";
          if (t < 0.85) return "dusk";
          return "night";
        },
      };
    }
  };

  DR.Weather = Weather;
})();
