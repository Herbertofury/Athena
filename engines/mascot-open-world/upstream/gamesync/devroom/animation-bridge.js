/* ═══════════════════════════════════════════════════════════════════════════
   Dev Room — Animation Bridge
   Generic mapper from game states to shimeji animation actions.
   Each game defines its own state→action mapping table.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const DR = window.__gsDevRoom = window.__gsDevRoom || {};
  if (DR.AnimationBridge) return;

  /**
   * Default state→shimeji action mapping.
   * Keys are game state names, values are shimeji action alias names
   * (matched by the runtime's resolveAlias).
   */
  const DEFAULT_STATE_MAP = Object.freeze({
    /* Locomotion */
    idle:         "idle",
    walk:         "walk",
    run:          "run",
    dash:         "dash",
    creep:        "creep",
    /* Airborne */
    jump:         "jump",
    fall:         "fall",
    land:         "land",
    bounce:       "land",
    /* Traversal */
    wallGrab:     "wallGrab",
    wallClimb:    "wallClimb",
    ceilingGrab:  "ceilingGrab",
    ceilingClimb: "ceilingClimb",
    /* Combat */
    attack:       "jump",     // fallback — no native "attack" in base shimeji
    hurt:         "hurt",
    block:        "idle",
    dodge:        "dash",
    /* Interaction */
    carry:        "carryWalk",
    carryWalk:    "carryWalk",
    carryRun:     "carryRun",
    throwItem:    "throwCarry",
    pickup:       "drag",
    /* Emotes / Special */
    sit:          "sit",
    relax:        "relax",
    lookUp:       "lookUp",
    spin:         "spin",
    split:        "split",
    resist:       "resist",
    drag:         "drag",
    pullUp:       "pullUp",
    /* Vehicle — use dash as approximation */
    drive:        "dash",
    vehicle:      "dash",
    /* Death / KO */
    dead:         "fall",
    ko:           "hurt",
    respawn:      "jump",
    /* Custom — games add their own */
  });

  /**
   * Speed scale presets — how fast to play the animation
   * relative to in-game movement speed.
   */
  const SPEED_PRESETS = Object.freeze({
    idle: 1.0,
    walk: 1.0,
    run: 1.15,
    dash: 1.25,
    climb: 0.85,
    attack: 1.3,
    hurt: 1.0,
    slow: 0.7,
  });

  const AnimationBridge = {
    DEFAULT_STATE_MAP,
    SPEED_PRESETS,

    /**
     * Create an animation bridge instance.
     * @param {Object} userConfig
     * @param {Object} userConfig.stateMap — custom state→action mapping (merged with defaults)
     * @param {Object} userConfig.speedMap — custom speed scale overrides
     * @param {Function} userConfig.resolveAlias — runtime.resolveAlias if available
     */
    create(userConfig = {}) {
      const stateMap = { ...DEFAULT_STATE_MAP, ...(userConfig.stateMap || {}) };
      const speedMap = { ...SPEED_PRESETS, ...(userConfig.speedMap || {}) };
      const resolveAlias = userConfig.resolveAlias || null;

      return {
        stateMap,
        speedMap,

        /**
         * Resolve a game state string to the best shimeji action name.
         * @param {string} gameState — e.g. "run", "wallClimb", "attack"
         * @returns {string} shimeji action name
         */
        resolve(gameState) {
          const mapped = stateMap[gameState] || stateMap.idle;
          if (resolveAlias) return resolveAlias(mapped);
          return mapped;
        },

        /**
         * Get the animation speed scale for a game state.
         * @param {string} gameState
         * @param {number} movementSpeed — current entity speed (optional, for dynamic scaling)
         * @param {number} baseSpeed — base walk speed (optional)
         * @returns {number}
         */
        getSpeedScale(gameState, movementSpeed, baseSpeed) {
          const baseScale = speedMap[gameState] ?? speedMap.idle ?? 1.0;
          if (movementSpeed != null && baseSpeed != null && baseSpeed > 0) {
            return baseScale * Math.max(0.35, movementSpeed / baseSpeed);
          }
          return baseScale;
        },

        /**
         * Full sync: given an entity and its game state, update its animator.
         * This is the main convenience method games should call every frame.
         *
         * @param {Object} entity — must have { animator, dir, vx, vy }
         * @param {string} gameState — current game state string
         * @param {number} dt
         * @param {Object} options — { facing, speedScale, loop }
         */
        sync(entity, gameState, dt, options = {}) {
          if (!entity.animator) return;

          const actionName = this.resolve(gameState);
          const speedScale = options.speedScale ?? this.getSpeedScale(gameState);
          const facing = options.facing ?? entity.dir ?? 1;

          /* Only change action if different (avoids restart flicker) */
          const currentResolved = resolveAlias ? resolveAlias(entity.animator.action) : entity.animator.action;
          const nextResolved = resolveAlias ? resolveAlias(actionName) : actionName;

          if (currentResolved !== nextResolved) {
            entity.animator.setAction(actionName, {
              loop: options.loop !== false,
              speedScale
            });
          } else {
            entity.animator.speedScale = Math.max(0.35, speedScale);
          }

          entity.animator.facing = facing;
          entity.animator.update(dt);
        },

        /**
         * Determine the best game state from entity properties.
         * Utility for games that don't have explicit state tracking.
         *
         * @param {Object} entity — { vx, vy, mode, hp, jumpZ, jumpVz, carryItem, ... }
         * @returns {string} game state string
         */
        inferState(entity) {
          /* Dead / KO */
          if (entity.dead || (entity.hp !== undefined && entity.hp <= 0)) return "dead";
          if (entity.hitstun > 0) return "hurt";

          /* Mode-specific */
          if (entity.mode === "wall") return "wallGrab";
          if (entity.mode === "ceiling") return "ceilingGrab";
          if (entity.mode === "vehicle") return "drive";

          /* Airborne */
          if (entity.jumpZ > 2 || entity.airborne) {
            return (entity.jumpVz >= 0 || entity.vy < 0) ? "jump" : "fall";
          }

          /* Carrying */
          if (entity.carryItem) {
            const speed = Math.sqrt((entity.vx || 0) ** 2 + (entity.vy || 0) ** 2);
            return speed > 80 ? "carryRun" : speed > 8 ? "carryWalk" : "idle";
          }

          /* Running / walking / idle */
          const speed = Math.sqrt((entity.vx || 0) ** 2 + (entity.vy || 0) ** 2);
          if (speed > 120) return "run";
          if (speed > 18) return "walk";
          return "idle";
        },

        /**
         * Auto-sync: infer state from entity properties and sync animator.
         * Simplest approach — call this once per frame per entity.
         */
        autoSync(entity, dt, options = {}) {
          const state = this.inferState(entity);
          this.sync(entity, state, dt, options);
          return state;
        },

        /** Add a custom state mapping at runtime */
        addMapping(gameState, shimejAction) {
          stateMap[gameState] = shimejAction;
        },

        /** Add multiple mappings at once */
        addMappings(mappings) {
          for (const [state, action] of Object.entries(mappings)) {
            stateMap[state] = action;
          }
        },

        /** Set speed for a state */
        setSpeed(gameState, scale) {
          speedMap[gameState] = scale;
        },

        /** Get all available mappings */
        getMappings() {
          return { ...stateMap };
        },

        /** Get list of all shimeji actions referenced by the current mappings */
        getUsedActions() {
          return [...new Set(Object.values(stateMap))];
        },
      };
    }
  };

  DR.AnimationBridge = AnimationBridge;
})();
