/* ═══════════════════════════════════════════════════════════════════════════
   Dev Room — Movement
   Character movement: ground/wall/ceiling/vehicle modes.
   Configurable speeds, acceleration, multi-mode traversal.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const DR = window.__gsDevRoom = window.__gsDevRoom || {};
  if (DR.Movement) return;

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const lerp  = (a, b, t) => a + (b - a) * t;

  const DEFAULTS = Object.freeze({
    /* Walk speed (px/s) */
    walkSpeed: 180,
    /* Sprint multiplier */
    sprintMultiplier: 1.65,
    /* Acceleration rate (px/s²) — how fast the entity reaches walkSpeed */
    acceleration: 1200,
    /* Deceleration rate (px/s²) — how fast the entity stops */
    deceleration: 800,
    /* Maximum speed cap */
    maxSpeed: 500,
    /* Wall climb speed (px/s) */
    wallClimbSpeed: 100,
    /* Ceiling shimmy speed (px/s) */
    ceilingSpeed: 70,
    /* Vehicle acceleration (px/s²) */
    vehicleAcceleration: 220,
    /* Vehicle max speed */
    vehicleMaxSpeed: 360,
    /* Vehicle turn rate (rad/s) */
    vehicleTurnRate: 2.9,
    /* Vehicle brake deceleration */
    vehicleBrake: 500,
    /* Stamina drain per second while sprinting */
    staminaDrain: 18,
    /* Stamina regen per second while not sprinting */
    staminaRegen: 12,
    /* Stamina max */
    staminaMax: 100,
    /* Movement modes this instance supports */
    modes: ["ground"],
    /* Whether direction facing auto-updates from velocity */
    autoFace: true,
    /* Diagonal normalization — prevents faster diagonal movement */
    normalizeDiagonal: true,
  });

  const Movement = {
    DEFAULTS,

    /**
     * Create a movement instance with per-game config.
     * @param {Object} userConfig — overrides for DEFAULTS
     * @returns {Object} movement instance
     */
    create(userConfig = {}) {
      const cfg = { ...DEFAULTS, ...userConfig };
      const supportedModes = new Set(cfg.modes);

      return {
        config: cfg,

        /**
         * Read directional input from keys and return a normalized direction vector.
         * @param {Object} keys — input.keys from game-core
         * @returns {{ dx: number, dy: number, sprint: boolean }}
         */
        readInput(keys) {
          let dx = 0, dy = 0;
          if (keys.KeyA || keys.ArrowLeft) dx -= 1;
          if (keys.KeyD || keys.ArrowRight) dx += 1;
          if (keys.KeyW || keys.ArrowUp) dy -= 1;
          if (keys.KeyS || keys.ArrowDown) dy += 1;

          /* Normalize diagonal */
          if (cfg.normalizeDiagonal && dx !== 0 && dy !== 0) {
            const invLen = 1 / Math.sqrt(2);
            dx *= invLen;
            dy *= invLen;
          }

          const sprint = !!(keys.ShiftLeft || keys.ShiftRight);
          return { dx, dy, sprint };
        },

        /**
         * Update ground movement for an entity.
         * @param {Object} entity — { x, y, vx, vy, dir, stamina, mode }
         * @param {{ dx, dy, sprint }} input — from readInput
         * @param {number} dt
         */
        updateGround(entity, input, dt) {
          const speed = cfg.walkSpeed * (input.sprint && entity.stamina > 0 ? cfg.sprintMultiplier : 1);

          if (input.dx !== 0 || input.dy !== 0) {
            entity.vx += input.dx * cfg.acceleration * dt;
            entity.vy += input.dy * cfg.acceleration * dt;
          } else {
            /* Decelerate towards zero */
            if (Math.abs(entity.vx) > 1) {
              entity.vx -= Math.sign(entity.vx) * Math.min(cfg.deceleration * dt, Math.abs(entity.vx));
            } else {
              entity.vx = 0;
            }
            if (Math.abs(entity.vy) > 1) {
              entity.vy -= Math.sign(entity.vy) * Math.min(cfg.deceleration * dt, Math.abs(entity.vy));
            } else {
              entity.vy = 0;
            }
          }

          /* Speed cap */
          const curSpeed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
          if (curSpeed > speed) {
            const scale = speed / curSpeed;
            entity.vx *= scale;
            entity.vy *= scale;
          }

          /* Stamina */
          if (input.sprint && (input.dx !== 0 || input.dy !== 0)) {
            entity.stamina = Math.max(0, (entity.stamina ?? cfg.staminaMax) - cfg.staminaDrain * dt);
          } else {
            entity.stamina = Math.min(cfg.staminaMax, (entity.stamina ?? cfg.staminaMax) + cfg.staminaRegen * dt);
          }

          /* Facing direction */
          if (cfg.autoFace && Math.abs(entity.vx) > 5) {
            entity.dir = entity.vx > 0 ? 1 : -1;
          }
        },

        /**
         * Update wall climb movement.
         * @param {Object} entity — { x, y, vx, vy }
         * @param {{ dx, dy }} input
         * @param {number} dt
         * @param {Object} route — { points: [{x,y}...], vertical: boolean }
         */
        updateWall(entity, input, dt, route) {
          if (!supportedModes.has("wall") || !route || !route.points) return;
          /* Move along the route axis */
          const speed = cfg.wallClimbSpeed;
          if (route.vertical) {
            entity.vy = input.dy * speed;
            entity.vx = 0;
          } else {
            entity.vx = input.dx * speed;
            entity.vy = 0;
          }
        },

        /**
         * Update ceiling shimmy movement.
         * @param {Object} entity
         * @param {{ dx }} input
         * @param {number} dt
         * @param {Object} route — { points: [{x,y}...] }
         */
        updateCeiling(entity, input, dt, route) {
          if (!supportedModes.has("ceiling") || !route) return;
          entity.vx = input.dx * cfg.ceilingSpeed;
          entity.vy = 0;
        },

        /**
         * Update vehicle movement.
         * @param {Object} vehicle — { x, y, vx, vy, angle, speed }
         * @param {{ dx, dy }} input — dx for steering, dy for accel/brake
         * @param {number} dt
         * @param {Object} vehicleSpec — optional per-vehicle overrides { maxSpeed, accel, turnRate }
         */
        updateVehicle(vehicle, input, dt, vehicleSpec) {
          const maxSpeed = vehicleSpec?.maxSpeed ?? cfg.vehicleMaxSpeed;
          const accel = vehicleSpec?.accel ?? cfg.vehicleAcceleration;
          const turn = vehicleSpec?.turnRate ?? cfg.vehicleTurnRate;
          const brake = cfg.vehicleBrake;

          /* Steering */
          if (input.dx !== 0 && Math.abs(vehicle.speed || 0) > 5) {
            vehicle.angle = (vehicle.angle || 0) + input.dx * turn * dt;
          }

          /* Accelerate / brake */
          if (input.dy < 0) {
            vehicle.speed = Math.min(maxSpeed, (vehicle.speed || 0) + accel * dt);
          } else if (input.dy > 0) {
            vehicle.speed = Math.max(-maxSpeed * 0.3, (vehicle.speed || 0) - brake * dt);
          } else {
            /* Coast — slow deceleration */
            if (Math.abs(vehicle.speed || 0) > 2) {
              vehicle.speed = (vehicle.speed || 0) * 0.97;
            } else {
              vehicle.speed = 0;
            }
          }

          /* Apply to position */
          const angle = vehicle.angle || 0;
          vehicle.vx = Math.cos(angle) * (vehicle.speed || 0);
          vehicle.vy = Math.sin(angle) * (vehicle.speed || 0);
          vehicle.x += vehicle.vx * dt;
          vehicle.y += vehicle.vy * dt;
        },

        /**
         * Check mode transitions (ground → wall, wall → ceiling, etc.)
         * Returns the new mode if a transition should occur, else null.
         * @param {Object} entity — { x, y, mode }
         * @param {Object} zones — { wallZones: [], ceilingZones: [], vehicleZones: [] }
         * @param {Object} keys — input keys
         * @returns {string|null}
         */
        checkModeTransition(entity, zones, keys) {
          const interactKey = keys.KeyE;

          if (entity.mode === "ground" && supportedModes.has("wall")) {
            if (interactKey && zones.wallZones) {
              for (const zone of zones.wallZones) {
                const dx = entity.x - zone.x, dy = entity.y - zone.y;
                if (dx * dx + dy * dy < (zone.radius || 40) * (zone.radius || 40)) {
                  return "wall";
                }
              }
            }
          }

          if (entity.mode === "wall" && supportedModes.has("ceiling")) {
            if (interactKey && zones.ceilingZones) {
              for (const zone of zones.ceilingZones) {
                const dx = entity.x - zone.x, dy = entity.y - zone.y;
                if (dx * dx + dy * dy < (zone.radius || 40) * (zone.radius || 40)) {
                  return "ceiling";
                }
              }
            }
          }

          if (entity.mode === "ground" && supportedModes.has("vehicle")) {
            if (interactKey && zones.vehicleZones) {
              for (const zone of zones.vehicleZones) {
                const dx = entity.x - zone.x, dy = entity.y - zone.y;
                if (dx * dx + dy * dy < (zone.radius || 50) * (zone.radius || 50)) {
                  return "vehicle";
                }
              }
            }
          }

          /* Drop from wall/ceiling/vehicle back to ground */
          if ((entity.mode === "wall" || entity.mode === "ceiling" || entity.mode === "vehicle") && keys.Space) {
            return "ground";
          }

          return null;
        },

        /**
         * Convenience: full update for the entity's current mode.
         * @param {Object} entity — must have { mode, x, y, vx, vy, dir, stamina }
         * @param {{ dx, dy, sprint }} input — from readInput
         * @param {number} dt
         * @param {Object} context — { route, vehicleSpec } depending on mode
         */
        update(entity, input, dt, context) {
          switch (entity.mode || "ground") {
            case "ground":
              this.updateGround(entity, input, dt);
              break;
            case "wall":
              this.updateWall(entity, input, dt, context?.route);
              break;
            case "ceiling":
              this.updateCeiling(entity, input, dt, context?.route);
              break;
            case "vehicle":
              this.updateVehicle(context?.vehicle || entity, input, dt, context?.vehicleSpec);
              break;
          }
        },
      };
    }
  };

  DR.Movement = Movement;
})();
