// SPDX-License-Identifier: GPL-3.0-or-later
// Produce a portable fixed-step experiment from known retained GameSync source only.
import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..');
const revision='bce6c1bcb31c63d31c64185fef143a53d9c4d35f';
const survivorPin='babfa7bb60ca3f79b750ca99310f361167f06f8e';
const runtimePin='b8e8eb09b0ccff281747669e0976c21e63e8981e';
const attribution='// SPDX-License-Identifier: GPL-3.0-or-later\n// Reviewed derivation of GameSync '+revision+'.\n';

function change(text, pattern, replacement, count=1) {
  let matches=0;
  const result=text.replace(pattern,(...parts)=>{matches++;return typeof replacement==='function'?replacement(...parts):replacement;});
  if(matches!==count)throw Error('Unexpected pinned-source transformation count');
  return result;
}
function until(text, first, last) {
  const i=text.indexOf(first), j=text.indexOf(last,i+first.length);
  if(i<0||j<=i)throw Error('Pinned source section missing');
  return text.slice(i,j);
}
async function pinned(name, oid) {
  const data=await readFile(resolve(root,name));
  if(createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex')!==oid)throw Error('Pinned source did not match');
  return new TextDecoder('utf-8',{fatal:true}).decode(data);
}

// The headless adapter only supplies original input events and returns data.
// Neither the renderer nor any visible host, clock, storage or reward API is started.
const factory=`export function createSurvivorsRun({seed,seconds=300}={}) {
    if(!Number.isInteger(seconds)||seconds<5||seconds>600)throw RangeError('Choose 5–600 whole seconds');
    const entropy=createReplayEntropy(seed);
    const SURVIVE_TIME=seconds;
    const random=()=>entropy.next();
    const rand=(lo,hi)=>random()*(hi-lo)+lo;
    const randInt=(lo,hi)=>Math.floor(rand(lo,hi+1));
    const pick=list=>list[Math.floor(random()*list.length)];
    let activeTicks=0;
    const NOOP=()=>{};
    const core={Audio:{play:NOOP}};
    const particles={emit:NOOP,update:NOOP};
    const input={keys:Object.create(null),mouse:{x:0,y:0,clicked:false},
      clearClicked(){this.mouse.clicked=false;}};
`;
const adapter=`
    const phase=()=>gameOver?(won?'won':'lost'):levelUpPaused?'draft':'running';
    function step({dx=0,dy=0,dash=false,upgrade=null}={}) {
      if(![-1,0,1].includes(dx)||![-1,0,1].includes(dy)||typeof dash!=='boolean')
        throw TypeError('Use a discrete direction and boolean dash');
      if(gameOver) return phase();
      if(upgrade!==null){
        const slot=levelUpChoices?.findIndex(row=>row.id===upgrade) ?? -1;
        if(!levelUpPaused||slot<0)throw RangeError('Wait for and choose a listed upgrade');
        input.mouse.clicked=true;
        input.mouse.x=W/2;
        input.mouse.y=H/2-60+slot*42+1;
      }
      input.keys.KeyA=dx<0;input.keys.KeyD=dx>0;
      input.keys.KeyW=dy<0;input.keys.KeyS=dy>0;
      input.keys.ShiftLeft=dash;
      update(1/60);
      return phase();
    }
    function inspect() {
      // No live mutable object, executable callback, or private host data leaks.
      return {phase:phase(),seed,seconds,activeTicks,time:gameTime,kills,
        player:{...player,weapons:player.weapons.map(v=>({...v}))},
        enemies:enemies.map(v=>({...v})),
        projectiles:projectiles.map(({hit,...v})=>({...v,hitLive:enemies.filter(e=>hit.has(e)).length})),
        gems:gems.map(v=>({...v})),
        pending:(levelUpChoices||[]).map(({id,name})=>({id,name}))};
    }
    return Object.freeze({step,inspect});
}
`;

export async function buildFixedStep(destination) {
  destination=resolve(destination);
  destination=resolve(await realpath(dirname(destination)),basename(destination));
  const from=relative(await realpath(here),destination);
  if(!isAbsolute(from)&&from!=='..'&&!from.startsWith('..'+sep))throw Error('Use a new directory outside the engine source');
  const [game,runtime,entropy,license,preview]=await Promise.all([
    pinned('roguelite/upstream/gamesync/game-survivors.js',survivorPin),
    pinned('shared-game-runtime/upstream/gamesync/game-core.js',runtimePin),
    readFile(resolve(root,'card-game/src/replay-entropy.mjs')),readFile(resolve(here,'LICENSE')),
    readFile(resolve(here,'src/play-fixed-step.mjs'))
  ]);
  const terms=until(game,'  const W = 640','  function createSurvivorsGame')
      .replace('  const SURVIVE_TIME = 300; // 5 minutes\n','');
  const tau=until(runtime,'  const TAU','  const DEG');
  let rules=until(game,'    // Camera\n','    function projectWorldToFirstPerson');
  rules=change(rules,/    \/\/ Camera\n    let camX = 0, camY = 0;\n\n/g,'');
  rules=change(rules,/    \/\/ Ground tiles\n[\s\S]*?(?=    function spawnEnemy\()/g,'');
  rules=change(rules,/    let damageNumbers = \[\];\n/g,'');
  rules=change(rules,/    function showDmg\([^\n]+\n[\s\S]*?\n    }\n\n/g,'    const showDmg=NOOP;\n\n');
  rules=change(rules,/      \/\/ Camera\n[\s\S]*?(?=      \/\/ Spawn enemies)/g,'');
  rules=change(rules,/      \/\/ Update damage numbers\n[\s\S]*?(?=      particles\.update\(dt\);)/g,'');
  rules=change(rules,/gameTime \+= dt;/g,'gameTime = ++activeTicks / 60;');
  rules=change(rules,/Math\.random\(\)/g,'random()',3);
  // Fisher–Yates makes selections stable across JavaScript engines, with no UI clock.
  rules=change(rules,/pool\.sort\(\(\) => random\(\) - 0\.5\)/g,
    'pool;\n      for(let i=shuffled.length-1;i>0;i--){const j=randInt(0,i);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}');
  const generated=attribution+"import {createReplayEntropy} from './replay-entropy.mjs';\n"+tau+terms+factory+rules+adapter;
  await mkdir(destination,{mode:0o700});
  for(const [name,data] of [['survivors.mjs',generated],['replay-entropy.mjs',entropy],['LICENSE',license],['play.mjs',preview]]){
    await writeFile(resolve(destination,name),data,{flag:'wx'});
  }
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length!==3)throw Error('Usage: node build-fixed-step.mjs NEW-DIRECTORY');
  await buildFixedStep(process.argv[2]);
}
