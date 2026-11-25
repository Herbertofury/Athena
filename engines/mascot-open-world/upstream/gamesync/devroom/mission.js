/* ═══════════════════════════════════════════════════════════════════════════
   Dev Room — Mission
   Objectives, waypoints, phases, rewards, tracking.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const DR = window.__gsDevRoom = window.__gsDevRoom || {};
  if (DR.Mission) return;

  const DEFAULTS = Object.freeze({
    /* Max active missions at once */
    maxActive: 3,
    /* Waypoint approach radius (px) */
    waypointRadius: 40,
    /* Whether to auto-advance phases on completion */
    autoAdvance: true,
    /* Show waypoint markers on HUD */
    showMarkers: true,
    /* Marker pulse speed */
    markerPulseSpeed: 2.6,
  });

  /** Mission status enum */
  const STATUS = Object.freeze({
    LOCKED:     "locked",
    AVAILABLE:  "available",
    ACTIVE:     "active",
    COMPLETED:  "completed",
    FAILED:     "failed",
  });

  /** Objective types */
  const OBJECTIVE_TYPES = Object.freeze({
    REACH:      "reach",      // reach a location
    KILL:       "kill",       // defeat N enemies
    COLLECT:    "collect",    // collect N items
    DELIVER:    "deliver",    // deliver item to location
    SURVIVE:    "survive",    // survive N seconds
    INTERACT:   "interact",   // interact with object
    ESCORT:     "escort",     // escort NPC to location
    CUSTOM:     "custom",     // game-specific
  });

  const Mission = {
    DEFAULTS,
    STATUS,
    OBJECTIVE_TYPES,

    create(userConfig = {}) {
      const cfg = { ...DEFAULTS, ...userConfig };
      const missions = new Map(); // id → mission
      let activeMissions = [];

      return {
        config: cfg,

        /**
         * Define a mission.
         * @param {Object} def
         *   id, title, description, phases: [{ objectives: [...], message }],
         *   rewards: { cash, xp, items }, prerequisites: [missionId...],
         *   onStart, onComplete, onFail
         */
        define(def) {
          const mission = {
            id: def.id,
            title: def.title || "",
            description: def.description || "",
            phases: (def.phases || []).map((p, i) => ({
              index: i,
              message: p.message || "",
              objectives: (p.objectives || []).map((obj, j) => ({
                id: obj.id || `${def.id}_p${i}_o${j}`,
                type: obj.type || OBJECTIVE_TYPES.CUSTOM,
                description: obj.description || "",
                target: obj.target || null,     // location {x,y}, npc id, item id, etc.
                count: obj.count || 1,
                progress: 0,
                completed: false,
                ...obj,
              })),
              completed: false,
            })),
            rewards: def.rewards || {},
            prerequisites: def.prerequisites || [],
            status: STATUS.LOCKED,
            currentPhase: 0,
            startedAt: 0,
            completedAt: 0,
            onStart: def.onStart || null,
            onComplete: def.onComplete || null,
            onFail: def.onFail || null,
            ...def,
          };
          missions.set(mission.id, mission);
          return mission;
        },

        /** Get a mission by ID */
        get(id) { return missions.get(id) || null; },

        /** Get all missions */
        getAll() { return [...missions.values()]; },

        /** Get active missions */
        getActive() { return activeMissions; },

        /** Check if a mission's prerequisites are met */
        isUnlocked(id) {
          const m = missions.get(id);
          if (!m) return false;
          return m.prerequisites.every(pid => {
            const prereq = missions.get(pid);
            return prereq && prereq.status === STATUS.COMPLETED;
          });
        },

        /** Update mission availability based on prerequisites */
        refreshAvailability() {
          for (const m of missions.values()) {
            if (m.status === STATUS.LOCKED && this.isUnlocked(m.id)) {
              m.status = STATUS.AVAILABLE;
            }
          }
        },

        /** Start a mission */
        start(id) {
          const m = missions.get(id);
          if (!m) return false;
          if (m.status !== STATUS.AVAILABLE) return false;
          if (activeMissions.length >= cfg.maxActive) return false;

          m.status = STATUS.ACTIVE;
          m.currentPhase = 0;
          m.startedAt = performance.now() / 1000;

          /* Reset all objectives */
          for (const phase of m.phases) {
            phase.completed = false;
            for (const obj of phase.objectives) {
              obj.progress = 0;
              obj.completed = false;
            }
          }

          activeMissions.push(m);
          if (m.onStart) m.onStart(m);
          return true;
        },

        /**
         * Report progress on an objective.
         * @param {string} missionId
         * @param {string} objectiveId
         * @param {number} amount — progress to add (default 1)
         */
        reportProgress(missionId, objectiveId, amount = 1) {
          const m = missions.get(missionId);
          if (!m || m.status !== STATUS.ACTIVE) return false;

          const phase = m.phases[m.currentPhase];
          if (!phase) return false;

          const obj = phase.objectives.find(o => o.id === objectiveId);
          if (!obj || obj.completed) return false;

          obj.progress = Math.min(obj.count, obj.progress + amount);
          if (obj.progress >= obj.count) {
            obj.completed = true;
          }

          /* Check phase completion */
          if (phase.objectives.every(o => o.completed)) {
            phase.completed = true;
            if (cfg.autoAdvance) {
              this.advancePhase(missionId);
            }
          }

          return true;
        },

        /**
         * Check if a "reach" objective is fulfilled by player position.
         * @param {string} missionId
         * @param {number} px — player x
         * @param {number} py — player y
         */
        checkReachObjectives(missionId, px, py) {
          const m = missions.get(missionId);
          if (!m || m.status !== STATUS.ACTIVE) return;

          const phase = m.phases[m.currentPhase];
          if (!phase) return;

          for (const obj of phase.objectives) {
            if (obj.completed || obj.type !== OBJECTIVE_TYPES.REACH) continue;
            if (!obj.target) continue;
            const dx = px - obj.target.x, dy = py - obj.target.y;
            const radius = obj.target.radius ?? cfg.waypointRadius;
            if (dx * dx + dy * dy < radius * radius) {
              this.reportProgress(missionId, obj.id, 1);
            }
          }
        },

        /** Advance to next phase of a mission */
        advancePhase(missionId) {
          const m = missions.get(missionId);
          if (!m || m.status !== STATUS.ACTIVE) return;

          m.currentPhase++;
          if (m.currentPhase >= m.phases.length) {
            this.complete(missionId);
          }
        },

        /** Complete a mission */
        complete(missionId) {
          const m = missions.get(missionId);
          if (!m || m.status !== STATUS.ACTIVE) return null;

          m.status = STATUS.COMPLETED;
          m.completedAt = performance.now() / 1000;
          activeMissions = activeMissions.filter(am => am.id !== missionId);

          if (m.onComplete) m.onComplete(m);
          this.refreshAvailability();
          return m.rewards;
        },

        /** Fail a mission */
        fail(missionId) {
          const m = missions.get(missionId);
          if (!m || m.status !== STATUS.ACTIVE) return;

          m.status = STATUS.FAILED;
          activeMissions = activeMissions.filter(am => am.id !== missionId);
          if (m.onFail) m.onFail(m);
        },

        /** Restart a failed/completed mission (set back to available) */
        restart(missionId) {
          const m = missions.get(missionId);
          if (!m) return;
          if (m.status === STATUS.COMPLETED || m.status === STATUS.FAILED) {
            m.status = STATUS.AVAILABLE;
          }
        },

        /** Get current phase message for display */
        getMessage(missionId) {
          const m = missions.get(missionId);
          if (!m || m.status !== STATUS.ACTIVE) return "";
          const phase = m.phases[m.currentPhase];
          return phase?.message || "";
        },

        /** Get waypoints for active missions (for HUD markers) */
        getWaypoints() {
          if (!cfg.showMarkers) return [];
          const waypoints = [];
          for (const m of activeMissions) {
            const phase = m.phases[m.currentPhase];
            if (!phase) continue;
            for (const obj of phase.objectives) {
              if (obj.completed || !obj.target) continue;
              if (obj.type === OBJECTIVE_TYPES.REACH || obj.type === OBJECTIVE_TYPES.DELIVER) {
                waypoints.push({
                  missionId: m.id,
                  objectiveId: obj.id,
                  x: obj.target.x,
                  y: obj.target.y,
                  label: obj.description || m.title,
                  color: obj.markerColor || "#e94560",
                });
              }
            }
          }
          return waypoints;
        },

        /** Save mission state (for game saves) */
        serialize() {
          const data = {};
          for (const [id, m] of missions) {
            data[id] = {
              status: m.status,
              currentPhase: m.currentPhase,
              phases: m.phases.map(p => ({
                completed: p.completed,
                objectives: p.objectives.map(o => ({
                  id: o.id,
                  progress: o.progress,
                  completed: o.completed,
                }))
              })),
            };
          }
          return data;
        },

        /** Load mission state from save data */
        deserialize(data) {
          if (!data) return;
          activeMissions = [];
          for (const [id, saved] of Object.entries(data)) {
            const m = missions.get(id);
            if (!m) continue;
            m.status = saved.status || STATUS.LOCKED;
            m.currentPhase = saved.currentPhase || 0;
            if (saved.phases) {
              for (let i = 0; i < saved.phases.length && i < m.phases.length; i++) {
                m.phases[i].completed = saved.phases[i].completed;
                for (let j = 0; j < (saved.phases[i].objectives || []).length && j < m.phases[i].objectives.length; j++) {
                  m.phases[i].objectives[j].progress = saved.phases[i].objectives[j].progress;
                  m.phases[i].objectives[j].completed = saved.phases[i].objectives[j].completed;
                }
              }
            }
            if (m.status === STATUS.ACTIVE) activeMissions.push(m);
          }
        },
      };
    }
  };

  DR.Mission = Mission;
})();
