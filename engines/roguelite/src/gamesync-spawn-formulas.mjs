// SPDX-License-Identifier: GPL-3.0-or-later
// Generated from exact reviewed GameSync source. See ../LICENSE.
// Upstream commit bce6c1bcb31c63d31c64185fef143a53d9c4d35f.
// game-survivors.js: 1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7
// game-core.js: f6c4f182ec271a1aefe2decea72cd9da0d120cfa8e649126c04e55d15a4b038e
  const ENEMY_TYPES = [
    { name: "Slime",   color: "#22c55e", hp: 15,  speed: 50,  size: 10, dmg: 5,  xp: 1 },
    { name: "Bat",     color: "#8b5cf6", hp: 10,  speed: 90,  size: 8,  dmg: 4,  xp: 1 },
    { name: "Zombie",  color: "#6b7280", hp: 30,  speed: 35,  size: 12, dmg: 8,  xp: 2 },
    { name: "Wraith",  color: "#d946ef", hp: 20,  speed: 70,  size: 11, dmg: 6,  xp: 2 },
    { name: "Golem",   color: "#92400e", hp: 80,  speed: 25,  size: 18, dmg: 15, xp: 5 },
    { name: "Dragon",  color: "#dc2626", hp: 150, speed: 40,  size: 22, dmg: 20, xp: 10 },
  ];

export function tickSpawnFormulas({spawnTimer,dt,gameTime,SURVIVE_TIME,player,random}) {
  const rand  = (lo, hi) => random() * (hi - lo) + lo;
  const randInt = (lo, hi) => Math.floor(rand(lo, hi + 1));
  const TAU   = Math.PI * 2;
    let spawnRate;
    const enemies = [];
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
      // Spawn enemies
      spawnTimer -= dt;
      const difficulty = Math.min(gameTime / SURVIVE_TIME, 1);
      spawnRate = Math.max(0.3, 2.0 - difficulty * 1.5);
      if (spawnTimer <= 0) {
        spawnTimer = spawnRate;
        const count = 1 + Math.floor(difficulty * 4);
        for (let i = 0; i < count; i++) spawnEnemy();
      }
    return {spawnTimer,spawnRate,enemies};
}
