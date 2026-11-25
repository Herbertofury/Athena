/* ═══════════════════════════════════════════════════════════════════════════
   Dev Room — Physics
   Configurable physics system: gravity, friction, knockback, projectiles.
   Each game creates its own instance via Physics.create(config).
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const DR = window.__gsDevRoom = window.__gsDevRoom || {};
  if (DR.Physics) return;

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  const DEFAULTS = Object.freeze({
    /* Gravity (px/s²) — games range from 900 (smash) to 1200 (racing) */
    gravity: 900,
    /* Ground friction multiplier per frame (0..1) */
    friction: 0.85,
    /* Air friction — less drag while airborne */
    airFriction: 0.98,
    /* Terminal velocity (max fall speed) */
    maxFallSpeed: 800,
    /* Jump initial velocity (negative = up) */
    jumpVelocity: -380,
    /* Restitution — bounce factor (0 = no bounce, 1 = full bounce) */
    restitution: 0,
    /* Knockback base magnitude */
    knockbackBase: 180,
    /* Knockback scaling with damage */
    knockbackDamageScale: 4.5,
    /* Hitstun base duration */
    hitstunBase: 0.15,
    /* Hitstun scale with knockback */
    hitstunKbScale: 0.08,
    /* Projectile default speed */
    projectileSpeed: 500,
    /* Projectile gravity (0 = no drop) */
    projectileGravity: 0,
    /* Whether to clamp entity positions to world bounds */
    clampToWorld: true,
    /* World bounds (if clampToWorld is true) */
    worldWidth: 3200,
    worldHeight: 2200,
  });

  const Physics = {
    DEFAULTS,

    /**
     * Create a physics instance with per-game config.
     * @param {Object} userConfig — overrides for any DEFAULTS key
     * @returns {Object} physics instance with methods
     */
    create(userConfig = {}) {
      const cfg = { ...DEFAULTS, ...userConfig };

      return {
        config: cfg,

        /** Apply gravity to an entity { vy } */
        applyGravity(entity, dt) {
          entity.vy = clamp(
            entity.vy + cfg.gravity * dt,
            -cfg.maxFallSpeed,
            cfg.maxFallSpeed
          );
        },

        /** Apply friction to an entity { vx, vy } based on grounded state */
        applyFriction(entity, dt, grounded) {
          const f = grounded ? cfg.friction : cfg.airFriction;
          entity.vx *= f;
          entity.vy *= f;
        },

        /** Apply directional friction (different X vs Y) */
        applyDirectionalFriction(entity, dt, grounded, frictionX, frictionY) {
          const fBase = grounded ? cfg.friction : cfg.airFriction;
          entity.vx *= (frictionX ?? fBase);
          entity.vy *= (frictionY ?? fBase);
        },

        /** Move entity by velocity and dt */
        applyVelocity(entity, dt) {
          entity.x += entity.vx * dt;
          entity.y += entity.vy * dt;
          if (cfg.clampToWorld) {
            entity.x = clamp(entity.x, 0, cfg.worldWidth);
            entity.y = clamp(entity.y, 0, cfg.worldHeight);
          }
        },

        /** Apply jump to an entity (sets vy to jumpVelocity) */
        jump(entity) {
          entity.vy = cfg.jumpVelocity;
        },

        /** Apply jump with a custom multiplier */
        jumpScaled(entity, multiplier) {
          entity.vy = cfg.jumpVelocity * (multiplier || 1);
        },

        /**
         * Calculate knockback vector from an attack.
         * @param {Object} defender — { x, y, damage }
         * @param {Object} attacker — { x, y }
         * @param {Object} attack — { kb (multiplier), damage }
         * @returns {{ vx, vy, hitstun }}
         */
        calculateKnockback(defender, attacker, attack) {
          const angle = Math.atan2(defender.y - attacker.y, defender.x - attacker.x);
          const magnitude = (cfg.knockbackBase + (defender.damage || 0) * cfg.knockbackDamageScale) * (attack.kb || 1);
          const hitstun = cfg.hitstunBase + (attack.kb || 1) * cfg.hitstunKbScale;
          return {
            vx: Math.cos(angle) * magnitude,
            vy: Math.sin(angle) * magnitude - 80, // slight upward bias
            hitstun
          };
        },

        /** Apply knockback result to entity */
        applyKnockback(entity, kb) {
          entity.vx += kb.vx;
          entity.vy += kb.vy;
          if (entity.hitstun !== undefined) {
            entity.hitstun = kb.hitstun;
          }
        },

        /**
         * Update a projectile { x, y, vx, vy, life }.
         * Returns false if projectile should be removed.
         */
        updateProjectile(proj, dt) {
          proj.vy += cfg.projectileGravity * dt;
          proj.x += proj.vx * dt;
          proj.y += proj.vy * dt;
          proj.life -= dt;
          return proj.life > 0;
        },

        /** Create a projectile from origin in a direction */
        createProjectile(x, y, angle, overrides = {}) {
          const speed = overrides.speed ?? cfg.projectileSpeed;
          return {
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: overrides.life ?? 3,
            damage: overrides.damage ?? 10,
            radius: overrides.radius ?? 4,
            owner: overrides.owner ?? "player",
            pierce: overrides.pierce ?? 0,
          };
        },

        /** Simple AABB floor check: is entity on or below floorY? */
        isOnFloor(entity, floorY) {
          return entity.y >= floorY;
        },

        /** Resolve floor collision — snap entity to floor and zero vy */
        resolveFloor(entity, floorY) {
          if (entity.y >= floorY) {
            entity.y = floorY;
            if (entity.vy > 0) {
              if (cfg.restitution > 0) {
                entity.vy = -entity.vy * cfg.restitution;
              } else {
                entity.vy = 0;
              }
            }
            return true;
          }
          return false;
        },

        /** Resolve wall collision (axis-aligned) */
        resolveWall(entity, wallX, entityWidth, fromLeft) {
          if (fromLeft && entity.x + entityWidth > wallX) {
            entity.x = wallX - entityWidth;
            entity.vx = cfg.restitution > 0 ? -entity.vx * cfg.restitution : 0;
            return true;
          }
          if (!fromLeft && entity.x < wallX) {
            entity.x = wallX;
            entity.vx = cfg.restitution > 0 ? -entity.vx * cfg.restitution : 0;
            return true;
          }
          return false;
        },

        /** Batch-update a list of projectiles, removing dead ones in-place */
        updateProjectiles(projectiles, dt) {
          for (let i = projectiles.length - 1; i >= 0; i--) {
            if (!this.updateProjectile(projectiles[i], dt)) {
              projectiles.splice(i, 1);
            }
          }
        },
      };
    }
  };

  DR.Physics = Physics;
})();
