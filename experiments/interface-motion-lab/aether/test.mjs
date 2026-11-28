import test from 'node:test'
import assert from 'node:assert/strict'
import { GestureField, motionBudget, STILL_TIME } from './interaction.js'
import { autoMode, CLICK_LIFE, CLICK_SLOTS, modeIndex, POINTER_CHOICES } from './vendor/aether/pointer.js'
import { ENGINES, FINISHES, fragmentSource } from './vendor/aether/shader.js'
import { PRESETS } from './vendor/aether/presets.generated.js'
function observe() {
  const out = {}
  return [out, {
    setPointer(x,y,s,w,h) {out.pointer = {x,y,s,w,h}},
    setClick(i,x,y,age,w,h) { (out.clicks ??= [])[i] = {x,y,age,w,h} },
    setInteraction(mode,vx,vy) { out.interaction = {mode,vx,vy} }
  }]
}
const state = {now: 1000, dt:1/24, width:1280, height:800, mode:1, rings:true}
test('upstream scene and mode corpus', () => {
  assert.equal(PRESETS.length,18)
  assert.equal(FINISHES.length,10)
  assert.equal(POINTER_CHOICES.length,7)
  assert.equal(CLICK_LIFE,2.4)
  assert.equal(CLICK_SLOTS,4)
  assert.equal(autoMode('moonsea'),'ripples')
  assert.equal(autoMode('blackhole'),'well')
  assert.equal(modeIndex({pointerMode:'off'},'moonsea'),-1)
  for(const engine of ENGINES) for(const finish of FINISHES) assert.match(fragmentSource(engine,finish), /u_pointer/)
})
test('pointer wake eases, caps flicks, and settles after hold', () => {
  const g = new GestureField(), [out,r] = observe()
  g.move(80,40,1000); g.step(r,state)
  assert.deepEqual(out.pointer,{x:80,y:40,s:.08,w:1280,h:800})
  g.move(1080,40,1010); g.step(r,{...state,now:1010})
  assert.ok(Math.abs(out.pointer.x-220)<1e-10)
  assert.ok(Math.abs(out.interaction.vx-1.26)<1e-10)
  for(let i=0;i<120;i++) g.step(r,{...state,now:3200+i*42})
  assert.ok(out.pointer.s < .01)
})
test('ring buffer slot rotation, one press at t=0, battery suppression and clear', () => {
  const g = new GestureField(), [out,r] = observe()
  g.press(111,55,0); g.step(r,state)
  assert.deepEqual(out.clicks[0],{x:111,y:55,age:1,w:1280,h:800})
  for(let i=0;i<4;i++) g.press(i,200,1000+i)
  g.step(r,{...state,now:1200})
  assert.equal(out.clicks.length,4); assert.equal(out.clicks[0].x,3)
  g.step(r,{...state,rings:false})
  assert.ok(out.clicks.every(c=>c.age===99))
  g.clearPresses(); g.step(r,state)
  assert.ok(out.clicks.every(c=>c.age===99))
})
test('touch cancel weakens wake without removing click wave', () => {
  const g = new GestureField(), [out,r] = observe()
  g.move(140,220,1000); g.press(140,220,1000)
  g.step(r,{...state,width:390,height:844})
  assert.equal(out.pointer.s,.08)
  g.deactivate();g.step(r,{...state,now:1100,width:390,height:844})
  assert.ok(out.pointer.s < .08); assert.equal(out.clicks[0].age,.1)
})
test('original motion tiers, composed freeze, fails closed on reduced motion', () => {
  assert.equal(STILL_TIME,23.7)
  assert.deepEqual(motionBudget('full','battery',1),{scale:.35,fps:12,speed:1})
  assert.deepEqual(motionBudget('full','balanced',1),{scale:.5,fps:24,speed:1})
  assert.deepEqual(motionBudget('calm','high',2),{scale:.75,fps:15,speed:.9})
  assert.deepEqual(motionBudget('full','high',1,true),{scale:.75,fps:0,speed:0})
  assert.deepEqual(motionBudget('still','balanced',2),{scale:.5,fps:0,speed:0})
})
