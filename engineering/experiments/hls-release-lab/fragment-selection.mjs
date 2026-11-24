import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
if(process.argv.length!==5)throw Error('Usage: node fragment-selection.mjs VERIFIED_STAGE TRUSTED_ESBUILD_INSTALL NEW_OUTPUT');
const stage=path.resolve(process.argv[2]),tool=path.join(path.resolve(process.argv[3]),'node_modules/esbuild'),out=path.resolve(process.argv[4]);
if(fs.existsSync(out))throw Error('Output must be new; preserve prior evidence');
const expected={'src/controller/fragment-finders.ts':'02025291966397a3245fabde66b8e3dbde9ccbcfc224a89aa873b8cd01f38646','src/utils/binary-search.ts':'f5870cbde5e148b50f241122e7a17a3493e9ebb96d84b61e914623ecc783db29'};
for(const v of ['1.7.3','1.7.4'])for(const [file,hash]of Object.entries(expected)){
 const bytes=fs.readFileSync(path.join(stage,'packages',`source-${v}`,file));
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('Unverified source rejected before compilation');
}
fs.mkdirSync(out,{recursive:false});
globalThis.fetch=()=>{throw Error('Network forbidden in source fixture');};
if(JSON.parse(fs.readFileSync(path.join(tool,'package.json'))).version!=='0.28.2')throw Error('Compiler mismatch');
const {build}=await import(pathToFileURL(path.join(tool,'lib/main.js')));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const receipt={schema_version:1,runtime:process.version,compiler:'esbuild 0.28.2',evaluator_sha256:sha(fs.readFileSync(new URL(import.meta.url))),source_dependencies:expected,scope:'Synthetic source-level fragment-selection observations; no playback, network, improvement or promotion claim',versions:[],cases:[],promoted:false};
for(const v of ['1.7.3','1.7.4']){
 const source=path.join(stage,`packages/source-${v}/src/controller/fragment-finders.ts`);
 const artifact=path.join(out,`finder-${v}.mjs`);
 await build({entryPoints:[source],bundle:true,platform:'node',format:'esm',outfile:artifact,logLevel:'silent'});
 receipt.versions.push({version:v,source_sha256:sha(fs.readFileSync(source)),bundle_sha256:sha(fs.readFileSync(artifact))});
 const {findFragmentByPTS}=await import(pathToFileURL(artifact));
 function ladder(level){return Array.from({length:100},(_,sn)=>({level,sn,start:sn*6.006,duration:6.006,end:(sn+1)*6.006,endPTS:(sn+1)*6.006,endDTS:(sn+1)*6.006,deltaPTS:0,tagList:[['INF','6.006']]}));}
 const levels=[ladder(0),ladder(1)];
 for(const sn of [0,1,49,98])for(const level of [0,1])for(const early of [0,0.1,0.3,1])for(const tolerance of [0,0.25]){
  const previous=levels[0][sn];const next=findFragmentByPTS(previous,levels[level],previous.end-early,tolerance);
  receipt.cases.push({version:v,previous_sn:sn,target_level:level,buffer_shortfall:early,tolerance,selected_sn:next?.sn??null,selected_level:next?.level??null});
 }
}
receipt.complete=receipt.cases.length===128;
const a=receipt.cases.filter(x=>x.version==='1.7.3'),b=receipt.cases.filter(x=>x.version==='1.7.4');
receipt.cross_version_same_selection=a.every((x,i)=>x.selected_sn===b[i].selected_sn&&x.selected_level===b[i].selected_level);
fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({complete:receipt.complete,cases:receipt.cases.length,same:receipt.cross_version_same_selection}));
