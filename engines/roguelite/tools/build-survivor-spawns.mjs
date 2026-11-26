// SPDX-License-Identifier: GPL-3.0-or-later
// Exact source extraction: lift only the spawn templates and formula bodies.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const survivors=new URL('../upstream/gamesync/game-survivors.js',import.meta.url);
const helpers=new URL('../../shared-game-runtime/upstream/gamesync/game-core.js',import.meta.url);
const out=new URL('../src/gamesync-spawn-formulas.mjs',import.meta.url);
const pins=[
 [survivors,'1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7'],
 [helpers,'f6c4f182ec271a1aefe2decea72cd9da0d120cfa8e649126c04e55d15a4b038e'],
];
function exact(file,sha){const bytes=readFileSync(file);assert.equal(createHash('sha256').update(bytes).digest('hex'),sha,'pinned game source differs');return bytes.toString('utf8');}
const [source,core]=pins.map(args=>exact(...args));
const get=(s,pattern)=>{const m=s.match(pattern);assert.ok(m,'exact source boundary missing');return m[0];};
const template=get(source,/  const ENEMY_TYPES = \[[\s\S]+?\n  \];/);
const spawn=get(source,/    function spawnEnemy\(\) \{[\s\S]+?\n    \}(?=\n\n    function spawnGem)/);
const tick=get(source,/      \/\/ Spawn enemies\n[\s\S]+?(?=\n\n      \/\/ Fire weapons)/);
const rand=get(core,/  const rand  = \(lo, hi\) => Math\.random\(\) \* \(hi - lo\) \+ lo;/).replace('Math.random()', 'random()');
const int=get(core,/  const randInt = \(lo, hi\) => Math\.floor\(rand\(lo, hi \+ 1\)\);/);
const tau=get(core,/  const TAU   = Math\.PI \* 2;/);
const text=`// SPDX-License-Identifier: GPL-3.0-or-later
// Generated from exact reviewed GameSync source. See ../LICENSE.
// Upstream commit bce6c1bcb31c63d31c64185fef143a53d9c4d35f.
// game-survivors.js: ${pins[0][1]}
// game-core.js: ${pins[1][1]}
${template}

export function tickSpawnFormulas({spawnTimer,dt,gameTime,SURVIVE_TIME,player,random}) {
${rand}
${int}
${tau}
    let spawnRate;
    const enemies = [];
${spawn}
${tick}
    return {spawnTimer,spawnRate,enemies};
}
`;
if(process.argv.includes('--check')) assert.equal(readFileSync(out,'utf8').replaceAll('\r\n','\n'),text);
else writeFileSync(out,text,{encoding:'utf8'});
