import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createLayoutModel} from '../../../dist/workspaces/foundry/layout-state.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../../../dist/workspaces/foundry/catalog.json',import.meta.url))).themes,m=createLayoutModel(catalog);
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
test('world reset preserves scrapbook identities and exact appearance, environment, time and schema',()=>{
 for(let version=6;version<=11;version++){
  let prior=m.upgradeBlendModes(m.initial());prior.version=version;
  for(const p of Object.values(prior.placements)){if(version<11)delete p.blendMode;if(version<9)delete p.transformOrigin;if(version<8)for(const k of ['skewX','skewY','brightness','contrast','saturation','hue','blur'])delete p[k];if(version<7)for(const k of ['opacity','visible','zIndex'])delete p[k];}
  const ids=Object.keys(prior.placements);prior.placements[ids[0]]={...prior.placements[ids[0]],scope:'sticker',anchor:'inspector',x:.7,pinned:true};prior.placements[ids[1]]={...prior.placements[ids[1]],scope:'ui',x:.8};prior.time='night';
  let n=0;const saved=JSON.stringify(prior),next=m.resetWorldActors(prior,()=>uuid(++n));
  assert.equal(JSON.stringify(prior),saved);assert.equal(next.version,version);assert.equal(next.time,'night');assert.deepEqual(next.environment,prior.environment);
  assert.deepEqual(next.placements[ids[0]],prior.placements[ids[0]]);assert.deepEqual(next.placements[ids[1]],prior.placements[ids[1]]);
  assert.equal(Object.values(next.placements).filter(p=>p.scope==='world').length,catalog[0].objects.length);
  assert.deepEqual(m.parse(m.encode(next)),next);
 }
});
test('old scoped layout upgrades only to preserve separate world and scrapbook identities',()=>{
 let p=m.upgradeScopes(m.initial());const id=catalog[0].objects[0].id;p.placements[id]={x:.3,y:.4,pinned:true,rotation:30,scaleX:-1,scaleY:2,scope:'sticker',anchor:'inspector'};
 const n=m.resetWorldActors(p,()=>uuid(1));assert.equal(n.version,6);assert.equal(n.placements[id].scope,'sticker');assert.equal(n.placements[id].rotation,30);assert.ok(Object.values(n.placements).some(x=>x.objectId===id&&x.scope==='world'));
});
test('capacity or identity allocation failure never mutates original scrapbook',()=>{
 let p=m.upgradeInstances(m.initial());const v=Object.values(p.placements)[0];p.placements=Object.fromEntries(Array.from({length:100},(_,i)=>['instance-'+uuid(i),{...v,scope:'ui'}]));const before=JSON.stringify(p);assert.throws(()=>m.resetWorldActors(p),/100 instances/);assert.equal(JSON.stringify(p),before);
 p=m.upgradeInstances(m.initial());const id=Object.keys(p.placements)[0];p.placements[id].scope='ui';p.placements['instance-'+uuid(1)]={...p.placements[id]};assert.throws(()=>m.resetWorldActors(p,()=>uuid(1)),/distinct world actor/);
});
