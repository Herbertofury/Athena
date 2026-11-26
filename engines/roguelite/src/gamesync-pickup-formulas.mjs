// SPDX-License-Identifier: GPL-3.0-or-later
// Generated exact pickup and XP transitions from pinned GameSync Survivor source.
// Upstream commit bce6c1bcb31c63d31c64185fef143a53d9c4d35f / SHA-256 1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7.
export function spawnExperienceGem(gems,x,y,xp) {
    function spawnGem(x, y, xp) {
      gems.push({ x, y, xp, size: 4 + xp, life: 15, magnetized: false });
    }
    spawnGem(x,y,xp);
}

// Mutates only engine-owned input, as the original game did. Host chooses
// which choices to present. No audio, random draw, reward, or auto-upgrade.
export function tickPickupFormulas({gems,player,dt}) {
    const levels = [];
    function tryLevelUp() {
      player.level++;
      player.xp -= player.xpToNext;
      player.xpToNext = Math.floor(player.xpToNext * 1.5);
      levels.push({level:player.level,xp:player.xp,xpToNext:player.xpToNext});
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
    return levels;
}
