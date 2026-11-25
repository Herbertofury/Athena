// Narrow offline projection into gate.mjs, not a general glTF validator or decoder.
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {checkMorphEvidence,validMorphContract,readBoundedFile,readJson} from './gate.mjs';

export const MAX_GLB_BYTES=16*1024*1024;
const MAX_JSON_BYTES=2*1024*1024;
const LIMITS={primitives:16,targets:16,positions:2048,animations:128,channels:1024,tracks:32,frames:512,samples:131072};
const GLB=0x46546c67,JSON_CHUNK=0x4e4f534a,BIN_CHUNK=0x004e4942;
class ProjectionError extends Error {}
const ensure=(condition,reason)=>{if(!condition)throw new ProjectionError(reason);};
const index=v=>Number.isSafeInteger(v)&&v>=0;
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const optional=(record,key,otherwise)=>Object.hasOwn(record,key)?record[key]:otherwise;
function recordAt(array,i){
 ensure(Array.isArray(array)&&index(i)&&i<array.length&&object(array[i]),'invalid_index_or_record');
 return array[i];
}
function arrayOf(value,max){
 ensure(Array.isArray(value)&&value.length<=max,'unsupported_structure_or_budget');
 return value;
}
function readContainer(bytes){
 ensure(Buffer.isBuffer(bytes)&&bytes.length>=28&&bytes.length<=MAX_GLB_BYTES,'invalid_glb_size');
 ensure(bytes.readUInt32LE(0)===GLB&&bytes.readUInt32LE(4)===2&&bytes.readUInt32LE(8)===bytes.length,'invalid_glb_header');
 const size=bytes.readUInt32LE(12),end=20+size;
 ensure(bytes.readUInt32LE(16)===JSON_CHUNK&&size>0&&size<=MAX_JSON_BYTES&&size%4===0&&end+8<=bytes.length,'invalid_glb_json_chunk');
 const binSize=bytes.readUInt32LE(end);
 ensure(bytes.readUInt32LE(end+4)===BIN_CHUNK&&binSize%4===0&&end+8+binSize===bytes.length,'unsupported_glb_chunks');
 let model;
 try{model=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(20,end)));}
 catch{throw new ProjectionError('invalid_glb_json');}
 ensure(object(model)&&model.asset?.version==='2.0','unsupported_asset_version');
 const required=optional(model,'extensionsRequired',[]);
 ensure(Array.isArray(required)&&required.length===0,'unsupported_required_extension');
 const buffers=arrayOf(model.buffers,1),buffer=recordAt(buffers,0),length=buffer.byteLength;
 ensure(!Object.hasOwn(buffer,'uri')&&index(length)&&length<=binSize&&binSize-length<=3,
  'unsupported_buffer_or_bounds');
 return {model,bin:bytes.subarray(end+8,end+8+length)};
}

export function verifyGlb(contract,bytes){
 const scope='Selected node, dense POSITION deltas and attached weights only. This does not validate full glTF, visual geometry, materials or importer behavior.';
 const answer=(verdict,reason)=>({verdict,reason,scope});
 if(!validMorphContract(contract))return answer('inconclusive','invalid_contract');
 if(!Buffer.isBuffer(bytes)||bytes.length>MAX_GLB_BYTES)return answer('inconclusive','invalid_glb_size');
 const sourceSha256=createHash('sha256').update(bytes).digest('hex');
 if(sourceSha256!==contract.sourceSha256)return answer('rejected','source_or_node_mismatch');
 try{
  const {model,bin}=readContainer(bytes);
  const node=recordAt(model.nodes,contract.nodeIndex);
  if(node.mesh!==contract.meshIndex)return answer('rejected','source_or_node_mismatch');
  const mesh=recordAt(model.meshes,node.mesh);
  let sampleTotal=0;
  function samples(id,shape,components,maxCount,read=true){
   const a=recordAt(model.accessors,id);
   ensure(a.type===shape&&a.componentType===5126&&!Object.hasOwn(a,'sparse')&&
      !a.normalized&&!a.extensions,'unsupported_accessor_encoding');
   const view=recordAt(model.bufferViews,a.bufferView);
   ensure(view.buffer===0&&!view.extensions,'unsupported_buffer_view');
   const bytesPerElement=components*4,start=optional(view,'byteOffset',0),offset=optional(a,'byteOffset',0),
     stride=optional(view,'byteStride',bytesPerElement),count=a.count,length=view.byteLength;
   ensure(index(start)&&index(offset)&&index(length)&&index(stride)&&index(count)&&count>0&&
      count<=maxCount&&stride>=bytesPerElement&&stride<=252&&stride%4===0&&offset%4===0&&start%4===0&&
      start<=bin.length&&length<=bin.length-start&&offset<=length&&
      (count-1)*stride+bytesPerElement<=length-offset,'invalid_accessor_bounds_or_sample_budget');
   if(!read)return count;
   sampleTotal+=count*components;
   ensure(sampleTotal<=LIMITS.samples,'sample_budget_exceeded');
   const values=[];
   for(let i=0;i<count;i++)for(let j=0;j<components;j++)
    values.push(bin.readFloatLE(start+offset+i*stride+j*4));
   return values;
  }
  const rawPrimitives=arrayOf(mesh.primitives,LIMITS.primitives);
  ensure(rawPrimitives.length>0,'missing_primitives');
  const targets=rawPrimitives.map(p=>{
   ensure(object(p)&&!p.extensions&&object(p.attributes),'unsupported_primitive');
   return arrayOf(optional(p,'targets',[]),LIMITS.targets);
  });
  const targetCount=targets[0].length;
  if(!targets.every(t=>t.length===targetCount))return answer('rejected','primitive_target_cardinality');
  const targetNames=object(mesh.extras)?optional(mesh.extras,'targetNames',[]):[];
  if(targetCount>0&&contract.lane==='static')return answer('rejected','static_contains_morph_controls_or_weights');
  ensure(Array.isArray(targetNames)&&targetNames.length===targetCount,'unnamed_or_ambiguous_morph_targets');
  if(contract.lane==='editable-animated'&&targetCount===0)
   return answer('rejected','target_identity_or_order');
  const primitives=rawPrimitives.map((p,i)=>{
   const positionCount=samples(p.attributes.POSITION,'VEC3',3,LIMITS.positions,false);
   const targetPositions=targets[i].map(target=>{
    ensure(object(target)&&Object.hasOwn(target,'POSITION'),'unsupported_morph_target_encoding');
    return samples(target.POSITION,'VEC3',3,LIMITS.positions);
   });
   return {positionCount,targetPositions};
  });
  const weightTracks=[];
  let channelCount=0;
  for(const [animationIndex,anim] of arrayOf(optional(model,'animations',[]),LIMITS.animations).entries()){
   ensure(object(anim)&&!anim.extensions,'unsupported_animation');
   for(const channel of arrayOf(anim.channels,LIMITS.channels)){
    channelCount+=1;
    ensure(channelCount<=LIMITS.channels&&object(channel)&&!channel.extensions&&
     object(channel.target)&&!channel.target.extensions&&index(channel.target.node)&&
     ['weights','translation','rotation','scale'].includes(channel.target.path),'unsupported_animation_channel_or_budget');
    if(channel.target.path!=='weights'||channel.target.node!==contract.nodeIndex)continue;
    if(contract.lane==='static')return answer('rejected','static_contains_morph_controls_or_weights');
    ensure(weightTracks.length<LIMITS.tracks,'weight_track_budget_exceeded');
    const s=recordAt(anim.samplers,channel.sampler);
    const interpolation=optional(s,'interpolation','LINEAR');
    ensure(['LINEAR','STEP'].includes(interpolation),'unsupported_weight_interpolation');
    weightTracks.push({nodeIndex:contract.nodeIndex,animationIndex,interpolation,
     times:samples(s.input,'SCALAR',1,LIMITS.frames),
     weights:samples(s.output,'SCALAR',1,LIMITS.frames*LIMITS.targets)});
   }
  }
  return checkMorphEvidence(contract,{schema:1,sampleFormat:'glb-2-dense-f32-exhaustive',
   sourceSha256,nodeIndex:contract.nodeIndex,meshIndex:node.mesh,targetNames,primitives,weightTracks});
 }catch(error){
  return answer('inconclusive',error instanceof ProjectionError?error.message:'invalid_glb_projection');
 }
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 let result;
 try{
  if(process.argv.length!==4)throw Error('one contract and one GLB required');
  result=verifyGlb(readJson(process.argv[2]),readBoundedFile(process.argv[3],MAX_GLB_BYTES));
 }catch{result={verdict:'inconclusive',reason:'invalid_or_oversized_input'};}
 process.stdout.write(JSON.stringify(result)+'\n');
 process.exitCode={matched:0,rejected:2,inconclusive:3}[result.verdict];
}
