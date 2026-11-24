import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {checkMorphEvidence,MAX_INPUT_BYTES} from '../experiments/gltf-morph-acceptance/gate.mjs';

const sha='a'.repeat(64);
const contract={schema:1,lane:'editable-animated',sourceSha256:sha,nodeIndex:2,meshIndex:1,targets:['Smile','Blink'],minAbsPositionDelta:.01,minWeightChange:.01};
const zero=[0,0,0,0,0,0],smile=[0,0,0,.25,0,0],blink=[0,.125,0,0,0,0];
const decoded={schema:1,sampleFormat:'glb-2-dense-f32-exhaustive',sourceSha256:sha,nodeIndex:2,meshIndex:1,
 targetNames:['Smile','Blink'],primitives:[{positionCount:2,targetPositions:[smile,zero]},{positionCount:2,targetPositions:[zero,blink]}],
 weightTracks:[{nodeIndex:2,animationIndex:0,interpolation:'LINEAR',times:[0,1,2],weights:[0,0,.5,1,0,0]}],otherAnimationChannels:1};
const check=(edit,expected=contract)=>{const d=structuredClone(decoded);edit?.(d);return checkMorphEvidence(expected,d);};
const match=check=>assert.equal(check.verdict,'matched',JSON.stringify(check));
const rejected=(check,reason)=>assert.deepEqual([check.verdict,check.reason],['rejected',reason]);
const uncertain=(check,reason)=>assert.deepEqual([check.verdict,check.reason],['inconclusive',reason]);

test('accepts exact named decoded geometry and changing weights on the same target node',()=>{
 const verdict=check();match(verdict);assert.deepEqual(verdict.measured,{targetCount:2,primitiveCount:2,attachedWeightTracks:1});
 assert.deepEqual(check(),verdict);
 match(check(d=>{d.weightTracks[0].interpolation='STEP';}));
});
test('cases that report successful motion cannot pass editable acceptance if targets are absent or untied',()=>{
 rejected(check(d=>{d.targetNames=[];d.primitives.forEach(p=>p.targetPositions=[]);d.otherAnimationChannels=4;}),'target_identity_or_order');
 rejected(check(d=>{d.weightTracks=[];d.otherAnimationChannels=4;}),'missing_changing_attached_weights');
 rejected(check(d=>{d.weightTracks[0].nodeIndex=7;d.otherAnimationChannels=4;}),'missing_changing_attached_weights');
 rejected(check(d=>{d.weightTracks[0].weights=[0,0,1,0,0,0];}),'missing_changing_attached_weights');
 rejected(check(d=>{d.primitives[1].targetPositions[1]=zero;}),'missing_nonzero_position_delta');
 rejected(check(d=>{d.targetNames.reverse();}),'target_identity_or_order');
});
test('rejects wrong source/node/mesh and malformed target/sample or sampler data',()=>{
 rejected(check(d=>{d.sourceSha256='b'.repeat(64);}), 'source_or_node_mismatch');
 rejected(check(d=>{d.nodeIndex=3;}), 'source_or_node_mismatch');
 rejected(check(d=>{d.meshIndex=7;}), 'source_or_node_mismatch');
 rejected(check(d=>{d.primitives[1].targetPositions.pop();}),'primitive_target_cardinality');
 rejected(check(d=>{d.primitives[0].targetPositions[0]=[0,.01,0];}),'position_sample_cardinality');
 rejected(check(d=>{d.primitives[0].targetPositions[0][0]=Infinity;}),'nonfinite_sample');
 rejected(check(d=>{d.weightTracks[0].times=[0,0,2];}),'nonincreasing_key_times');
 rejected(check(d=>{d.weightTracks[0].weights.pop();}),'weight_sample_cardinality');
 rejected(check(d=>{d.weightTracks.push(structuredClone(d.weightTracks[0]));}),'duplicate_or_invalid_animation_identity');
});
test('keeps unsupported evidence and intentional static control absence separate',()=>{
 uncertain(check(d=>{d.sampleFormat='quantized';}),'unsupported_sample_format');
 uncertain(check(d=>{d.weightTracks[0].interpolation='CUBICSPLINE';}),'unsupported_weight_interpolation');
 uncertain(check(d=>{d.primitives[0].positionCount=999999;}),'sample_budget_exceeded');
 const staticContract={schema:1,lane:'static',sourceSha256:sha,nodeIndex:2,meshIndex:1};
 const clean=d=>{d.targetNames=[];d.primitives.forEach(p=>p.targetPositions=[]);};
 const verdict=check(d=>{clean(d);d.weightTracks=[];},staticContract);
 match(verdict);assert.match(verdict.scope,/not.*geometry/);
 rejected(check(clean,staticContract),'static_contains_morph_controls_or_weights');
 rejected(check(undefined,staticContract),'static_contains_morph_controls_or_weights');
});
test('read-only CLI requires separate contract and evidence, caps JSON and emits one decision',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'athena morph fixture '));
 const c=path.join(dir,'contract.json'),d=path.join(dir,'decoded.json');
 const script=new URL('../experiments/gltf-morph-acceptance/gate.mjs',import.meta.url);
 const run=()=>spawnSync(process.execPath,[script.pathname,c,d],{encoding:'utf8',timeout:5000});
 try{
  fs.writeFileSync(c,JSON.stringify(contract));fs.writeFileSync(d,JSON.stringify(decoded));const before=[fs.readFileSync(c),fs.readFileSync(d)];
  const success=run();assert.equal(success.status,0,success.stderr);match(JSON.parse(success.stdout));
  assert.deepEqual([fs.readFileSync(c),fs.readFileSync(d)],before);
  fs.writeFileSync(d,JSON.stringify({...decoded,sourceSha256:'b'.repeat(64)}));const mismatch=run();assert.equal(mismatch.status,2);rejected(JSON.parse(mismatch.stdout),'source_or_node_mismatch');
  fs.writeFileSync(d,' '.repeat(MAX_INPUT_BYTES+1));const excess=run();assert.equal(excess.status,3);uncertain(JSON.parse(excess.stdout),'invalid_or_oversized_input');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
