// SPDX-License-Identifier: GPL-3.0-or-later
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newClockworkEncounter,openClockworkTape} from '../src/clockwork-encounter.mjs';
test('setup, defense and payoff make the enemy timer tactically visible',()=>{
 const risky=newClockworkEncounter(), guarded=newClockworkEncounter();
 for(const m of [risky,guarded])m.apply('prime');
 assert.deepEqual(risky.preview('spark'),{ticks:2,damage:9,intercept:true,shield:0});
 assert.deepEqual(guarded.preview('brace'),{ticks:1,damage:0,intercept:true,shield:6});
 const hit=risky.apply('spark'), block=guarded.apply('brace');
 assert.equal(hit.state.health,12);assert.equal(hit.state.sentinel,6);
 assert.deepEqual(block.last.filter(e=>e.type==='SENTINEL_STRIKE'),[{type:'SENTINEL_STRIKE',blocked:6,damage:0}]);
 const payoff=guarded.apply('spark');assert.equal(payoff.state.health,18);assert.equal(payoff.state.sentinel,6);
 assert.equal(payoff.last.some(e=>e.type==='SENTINEL_STRIKE'),false);
});
test('illegal commands are inert, finishing hit takes precedence, and views are detached',async()=>{
 const m=newClockworkEncounter();m.apply('prime');const v=m.view(),before=await m.tape();
 v.state.hand.push('prime');v.last[0].type='changed';
 assert.throws(()=>m.apply('prime'),/Unavailable/);
 assert.throws(()=>m.apply(['spark']),/Unavailable/);
 assert.deepEqual(await m.tape(),before);
 for(const c of ['spark','end','prime'])m.apply(c);
 const win=m.apply('spark');assert.equal(win.state.outcome,'win');assert.equal(win.last.some(e=>e.type==='SENTINEL_STRIKE'),false);
 assert.throws(()=>m.apply('end'),/Unavailable/);
});
test('round-trips verified tapes and rejects edits without altering another match',async()=>{
 const m=newClockworkEncounter();for(const c of ['prime','brace','spark','end'])m.apply(c);
 const tape=await m.tape(), loaded=await openClockworkTape(JSON.stringify(tape));
 assert.deepEqual(loaded.view(),m.view());assert.deepEqual(await loaded.tape(),tape);
 await assert.rejects(openClockworkTape(JSON.stringify({...tape,commands:['end']})),/verification failed/);
 await assert.rejects(openClockworkTape(JSON.stringify({...tape,rules:'warden'})),/valid Clockwork/);
 await assert.rejects(openClockworkTape(' '.repeat(17000)),/16 KiB/);
});
