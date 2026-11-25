import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';
import {verifyGlb,MAX_GLB_BYTES} from '../experiments/gltf-morph-acceptance/check-glb.mjs';

const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/gltf-morph/blender-4.3.2-original-probes.json',import.meta.url),'utf-8')).cases;
const sha=b=>createHash('sha256').update(b).digest('hex');
const real=(name)=>Buffer.from(fixtures[name].glb_base64,'base64');
const expected=(bytes,lane='editable-animated')=>({
 schema:1,lane,sourceSha256:sha(bytes),nodeIndex:0,meshIndex:0,
 targets:['Raise corners','Drop corner'],minAbsPositionDelta:.25,minWeightChange:.75,
});
function jsonEdit(blob,edit){
 const oldLen=blob.readUInt32LE(12),model=JSON.parse(blob.subarray(20,20+oldLen));
 edit(model);
 let json=Buffer.from(JSON.stringify(model),'utf8');
 json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
 const header=Buffer.from(blob.subarray(0,20)),bin=blob.subarray(20+oldLen);
 header.writeUInt32LE(20+json.length+bin.length,8);
 header.writeUInt32LE(json.length,12);
 return Buffer.concat([header,json,bin]);
}
function check(bytes,verdict,reason,lane){
 const actual=verifyGlb(expected(bytes,lane),bytes);
 assert.equal(actual.verdict,verdict,JSON.stringify(actual));
 assert.equal(actual.reason,reason);
}
test('actual original Blender export preserves two independently animated named shapes',()=>{
 const bytes=real('editable');
 assert.equal(sha(bytes),fixtures.editable.sha256);
 assert.equal(bytes.length,2436);
 const decision=verifyGlb(expected(bytes),bytes);
 assert.equal(decision.reason,'matched_named_animated_controls');
 assert.deepEqual(decision.measured,{targetCount:2,primitiveCount:1,attachedWeightTracks:1});
});
test('actual Blender apply-modifiers export falsely retains a channel but cannot pass either lane',()=>{
 const bytes=real('baked');
 assert.equal(sha(bytes),fixtures.baked.sha256);
 check(bytes,'rejected','target_identity_or_order');
 check(bytes,'rejected','static_contains_morph_controls_or_weights','static');
 const intentionalStatic=jsonEdit(bytes,model=>{delete model.animations;});
 check(intentionalStatic,'matched','intentional_static_controls_absent','static');
});
test('changed bytes, wrong selected mesh and invalid contract do not pass',()=>{
 const bytes=real('editable'),contract=expected(bytes);
 assert.equal(verifyGlb(contract,real('baked')).reason,'source_or_node_mismatch');
 assert.equal(verifyGlb({...contract,meshIndex:1},bytes).reason,'source_or_node_mismatch');
 assert.equal(verifyGlb({...contract,schema:2},bytes).reason,'invalid_contract');
});
test('dense binary reader refuses malformed header and overbudget input',()=>{
 const bytes=real('editable');bytes.writeUInt32LE(bytes.length-1,8);
 check(bytes,'inconclusive','invalid_glb_header');
 const huge=Buffer.alloc(MAX_GLB_BYTES+1);
 check(huge,'inconclusive','invalid_glb_size');
});
test('unnamed targets, sparse positions, cubic weights and external buffer are not guessed',()=>{
 const bytes=real('editable');
 check(jsonEdit(bytes,m=>{delete m.meshes[0].extras.targetNames;}),'inconclusive','unnamed_or_ambiguous_morph_targets');
 check(jsonEdit(bytes,m=>{m.accessors[m.meshes[0].primitives[0].targets[0].POSITION].sparse={};}),
  'inconclusive','unsupported_accessor_encoding');
 check(jsonEdit(bytes,m=>{m.animations[0].samplers[0].interpolation='CUBICSPLINE';}),
  'inconclusive','unsupported_weight_interpolation');
 check(jsonEdit(bytes,m=>{m.buffers[0].uri='missing.bin';}),'inconclusive','unsupported_buffer_or_bounds');
 check(jsonEdit(bytes,m=>{m.extensionsRequired=['KHR_draco_mesh_compression'];}),'inconclusive','unsupported_required_extension');
});
test('cannot read positions outside their declared view, even if file has trailing accessible bytes',()=>{
 const bytes=jsonEdit(real('editable'),m=>{
  const a=m.accessors[m.meshes[0].primitives[0].targets[0].POSITION];a.byteOffset=m.bufferViews[a.bufferView].byteLength;
 });
 check(bytes,'inconclusive','invalid_accessor_bounds_or_sample_budget');
});
test('missing weights are not inferred from another node or a mesh default',()=>{
 const bytes=jsonEdit(real('editable'),m=>{
  m.nodes.push({name:'different node',mesh:0});m.animations[0].channels[0].target.node=1;
 });
 check(bytes,'rejected','missing_changing_attached_weights');
});
test('supported CLI reports exact verdict codes and preserves both input files',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'athena glb cli '));
 try{
  const asset=path.join(d,'original mesh.glb'),contract=path.join(d,'contract.json');
  const cli=fileURLToPath(new URL('../experiments/gltf-morph-acceptance/check-glb.mjs',import.meta.url));
  const run=()=>spawnSync(process.execPath,[cli,contract,asset],{encoding:'utf8',timeout:5000});
  const bytes=real('editable'),document=JSON.stringify(expected(bytes));
  fs.writeFileSync(asset,bytes);fs.writeFileSync(contract,document);
  assert.equal(run().status,0);
  assert.deepEqual(fs.readFileSync(asset),bytes);
  assert.equal(fs.readFileSync(contract,'utf8'),document);
  fs.writeFileSync(asset,real('baked'));assert.equal(run().status,2);
  fs.unlinkSync(asset);assert.equal(run().status,3);
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});
