// SPDX-License-Identifier: GPL-3.0-or-later
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {tickPlayerMovement,tickEnemyContact} from '../src/gamesync-movement-formulas.mjs';
const fresh=()=>({player:{x:0,y:0,speed:130,dir:1,hp:100,maxHp:100,regen:0,invincible:0,dashCooldown:0,dashTimer:0,alive:true},
 enemies:[],gems:[],run:{kills:0,gameOver:false,won:false}});
const enemy=(x,y,hp=10)=>({x,y,hp,speed:30,size:10,dmg:40,xp:4,color:'#ab12cd',hitFlash:0.02});
function reference(){
 const raw=readFileSync(new URL('../upstream/gamesync/game-survivors.js',import.meta.url));assert.equal(createHash('sha256').update(raw).digest('hex'),'1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7');
 const src=raw.toString('utf8');
 const block=(a,b)=>{const x=src.indexOf('      // '+a),y=src.indexOf('      // '+b,x+1);assert.ok(x>=0&&y>x);return src.slice(x,y);};
 const probe=`
    let captured;
    return {runStep(s, keys, dt){
      captured=[];
      Object.assign(player,s.player);
      input.keys=keys;enemies=s.enemies;gems=s.gems;
      ({kills,gameOver,won}=s.run);
${block('Player movement','Camera')}
${block('Update enemies','Update gems')}
      Object.assign(s.player,Object.fromEntries(Object.keys(s.player).map(k=>[k,player[k]])));
      Object.assign(s.run,{kills,gameOver,won});
      return captured;
    }};
    function capture(type,...data){
      if(type==='particles'){const [x,y,count,style]=data;captured.push({type,x,y,count,style});}
      else captured.push({type,id:data[0]});
    }
 `;
 const core={createCanvas:()=>({}),createInput:()=>({}),createButton:()=>({}),
  createParticleSystem:()=>({}),Audio:{play:()=>{}}};
 const source=src.replace('    /* ── Weapon firing',probe+'\n    /* ── Weapon firing')
   .replace('const particles = core.createParticleSystem(600);','const particles = {emit:(...args)=>capture("particles",...args)}; core.Audio.play=(...args)=>capture("audio",...args);');
 const window={__gsMascotGameCore:core};
 runInNewContext(source,{window});
 return window.__gsMascotGameSurvivors.create(null);
}
test('original movement, dash cues, chase, contact and kill-to-gem transfers match over 360 moving ticks',()=>{
 const a=fresh(),b=fresh(),ref=reference();let dashes=0,levels=0;
 for(let i=0;i<360;i++){
  const dt=i%47===0?.05:.016;
  const keys={KeyW:i%90<30,KeyA:i%72<36,KeyD:i%72>=36,ShiftLeft:i%25===0};
  const oldKeys={...keys};
  if(i%11===0){const e=enemy(a.player.x+i%31,a.player.y+i%23,i%3===0?0:10);a.enemies.push({...e});b.enemies.push({...e});}
  const cues=[...tickPlayerMovement({player:a.player,keys,dt}),...tickEnemyContact({...a,dt})];
  const original=ref.runStep(b,oldKeys,dt);
  assert.equal(JSON.stringify({state:a,keys,cues}),JSON.stringify({state:b,keys:oldKeys,cues:original}));
  dashes+=cues.filter(c=>c.type==='audio').length;levels=a.run.kills;
 }
 assert.ok(dashes>=2&&levels>=5);
});
test('exact contact uses pre-move distance and dead enemy can contact before legacy gem drop',()=>{
 const a=fresh();
 a.enemies.push(enemy(27,0));
 tickEnemyContact({...a,dt:.25});
 assert.equal(a.player.hp,100);assert.equal(a.enemies[0].x,19.5);
 a.enemies[0].hp=0;tickEnemyContact({...a,dt:.25});
 assert.equal(a.player.hp,90);assert.equal(a.run.kills,1);assert.equal(a.enemies.length,0);assert.equal(a.gems[0].xp,4);
});
test('legacy diagonal dash and first in-range enemy produce matching invulnerability state',()=>{
 const a=fresh();let keys={KeyW:true,KeyD:true,ShiftLeft:true};
 const cues=tickPlayerMovement({player:a.player,keys,dt:.05});
 assert.equal(keys.ShiftLeft,false);assert.equal(cues.at(-1).id,'jump');
 assert.equal(a.player.dashCooldown,.9);assert.ok(a.player.invincible>0);
 assert.ok(Math.hypot(a.player.x,a.player.y)>92);
 a.player.invincible=0;a.player.hp=1;a.enemies.push(enemy(a.player.x+1,a.player.y),enemy(a.player.x-1,a.player.y));
 tickEnemyContact({...a,dt:.05});
 assert.equal(a.player.hp,-1);assert.equal(a.player.alive,false);assert.equal(a.run.gameOver,true);assert.equal(a.run.won,false);
});
