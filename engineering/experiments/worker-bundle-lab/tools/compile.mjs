import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const started=performance.now(),tool=process.argv[2],destination=process.argv[3];
if(!['esbuild','rolldown'].includes(tool)||!destination)throw Error('Fixed tool and new output path required');
const root=process.env.ATLAS_BUNDLE_REPO||fileURLToPath(new URL('../../../',import.meta.url));
const manifestName=process.argv[4]||'build-manifest.json';
if(!['build-manifest.json','worker-input-manifest.json'].includes(manifestName))throw Error('Only fixed worker manifests are accepted');
const manifest=JSON.parse(await readFile(path.join(root,'docs/card-receiver-lab',manifestName),'utf8'));
const entryName=Object.keys(manifest.artifacts).find(x=>x.startsWith('receiver-worker.'));
if(typeof entryName!=='string'||!/^receiver-worker\.[a-f0-9]{16}\.mjs$/.test(entryName))throw Error('Expected a content-addressed worker entry');
const entry=path.join(root,'docs/card-receiver-lab',entryName);
if(createHash('sha256').update(await readFile(entry)).digest('hex')!==manifest.artifacts[entryName])throw Error('Worker entry does not match its input manifest');
let code,version,warnings=[],inputs=[];
if(tool==='esbuild'){
 const api=await import('esbuild');version=api.version;
 const result=await api.build({absWorkingDir:root,entryPoints:[entry],bundle:true,format:'esm',platform:'browser',target:'esnext',minify:true,write:false,metafile:true,legalComments:'inline'});
 if(result.outputFiles.length!==1)throw Error('Expected one bundle');code=result.outputFiles[0].text;warnings=result.warnings;inputs=Object.keys(result.metafile.inputs).map(p=>path.resolve(root,p));api.stop();
}else{
 const api=await import('rolldown');version=api.VERSION;
 const bundle=await api.rolldown({input:entry,platform:'browser',treeshake:true,onLog(level,log){warnings.push({level,code:log.code,message:log.message});}});
 try{const result=await bundle.generate({format:'esm',minify:true});if(result.output.length!==1||result.output[0].type!=='chunk')throw Error('Expected one code bundle');code=result.output[0].code;inputs=Object.keys(result.output[0].modules);}finally{await bundle.close();}
}
const compilation_ms=performance.now()-started;
const sourceInputs={};for(const input of inputs){const relative=path.relative(root,input).split(path.sep).join('/');if(relative.startsWith('../')||path.isAbsolute(relative))throw Error('Input outside Atlas');sourceInputs[relative]=createHash('sha256').update(await readFile(input)).digest('hex');}
await writeFile(destination,code,{flag:'wx'});
console.log(JSON.stringify({tool,version,node:process.version,compilation_ms,output_bytes:Buffer.byteLength(code),sha256:createHash('sha256').update(code).digest('hex'),entry:'docs/card-receiver-lab/'+entryName,input_manifest:'docs/card-receiver-lab/'+manifestName,inputs:sourceInputs,warnings,scope:'Fresh process compiler experiment; not browser startup or target performance'}));
