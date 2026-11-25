/* ═══════════════════════════════════════════════════════════════════════════
   Dev Room — Presets
   Pre-built config bundles for common game archetypes.
   Games can spread a preset then override individual values.
   Usage: const cfg = { ...DR.Presets.OPENWORLD, gravity: 1200 };
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const DR = window.__gsDevRoom = window.__gsDevRoom || {};
  if (DR.Presets) return;

  /* ── Genre presets ────────────────────────────────────────────────────── */

  /** Top-down open-world (GTA-style) */
  const OPENWORLD = Object.freeze({
    /* physics */
    gravity: 900,
    friction: 0.85,
    airFriction: 0.98,
    maxFallSpeed: 800,
    jumpVelocity: -380,
    /* movement */
    walkSpeed: 180,
    sprintMultiplier: 1.65,
    acceleration: 1200,
    staminaMax: 100,
    staminaDrain: 18,
    staminaRegen: 12,
    /* camera */
    cameraSmoothing: 5,
    cameraZoomMin: 0.5,
    cameraZoomMax: 3.0,
    cameraDeadZoneX: 20,
    cameraDeadZoneY: 15,
    /* combat */
    maxHp: 100,
    invulnDuration: 0.5,
    comboWindow: 1.5,
    knockbackBase: 180,
    knockbackDamageScale: 4.5,
    /* world */
    worldWidth: 3200,
    worldHeight: 2200,
    /* weather */
    dayNightCycleDuration: 300,
    rainMaxDrops: 200,
    /* vehicle */
    vehicleMaxSpeed: 360,
    vehicleAcceleration: 220,
    vehicleTurnSpeed: 2.9,
    /* AI */
    aiThinkInterval: 0.3,
    aiDetectionRange: 300,
    aiAttackRange: 60,
    /* missions */
    maxActiveMissions: 3,
    waypointRadius: 40,
  });

  /** Side-scrolling platformer */
  const PLATFORMER = Object.freeze({
    gravity: 1400,
    friction: 0.88,
    airFriction: 0.995,
    maxFallSpeed: 1000,
    jumpVelocity: -520,
    walkSpeed: 220,
    sprintMultiplier: 1.4,
    acceleration: 1600,
    staminaMax: 0, // no stamina for platformers
    staminaDrain: 0,
    staminaRegen: 0,
    cameraSmoothing: 8,
    cameraZoomMin: 1.0,
    cameraZoomMax: 1.0,
    cameraDeadZoneX: 40,
    cameraDeadZoneY: 30,
    maxHp: 3, // hearts-style
    invulnDuration: 1.0,
    comboWindow: 0,
    knockbackBase: 250,
    knockbackDamageScale: 0,
    worldWidth: 6400,
    worldHeight: 1200,
    dayNightCycleDuration: 0, // no day/night
    rainMaxDrops: 0,
    vehicleMaxSpeed: 0,
    vehicleAcceleration: 0,
    vehicleTurnSpeed: 0,
    aiThinkInterval: 0.2,
    aiDetectionRange: 200,
    aiAttackRange: 40,
    maxActiveMissions: 1,
    waypointRadius: 30,
  });

  /** Top-down arena / smash / brawler */
  const BRAWLER = Object.freeze({
    gravity: 800,
    friction: 0.80,
    airFriction: 0.96,
    maxFallSpeed: 600,
    jumpVelocity: -320,
    walkSpeed: 200,
    sprintMultiplier: 1.8,
    acceleration: 2000,
    staminaMax: 60,
    staminaDrain: 25,
    staminaRegen: 20,
    cameraSmoothing: 10,
    cameraZoomMin: 0.8,
    cameraZoomMax: 2.0,
    cameraDeadZoneX: 10,
    cameraDeadZoneY: 10,
    maxHp: 200,
    invulnDuration: 0.3,
    comboWindow: 0.8,
    knockbackBase: 300,
    knockbackDamageScale: 8,
    worldWidth: 800,
    worldHeight: 600,
    dayNightCycleDuration: 0,
    rainMaxDrops: 0,
    vehicleMaxSpeed: 0,
    vehicleAcceleration: 0,
    vehicleTurnSpeed: 0,
    aiThinkInterval: 0.15,
    aiDetectionRange: 400,
    aiAttackRange: 80,
    maxActiveMissions: 0,
    waypointRadius: 0,
  });

  /** Racing */
  const RACING = Object.freeze({
    gravity: 0,
    friction: 0.92,
    airFriction: 1.0,
    maxFallSpeed: 0,
    jumpVelocity: 0,
    walkSpeed: 0,
    sprintMultiplier: 1,
    acceleration: 0,
    staminaMax: 0,
    staminaDrain: 0,
    staminaRegen: 0,
    cameraSmoothing: 6,
    cameraZoomMin: 0.6,
    cameraZoomMax: 1.8,
    cameraDeadZoneX: 0,
    cameraDeadZoneY: 0,
    maxHp: 100, // car health
    invulnDuration: 0.2,
    comboWindow: 0,
    knockbackBase: 0,
    knockbackDamageScale: 0,
    worldWidth: 4000,
    worldHeight: 4000,
    dayNightCycleDuration: 600,
    rainMaxDrops: 300,
    vehicleMaxSpeed: 420,
    vehicleAcceleration: 300,
    vehicleTurnSpeed: 3.0,
    aiThinkInterval: 0.1,
    aiDetectionRange: 600,
    aiAttackRange: 0,
    maxActiveMissions: 1,
    waypointRadius: 60,
  });

  /** Survivors / horde mode */
  const SURVIVORS = Object.freeze({
    gravity: 0, // top-down, no gravity
    friction: 0.90,
    airFriction: 1.0,
    maxFallSpeed: 0,
    jumpVelocity: 0,
    walkSpeed: 140,
    sprintMultiplier: 1.3,
    acceleration: 1000,
    staminaMax: 80,
    staminaDrain: 15,
    staminaRegen: 10,
    cameraSmoothing: 4,
    cameraZoomMin: 0.5,
    cameraZoomMax: 2.5,
    cameraDeadZoneX: 30,
    cameraDeadZoneY: 30,
    maxHp: 100,
    invulnDuration: 0.3,
    comboWindow: 0,
    knockbackBase: 120,
    knockbackDamageScale: 3,
    worldWidth: 2400,
    worldHeight: 2400,
    dayNightCycleDuration: 180,
    rainMaxDrops: 100,
    vehicleMaxSpeed: 0,
    vehicleAcceleration: 0,
    vehicleTurnSpeed: 0,
    aiThinkInterval: 0.25,
    aiDetectionRange: 350,
    aiAttackRange: 30,
    maxActiveMissions: 1,
    waypointRadius: 0,
  });

  /** Sports / tennis / fishing */
  const SPORTS = Object.freeze({
    gravity: 980,
    friction: 0.92,
    airFriction: 0.99,
    maxFallSpeed: 600,
    jumpVelocity: -300,
    walkSpeed: 160,
    sprintMultiplier: 1.5,
    acceleration: 1400,
    staminaMax: 120,
    staminaDrain: 10,
    staminaRegen: 15,
    cameraSmoothing: 8,
    cameraZoomMin: 1.0,
    cameraZoomMax: 1.5,
    cameraDeadZoneX: 0,
    cameraDeadZoneY: 0,
    maxHp: 0, // no HP in sports
    invulnDuration: 0,
    comboWindow: 0,
    knockbackBase: 0,
    knockbackDamageScale: 0,
    worldWidth: 800,
    worldHeight: 600,
    dayNightCycleDuration: 0,
    rainMaxDrops: 0,
    vehicleMaxSpeed: 0,
    vehicleAcceleration: 0,
    vehicleTurnSpeed: 0,
    aiThinkInterval: 0.1,
    aiDetectionRange: 600,
    aiAttackRange: 0,
    maxActiveMissions: 0,
    waypointRadius: 0,
  });

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  /**
   * Merge a preset with per-game overrides.
   * @param {Object} preset — one of the preset objects above
   * @param {Object} overrides — game-specific values
   * @returns {Object} merged config (new object, preset untouched)
   */
  function merge(preset, overrides = {}) {
    return { ...preset, ...overrides };
  }

  /**
   * Apply a preset to multiple dev room modules at once.
   * Returns an object with ready-to-use instances:
   *   { physics, movement, camera, combat, ai, mission, weather, vehicle }
   *
   * @param {Object} preset — one of the preset objects above
   * @param {Object} overrides — per-key overrides
   * @param {Object} modules — which modules to instantiate (default: all available)
   * @returns {Object} map of module name → instance
   */
  function instantiate(preset, overrides = {}, modules = {}) {
    const cfg = merge(preset, overrides);
    const out = {};

    if (DR.Physics && modules.physics !== false) {
      out.physics = DR.Physics.create({
        gravity: cfg.gravity,
        friction: cfg.friction,
        airFriction: cfg.airFriction,
        maxFallSpeed: cfg.maxFallSpeed,
        jumpVelocity: cfg.jumpVelocity,
        knockbackBase: cfg.knockbackBase,
        knockbackDamageScale: cfg.knockbackDamageScale,
      });
    }

    if (DR.Movement && modules.movement !== false) {
      out.movement = DR.Movement.create({
        walkSpeed: cfg.walkSpeed,
        sprintMultiplier: cfg.sprintMultiplier,
        acceleration: cfg.acceleration,
        staminaMax: cfg.staminaMax,
        staminaDrain: cfg.staminaDrain,
        staminaRegen: cfg.staminaRegen,
      });
    }

    if (DR.Camera && modules.camera !== false) {
      out.camera = DR.Camera.create({
        smoothing: cfg.cameraSmoothing,
        zoomMin: cfg.cameraZoomMin,
        zoomMax: cfg.cameraZoomMax,
        deadZoneX: cfg.cameraDeadZoneX,
        deadZoneY: cfg.cameraDeadZoneY,
        worldWidth: cfg.worldWidth,
        worldHeight: cfg.worldHeight,
      });
    }

    if (DR.Combat && modules.combat !== false) {
      out.combat = DR.Combat.create({
        maxHp: cfg.maxHp,
        invulnDuration: cfg.invulnDuration,
        comboWindow: cfg.comboWindow,
      });
    }

    if (DR.AI && modules.ai !== false) {
      out.ai = DR.AI.create({
        thinkInterval: cfg.aiThinkInterval,
        detectionRange: cfg.aiDetectionRange,
        attackRange: cfg.aiAttackRange,
      });
    }

    if (DR.Mission && modules.mission !== false) {
      out.mission = DR.Mission.create({
        maxActive: cfg.maxActiveMissions,
        waypointRadius: cfg.waypointRadius,
      });
    }

    if (DR.Weather && modules.weather !== false) {
      out.weather = DR.Weather.create({
        dayNightCycleDuration: cfg.dayNightCycleDuration,
        rainMaxDrops: cfg.rainMaxDrops,
      });
    }

    if (DR.Vehicle && modules.vehicle !== false) {
      out.vehicle = DR.Vehicle.create({
        maxSpeed: cfg.vehicleMaxSpeed,
        acceleration: cfg.vehicleAcceleration,
        turnSpeed: cfg.vehicleTurnSpeed,
      });
    }

    return out;
  }

  /* ── Export ────────────────────────────────────────────────────────────── */
  DR.Presets = {
    OPENWORLD,
    PLATFORMER,
    BRAWLER,
    RACING,
    SURVIVORS,
    SPORTS,
    merge,
    instantiate,
  };
})();
