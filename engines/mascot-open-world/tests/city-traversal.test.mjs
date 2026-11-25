// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {authoredCityGeometry,createCityTraversal} from '../src/city-traversal.mjs';
import {bindOriginalTraversal} from '../src/gamesync-city-formulas.mjs';
const bytes=readFileSync(new URL('../upstream/gamesync/game-openworld.js',import.meta.url));
assert.equal(createHash('sha256').update(bytes).digest('hex'),'4d004092a3dd8d164869457b5cebab0ef9109dabb118d553bd0f3765b2fdc628');
const src=bytes.toString('utf8');
// Each probe reuses intact original bodies in the original top-level scope.
// Supply only the closure state and three dependencies previously owned by the app.
const block=(head,tail)=>{
 const start=src.indexOf(head),end=src.indexOf(tail,start);
 assert.ok(start>=0&&end>start,head);return src.slice(start,end);
};
const helpers=block('    function currentInterior()', '    function dimensionLabel()')+
 block('    function nearInteriorDoor()', '    function distanceSq(')+
 block('    function pointInRect(', '    function nearestPointOutsideRect(')+
 block('    function enterInterior(', '    function vehicleSamplePoints(')+
 block('    function updateRoofTraversalAfterMove(', '    function updatePlayerGround(');
const probe=`
 window.__probe=(state,setMessage,clamp)=>{${helpers}
  return {data:{buildings:BUILDINGS,districts:DISTRICTS,interiors:INTERIORS},
   move(dx,dy){moveWithBuildingCollision(state.player,dx,dy);updateRoofTraversalAfterMove(state.player);},
   interact(){
    if(currentInterior())return nearInteriorExit()?exitInterior():false;
    const door=nearInteriorDoor();return door?enterInterior(door.id):false;
   },
   inspect(){
    return {bounds:sceneBounds(),door:nearInteriorDoor()?.id??null,exit:nearInteriorExit(),
     z:entityAbsoluteZ(state.player)};
   }
  };
 };
`;
const exportIndex=src.lastIndexOf('  window.__gsMascotGameOpenWorld');
assert.ok(exportIndex>0);
const window={};runInNewContext(src.slice(0,exportIndex)+probe+src.slice(exportIndex),{window});
const clamp=(v,lo,hi)=>v<lo?lo:v>hi?hi:v;
const json=x=>JSON.parse(JSON.stringify(x));
const actor=(x,y,more={})=>({x,y,vx:0,vy:0,mode:'ground',interiorId:'',roofId:'',airborneRoofId:'',jumpZ:0,jumpVz:0,aimAngle:0,...more});

test('exact pinned city geometry plus 8,000 seeded outside and indoor moves and decisions',()=>{
 const {buildings,districts,interiors,width,height}=authoredCityGeometry();
 assert.deepEqual([width,height,buildings.length,districts.length,interiors.length],[3200,2200,10,5,4]);
 for(const inside of interiors){
  const a={player:actor(inside.outsideDoor.x,inside.outsideDoor.y+2)}, b=structuredClone(a);
  const events=[],other=[],legacy=window.__probe(a,(...values)=>events.push(values),clamp);
  const engine=bindOriginalTraversal(b,(...values)=>other.push(values));
  assert.deepEqual({buildings,districts,interiors},json(legacy.data));
  assert.equal(legacy.interact(),true);
  assert.equal(engine.enterInterior(engine.nearInteriorDoor().id),true);
  assert.deepEqual(a,b);
  let seed=42;
  const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed>>>24)%49-24;};
  for(let k=0;k<2000;k++){
   if(k===1000){
    Object.assign(a.player,{x:inside.exitZone.x+2,y:inside.exitZone.y+2});
    Object.assign(b.player,{x:inside.exitZone.x+2,y:inside.exitZone.y+2});
    assert.equal(legacy.interact(),true);
    assert.ok(engine.nearInteriorExit());assert.equal(engine.exitInterior(),true);
    assert.deepEqual(a,b);
   }
   const dx=next(),dy=next(); legacy.move(dx,dy);
   engine.moveWithBuildingCollision(b.player,dx,dy);engine.updateRoofTraversalAfterMove(b.player);
   assert.deepEqual(a,b);
   assert.deepEqual(json(legacy.inspect()),{bounds:engine.sceneBounds(),door:engine.nearInteriorDoor()?.id??null,
    exit:engine.nearInteriorExit(),z:engine.entityAbsoluteZ(b.player)});
  }
  assert.deepEqual(events,other);
 }
});

test('walking trips across four authored doors and back preserves position and clamps collisions',()=>{
 const map=authoredCityGeometry();
 for(const i of map.interiors){
  const start={x:i.outsideDoor.x,y:i.outsideDoor.y+2};
  const host=createCityTraversal(start);
  assert.equal(host.snapshot().action,'enter');
  assert.equal(host.interact().state.interior.id,i.id);
  assert.equal(host.interact().changed,false,'Not inside exit zone');
  const wantX=i.exitZone.x+i.exitZone.w/2,wantY=i.exitZone.y+i.exitZone.h/2;
  const near=(a,b)=>Math.max(-16,Math.min(16,b-a));
  for(let k=0;k<30&&host.snapshot().action!=='exit';k++){
   const {x,y}=host.snapshot();host.move(near(x,wantX),near(y,wantY));
  }
  assert.equal(host.snapshot().action,'exit');
  const out=host.interact();
  assert.equal(out.changed,true);assert.equal(out.state.interior,null);
  assert.deepEqual([out.state.x,out.state.y],[start.x,start.y]);
 }
 const p=createCityTraversal({x:130,y:1790});assert.equal(p.move(20,0).x,130,'Hideout wall');
 assert.throws(()=>p.move(1000,0),RangeError);
 assert.equal(createCityTraversal({x:25,y:25}).move(-15,-15).x,24,'City border clamp');
 map.buildings.pop();assert.equal(authoredCityGeometry().buildings.length,10,'Host view cannot edit engine facts');
});

test('pinned roof boundary detaches airborne character without losing absolute Z',()=>{
 const p={player:actor(425,1780,{roofId:'hideout',jumpZ:30,jumpVz:50,overrideTimer:0})}, ref=structuredClone(p);
 const source=window.__probe(ref,()=>{},clamp), got=bindOriginalTraversal(p,()=>{});
 got.moveWithBuildingCollision(p.player,22,0);got.updateRoofTraversalAfterMove(p.player);
 source.move(22,0);assert.deepEqual(p,ref);
 assert.equal(p.player.airborneRoofId,'hideout');assert.equal(p.player.roofId,'');
 assert.equal(got.entityAbsoluteZ(p.player),30+23.4*16);
});
