# Mascot Games — Dev Room

**Read-only shared game framework.**  
A template library of reusable game systems that any mascot game can copy from and customize per-game — non-destructively.

## Philosophy

The Dev Room is **not** an extracted package or build dependency.  
It's a **reference implementation** and **testing ground** for core game mechanics.

- **Read-only by convention** — games import from here, never modify it directly.
- **Non-destructive** — each game creates its own instance with per-game config overrides.
- **Additive-only** — improvements to the Dev Room are available to all games, but no game is forced to adopt them.
- **Copy-friendly** — if a game needs wildly different behavior, copy the module into the game's own scope and diverge freely.

## How Games Use the Dev Room

```javascript
// 1. Access the dev room namespace
const DR = window.__gsDevRoom;

// 2. Create per-game instances with custom config
const physics = DR.Physics.create({
  gravity: 1200,       // Override default 900
  jumpVelocity: -450,  // Override default -380
  friction: 0.90       // Override default 0.85
});

const camera = DR.Camera.create({
  width: 960, height: 540,
  smoothing: 5,
  deadZone: { x: 40, y: 30 }
});

const movement = DR.Movement.create({
  modes: ['ground', 'wall', 'ceiling', 'vehicle'],
  walkSpeed: 180,
  sprintMultiplier: 1.65,
  wallClimbSpeed: 100
});

// 3. Use in your game loop
function update(dt) {
  physics.applyGravity(player, dt);
  movement.update(player, input, dt);
  camera.follow(player, dt);
}
```

## Module Inventory

| Module | File | Purpose |
|--------|------|---------|
| **Physics** | `physics.js` | Gravity, friction, knockback, projectile motion |
| **Movement** | `movement.js` | Ground/wall/ceiling/vehicle character movement |
| **Camera** | `camera.js` | 2D follow camera with smoothing, shake, zoom |
| **Combat** | `combat.js` | Health, damage, weapons, knockback, invulnerability |
| **AI** | `ai.js` | State machine AI with configurable behavior trees |
| **World** | `world.js` | Buildings, interiors, districts, zones, collision |
| **AnimationBridge** | `animation-bridge.js` | Maps shimeji actions to game states generically |
| **Weather** | `weather.js` | Day/night cycle, rain, wind, lightning |
| **Vehicle** | `vehicle.js` | Vehicle physics, steering, acceleration |
| **Dialog** | `dialog.js` | NPC dialog, conversation trees, speech bubbles |
| **Mission** | `mission.js` | Objectives, waypoints, phases, rewards |
| **Presets** | `presets.js` | Pre-built config bundles (platformer, topdown, racing, etc.) |

## Per-Game Config Override Pattern

Every module uses the same pattern:

```javascript
const Module = {
  DEFAULTS: { /* sane defaults derived from existing games */ },
  create(userConfig = {}) {
    const cfg = { ...Module.DEFAULTS, ...userConfig };
    // Return instance methods that use cfg
    return { config: cfg, /* methods */ };
  }
};
```

Games never touch `DEFAULTS`. They pass their own overrides to `create()`.

## Adding New Systems

1. Create a new file in `devroom/` following the factory pattern above.
2. Register it in `index.js`.
3. Existing games are unaffected — they opt-in by creating instances.

## Testing

The Dev Room includes a test harness (`devroom-lab.html`) for testing systems in isolation before wiring them into actual games.
