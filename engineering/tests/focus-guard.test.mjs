import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFocusGuard} from '../docs/card-lab/lab-core.mjs';
function fixture(){let focused=true;const listeners=new Map();const doc={hidden:false,hasFocus:()=>focused};const guard=createFocusGuard(doc,{addEventListener:(type,fn)=>listeners.set(type,fn)});return {doc,guard,focus(value){focused=value;},blur(){focused=false;listeners.get('blur')();}};}
test('visible but unfocused baseline acceptance is rejected',()=>{const f=fixture();f.focus(false);assert.equal(f.doc.hidden,false); // old visibility-only guard would pass
 f.guard.begin();assert.throws(()=>f.guard.check(),/focus/);assert.deepEqual(f.guard.snapshot(),{started_focused:false,focus_lost:true,focused_now:false});});
test('transient blur cannot become a valid measurement after focus returns',()=>{const f=fixture();f.guard.begin();f.guard.check();f.blur();f.focus(true);assert.throws(()=>f.guard.check(),/focus/);assert.equal(f.guard.snapshot().focus_lost,true);});
test('missing focus capability fails closed without fabricated success',()=>{const g=createFocusGuard({}, {addEventListener(){}});g.begin();assert.throws(()=>g.check(),/focus/);});
test('idle blur does not poison a later explicit run, while inactive check fails',()=>{const f=fixture();f.blur();f.focus(true);f.guard.begin();f.guard.check();f.guard.finish();assert.throws(()=>f.guard.check(),/focus/);f.blur();f.focus(true);f.guard.begin();f.guard.check();assert.equal(f.guard.snapshot().focus_lost,false);});
test('focus polling rejects loss even if the blur callback was not delivered',()=>{const f=fixture();f.guard.begin();f.focus(false);assert.throws(()=>f.guard.check(),/focus/);f.focus(true);assert.throws(()=>f.guard.check(),/focus/);});
test('actual harness begins, checks and ends the guard without replacing retention',()=>{const source=readFileSync(new URL('../docs/card-lab/lab.js',import.meta.url),'utf8');assert.match(source,/focusGuard.begin\(\)/);assert.match(source,/try\{focusGuard.check\(\)/);assert.match(source,/await settle\(\);focusGuard.check\(\)/);assert.match(source,/finally\{focusGuard.finish\(\)/);assert.match(source,/lastCompletedEvidence=retainCompleted\(evidence,lastCompletedEvidence\)/);});
