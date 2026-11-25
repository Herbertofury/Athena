// SPDX-License-Identifier: GPL-3.0-or-later
// Generated pinned GameSync Survivor combat and shared particle formulas.
// Game SHA-256 1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7; core SHA-256 f6c4f182ec271a1aefe2decea72cd9da0d120cfa8e649126c04e55d15a4b038e.
// A single caller-owned random stream is used, including particle emissions.
  const WEAPONS = {
    orb:      { name: "Magic Orb",     color: "#a855f7", dmg: 8,  rate: 0.8,  range: 120, projSpeed: 250, projSize: 5 },
    whip:     { name: "Whip",          color: "#f5a623", dmg: 12, rate: 1.2,  range: 80,  area: true },
    bible:    { name: "Bible",         color: "#ffd700", dmg: 6,  rate: 0.1,  range: 60,  orbit: true, orbitR: 55, count: 2 },
    lightning:{ name: "Lightning",     color: "#06b6d4", dmg: 20, rate: 2.0,  range: 150, instant: true },
    fire:     { name: "Fire Nova",     color: "#ef4444", dmg: 15, rate: 3.0,  range: 100, nova: true },
    knife:    { name: "Throwing Knife",color: "#94a3b8", dmg: 5,  rate: 0.4,  range: 200, projSpeed: 350, projSize: 3, pierce: 2 },
  };
export function createLegacyPlayer() {
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
    return player;
}

export function createLegacyCombat(random) {
  const Math=Object.create(globalThis.Math,{random:{value:random}});
  const rand  = (lo, hi) => Math.random() * (hi - lo) + lo;
  const randInt = (lo, hi) => Math.floor(rand(lo, hi + 1));
  const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const TAU   = Math.PI * 2;
  const hsl = (h, s, l, a) => a != null ? `hsla(${h},${s}%,${l}%,${a})` : `hsl(${h},${s}%,${l}%)`;
  function createParticleSystem(maxParticles = 500) {
    const pool = [];
    return {
      emit(x, y, count, opts = {}) {
        for (let i = 0; i < count && pool.length < maxParticles; i++) {
          const angle = opts.angle != null ? opts.angle + rand(-opts.spread || 0.3, opts.spread || 0.3) : rand(0, TAU);
          const speed = rand(opts.speedMin || 40, opts.speedMax || 200);
          pool.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: opts.life || rand(0.4, 1.2),
            maxLife: opts.life || rand(0.4, 1.2),
            size: opts.size || rand(2, 6),
            color: opts.color || hsl(randInt(0, 360), 80, 60),
            gravity: opts.gravity ?? 120,
            friction: opts.friction ?? 0.98,
            shape: opts.shape || "circle",
            rotation: rand(0, TAU),
            rotSpeed: rand(-4, 4),
          });
        }
      },
      update(dt) {
        for (let i = pool.length - 1; i >= 0; i--) {
          const p = pool[i];
          p.life -= dt;
          if (p.life <= 0) { pool.splice(i, 1); continue; }
          p.vy += p.gravity * dt;
          p.vx *= p.friction;
          p.vy *= p.friction;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rotation += p.rotSpeed * dt;
        }
      },
      get count() { return pool.length; }
    };
  }
  const particles=createParticleSystem(600), projectiles=[], damageNumbers=[];
  let bibles=[];
  function step(player,enemies,dt) {
    function showDmg(x, y, val, color) {
      damageNumbers.push({ x, y, val: Math.floor(val), color: color || "#fff", life: 0.8 });
    }
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
  }
  return {
    step,
    emit:(x,y,count,style)=>particles.emit(x,y,count,style),
    settle(dt) {
      // Update damage numbers
      for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const d = damageNumbers[i];
        d.y -= 40 * dt;
        d.life -= dt;
        if (d.life <= 0) damageNumbers.splice(i, 1);
      }
      particles.update(dt);
    },
    // Paint does not use hit identities. Preserve them in the durable snapshot,
    // and project everything the canvas draws without walking or cloning Sets.
    frameView() {
      return {
        projectiles:projectiles.map(({x,y,size,color})=>({x,y,size,color})),
        bibles:bibles.map(({angle,r,size,color})=>({angle,r,size,color})),
        damageNumbers:damageNumbers.map(({x,y,val,color})=>({x,y,val,color})),
      };
    },
    snapshot(enemies) {
      return {
        projectiles:projectiles.map(({hit,...p})=>({...p,hit:[...hit].map(e=>enemies.indexOf(e))})),
        bibles:bibles.map(b=>({...b})),
        damageNumbers:damageNumbers.map(d=>({...d})),
        particles:particles.count,
      };
    },
  };
}
