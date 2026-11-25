// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
const source=new URL('../upstream/gamesync/game-survivors.js',import.meta.url);
const raw=readFileSync(source);
const pin='1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7';
assert.equal(createHash('sha256').update(raw).digest('hex'),pin);
const src=raw.toString('utf8');
const piece=pattern=>{const m=src.match(pattern);assert.ok(m,'Expected exact former boundary');return m[0];};
const gem=piece(/    function spawnGem\(x, y, xp\) \{[\s\S]+?\n    \}(?=\n\n    function showDmg)/);
const xp=piece(/      player\.level\+\+;[\s\S]+?(?=\n\n      \/\/ Pick 3 random upgrades)/);
const step=piece(/      \/\/ Update gems\n[\s\S]+?(?=\n\n      \/\/ Update damage numbers)/);
const generated=`// SPDX-License-Identifier: GPL-3.0-or-later
// Generated exact pickup and XP transitions from pinned GameSync Survivor source.
// Upstream commit bce6c1bcb31c63d31c64185fef143a53d9c4d35f / SHA-256 ${pin}.
export function spawnExperienceGem(gems,x,y,xp) {
${gem}
    spawnGem(x,y,xp);
}

// Mutates only engine-owned input, as the original game did. Host chooses
// which choices to present. No audio, random draw, reward, or auto-upgrade.
export function tickPickupFormulas({gems,player,dt}) {
    const levels = [];
    function tryLevelUp() {
${xp}
      levels.push({level:player.level,xp:player.xp,xpToNext:player.xpToNext});
    }
${step}
    return levels;
}
`;
const out=new URL('../src/gamesync-pickup-formulas.mjs',import.meta.url);
if(process.argv.includes('--check'))assert.equal(readFileSync(out,'utf8').replaceAll('\r\n','\n'),generated);
else writeFileSync(out,generated);
