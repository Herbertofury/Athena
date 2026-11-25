/* ═══════════════════════════════════════════════════════════════════════════
   Dev Room — Vehicle
   Vehicle physics: steering, acceleration, drift, collision, types.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const DR = window.__gsDevRoom = window.__gsDevRoom || {};
  if (DR.Vehicle) return;

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  const DEFAULTS = Object.freeze({
    /* Default acceleration (px/s²) */
    acceleration: 220,
    /* Default max speed */
    maxSpeed: 360,
    /* Reverse max speed ratio */
    reverseSpeedRatio: 0.3,
    /* Turn rate (rad/s) */
    turnRate: 2.9,
    /* Brake deceleration */
    brakeForce: 500,
    /* Coast friction (multiplier per frame) */
    coastFriction: 0.97,
    /* Drift friction (lower = more slide) */
    driftFriction: 0.93,
    /* Whether drift mode is available */
    enableDrift: false,
    /* Drift threshold — speed at which drift activates */
    driftThreshold: 200,
    /* Minimum speed for turning */
    minTurnSpeed: 5,
    /* Collision damage per impact speed unit */
    collisionDamageScale: 0.05,
    /* Whether vehicles take collision damage */
    takesCollisionDamage: false,
  });

  /** Vehicle type presets (from openworld) */
  const TYPE_PRESETS = Object.freeze({
    coupe:   { maxSpeed: 360, acceleration: 220, turnRate: 2.9, label: "Coupe" },
    van:     { maxSpeed: 300, acceleration: 180, turnRate: 2.2, label: "Van" },
    cruiser: { maxSpeed: 340, acceleration: 210, turnRate: 2.5, label: "Cruiser" },
    bike:    { maxSpeed: 400, acceleration: 280, turnRate: 3.5, label: "Bike" },
    truck:   { maxSpeed: 250, acceleration: 150, turnRate: 1.8, label: "Truck" },
    sports:  { maxSpeed: 420, acceleration: 300, turnRate: 3.0, label: "Sports" },
  });

  const Vehicle = {
    DEFAULTS,
    TYPE_PRESETS,

    create(userConfig = {}) {
      const cfg = { ...DEFAULTS, ...userConfig };

      return {
        config: cfg,

        /**
         * Create a vehicle entity.
         * @param {Object} def — { id, x, y, type, color, ... }
         * @returns {Object} vehicle state
         */
        createVehicle(def) {
          const preset = TYPE_PRESETS[def.type] || {};
          return {
            id: def.id || `v_${Date.now()}`,
            x: def.x || 0,
            y: def.y || 0,
            angle: def.angle || 0,
            speed: 0,
            vx: 0,
            vy: 0,
            maxSpeed: def.maxSpeed ?? preset.maxSpeed ?? cfg.maxSpeed,
            acceleration: def.acceleration ?? preset.acceleration ?? cfg.acceleration,
            turnRate: def.turnRate ?? preset.turnRate ?? cfg.turnRate,
            hp: def.hp ?? 100,
            maxHp: def.maxHp ?? 100,
            color: def.color || "#4488cc",
            label: def.label || preset.label || "Vehicle",
            type: def.type || "coupe",
            occupantId: def.occupantId || "",
            drifting: false,
            driftAngle: 0,
            ...def,
          };
        },

        /**
         * Update vehicle physics.
         * @param {Object} vehicle — created by createVehicle
         * @param {{ dx, dy }} input — dx for steering (-1 to 1), dy for accel (-1=forward, 1=brake)
         * @param {number} dt
         */
        update(vehicle, input, dt) {
          const accel = vehicle.acceleration;
          const maxSpd = vehicle.maxSpeed;
          const turn = vehicle.turnRate;

          /* Steering — only when moving */
          if (Math.abs(vehicle.speed) > cfg.minTurnSpeed && input.dx !== 0) {
            const turnScale = clamp(Math.abs(vehicle.speed) / maxSpd, 0.3, 1);
            vehicle.angle += input.dx * turn * turnScale * dt;
          }

          /* Accelerate / brake */
          if (input.dy < 0) {
            vehicle.speed = Math.min(maxSpd, vehicle.speed + accel * dt);
          } else if (input.dy > 0) {
            if (vehicle.speed > 10) {
              /* Braking */
              vehicle.speed = Math.max(0, vehicle.speed - cfg.brakeForce * dt);
            } else {
              /* Reverse */
              vehicle.speed = Math.max(-maxSpd * cfg.reverseSpeedRatio, vehicle.speed - accel * 0.5 * dt);
            }
          } else {
            /* Coast */
            vehicle.speed *= cfg.coastFriction;
            if (Math.abs(vehicle.speed) < 2) vehicle.speed = 0;
          }

          /* Drift */
          if (cfg.enableDrift && Math.abs(vehicle.speed) > cfg.driftThreshold && Math.abs(input.dx) > 0.5) {
            vehicle.drifting = true;
            vehicle.driftAngle = vehicle.angle + input.dx * 0.3;
          } else {
            vehicle.drifting = false;
          }

          /* Apply velocity */
          const effectiveAngle = vehicle.drifting ? vehicle.driftAngle : vehicle.angle;
          vehicle.vx = Math.cos(effectiveAngle) * vehicle.speed;
          vehicle.vy = Math.sin(effectiveAngle) * vehicle.speed;
          vehicle.x += vehicle.vx * dt;
          vehicle.y += vehicle.vy * dt;

          /* Drift friction */
          if (vehicle.drifting) {
            vehicle.speed *= cfg.driftFriction;
          }
        },

        /**
         * Handle collision between vehicle and a static object.
         * @param {Object} vehicle
         * @param {Object} obstacle — { x, y, w, h }
         * @returns {{ collided, damage }}
         */
        resolveCollision(vehicle, obstacle) {
          /* Simple AABB overlap check using vehicle center ± hitbox */
          const vhw = 20, vhh = 12; // vehicle half-width/height approximation
          const vx1 = vehicle.x - vhw, vy1 = vehicle.y - vhh;
          const vx2 = vehicle.x + vhw, vy2 = vehicle.y + vhh;

          if (vx2 > obstacle.x && vx1 < obstacle.x + obstacle.w &&
              vy2 > obstacle.y && vy1 < obstacle.y + obstacle.h) {
            /* Collision — bounce back */
            const damage = cfg.takesCollisionDamage
              ? Math.abs(vehicle.speed) * cfg.collisionDamageScale
              : 0;

            vehicle.speed *= -0.3;
            vehicle.x -= vehicle.vx * 0.02;
            vehicle.y -= vehicle.vy * 0.02;

            if (damage > 0) {
              vehicle.hp = Math.max(0, vehicle.hp - damage);
            }

            return { collided: true, damage };
          }
          return { collided: false, damage: 0 };
        },

        /** Enter a vehicle — attach occupant */
        enter(vehicle, occupantId) {
          vehicle.occupantId = occupantId;
        },

        /** Exit a vehicle — detach occupant */
        exit(vehicle) {
          const occupant = vehicle.occupantId;
          vehicle.occupantId = "";
          vehicle.speed *= 0.3; // slow down on exit
          return occupant;
        },

        /** Check if a point is near enough to enter a vehicle */
        canEnter(vehicle, x, y, radius) {
          const dx = vehicle.x - x, dy = vehicle.y - y;
          return dx * dx + dy * dy < (radius || 50) * (radius || 50) && !vehicle.occupantId;
        },

        /** Get nearest available vehicle */
        findNearest(vehicles, x, y, maxDist) {
          let best = null, bestDist = maxDist ?? Infinity;
          for (const v of vehicles) {
            if (v.occupantId) continue;
            const dx = v.x - x, dy = v.y - y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < bestDist) { bestDist = d; best = v; }
          }
          return best;
        },
      };
    }
  };

  DR.Vehicle = Vehicle;
})();
