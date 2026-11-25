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
const move=piece(/      \/\/ Player movement\n[\s\S]+?(?=\n\n      \/\/ Camera)/);
const enemies=piece(/      \/\/ Update enemies\n[\s\S]+?(?=\n\n      \/\/ Update gems)/);
const generated=`// SPDX-License-Identifier: GPL-3.0-or-later
// Generated exact GameSync movement, dash and enemy-contact formulas.
// Upstream commit bce6c1bcb31c63d31c64185fef143a53d9c4d35f / SHA-256 ${pin}.
import {spawnExperienceGem} from './gamesync-pickup-formulas.mjs';

// These slices mutate only the validated engine-owned objects supplied by the host.
// Renderer/audio calls are returned as inert ordered cues, never executed here.
export function tickPlayerMovement({player,keys,dt}) {
    const input={keys};
    const cues=[];
    const particles={emit:(x,y,count,style)=>cues.push({type:'particles',x,y,count,style})};
    const core={Audio:{play:id=>cues.push({type:'audio',id})}};
${move}
    return cues;
}

export function tickEnemyContact({player,enemies,gems,run,dt}) {
    const cues=[];
    const particles={emit:(x,y,count,style)=>cues.push({type:'particles',x,y,count,style})};
    const spawnGem=(x,y,xp)=>spawnExperienceGem(gems,x,y,xp);
    let {kills,gameOver,won}=run;
${enemies}
    Object.assign(run,{kills,gameOver,won});
    return cues;
}
`;
const out=new URL('../src/gamesync-movement-formulas.mjs',import.meta.url);
if(process.argv.includes('--check'))assert.equal(readFileSync(out,'utf8').replaceAll('\r\n','\n'),generated);
else writeFileSync(out,generated);
