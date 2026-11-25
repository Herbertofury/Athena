// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import test from 'node:test';
import {createRiftDirector} from '../src/rift-director.mjs';
test('seeded rifts bind to actual approach, never replace pending upgrade and can be declined',()=>{
 const d=createRiftDirector(41), another=createRiftDirector(41), player={x:0,y:0};
 assert.equal(d.step({clock:94,player}),false);
 assert.equal(d.step({clock:95,player}),false);another.step({clock:95,player});
 const x=d.snapshot(); assert.deepEqual(x,another.snapshot());
 assert.ok(Math.hypot(x.marker.x,x.marker.y)>=190);
 assert.equal(d.step({clock:100,player:x.marker,choicePending:true}),false);
 assert.equal(d.step({clock:100,player:x.marker}),true);
 assert.equal(d.choose(false),null); assert.equal(d.snapshot().marker,null);
 assert.throws(()=>d.choose(true),/No rift/);
});
test('all side choices arise across deterministic seeds and dead portals never open',()=>{
 const durations=new Set();
 for(let seed=0;seed<30;seed++){
  const d=createRiftDirector(seed);d.step({clock:95,player:{x:0,y:0}});
  const m=d.snapshot().marker;
  assert.equal(d.step({clock:102,player:m}),true);
  assert.deepEqual(d.choose(true),{minutes:m.minutes,seed:m.seed});
  durations.add(m.minutes);
 }
 assert.deepEqual([...durations].sort(),[10,20,30]);
 const d=createRiftDirector(7);d.step({clock:95,player:{x:0,y:0}});
 const dead=d.snapshot().marker;
 assert.equal(d.step({clock:159,player:dead}),false);assert.equal(d.snapshot().marker,null);
});
