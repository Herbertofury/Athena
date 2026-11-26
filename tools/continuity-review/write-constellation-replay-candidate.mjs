#!/usr/bin/env node
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
import {readVerifiedDriveBundle} from './verify-constellation-drive.mjs';

const MAX_OUTPUT = 48*1024*1024;
const USAGE = 'node tools/continuity-review/write-constellation-replay-candidate.mjs --index INDEX.json --snapshot FULL.json.gz --journal JOURNAL.json.gz --output NEW-CANDIDATE.json';
const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
const stableId = x => object(x) && typeof x.id === 'string' && x.id.length>0;
const stamp = n => Number.isSafeInteger(n) && n >= 0;
class CandidateError extends Error {}
const refuse = reason => { throw new CandidateError(reason); };

function positions(rows) {
  const map = new Map();
  for(let i=0;i<rows.length;i++){
    if(!stableId(rows[i]))continue;
    const id=rows[i].id;
    map.set(id, map.has(id)? null : i);
  }
  return map;
}

export function buildReplayCandidate(selected) {
  const {report,snapshotData,journalData}=readVerifiedDriveBundle(selected);
  if(!journalData)refuse('Select a verified backup with a declared journal.');
  const collections={}, unresolved={}, outcomes={};
  for(const name of Object.keys(report.snapshot.retained)){
    const base=snapshotData[name], delta=journalData[name];
    const staged=Array.isArray(base)?base.slice():null;
    const known=staged?positions(staged):null, incoming=positions(delta), review=[];
    const counts={retained:base?.length??null,added:0,newerMerged:0,identical:0,older:0,unresolved:0};
    const defer=(row,reason,baseIndex)=>review.push({reason,...(typeof baseIndex==='number'?{baseIndex}:{}),row});
    for(let index=0;index<delta.length;index++){
      const row=delta[index];
      if(!known){defer(row,'base-collection-absent');continue;}
      if(!stableId(row)){defer(row,'journal-id-unrecognized');continue;}
      if(incoming.get(row.id)!==index){defer(row,'duplicate-journal-id');continue;}
      const at=known.get(row.id);
      if(at===null){defer(row,'duplicate-base-id');continue;}
      if(!stamp(row.updatedAt)){defer(row,'journal-timestamp-unrecognized',at);continue;}
      if(at===undefined){staged.push(row);counts.added++;continue;}
      const prior=staged[at];
      if(!stamp(prior.updatedAt)){defer(row,'base-timestamp-unrecognized',at);continue;}
      if(row.updatedAt<prior.updatedAt){counts.older++;continue;}
      if(row.updatedAt===prior.updatedAt){
        if(isDeepStrictEqual(row,prior))counts.identical++;
        else defer(row,'same-timestamp-different-record',at);
        continue;
      }
      // Preserve all base fields not supplied by the genuinely newer journal.
      // Never stamp writes with wall-clock time.
      staged[at]={...prior,...row,...(prior.createdAt?{createdAt:prior.createdAt}:{})};
      counts.newerMerged++;
    }
    counts.unresolved=review.length;
    collections[name]=staged;
    if(review.length)unresolved[name]=review;
    outcomes[name]=counts;
  }
  const audit={schema:'athena-constellation-replay-audit-v1',outcomes,
    unresolvedCount:Object.values(unresolved).reduce((n,entries)=>n+entries.length,0),
    source:report.source,
    inputHashes:{index:report.index.sha256,snapshot:report.snapshot.sha256,journal:report.journal.sha256},
    warnings:report.warnings,
    scope:'Private inspection candidate only. Originals unchanged. Not an app import or restore file.'};
  return {schema:'athena-constellation-replay-candidate-v1',audit,collections,unresolved};
}

function hash(bytes) {return createHash('sha256').update(bytes).digest('hex');}

export function writeNewCandidate(path, candidate) {
  const encoded=Buffer.from(JSON.stringify(candidate)+'\n');
  if(encoded.length>MAX_OUTPUT)refuse('Candidate exceeds its 48 MiB output budget; nothing was written.');
  let fd;
  try{fd=fs.openSync(path,'wx+',0o600);}
  catch{refuse('Could not create a new candidate file. An existing path is never overwritten.');}
  try{
    fs.writeFileSync(fd,encoded);
    fs.fsyncSync(fd);
    const checked=createHash('sha256'), buf=Buffer.alloc(64*1024);
    let position=0;
    while(position<encoded.length){
      const n=fs.readSync(fd,buf,0,Math.min(buf.length,encoded.length-position),position);
      if(!n)refuse('Could not verify the new candidate. A partial file may remain.');
      checked.update(buf.subarray(0,n));
      position+=n;
    }
    const sha256=hash(encoded);
    if(fs.fstatSync(fd).size!==encoded.length||checked.digest('hex')!==sha256)
      refuse('New candidate bytes did not verify. A partial file may remain.');
    return {sha256,bytes:encoded.length};
  } catch(error){
    if(error instanceof CandidateError)throw error;
    refuse('Writing or verifying the candidate failed. A partial new file may remain.');
  } finally {fs.closeSync(fd);}
}

function main(argv){
  if(argv.length===1&&argv[0]==='--help'){console.log(USAGE);return;}
  const paths={};
  for(let i=0;i<argv.length;i+=2){
    const key=argv[i],value=argv[i+1];
    if(!['--index','--snapshot','--journal','--output'].includes(key)||!value||Object.hasOwn(paths,key))
      refuse('Choose one verified index, snapshot, journal, and new output path.');
    paths[key]=value;
  }
  if(Object.keys(paths).length!==4)refuse('Choose one verified index, snapshot, journal, and new output path.');
  let candidate;
  try{
    candidate=buildReplayCandidate({index:paths['--index'],snapshot:paths['--snapshot'],journal:paths['--journal']});
  }catch(error){
    if(error instanceof CandidateError)throw error;
    refuse('Selected originals did not verify. Run the read-only bundle verifier for details; nothing was written.');
  }
  const output=writeNewCandidate(paths['--output'],candidate);
  process.stdout.write(JSON.stringify({...candidate.audit,output},null,2)+'\n');
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{main(process.argv.slice(2));}
 catch(error){
  process.stderr.write('Replay candidate not completed: '+(error instanceof CandidateError?error.message:'Unsupported local input or output.')+' Original files were not modified.\n');
  process.exitCode=2;
 }
}
