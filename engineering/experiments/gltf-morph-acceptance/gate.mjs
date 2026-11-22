// This is a decision over supplied decoded numeric evidence, not a glTF parser.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const MAX_INPUT_BYTES=2*1024*1024;
const FORMAT='glb-2-dense-f32-exhaustive',MAX_PRIMITIVES=16,MAX_TARGETS=16,MAX_POSITIONS=2048,MAX_TRACKS=32,MAX_FRAMES=512,MAX_SAMPLES=131072;
const scope='One decoded node only. A matching decision is not geometry/visual, importer, runtime, or provenance acceptance.';
const decision=(verdict,reason,measured)=>({verdict,reason,scope,...(measured?{measured}:{})});
const rejected=reason=>decision('rejected',reason),uncertain=reason=>decision('inconclusive',reason);
const index=value=>Number.isSafeInteger(value)&&value>=0;
const digest=value=>typeof value==='string'&&value.length===64&&/^[a-f0-9]{64}$/.test(value);
const bounded=(items,min,max)=>Array.isArray(items)&&items.length>=min&&items.length<=max;
function names(value,min){
 return bounded(value,min,MAX_TARGETS)&&Array.from(value).every(name=>typeof name==='string'&&name===name.trim()&&name.length>0&&name.length<=100)&&new Set(value).size===value.length;
}
const positive=value=>Number.isFinite(value)&&value>0;
function sameSource(expected,observed){
 return expected.sourceSha256===observed.sourceSha256&&expected.nodeIndex===observed.nodeIndex&&expected.meshIndex===observed.meshIndex;
}

export function checkMorphEvidence(contract,evidence){
 if(contract?.schema!==1||!['editable-animated','static'].includes(contract.lane)||!digest(contract.sourceSha256)||!index(contract.nodeIndex)||!index(contract.meshIndex))return uncertain('invalid_contract');
 const editable=contract.lane==='editable-animated';
 if(editable&&(!names(contract.targets,1)||!positive(contract.minAbsPositionDelta)||!positive(contract.minWeightChange)))return uncertain('invalid_contract');
 if(evidence?.schema!==1||evidence.sampleFormat!==FORMAT)return uncertain('unsupported_sample_format');
 if(!sameSource(contract,evidence))return rejected('source_or_node_mismatch');
 if(!bounded(evidence.primitives,1,MAX_PRIMITIVES)||!bounded(evidence.weightTracks,0,MAX_TRACKS)||!names(evidence.targetNames,0))return uncertain('invalid_projection_or_structure_budget');
 const targetCount=evidence.targetNames.length,primitiveCount=evidence.primitives.length;
 if(editable&&(contract.targets.length!==targetCount||contract.targets.some((name,i)=>name!==evidence.targetNames[i])))return rejected('target_identity_or_order');
 if(!editable&&targetCount)return rejected('static_contains_morph_controls_or_weights');

 let samples=0,attachedWeightTracks=0;
 const nonzero=Array(targetCount).fill(false),moving=Array(targetCount).fill(false);
 for(const primitive of evidence.primitives){
  if(!index(primitive?.positionCount)||!primitive.positionCount)return rejected('invalid_position_count');
  if(primitive.positionCount>MAX_POSITIONS)return uncertain('sample_budget_exceeded');
  if(!Array.isArray(primitive.targetPositions)||primitive.targetPositions.length!==targetCount)return rejected('primitive_target_cardinality');
  for(let target=0;target<targetCount;target++){
   const data=primitive.targetPositions[target],expected=primitive.positionCount*3;
   if(!Array.isArray(data)||data.length!==expected)return rejected('position_sample_cardinality');
   samples+=expected;if(samples>MAX_SAMPLES)return uncertain('sample_budget_exceeded');
   for(const component of data){
    if(!Number.isFinite(component))return rejected('nonfinite_sample');
    if(Math.abs(component)>=contract.minAbsPositionDelta)nonzero[target]=true;
   }
  }
 }
 if(editable&&nonzero.some(value=>!value))return rejected('missing_nonzero_position_delta');

 const seenAnimations=new Set();
 for(const track of evidence.weightTracks){
  if(!index(track?.nodeIndex))return rejected('invalid_weight_track_node');
  if(track.nodeIndex!==contract.nodeIndex)continue;
  if(!editable)return rejected('static_contains_morph_controls_or_weights');
  if(!index(track.animationIndex)||seenAnimations.has(track.animationIndex))return rejected('duplicate_or_invalid_animation_identity');
  seenAnimations.add(track.animationIndex);
  if(!['LINEAR','STEP'].includes(track.interpolation))return uncertain('unsupported_weight_interpolation');
  if(!Array.isArray(track.times)||track.times.length<2)return rejected('weight_key_count');
  const frames=track.times.length;
  if(frames>MAX_FRAMES)return uncertain('sample_budget_exceeded');
  if(!Array.isArray(track.weights)||track.weights.length!==frames*targetCount)return rejected('weight_sample_cardinality');
  samples+=frames+track.weights.length;if(samples>MAX_SAMPLES)return uncertain('sample_budget_exceeded');
  let previous=-Infinity;
  for(const time of track.times){
   if(!Number.isFinite(time)||time<0)return rejected('invalid_key_time');
   if(time<=previous)return rejected('nonincreasing_key_times');
   previous=time;
  }
  const low=Array(targetCount).fill(Infinity),high=Array(targetCount).fill(-Infinity);
  for(const [i,value] of track.weights.entries()){
   if(!Number.isFinite(value))return rejected('nonfinite_sample');
   const target=i%targetCount;
   if(value<low[target])low[target]=value;if(value>high[target])high[target]=value;
  }
  for(let i=0;i<targetCount;i++)if(high[i]-low[i]>=contract.minWeightChange)moving[i]=true;
  attachedWeightTracks++;
 }
 if(editable&&moving.some(value=>!value))return rejected('missing_changing_attached_weights');
 return decision('matched',editable?'matched_named_animated_controls':'intentional_static_controls_absent',{targetCount,primitiveCount,attachedWeightTracks});
}

function readJson(file){
 if(!fs.lstatSync(file).isFile())throw Error('regular file required');
 const fd=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NONBLOCK||0)|(fs.constants.O_NOFOLLOW||0));
 try{
  const info=fs.fstatSync(fd);
  if(!info.isFile()||info.size<1||info.size>MAX_INPUT_BYTES)throw Error('size budget');
  const buffer=Buffer.allocUnsafe(MAX_INPUT_BYTES+1);
  let size=0;
  while(size<buffer.length){
   const read=fs.readSync(fd,buffer,size,buffer.length-size,null);
   if(!read)break;size+=read;
  }
  if(size>MAX_INPUT_BYTES)throw Error('size budget');
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,size)));
 }finally{fs.closeSync(fd);}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 let result;
 try{
  if(process.argv.length!==4)throw Error('two JSON files required');
  result=checkMorphEvidence(readJson(process.argv[2]),readJson(process.argv[3]));
 }catch{result=uncertain('invalid_or_oversized_input');}
 process.stdout.write(JSON.stringify(result)+'\n');
 process.exitCode={matched:0,rejected:2,inconclusive:3}[result.verdict];
}
