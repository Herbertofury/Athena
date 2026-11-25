/* ═══════════════════════════════════════════════════════════════════════════
   Dev Room — AI
   State machine AI with configurable behavior trees, patrol, chase, flee.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const DR = window.__gsDevRoom = window.__gsDevRoom || {};
  if (DR.AI) return;

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  const DEFAULTS = Object.freeze({
    /* How often AI re-evaluates state (seconds) */
    thinkInterval: 0.3,
    /* Detection radius for targets */
    detectRadius: 200,
    /* Attack range */
    attackRange: 50,
    /* Flee threshold (HP ratio 0..1 below which entity flees) */
    fleeThreshold: 0.2,
    /* Patrol speed multiplier (relative to base speed) */
    patrolSpeedMul: 0.6,
    /* Chase speed multiplier */
    chaseSpeedMul: 1.0,
    /* Flee speed multiplier */
    fleeSpeedMul: 1.2,
    /* Wander radius */
    wanderRadius: 150,
    /* Max reaction time jitter (prevents all AI acting in sync) */
    reactionJitter: 0.15,
    /* Lookahead distance for obstacle avoidance */
    lookahead: 60,
  });

  /**
   * Built-in AI states.
   * Games can add custom states by extending the state map.
   */
  const BUILTIN_STATES = {
    idle: {
      enter(npc) { npc.aiTarget = null; },
      update(npc, ctx, dt) {
        /* Check for nearby threats */
        const target = ctx.findNearest(npc, ctx.detectRadius);
        if (target) return "chase";
        if (npc.aiPatrolPath && npc.aiPatrolPath.length) return "patrol";
        return null; // stay idle
      }
    },
    patrol: {
      enter(npc) {
        npc.aiPatrolIndex = npc.aiPatrolIndex || 0;
      },
      update(npc, ctx, dt) {
        const target = ctx.findNearest(npc, ctx.detectRadius);
        if (target) return "chase";

        const path = npc.aiPatrolPath;
        if (!path || !path.length) return "idle";

        const wp = path[npc.aiPatrolIndex % path.length];
        const dx = wp.x - npc.x, dy = wp.y - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
          npc.aiPatrolIndex = (npc.aiPatrolIndex + 1) % path.length;
        } else {
          const speed = (npc.speed || 100) * ctx.patrolSpeedMul;
          npc.vx = (dx / dist) * speed;
          npc.vy = (dy / dist) * speed;
          if (Math.abs(npc.vx) > 2) npc.dir = npc.vx > 0 ? 1 : -1;
        }
        return null;
      }
    },
    chase: {
      enter(npc) {},
      update(npc, ctx, dt) {
        const target = ctx.findNearest(npc, ctx.detectRadius * 1.5);
        if (!target) return "idle";

        /* Flee if low HP */
        const hpRatio = (npc.hp || 100) / (npc.maxHp || 100);
        if (hpRatio < ctx.fleeThreshold) return "flee";

        const dx = target.x - npc.x, dy = target.y - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ctx.attackRange) {
          return "attack";
        }

        const speed = (npc.speed || 100) * ctx.chaseSpeedMul;
        npc.vx = (dx / dist) * speed;
        npc.vy = (dy / dist) * speed;
        if (Math.abs(npc.vx) > 2) npc.dir = npc.vx > 0 ? 1 : -1;
        npc.aiTarget = target;
        return null;
      }
    },
    attack: {
      enter(npc) { npc.aiAttackCooldown = 0; },
      update(npc, ctx, dt) {
        const target = npc.aiTarget || ctx.findNearest(npc, ctx.attackRange * 1.5);
        if (!target) return "idle";

        const dx = target.x - npc.x, dy = target.y - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > ctx.attackRange * 1.5) return "chase";

        /* Face target */
        if (Math.abs(dx) > 2) npc.dir = dx > 0 ? 1 : -1;

        /* Attack on cooldown */
        npc.aiAttackCooldown = (npc.aiAttackCooldown || 0) - dt;
        if (npc.aiAttackCooldown <= 0) {
          if (ctx.onAttack) ctx.onAttack(npc, target);
          npc.aiAttackCooldown = npc.aiAttackInterval || 0.5;
        }

        /* Stop moving while attacking */
        npc.vx *= 0.5;
        npc.vy *= 0.5;
        return null;
      }
    },
    flee: {
      enter(npc) {},
      update(npc, ctx, dt) {
        const threat = ctx.findNearest(npc, ctx.detectRadius * 2);
        if (!threat) return "idle";

        /* Check if recovered enough to fight */
        const hpRatio = (npc.hp || 100) / (npc.maxHp || 100);
        if (hpRatio > ctx.fleeThreshold * 2) return "chase";

        const dx = npc.x - threat.x, dy = npc.y - threat.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = (npc.speed || 100) * ctx.fleeSpeedMul;
        npc.vx = (dx / dist) * speed;
        npc.vy = (dy / dist) * speed;
        if (Math.abs(npc.vx) > 2) npc.dir = npc.vx > 0 ? 1 : -1;
        return null;
      }
    },
    guard: {
      enter(npc) {},
      update(npc, ctx, dt) {
        const target = ctx.findNearest(npc, ctx.detectRadius);
        if (target) return "chase";

        /* Return to guard post */
        const gx = npc.guardX ?? npc.spawnX ?? npc.x;
        const gy = npc.guardY ?? npc.spawnY ?? npc.y;
        const dx = gx - npc.x, dy = gy - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 15) {
          const speed = (npc.speed || 100) * ctx.patrolSpeedMul;
          npc.vx = (dx / dist) * speed;
          npc.vy = (dy / dist) * speed;
        } else {
          npc.vx *= 0.5;
          npc.vy *= 0.5;
        }
        return null;
      }
    },
    wander: {
      enter(npc) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * (npc.wanderRadius || 150);
        npc.aiWanderTarget = {
          x: (npc.spawnX ?? npc.x) + Math.cos(angle) * r,
          y: (npc.spawnY ?? npc.y) + Math.sin(angle) * r
        };
      },
      update(npc, ctx, dt) {
        const target = ctx.findNearest(npc, ctx.detectRadius);
        if (target) return "chase";

        const wp = npc.aiWanderTarget;
        if (!wp) return "idle";

        const dx = wp.x - npc.x, dy = wp.y - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) return "idle"; // pick new wander on next think

        const speed = (npc.speed || 100) * ctx.patrolSpeedMul * 0.7;
        npc.vx = (dx / dist) * speed;
        npc.vy = (dy / dist) * speed;
        if (Math.abs(npc.vx) > 2) npc.dir = npc.vx > 0 ? 1 : -1;
        return null;
      }
    },
    follow: {
      enter(npc) {},
      update(npc, ctx, dt) {
        const leader = ctx.getLeader ? ctx.getLeader(npc) : null;
        if (!leader) return "idle";

        const dx = leader.x - npc.x, dy = leader.y - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        /* Stay at a comfortable distance */
        if (dist > 60) {
          const speed = (npc.speed || 100) * (dist > 150 ? ctx.chaseSpeedMul : ctx.patrolSpeedMul);
          npc.vx = (dx / dist) * speed;
          npc.vy = (dy / dist) * speed;
          if (Math.abs(npc.vx) > 2) npc.dir = npc.vx > 0 ? 1 : -1;
        } else {
          npc.vx *= 0.5;
          npc.vy *= 0.5;
        }

        /* Help fight if threats nearby */
        const threat = ctx.findNearest(npc, ctx.detectRadius * 0.8);
        if (threat) return "chase";

        return null;
      }
    },
  };

  const AI = {
    DEFAULTS,
    BUILTIN_STATES,

    create(userConfig = {}) {
      const cfg = { ...DEFAULTS, ...userConfig };
      /* Merge custom states with builtins */
      const stateMap = { ...BUILTIN_STATES, ...(userConfig.customStates || {}) };

      return {
        config: cfg,

        /**
         * Initialize AI state on an NPC entity.
         * Call once when creating the NPC.
         * @param {Object} npc — must have { x, y, hp, maxHp, speed }
         * @param {string} initialState — e.g. "idle", "patrol", "guard"
         * @param {Object} options — { patrolPath, guardX, guardY, attackInterval, ... }
         */
        init(npc, initialState, options = {}) {
          npc.aiState = initialState || "idle";
          npc.aiThinkTimer = Math.random() * cfg.thinkInterval; // stagger
          npc.aiTarget = null;
          npc.aiPatrolPath = options.patrolPath || null;
          npc.aiPatrolIndex = 0;
          npc.aiAttackCooldown = 0;
          npc.aiAttackInterval = options.attackInterval || 0.5;
          npc.guardX = options.guardX;
          npc.guardY = options.guardY;
          npc.spawnX = npc.x;
          npc.spawnY = npc.y;
          npc.wanderRadius = options.wanderRadius || cfg.wanderRadius;

          const st = stateMap[npc.aiState];
          if (st && st.enter) st.enter(npc);
        },

        /**
         * Update an NPC's AI each frame.
         * @param {Object} npc — the NPC entity
         * @param {number} dt
         * @param {Object} gameContext — game-specific callbacks:
         *   findNearest(npc, radius) → target or null
         *   onAttack(npc, target) — called when NPC attacks
         *   getLeader(npc) → leader entity (for follow state)
         */
        update(npc, dt, gameContext) {
          if (npc.dead || npc.hidden) return;

          const ctx = {
            detectRadius: cfg.detectRadius,
            attackRange: cfg.attackRange,
            fleeThreshold: cfg.fleeThreshold,
            patrolSpeedMul: cfg.patrolSpeedMul,
            chaseSpeedMul: cfg.chaseSpeedMul,
            fleeSpeedMul: cfg.fleeSpeedMul,
            ...gameContext,
          };

          /* Throttled think */
          npc.aiThinkTimer -= dt;
          if (npc.aiThinkTimer > 0) {
            /* Still execute current state's movement */
            const st = stateMap[npc.aiState];
            if (st && st.update) st.update(npc, ctx, dt);
            return;
          }
          npc.aiThinkTimer = cfg.thinkInterval + Math.random() * cfg.reactionJitter;

          /* Evaluate state */
          const st = stateMap[npc.aiState];
          if (!st) return;

          const nextState = st.update(npc, ctx, dt);
          if (nextState && nextState !== npc.aiState && stateMap[nextState]) {
            npc.aiState = nextState;
            const next = stateMap[nextState];
            if (next && next.enter) next.enter(npc);
          }
        },

        /** Force an NPC into a specific state */
        setState(npc, stateName) {
          if (!stateMap[stateName]) return;
          npc.aiState = stateName;
          const st = stateMap[stateName];
          if (st && st.enter) st.enter(npc);
        },

        /** Add a custom state at runtime */
        addState(name, stateObj) {
          stateMap[name] = stateObj;
        },

        /** Get list of available states */
        getStates() {
          return Object.keys(stateMap);
        },
      };
    }
  };

  DR.AI = AI;
})();
