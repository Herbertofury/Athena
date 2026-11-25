/* ═══════════════════════════════════════════════════════════════════════════
   GameSync Mascot Games — Mascot Survivors
   Vampire Survivors-style auto-attacking roguelike. WASD to move, weapons
   fire automatically. Kill enemies for XP gems, level up to choose upgrades.
   Survive 5 minutes to win.
   dt-based physics, no FPS caps, native refresh rate.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.__gsMascotGameSurvivors) return;
  const C = () => window.__gsMascotGameCore;

  const W = 640, H = 400;
  const SURVIVE_TIME = 300; // 5 minutes

  /* ── Weapon templates ────────────────────────────────────────────────── */
  const WEAPONS = {
    orb:      { name: "Magic Orb",     color: "#a855f7", dmg: 8,  rate: 0.8,  range: 120, projSpeed: 250, projSize: 5 },
    whip:     { name: "Whip",          color: "#f5a623", dmg: 12, rate: 1.2,  range: 80,  area: true },
    bible:    { name: "Bible",         color: "#ffd700", dmg: 6,  rate: 0.1,  range: 60,  orbit: true, orbitR: 55, count: 2 },
    lightning:{ name: "Lightning",     color: "#06b6d4", dmg: 20, rate: 2.0,  range: 150, instant: true },
    fire:     { name: "Fire Nova",     color: "#ef4444", dmg: 15, rate: 3.0,  range: 100, nova: true },
    knife:    { name: "Throwing Knife",color: "#94a3b8", dmg: 5,  rate: 0.4,  range: 200, projSpeed: 350, projSize: 3, pierce: 2 },
  };

  /* ── Upgrade choices ─────────────────────────────────────────────────── */
  const UPGRADES = [
    { id: "hp",      name: "+20 Max HP",      icon: "❤️",  apply: (p) => { p.maxHp += 20; p.hp = Math.min(p.hp + 20, p.maxHp); } },
    { id: "speed",   name: "+15% Speed",       icon: "💨",  apply: (p) => { p.speed *= 1.15; } },
    { id: "dmg",     name: "+25% Damage",       icon: "⚔️",  apply: (p) => { p.dmgMult *= 1.25; } },
    { id: "area",    name: "+20% Area",         icon: "🔮",  apply: (p) => { p.areaMult *= 1.2; } },
    { id: "magnet",  name: "+30% Pickup Range", icon: "🧲",  apply: (p) => { p.magnetRange *= 1.3; } },
    { id: "regen",   name: "HP Regen +1/s",     icon: "💚",  apply: (p) => { p.regen += 1; } },
  ];

  /* ── Enemy templates ─────────────────────────────────────────────────── */
  const ENEMY_TYPES = [
    { name: "Slime",   color: "#22c55e", hp: 15,  speed: 50,  size: 10, dmg: 5,  xp: 1 },
    { name: "Bat",     color: "#8b5cf6", hp: 10,  speed: 90,  size: 8,  dmg: 4,  xp: 1 },
    { name: "Zombie",  color: "#6b7280", hp: 30,  speed: 35,  size: 12, dmg: 8,  xp: 2 },
    { name: "Wraith",  color: "#d946ef", hp: 20,  speed: 70,  size: 11, dmg: 6,  xp: 2 },
    { name: "Golem",   color: "#92400e", hp: 80,  speed: 25,  size: 18, dmg: 15, xp: 5 },
    { name: "Dragon",  color: "#dc2626", hp: 150, speed: 40,  size: 22, dmg: 20, xp: 10 },
  ];

  function createSurvivorsGame(container) {
    const core = C();
    const { clamp, lerp, rand, randInt, pick, TAU, Draw, Collision } = core;
    const { cvs, ctx, presentation } = core.createCanvas(container, W, H, { bg: "#0a0a14", gameId: "survivors" });
    const input = core.createInput(cvs);
    const particles = core.createParticleSystem(600);

    // Camera
    let camX = 0, camY = 0;

    // Player
    const player = {
      x: 0, y: 0, vx: 0, vy: 0,
      hp: 100, maxHp: 100,
      speed: 130,
      dmgMult: 1,
      areaMult: 1,
      magnetRange: 50,
      regen: 0,
      xp: 0, level: 1, xpToNext: 10,
      dir: 1,
      weapons: [{ ...WEAPONS.orb, timer: 0 }],
      invincible: 0,
      alive: true,
      dashCooldown: 0,
      dashTimer: 0,
    };

    let enemies = [];
    let projectiles = [];
    let gems = [];
    let damageNumbers = [];
    let bibles = []; // orbiting items
    let gameTime = 0;
    let kills = 0;
    let spawnTimer = 0;
    let spawnRate = 2.0; // seconds between spawns
    let gameOver = false;
    let won = false;
    let levelUpChoices = null;
    let levelUpPaused = false;

    // Ground tiles
    const TILE = 40;

    const backBtn = core.createButton(5, 5, 55, 22, "Back", { color: "rgba(80,80,100,0.5)", fontSize: 10 });

    function spawnEnemy() {
      const difficulty = Math.min(gameTime / SURVIVE_TIME, 1);
      const maxTier = Math.min(Math.floor(difficulty * ENEMY_TYPES.length) + 1, ENEMY_TYPES.length);
      const template = ENEMY_TYPES[randInt(0, maxTier - 1)];

      // Spawn off-screen
      const angle = rand(0, TAU);
      const dist = 350 + rand(0, 100);
      const hpScale = 1 + difficulty * 2;
      enemies.push({
        x: player.x + Math.cos(angle) * dist,
        y: player.y + Math.sin(angle) * dist,
        hp: template.hp * hpScale,
        maxHp: template.hp * hpScale,
        speed: template.speed * (1 + difficulty * 0.5),
        size: template.size,
        color: template.color,
        dmg: template.dmg * (1 + difficulty),
        xp: template.xp,
        hitFlash: 0,
      });
    }

    function spawnGem(x, y, xp) {
      gems.push({ x, y, xp, size: 4 + xp, life: 15, magnetized: false });
    }

    function showDmg(x, y, val, color) {
      damageNumbers.push({ x, y, val: Math.floor(val), color: color || "#fff", life: 0.8 });
    }

    function tryLevelUp() {
      player.level++;
      player.xp -= player.xpToNext;
      player.xpToNext = Math.floor(player.xpToNext * 1.5);

      // Pick 3 random upgrades
      const pool = [...UPGRADES];
      // Maybe offer a new weapon
      const ownedIds = new Set(player.weapons.map(w => w.name));
      const available = Object.values(WEAPONS).filter(w => !ownedIds.has(w.name));
      if (available.length > 0 && Math.random() < 0.4) {
        const w = pick(available);
        pool.push({ id: "weapon_" + w.name, name: "New: " + w.name, icon: "🗡️", weapon: w });
      }

      const shuffled = pool.sort(() => Math.random() - 0.5);
      levelUpChoices = shuffled.slice(0, 3);
      levelUpPaused = true;
      core.Audio.play("collect");
    }

    /* ── Weapon firing ─────────────────────────────────────────────────── */
    function fireWeapons(dt) {
      for (const w of player.weapons) {
        w.timer -= dt;
        if (w.timer > 0) continue;
        w.timer = w.rate;

        if (w.projSpeed) {
          // Projectile weapon - aim at nearest enemy
          let nearest = null, nd = Infinity;
          for (const e of enemies) {
            const d = Math.hypot(e.x - player.x, e.y - player.y);
            if (d < nd && d < w.range * player.areaMult * 2) { nd = d; nearest = e; }
          }
          if (nearest) {
            const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
            projectiles.push({
              x: player.x, y: player.y,
              vx: Math.cos(angle) * w.projSpeed,
              vy: Math.sin(angle) * w.projSpeed,
              dmg: w.dmg * player.dmgMult,
              size: w.projSize * player.areaMult,
              color: w.color,
              life: 2,
              pierce: w.pierce || 1,
              hit: new Set(),
            });
          }
        } else if (w.area) {
          // Whip - damage in arc
          const range = w.range * player.areaMult;
          for (const e of enemies) {
            const d = Math.hypot(e.x - player.x, e.y - player.y);
            if (d < range) {
              e.hp -= w.dmg * player.dmgMult;
              e.hitFlash = 0.1;
              showDmg(e.x, e.y - e.size, w.dmg * player.dmgMult, w.color);
              particles.emit(e.x, e.y, 3, { color: w.color, speedMin: 30, speedMax: 80, life: 0.3 });
            }
          }
          // whip visual flash
          particles.emit(player.x + player.dir * 30, player.y, 8, {
            color: w.color, speedMin: 20, speedMax: 60, spread: 0.5,
            angle: player.dir > 0 ? 0 : Math.PI, life: 0.2
          });
        } else if (w.instant) {
          // Lightning - hit random enemy in range
          const inRange = enemies.filter(e => Math.hypot(e.x - player.x, e.y - player.y) < w.range * player.areaMult);
          if (inRange.length > 0) {
            const target = pick(inRange);
            target.hp -= w.dmg * player.dmgMult;
            target.hitFlash = 0.15;
            showDmg(target.x, target.y - target.size, w.dmg * player.dmgMult, w.color);
            // Lightning bolt particles
            particles.emit(target.x, target.y, 10, { color: w.color, speedMin: 60, speedMax: 150, life: 0.2, size: 3 });
          }
        } else if (w.nova) {
          // Fire nova - hit all enemies in range
          const range = w.range * player.areaMult;
          for (const e of enemies) {
            if (Math.hypot(e.x - player.x, e.y - player.y) < range) {
              e.hp -= w.dmg * player.dmgMult;
              e.hitFlash = 0.12;
              showDmg(e.x, e.y - e.size, w.dmg * player.dmgMult, w.color);
            }
          }
          // nova ring
          for (let a = 0; a < TAU; a += 0.3) {
            particles.emit(player.x + Math.cos(a) * range * 0.8, player.y + Math.sin(a) * range * 0.8, 2, {
              color: w.color, speedMin: 10, speedMax: 30, life: 0.3, gravity: 0
            });
          }
        } else if (w.orbit) {
          // Bible - refresh orbiting objects
          bibles = [];
          const count = w.count || 2;
          for (let i = 0; i < count; i++) {
            bibles.push({ angle: (TAU / count) * i, r: w.orbitR * player.areaMult, dmg: w.dmg * player.dmgMult, color: w.color, size: 6 });
          }
        }
      }
    }

    /* ── Update ─────────────────────────────────────────────────────────── */
    function update(dt) {
      if (gameOver || levelUpPaused) {
        // Level up choice
        if (levelUpPaused && input.mouse.clicked) {
          const mx = input.mouse.x, my = input.mouse.y;
          if (levelUpChoices) {
            for (let i = 0; i < levelUpChoices.length; i++) {
              const bx = W / 2 - 90, by = H / 2 - 60 + i * 42, bw = 180, bh = 36;
              if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
                const choice = levelUpChoices[i];
                if (choice.weapon) {
                  player.weapons.push({ ...choice.weapon, timer: 0 });
                } else {
                  choice.apply(player);
                }
                levelUpChoices = null;
                levelUpPaused = false;
                core.Audio.play("collect");
                break;
              }
            }
          }
          input.clearClicked();
          return;
        }
        if (input.mouse.clicked) input.clearClicked();
        return;
      }

      gameTime += dt;

      // Win condition
      if (gameTime >= SURVIVE_TIME && !gameOver) {
        gameOver = true;
        won = true;
        return;
      }

      // Player movement
      let mx = 0, my = 0;
      if (input.keys["KeyW"] || input.keys["ArrowUp"]) my -= 1;
      if (input.keys["KeyS"] || input.keys["ArrowDown"]) my += 1;
      if (input.keys["KeyA"] || input.keys["ArrowLeft"]) { mx -= 1; player.dir = -1; }
      if (input.keys["KeyD"] || input.keys["ArrowRight"]) { mx += 1; player.dir = 1; }
      const mag = Math.sqrt(mx * mx + my * my) || 1;
      player.x += (mx / mag) * player.speed * dt;
      player.y += (my / mag) * player.speed * dt;
      player.dashCooldown = Math.max(0, player.dashCooldown - dt);
      player.dashTimer = Math.max(0, player.dashTimer - dt);
      if ((input.keys["ShiftLeft"] || input.keys["ShiftRight"]) && player.dashCooldown <= 0 && (mx || my)) {
        player.x += (mx / mag) * 86;
        player.y += (my / mag) * 86;
        player.invincible = Math.max(player.invincible, 0.16);
        player.dashCooldown = 0.9;
        player.dashTimer = 0.18;
        particles.emit(player.x, player.y, 22, { color: "#22d3ee", speedMin: 80, speedMax: 220, gravity: 0, life: 0.28, shape: "star" });
        core.Audio.play("jump");
        input.keys["ShiftLeft"] = false;
        input.keys["ShiftRight"] = false;
      }

      // Regen
      if (player.regen > 0) {
        player.hp = Math.min(player.hp + player.regen * dt, player.maxHp);
      }

      // Invincibility
      if (player.invincible > 0) player.invincible -= dt;

      // Camera
      camX = lerp(camX, player.x - W / 2, dt * 5);
      camY = lerp(camY, player.y - H / 2, dt * 5);

      // Spawn enemies
      spawnTimer -= dt;
      const difficulty = Math.min(gameTime / SURVIVE_TIME, 1);
      spawnRate = Math.max(0.3, 2.0 - difficulty * 1.5);
      if (spawnTimer <= 0) {
        spawnTimer = spawnRate;
        const count = 1 + Math.floor(difficulty * 4);
        for (let i = 0; i < count; i++) spawnEnemy();
      }

      // Fire weapons
      fireWeapons(dt);

      // Update projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) { projectiles.splice(i, 1); continue; }

        // Hit enemies
        for (const e of enemies) {
          if (p.hit.has(e)) continue;
          if (Math.hypot(p.x - e.x, p.y - e.y) < p.size + e.size) {
            e.hp -= p.dmg;
            e.hitFlash = 0.1;
            p.hit.add(e);
            p.pierce--;
            showDmg(e.x, e.y - e.size, p.dmg, p.color);
            particles.emit(e.x, e.y, 4, { color: p.color, speedMin: 30, speedMax: 80, life: 0.2 });
            if (p.pierce <= 0) { projectiles.splice(i, 1); break; }
          }
        }
      }

      // Update bibles (orbit)
      for (const b of bibles) {
        b.angle += dt * 3;
        const bx = player.x + Math.cos(b.angle) * b.r;
        const by = player.y + Math.sin(b.angle) * b.r;
        // Hit enemies
        for (const e of enemies) {
          if (Math.hypot(bx - e.x, by - e.y) < b.size + e.size) {
            e.hp -= b.dmg * dt * 3;
            if (Math.random() < dt * 5) {
              e.hitFlash = 0.05;
              showDmg(e.x, e.y - e.size, b.dmg, b.color);
            }
          }
        }
      }

      // Update enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.hitFlash > 0) e.hitFlash -= dt;

        // Move toward player
        const dx = player.x - e.x, dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        e.x += (dx / dist) * e.speed * dt;
        e.y += (dy / dist) * e.speed * dt;

        // Damage player on contact
        if (dist < e.size + 12 && player.invincible <= 0) {
          player.hp -= e.dmg * dt;
          player.invincible = 0.2;
          if (player.hp <= 0) {
            player.alive = false;
            gameOver = true;
            won = false;
          }
        }

        // Dead
        if (e.hp <= 0) {
          kills++;
          spawnGem(e.x, e.y, e.xp);
          particles.emit(e.x, e.y, 8, { color: e.color, speedMin: 40, speedMax: 120, life: 0.3, shape: "square" });
          enemies.splice(i, 1);
        }
      }

      // Update gems
      for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i];
        g.life -= dt;
        if (g.life <= 0) { gems.splice(i, 1); continue; }

        const dist = Math.hypot(g.x - player.x, g.y - player.y);
        if (dist < player.magnetRange) g.magnetized = true;
        if (g.magnetized) {
          const dx = player.x - g.x, dy = player.y - g.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          g.x += (dx / d) * 300 * dt;
          g.y += (dy / d) * 300 * dt;
        }
        if (dist < 15) {
          player.xp += g.xp;
          gems.splice(i, 1);
          if (player.xp >= player.xpToNext) tryLevelUp();
        }
      }

      // Update damage numbers
      for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const d = damageNumbers[i];
        d.y -= 40 * dt;
        d.life -= dt;
        if (d.life <= 0) damageNumbers.splice(i, 1);
      }

      // Click
      if (input.mouse.clicked) {
        if (backBtn.contains(input.mouse.x, input.mouse.y)) { /* hub handles */ }
        input.clearClicked();
      }

      particles.update(dt);
    }

    function projectWorldToFirstPerson(entity) {
      const dx = entity.x - player.x;
      const dy = entity.y - player.y;
      const distance = Math.hypot(dx, dy) || 1;
      const facing = player.dir >= 0 ? 0 : Math.PI;
      const relativeAngle = Math.atan2(dy, dx) - facing;
      const forward = Math.cos(relativeAngle) * distance;
      const lateral = Math.sin(relativeAngle) * distance;
      const depth = clamp(forward / 520, 0, 1);
      return {
        x: W * 0.5 + lateral * (0.62 - depth * 0.34),
        y: lerp(H * 0.78, H * 0.32, depth) - entity.size * (0.2 + depth * 0.8),
        scale: 1.28 - depth * 0.74,
        depth,
        forward,
        lateral,
        distance,
        angle: relativeAngle
      };
    }

    function drawFirstPersonWeapon() {
      const primary = player.weapons[0] || WEAPONS.orb;
      const dashPulse = clamp(player.dashTimer / 0.18, 0, 1);
      ctx.save();
      Draw.roundRect(ctx, W * 0.18 - dashPulse * 20, H * 0.84, 126, 34, 18, "#111827", "rgba(255,255,255,0.12)");
      Draw.roundRect(ctx, W * 0.61 + dashPulse * 20, H * 0.84, 126, 34, 18, "#111827", "rgba(255,255,255,0.12)");
      Draw.circle(ctx, W * 0.3 - dashPulse * 36, H * 0.78 - dashPulse * 20, 31, "#f0c8b6");
      Draw.circle(ctx, W * 0.7 + dashPulse * 36, H * 0.78 - dashPulse * 20, 31, "#f0c8b6");
      ctx.globalCompositeOperation = "screen";
      if (primary.orbit) {
        for (let i = 0; i < Math.max(2, bibles.length || 2); i++) {
          const a = gameTime * 3 + i * TAU / Math.max(2, bibles.length || 2);
          Draw.circle(ctx, W * 0.5 + Math.cos(a) * 64, H * 0.58 + Math.sin(a) * 28, 8, primary.color);
        }
      } else if (primary.area) {
        ctx.strokeStyle = primary.color;
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.36 + Math.sin(gameTime * 8) * 0.1;
        ctx.beginPath();
        ctx.arc(W * 0.5, H * 0.55, 94, -Math.PI * 0.8, Math.PI * 0.12);
        ctx.stroke();
      } else {
        const glow = ctx.createRadialGradient(W * 0.5, H * 0.6, 6, W * 0.5, H * 0.6, 110);
        glow.addColorStop(0, primary.color);
        glow.addColorStop(0.42, primary.color + "88");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 0.66;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(W * 0.5, H * 0.6, 110, 0, TAU);
        ctx.fill();
        Draw.circle(ctx, W * 0.5, H * 0.6, 16 + Math.sin(gameTime * 6) * 3, primary.color);
      }
      ctx.restore();
    }

    function renderFirstPerson() {
      cvs.dataset.gsFirstPersonScene = "survivors-weapon";
      ctx.clearRect(0, 0, W, H);
      core.drawFirstPersonBackdrop(ctx, W, H, { gameId: "survivors", accent: "#e94560", time: gameTime, skyTop: "#070712", skyBottom: "#231235", groundTint: "rgba(24,18,42,0.84)", speed: player.dashTimer > 0 ? 1.15 : 0.42 });

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = "rgba(168,85,247,0.2)";
      ctx.lineWidth = 1;
      for (let ring = 0; ring < 8; ring++) {
        const p = (ring + (gameTime * 0.6) % 1) / 8;
        const y = lerp(H * 0.82, H * 0.34, p);
        const w = lerp(W * 0.86, W * 0.16, p);
        ctx.globalAlpha = 0.12 + (1 - p) * 0.18;
        ctx.beginPath();
        ctx.ellipse(W * 0.5, y, w * 0.5, 18 + (1 - p) * 12, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();

      const projectedEnemies = enemies.map((enemy) => ({ enemy, view: projectWorldToFirstPerson(enemy) }))
        .filter((entry) => entry.view.forward > -80)
        .sort((a, b) => b.view.distance - a.view.distance);
      for (const { enemy, view } of projectedEnemies) {
        if (view.x < -80 || view.x > W + 80 || view.y < H * 0.18 || view.y > H + 70) continue;
        const scale = Math.max(0.24, view.scale);
        ctx.save();
        ctx.translate(view.x, view.y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = enemy.hitFlash > 0 ? 1 : clamp(1.05 - view.depth * 0.32, 0.48, 1);
        ctx.fillStyle = enemy.hitFlash > 0 ? "#fff" : enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size * 1.5, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = enemy.hitFlash > 0 ? enemy.color : "#050505";
        ctx.beginPath(); ctx.arc(-enemy.size * 0.38, -enemy.size * 0.28, 3, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(enemy.size * 0.38, -enemy.size * 0.28, 3, 0, TAU); ctx.fill();
        if (enemy.maxHp > 30) {
          Draw.roundRect(ctx, -enemy.size, -enemy.size * 2.2, enemy.size * 2, 4, 2, "rgba(0,0,0,0.6)");
          Draw.roundRect(ctx, -enemy.size, -enemy.size * 2.2, enemy.size * 2 * clamp(enemy.hp / enemy.maxHp, 0, 1), 4, 2, "#22c55e");
        }
        ctx.restore();
      }

      for (const p of projectiles) {
        const view = projectWorldToFirstPerson(p);
        if (view.forward < -40 || view.x < -40 || view.x > W + 40) continue;
        const size = p.size * Math.max(0.4, view.scale);
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        Draw.circle(ctx, view.x, view.y, size + 3, p.color);
        Draw.circle(ctx, view.x - 2, view.y - 2, size * 0.45, "#fff");
        ctx.restore();
      }

      for (const g of gems) {
        const view = projectWorldToFirstPerson({ ...g, size: g.size });
        if (view.forward < -30 || view.x < -40 || view.x > W + 40) continue;
        ctx.save();
        ctx.translate(view.x, view.y + 10);
        ctx.rotate(gameTime * 3 + g.x);
        ctx.globalAlpha = clamp(g.life, 0, 1) * 0.76;
        ctx.fillStyle = "#22d3ee";
        const size = g.size * Math.max(0.45, view.scale);
        ctx.fillRect(-size, -size, size * 2, size * 2);
        ctx.restore();
      }

      for (const enemy of enemies) {
        const view = projectWorldToFirstPerson(enemy);
        if (view.forward > 0 && Math.abs(view.x - W * 0.5) < W * 0.62 && view.y > H * 0.16 && view.y < H) continue;
        const edgeX = clamp(W * 0.5 + Math.sin(view.angle) * W * 0.47, 22, W - 22);
        const edgeY = clamp(H * 0.47 - Math.cos(view.angle) * H * 0.34, 62, H - 24);
        ctx.save();
        ctx.translate(edgeX, edgeY);
        ctx.rotate(view.angle);
        ctx.globalAlpha = 0.32 + Math.sin(gameTime * 7 + enemy.x) * 0.16;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(13, 0);
        ctx.lineTo(-8, -7);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-8, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      drawFirstPersonWeapon();
      particles.render(ctx);
      core.drawCinematicViewFX(ctx, W, H, { gameId: "survivors", accent: "#e94560", time: gameTime, intensity: 0.68 + Math.min(enemies.length, 24) * 0.015, speed: player.dashTimer > 0 ? 1.18 : Math.min(0.85, enemies.length * 0.025) });
      core.drawFirstPersonReticle(ctx, W, H, { accent: player.weapons[0]?.color || "#e94560", time: gameTime, y: H * 0.49, spread: player.dashTimer > 0 ? 18 : 6 });

      const hpW = 120, hpH = 10, hpX = 10, hpY = 32;
      Draw.roundRect(ctx, hpX, hpY, hpW, hpH, 4, "rgba(0,0,0,0.6)");
      const hpRatio = clamp(player.hp / player.maxHp, 0, 1);
      const hpColor = hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.25 ? "#f5a623" : "#ef4444";
      Draw.roundRect(ctx, hpX, hpY, hpW * hpRatio, hpH, 4, hpColor);
      Draw.text(ctx, Math.ceil(player.hp) + "/" + player.maxHp, hpX + hpW / 2, hpY + hpH / 2, { size: 8, color: "#fff" });
      const xpW = 120, xpH = 6, xpX = 10, xpY = 46;
      Draw.roundRect(ctx, xpX, xpY, xpW, xpH, 3, "rgba(0,0,0,0.5)");
      Draw.roundRect(ctx, xpX, xpY, xpW * clamp(player.xp / player.xpToNext, 0, 1), xpH, 3, "#a855f7");
      Draw.text(ctx, "Lv " + player.level, xpX + xpW / 2, xpY + xpH + 8, { size: 9, color: "#a855f7" });
      Draw.roundRect(ctx, xpX, xpY + 18, xpW, 4, 2, "rgba(0,0,0,0.5)");
      Draw.roundRect(ctx, xpX, xpY + 18, xpW * (1 - clamp(player.dashCooldown / 0.9, 0, 1)), 4, 2, "#22d3ee");
      const remaining = Math.max(0, SURVIVE_TIME - gameTime);
      Draw.text(ctx, Math.floor(remaining / 60) + ":" + String(Math.floor(remaining % 60)).padStart(2, "0"), W / 2, 16, { size: 16, color: "#fff", outline: true });
      Draw.text(ctx, "Kills: " + kills, W - 50, 16, { size: 11, color: "#ef4444", align: "right" });
      Draw.text(ctx, "Enemies: " + enemies.length, W - 50, 32, { size: 9, color: "#888", align: "right" });

      if (levelUpPaused && levelUpChoices) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, W, H);
        Draw.text(ctx, "LEVEL UP!", W / 2, H / 2 - 90, { size: 24, color: "#ffd700", outline: true });
        Draw.text(ctx, "Choose an upgrade:", W / 2, H / 2 - 68, { size: 12, color: "#ccc" });
        for (let i = 0; i < levelUpChoices.length; i++) {
          const c = levelUpChoices[i];
          const bx = W / 2 - 90, by = H / 2 - 60 + i * 42, bw = 180, bh = 36;
          const hovered = input.mouse.x >= bx && input.mouse.x <= bx + bw && input.mouse.y >= by && input.mouse.y <= by + bh;
          Draw.roundRect(ctx, bx, by, bw, bh, 6, hovered ? "rgba(233,69,96,0.8)" : "rgba(40,40,80,0.9)");
          Draw.text(ctx, c.icon + " " + c.name, bx + bw / 2, by + bh / 2, { size: 12, color: "#fff" });
        }
      }
      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, W, H);
        Draw.text(ctx, won ? "YOU SURVIVED!" : "GAME OVER", W / 2, H / 2 - 30, { size: 30, color: won ? "#ffd700" : "#e94560", outline: true, outlineWidth: 4 });
        Draw.text(ctx, "Kills: " + kills + " | Level: " + player.level + " | Time: " + Math.floor(gameTime) + "s", W / 2, H / 2 + 5, { size: 12, color: "#ccc" });
      }
      backBtn.render(ctx, input.mouse.x, input.mouse.y);
    }

    /* ── Render ─────────────────────────────────────────────────────────── */
    function render() {
      ctx.clearRect(0, 0, W, H);
      if (core.isFirstPersonView(ctx)) {
        renderFirstPerson();
        return;
      }
      delete cvs.dataset.gsFirstPersonScene;
      ctx.fillStyle = "#0a0a14";
      ctx.fillRect(0, 0, W, H);
      core.drawHybridStage(ctx, W, H, { gameId: "survivors", accent: "#e94560", time: gameTime });

      ctx.save();
      ctx.translate(-camX, -camY);

      // Ground grid
      const startTX = Math.floor(camX / TILE) * TILE;
      const startTY = Math.floor(camY / TILE) * TILE;
      ctx.strokeStyle = "rgba(30,30,60,0.5)";
      ctx.lineWidth = 0.5;
      for (let gx = startTX; gx < camX + W + TILE; gx += TILE) {
        ctx.beginPath(); ctx.moveTo(gx, camY); ctx.lineTo(gx, camY + H); ctx.stroke();
      }
      for (let gy = startTY; gy < camY + H + TILE; gy += TILE) {
        ctx.beginPath(); ctx.moveTo(camX, gy); ctx.lineTo(camX + W, gy); ctx.stroke();
      }

      // Gems
      for (const g of gems) {
        const gs = g.size * (0.7 + Math.sin(gameTime * 5 + g.x) * 0.3);
        ctx.fillStyle = "#22d3ee";
        ctx.globalAlpha = clamp(g.life, 0, 1);
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(gameTime * 3 + g.x);
        ctx.fillRect(-gs / 2, -gs / 2, gs, gs);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // Enemies
      for (const e of enemies) {
        const flash = e.hitFlash > 0;
        ctx.fillStyle = flash ? "#fff" : e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, TAU);
        ctx.fill();
        // Eyes
        ctx.fillStyle = flash ? e.color : "#000";
        ctx.beginPath(); ctx.arc(e.x - e.size * 0.25, e.y - e.size * 0.2, 2, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(e.x + e.size * 0.25, e.y - e.size * 0.2, 2, 0, TAU); ctx.fill();
        // HP bar (for big enemies)
        if (e.maxHp > 30) {
          const bw = e.size * 2;
          Draw.roundRect(ctx, e.x - bw / 2, e.y - e.size - 8, bw, 3, 1, "rgba(0,0,0,0.5)");
          Draw.roundRect(ctx, e.x - bw / 2, e.y - e.size - 8, bw * clamp(e.hp / e.maxHp, 0, 1), 3, 1, "#22c55e");
        }
      }

      // Projectiles
      for (const p of projectiles) {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Bibles
      for (const b of bibles) {
        const bx = player.x + Math.cos(b.angle) * b.r;
        const by = player.y + Math.sin(b.angle) * b.r;
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(b.angle * 2);
        ctx.fillRect(-b.size / 2, -b.size / 2, b.size, b.size);
        ctx.restore();
        ctx.shadowBlur = 0;
      }

      // Player
      if (player.alive) {
        if (player.invincible > 0 && Math.sin(player.invincible * 30) > 0) ctx.globalAlpha = 0.4;
        if (player.dashTimer > 0) {
          ctx.globalAlpha = 0.38;
          ctx.strokeStyle = "#22d3ee";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(player.x, player.y - 8, 34 + (0.18 - player.dashTimer) * 120, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        core.drawMascotSprite(ctx, player.x, player.y - 12, 28, "#e94560", player.dashTimer > 0 ? "happy" : "normal", player.dir);
        ctx.globalAlpha = 1;
      }

      // Damage numbers
      for (const d of damageNumbers) {
        ctx.globalAlpha = clamp(d.life * 2, 0, 1);
        Draw.text(ctx, String(d.val), d.x, d.y, { size: 11, color: d.color, outline: true, outlineWidth: 2 });
      }
      ctx.globalAlpha = 1;

      // Particles
      particles.render(ctx);

      ctx.restore();

      for (const enemy of enemies.slice(0, 8)) {
        const screenX = enemy.x - camX;
        const screenY = enemy.y - camY;
        if (screenX >= 12 && screenX <= W - 12 && screenY >= 12 && screenY <= H - 12) continue;
        const edgeX = clamp(screenX, 18, W - 18);
        const edgeY = clamp(screenY, 58, H - 22);
        const angle = Math.atan2(screenY - H / 2, screenX - W / 2);
        ctx.save();
        ctx.translate(edgeX, edgeY);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.45 + Math.sin(gameTime * 7 + enemy.x) * 0.18;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-7, -6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-7, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      core.drawCinematicViewFX(ctx, W, H, { gameId: "survivors", accent: "#e94560", time: gameTime, intensity: 0.45 + Math.min(enemies.length, 24) * 0.012, speed: player.dashTimer > 0 ? 1.1 : Math.min(0.8, enemies.length * 0.025) });

      // ── HUD (screen-space) ──
      // HP bar
      const hpW = 120, hpH = 10, hpX = 10, hpY = 32;
      Draw.roundRect(ctx, hpX, hpY, hpW, hpH, 4, "rgba(0,0,0,0.6)");
      const hpRatio = clamp(player.hp / player.maxHp, 0, 1);
      const hpColor = hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.25 ? "#f5a623" : "#ef4444";
      Draw.roundRect(ctx, hpX, hpY, hpW * hpRatio, hpH, 4, hpColor);
      Draw.text(ctx, Math.ceil(player.hp) + "/" + player.maxHp, hpX + hpW / 2, hpY + hpH / 2, { size: 8, color: "#fff" });

      // XP bar
      const xpW = 120, xpH = 6, xpX = 10, xpY = 46;
      Draw.roundRect(ctx, xpX, xpY, xpW, xpH, 3, "rgba(0,0,0,0.5)");
      Draw.roundRect(ctx, xpX, xpY, xpW * clamp(player.xp / player.xpToNext, 0, 1), xpH, 3, "#a855f7");
      Draw.text(ctx, "Lv " + player.level, xpX + xpW / 2, xpY + xpH + 8, { size: 9, color: "#a855f7" });
      Draw.roundRect(ctx, xpX, xpY + 18, xpW, 4, 2, "rgba(0,0,0,0.5)");
      Draw.roundRect(ctx, xpX, xpY + 18, xpW * (1 - clamp(player.dashCooldown / 0.9, 0, 1)), 4, 2, "#22d3ee");

      // Timer
      const remaining = Math.max(0, SURVIVE_TIME - gameTime);
      const min = Math.floor(remaining / 60);
      const sec = Math.floor(remaining % 60);
      Draw.text(ctx, min + ":" + String(sec).padStart(2, "0"), W / 2, 16, { size: 16, color: "#fff", outline: true });

      // Kill count
      Draw.text(ctx, "Kills: " + kills, W - 50, 16, { size: 11, color: "#ef4444", align: "right" });

      // Enemy count
      Draw.text(ctx, "Enemies: " + enemies.length, W - 50, 32, { size: 9, color: "#888", align: "right" });

      // Weapons list
      for (let i = 0; i < player.weapons.length; i++) {
        const w = player.weapons[i];
        Draw.roundRect(ctx, W - 55, 45 + i * 18, 50, 15, 3, w.color + "33");
        Draw.text(ctx, w.name.slice(0, 8), W - 30, 52 + i * 18, { size: 7, color: w.color, align: "center" });
      }

      // Controls
      if (gameTime < 4) {
        ctx.globalAlpha = clamp(4 - gameTime, 0, 0.7);
        Draw.text(ctx, "WASD to move — weapons fire automatically!", W / 2, H - 15, { size: 10, color: "#666" });
        ctx.globalAlpha = 1;
      }

      // Level up screen
      if (levelUpPaused && levelUpChoices) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, W, H);
        Draw.text(ctx, "LEVEL UP!", W / 2, H / 2 - 90, { size: 24, color: "#ffd700", outline: true });
        Draw.text(ctx, "Choose an upgrade:", W / 2, H / 2 - 68, { size: 12, color: "#ccc" });

        for (let i = 0; i < levelUpChoices.length; i++) {
          const c = levelUpChoices[i];
          const bx = W / 2 - 90, by = H / 2 - 60 + i * 42, bw = 180, bh = 36;
          const hovered = input.mouse.x >= bx && input.mouse.x <= bx + bw && input.mouse.y >= by && input.mouse.y <= by + bh;
          Draw.roundRect(ctx, bx, by, bw, bh, 6, hovered ? "rgba(233,69,96,0.8)" : "rgba(40,40,80,0.9)");
          if (hovered) {
            ctx.strokeStyle = "#e94560";
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, bw, bh);
          }
          Draw.text(ctx, c.icon + " " + c.name, bx + bw / 2, by + bh / 2, { size: 12, color: "#fff" });
        }
      }

      // Game over
      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, W, H);
        Draw.text(ctx, won ? "YOU SURVIVED!" : "GAME OVER", W / 2, H / 2 - 30, {
          size: 30, color: won ? "#ffd700" : "#e94560", outline: true, outlineWidth: 4
        });
        Draw.text(ctx, "Kills: " + kills + " | Level: " + player.level + " | Time: " + Math.floor(gameTime) + "s", W / 2, H / 2 + 5, {
          size: 12, color: "#ccc"
        });
      }

      backBtn.render(ctx, input.mouse.x, input.mouse.y);
    }

    const loop = core.createGameLoop(update, render);

    return {
      start() { loop.start(); },
      stop() { loop.stop(); },
      destroy() { loop.stop(); input.destroy(); if (presentation) presentation.destroy(); cvs.remove(); },
      setPresentationMode: (dimensionMode, cameraMode, groundMode) => presentation && presentation.setPresentationMode(dimensionMode, cameraMode, groundMode),
      toggleDimensionMode: () => presentation && presentation.toggleDimensionMode(),
      cycleCameraMode: () => presentation && presentation.cycleCameraMode(),
      setWebpageGroundMode: () => presentation && presentation.setWebpageGroundMode(),
      onBack: null,
      get canvas() { return cvs; },
    };
  }

  window.__gsMascotGameSurvivors = { create: createSurvivorsGame };
})();
