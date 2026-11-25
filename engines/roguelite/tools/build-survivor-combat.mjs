// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
const gamePin='1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7';
const corePin='f6c4f182ec271a1aefe2decea72cd9da0d120cfa8e649126c04e55d15a4b038e';
function load(path,pin){
 const buf=readFileSync(new URL(path,import.meta.url));
 assert.equal(createHash('sha256').update(buf).digest('hex'),pin);
 return buf.toString('utf8');
}
const game=load('../upstream/gamesync/game-survivors.js',gamePin);
const core=load('../../shared-game-runtime/upstream/gamesync/game-core.js',corePin);
const piece=(text,pattern)=>{const m=text.match(pattern);assert.ok(m,'Missing pinned source boundary');return m[0];};
const get=(pattern)=>piece(game,pattern);
const combat=get(/      \/\/ Update projectiles\n[\s\S]+?(?=\n\n      \/\/ Update enemies)/);
const firing=get(/    function fireWeapons\(dt\) \{[\s\S]+?\n    \}/);
const weapons=get(/  const WEAPONS = \{[\s\S]+?\n  \};/);
const dmg=get(/    function showDmg\(x, y, val, color\) \{[\s\S]+?\n    \}/);
const age=get(/      \/\/ Update damage numbers\n[\s\S]+?(?=\n\n      \/\/ Click)/);
const initial=get(/    const player = \{[\s\S]+?\n    \};/);
const constants=piece(core,/  const rand  =[\s\S]+?(?=\n  const DEG)/);
const hsl=piece(core,/  const hsl = [^\n]+/);
const system=piece(core,/  function createParticleSystem\(maxParticles = 500\) \{[\s\S]+?\n  \}/);
assert.ok(constants.includes('const pick')&&constants.includes('const randInt'));
const gameplayConstants=piece(constants,/  const pick[^\n]+/);
const particleSetup=system.split('      render(ctx) {')[0].replace(/\brandInt\b/g,'visualInt').replace(/\brand\b/g,'visualRange');
const flashRoll='if (Math.random() < dt * 5)';
assert.equal(combat.split(flashRoll).length,2,'Pinned hit-flash roll boundary');
const combatWithVisualRoll=combat.replace(flashRoll,'if (visualRandom() < dt * 5)');
const generated=`// SPDX-License-Identifier: GPL-3.0-or-later
// Generated pinned GameSync Survivor combat and shared particle formulas.
// Game SHA-256 ${gamePin}; core SHA-256 ${corePin}.
// The legacy default shares entropy; new hosts can pass isolated visual entropy.
${weapons}
export function createLegacyPlayer() {
${initial}
    return player;
}

export function createLegacyCombat(random,visualRandom=random) {
  const Math=Object.create(globalThis.Math,{random:{value:random}});
${gameplayConstants}
const TAU=Math.PI*2;
  const visualRange=(lo,hi)=>visualRandom()*(hi-lo)+lo;
  const visualInt=(lo,hi)=>Math.floor(visualRange(lo,hi+1));
${hsl}
${particleSetup}      get count() { return pool.length; }
    };
  }
  const particles=createParticleSystem(600), projectiles=[], damageNumbers=[];
  let bibles=[];
  function step(player,enemies,dt) {
${dmg}
${firing}
    fireWeapons(dt);
${combatWithVisualRoll}
  }
  return {
    step,
    emit:(x,y,count,style)=>particles.emit(x,y,count,style),
    settle(dt) {
${age}
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
`;
const dest=new URL('../src/gamesync-combat-formulas.mjs',import.meta.url);
if(process.argv.includes('--check'))assert.equal(readFileSync(dest,'utf8').replaceAll('\r\n','\n'),generated);
else writeFileSync(dest,generated);
