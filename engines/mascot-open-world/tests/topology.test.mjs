import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rename,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildTopology} from '../build-topology.mjs';

async function openBundle(t){
 const root=await mkdtemp(resolve(tmpdir(),'athena-city-'));
 t.after(()=>rm(root,{force:true,recursive:true}));
 const initial=resolve(root,'first'),relocated=resolve(root,'offline city instance');
 await buildTopology(initial);await rename(initial,relocated);
 return {api:await import(pathToFileURL(resolve(relocated,'city.mjs'))),relocated};
}

test('all 900 routes match an independent distance oracle on the preserved street graph',async t=>{
 const {api}=await openBundle(t),city=api.cityCatalog(),count=city.roadNodes.length;
 assert.equal(count,30);assert.equal(city.roads.reduce((n,[,neighbors])=>n+neighbors.length,0),98);
 const road=new Map(city.roads),n=city.roadNodes;
 const edge=(x,y)=>Math.hypot(n[x].x-n[y].x,n[x].y-n[y].y);
 const matrix=Array.from({length:count},(_,i)=>Array.from({length:count},(_,j)=>i===j?0:road.get(i).includes(j)?edge(i,j):Infinity));
 for(let k=0;k<count;k++)for(let i=0;i<count;i++)for(let j=0;j<count;j++)matrix[i][j]=Math.min(matrix[i][j],matrix[i][k]+matrix[k][j]);
 for(let i=0;i<count;i++)for(let j=0;j<count;j++){
  const r=api.planRoadRoute(i,j);assert.equal(r.nodes[0],i);assert.equal(r.nodes.at(-1),j);
  let length=0;for(let k=1;k<r.nodes.length;k++){const a=r.nodes[k-1],b=r.nodes[k];assert.ok(road.get(a).includes(b));length+=edge(a,b);}
  assert.equal(length,r.distance);assert.equal(r.distance,matrix[i][j]);
 }
 assert.deepEqual(api.planRoadRoute(0,29),{nodes:[0,1,13,19,25,26,27,28,29],distance:3580});
});

test('four real authored doors enforce approach, one interior, exit zone and exact outdoor return',async t=>{
 const {api}=await openBundle(t),city=api.cityCatalog();
 assert.equal(city.interiors.length,4);assert.equal(city.districts.length,5);
 assert.equal(city.buildings.length,10);assert.equal(city.safehouses.length,2);
 for(const inside of city.interiors){
  const {x,y}=inside.outsideDoor;
  const at=api.inspectWorldPoint(x,y);assert.ok(at.doors.includes(inside.id));
  const visit=api.createDoorVisit();assert.throws(()=>visit.enter(inside.id,0,0),/authored door/);
  assert.deepEqual(visit.enter(inside.id,x,y),{interior:inside.id,position:inside.insideSpawn});
  assert.throws(()=>visit.enter(inside.id,x,y),/current interior/);
  assert.throws(()=>visit.exit(0,0),/exit zone/);
  const z=inside.exitZone;
  assert.deepEqual(visit.exit(z.x+z.w/2,z.y+z.h/2),{interior:null,position:{x,y}});
  assert.throws(()=>visit.exit(0,0),/No active/);
 }
 assert.deepEqual(api.inspectWorldPoint(430,2000).safehouses,['hideout']);
});

test('explicit inspection is clone-only, refuses invalid points and does not replace destinations',async t=>{
 const {api,relocated}=await openBundle(t);
 const initial=api.cityCatalog(),copy=api.cityCatalog();
 copy.roadNodes[0].x=-1;copy.interiors[0].insideSpawn.x=0;copy.roads[0][1].length=0;
 assert.deepEqual(api.cityCatalog(),initial);
 assert.throws(()=>api.inspectWorldPoint(-1,20));assert.throws(()=>api.inspectWorldPoint(20,2201));
 assert.throws(()=>api.planRoadRoute('0',29));assert.throws(()=>api.planRoadRoute(1,30));
 await assert.rejects(buildTopology(relocated),e=>e.code==='EEXIST');
});
