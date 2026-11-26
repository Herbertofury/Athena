// SPDX-License-Identifier: GPL-3.0-or-later
// Generated exact GameSync movement, dash and enemy-contact formulas.
// Upstream commit bce6c1bcb31c63d31c64185fef143a53d9c4d35f / SHA-256 1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7.
import {spawnExperienceGem} from './gamesync-pickup-formulas.mjs';

// These slices mutate only the validated engine-owned objects supplied by the host.
// Renderer/audio calls are returned as inert ordered cues, never executed here.
export function tickPlayerMovement({player,keys,dt}) {
    const input={keys};
    const cues=[];
    const particles={emit:(x,y,count,style)=>cues.push({type:'particles',x,y,count,style})};
    const core={Audio:{play:id=>cues.push({type:'audio',id})}};
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
    return cues;
}

export function tickEnemyContact({player,enemies,gems,run,dt}) {
    const cues=[];
    const particles={emit:(x,y,count,style)=>cues.push({type:'particles',x,y,count,style})};
    const spawnGem=(x,y,xp)=>spawnExperienceGem(gems,x,y,xp);
    let {kills,gameOver,won}=run;
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
    Object.assign(run,{kills,gameOver,won});
    return cues;
}
