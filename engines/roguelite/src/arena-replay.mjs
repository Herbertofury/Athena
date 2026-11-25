// SPDX-License-Identifier: GPL-3.0-or-later
// A portable input stream, not a writable engine-state serialization. The
// same deterministic engine is used to replay saved inputs and to resume.
import {createLegacySurvivorRun} from './legacy-survivor-run.mjs';
import {arenaFormat} from './arena-formats.mjs';
export const ARENA_TAPE_SCHEMA='athena.survivor-arena.tape.v1';
export const ARENA_REPLAY_RULES='gamesync-live-v1+ramp-20261125+lcg32-60hz';
export const ARENA_STEP=1/60;
export const ARENA_TAPE_MAX_BYTES=8*1024*1024;
export const ARENA_TAPE_MAX_TICKS=8*60*60*60;
const MAX_SEGMENTS=450000;
const groups=[['KeyW','ArrowUp'],['KeyS','ArrowDown'],['KeyA','ArrowLeft'],['KeyD','ArrowRight'],['ShiftLeft','ShiftRight']];
const keysByMask=Array.from({length:32},(_,mask)=>Object.freeze(Object.fromEntries(groups.flatMap(([key],i)=>mask&(1<<i)?[[key,true]]:[]))));
const readMask=keys=>groups.reduce((n,pair,i)=>n|(pair.some(k=>!!keys?.[k])?1<<i:0),0);
const uint=(n,cap)=>Number.isSafeInteger(n)&&n>=0&&n<=cap;
function exact(a,fields){
 if(a===null||typeof a!=='object'||Object.getPrototypeOf(a)!==Object.prototype||
    Object.keys(a).length!==fields.length||fields.some(k=>!Object.hasOwn(a,k)))throw Error('Invalid Arena tape shape');
}

export function createRecordedArena({seed,format='classic'}={}){
 if(!uint(seed,2**32-1))throw RangeError('Invalid Arena seed');
 arenaFormat(format);
 let cursor=seed>>>0,ticks=0,phase='running',truncated=false;
 const host=createLegacySurvivorRun({format,seed,random:()=>{cursor=(Math.imul(cursor,1664525)+1013904223)>>>0;return cursor/4294967296;}});
 const input=[];
 function advance(mask){
  if(!uint(mask,31))throw Error('Invalid Arena input mask');
  if(phase!=='running')throw Error('No movement expected during a choice or after the run ends');
  const next=host.step({dt:ARENA_STEP,keys:keysByMask[mask]});
  if(!truncated){
   if(ticks===ARENA_TAPE_MAX_TICKS||input.length===MAX_SEGMENTS){truncated=true;}
   else {
    const previous=input.at(-1);
    if(typeof previous?.[0]==='number'&&previous[0]===mask)previous[1]++;
    else input.push([mask,1]);
   }
  }
  ticks++;
  phase=next.status;
  return next;
 }
 function choose(id){
  if(phase!=='choice'||typeof id!=='string'||id.length>96)throw Error('No such pending Arena choice');
  const next=host.choose(id),view=host.snapshot();
  if(!truncated){if(input.length===MAX_SEGMENTS)truncated=true;else input.push([id]);}
  phase=view.run.gameOver?'finished':'running';
  return next;
 }
 function capture(){
  if(truncated)throw Error('This run is beyond the portable replay limit. You can keep playing.');
  return {header:{schema:ARENA_TAPE_SCHEMA,rules:ARENA_REPLAY_RULES,seed,format,ticks,inputs:structuredClone(input)},
   final:JSON.stringify({phase,cursor,world:host.snapshot()})};
 }
 return Object.freeze({
  step:({keys}={})=>advance(readMask(keys)),advance,choose,capture,
  snapshot:host.snapshot,phase:()=>phase,canSave:()=>!truncated,
 });
}

export async function encodeArenaTape(session,digest){
 const {header,final}=session.capture();
 const state_sha256=await digest(final);
 if(!/^[a-f0-9]{64}$/.test(state_sha256))throw Error('Invalid digest implementation');
 const out=JSON.stringify({...header,state_sha256})+'\n';
 if(new TextEncoder().encode(out).byteLength>ARENA_TAPE_MAX_BYTES)throw Error('This run is beyond the portable replay size limit');
 return out;
}

export async function decodeArenaTape(text,{digest,yieldTask=()=>Promise.resolve(),onProgress=()=>{},cancelled=()=>false}={}){
 if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>ARENA_TAPE_MAX_BYTES)throw Error('Arena tape exceeds portable size limit');
 const data=JSON.parse(text);
 exact(data,['schema','rules','seed','format','ticks','inputs','state_sha256']);
 if(data.schema!==ARENA_TAPE_SCHEMA||data.rules!==ARENA_REPLAY_RULES||
    !Array.isArray(data.inputs)||data.inputs.length>MAX_SEGMENTS||!uint(data.ticks,ARENA_TAPE_MAX_TICKS)||
    typeof data.state_sha256!=='string'||!/^[a-f0-9]{64}$/.test(data.state_sha256))throw Error('Incompatible Arena tape');
 const match=createRecordedArena({seed:data.seed,format:data.format});
 let observed=0;
 let prior=-1;
 for(const entry of data.inputs){
  if(cancelled())throw Error('Replay cancelled');
  if(!Array.isArray(entry))throw Error('Invalid Arena replay event');
  if(entry.length===1){
   match.choose(entry[0]);prior=-1;continue;
  }
  if(entry.length!==2||!uint(entry[0],31)||!uint(entry[1],ARENA_TAPE_MAX_TICKS)||entry[1]===0||
     prior===entry[0]||entry[1]+observed>data.ticks)throw Error('Invalid Arena input span');
  prior=entry[0];
  for(let i=0;i<entry[1];i++){
   match.advance(entry[0]);observed++;
   if(observed%4096===0){onProgress(observed,data.ticks);await yieldTask();if(cancelled())throw Error('Replay cancelled');}
  }
 }
 if(observed!==data.ticks||await encodeArenaTape(match,digest)!==text)throw Error('Arena replay state or canonical format did not match');
 onProgress(observed,data.ticks);
 return match;
}
