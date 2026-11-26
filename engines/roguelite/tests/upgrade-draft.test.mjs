// SPDX-License-Identifier: GPL-3.0-or-later
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {createLegacyUpgradeDirector} from '../src/upgrade-draft.mjs';

const dirs=seed=>{let n=seed,count=0;return {random(){count++;n=(Math.imul(n,1664525)+1013904223)>>>0;return n/2**32;},count:()=>count};};
const p=()=>({hp:60,maxHp:100,speed:130,dmgMult:1,areaMult:1,magnetRange:50,regen:0,weapons:[{name:'Magic Orb',timer:0}]});
function reference(random){
 const raw=readFileSync(new URL('../upstream/gamesync/game-survivors.js',import.meta.url));
 assert.equal(createHash('sha256').update(raw).digest('hex'),'1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7');
 const cap=`
    return {roll(s){
      Object.assign(player,s); tryLevelUp();
      return levelUpChoices.map(({id,name,icon,weapon})=>({id,name,icon,kind:weapon?'weapon':'stat'}));
    },click(i,fields){
      input.mouse={x:232,y:144+i*42,clicked:true};
      update(0);
      return Object.fromEntries(fields.map(k=>[k,player[k]]));
    }};
 `;
 const core={createCanvas:()=>({}),createInput:()=>({clearClicked(){this.mouse.clicked=false;}}),createParticleSystem:()=>({}),createButton:()=>({}),
   pick:arr=>arr[Math.floor(random()*arr.length)],Audio:{play:()=>{}}};
 const math=Object.create(Math);math.random=random;
 const window={__gsMascotGameCore:core};
 runInNewContext(raw.toString('utf8').replace('    /* ── Weapon firing',cap+'\n    /* ── Weapon firing'),{window,Math:math});
 return window.__gsMascotGameSurvivors.create(null);
}
test('original source produces the same offers and UI click effects through 100 seeded drafts',()=>{
 let weapon=0,stat=0;
 for(let i=1;i<=100;i++){
  const a=p(),b=p(),x=dirs(i*1391903),y=dirs(i*1391903),d=createLegacyUpgradeDirector(x),ref=reference(y.random);
  const offers=d.roll(a),known=ref.roll(b);
  assert.equal(JSON.stringify(offers),JSON.stringify(known));
  assert.equal(x.count(),y.count());
  const target=offers.findIndex(row=>row.kind==='weapon');
  const choice=target===-1?i%3:target;
  const got=d.choose(a,offers,offers[choice].id);
  assert.equal(JSON.stringify(a),JSON.stringify(ref.click(choice,Object.keys(a))));
  if(got.kind==='weapon')weapon++;else stat++;
 }
 assert.ok(weapon>=8&&stat>=10);
});
test('stale, foreign, unoffered and duplicate selections do not change the player',()=>{
 const d=createLegacyUpgradeDirector(dirs(17831)),a=p(),b=p(),one=d.roll(a),two=d.roll(a);
 assert.ok(Object.isFrozen(two)&&two.every(Object.isFrozen));
 const before=JSON.stringify(a);
 assert.throws(()=>d.choose(a,one,one[0].id),/stale/);
 assert.throws(()=>d.choose(b,two,two[0].id),/another player/);
 assert.throws(()=>d.choose(a,two,'none'),/not offered/);
 assert.equal(JSON.stringify(a),before);
 d.choose(a,two,two[0].id);
 const after=JSON.stringify(a);
 assert.notEqual(after,before);assert.throws(()=>d.choose(a,two,two[0].id),/stale/);assert.equal(JSON.stringify(a),after);
});
