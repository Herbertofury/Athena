import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,lstatSync,realpathSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {buildCases,original} from './fixtures.mjs';

export const ROOT=dirname(fileURLToPath(import.meta.url));
export const VERSION='2.0.0-dev.3.10';
export const SCOPE='Official glTF Validator on original tiny fixtures plus a limited animation/geometry data contract. No rendering, animation playback, importer, game, target compatibility, or performance acceptance.';
const INPUTS=['run.mjs','fixtures.mjs','dependency.json','initial-hypothesis.json'];
const FILES=['ISSUES.md','LICENSE','NOTICES','README.md','gltf_validator.dart.js','index.js','module.mjs','package.json','validation.schema.json'];
const MAX=1048576;
export const canonical=value=>JSON.stringify(value,null,2)+'\n';
export const sha=data=>createHash('sha256').update(data).digest('hex');
export const equal=isDeepStrictEqual;
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
function object(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function keys(value,names){assert(object(value));assert.deepEqual(Object.keys(value).sort(),[...names].sort());}
export function parseCanonical(text){assert(typeof text==='string'&&Buffer.byteLength(text)<=MAX);const value=JSON.parse(text);assert.equal(text,canonical(value),'Canonical JSON required; duplicate keys or alternate number encodings are not accepted');return value;}
function read(path,limit=MAX){assert(lstatSync(path).isFile(),'Regular file required');const size=lstatSync(path).size;assert(integer(size,0,limit),'Byte budget exceeded');const value=readFileSync(path);assert(value.length<=limit);return value;}
function readJSON(path){return parseCanonical(read(path).toString('utf8'));}
export function identity(){return Object.fromEntries(INPUTS.map(name=>[name,sha(read(join(ROOT,name)))]));}
export function dependency(){
  const d=readJSON(join(ROOT,'dependency.json'));
  keys(d,['name','version','url','bytes','sha256','sha512_integrity','git_head','published_at','files','supported_extensions']);
  assert.equal(d.name,'gltf-validator');assert.equal(d.version,VERSION);assert.equal(d.url,'https://registry.npmjs.org/gltf-validator/-/gltf-validator-2.0.0-dev.3.10.tgz');
  assert.equal(d.bytes,110015);assert.equal(d.sha256,'4e03dbdc3bc0d1342afd5d2d7ae341a7e3474502ccb872b02dbbaddaee0fdec6');assert.equal(d.git_head,'bcd52cc4ba5f333b2999a58f67cc05ddf28b4fb1');
  assert.equal(d.sha512_integrity,'sha512-odJ4k0tRkGXiDGn78yDBg+fBbAIvBnXxh3RwAta0emSxGtyagFE8B4xELB1oYe3S5RD8Ci3uZAsZaascH2LAEQ==');
  assert.equal(d.published_at,'2024-10-22T14:21:47.401Z');keys(d.files,FILES);
  for(const value of Object.values(d.files)){keys(value,['bytes','sha256']);assert(integer(value.bytes,1,500000));assert.match(value.sha256,/^[0-9a-f]{64}$/);}
  assert(Array.isArray(d.supported_extensions)&&d.supported_extensions.length===18&&d.supported_extensions.every(x=>typeof x==='string'&&/^[A-Z][A-Za-z0-9_]+$/.test(x)));
  assert.equal(new Set(d.supported_extensions).size,18);return d;
}
export function verifyPackage(directory){
  const root=realpathSync(directory),d=dependency();
  for(const name of FILES){const b=read(join(root,name),500000);assert.equal(b.length,d.files[name].bytes);assert.equal(sha(b),d.files[name].sha256,`Dependency file mismatch: ${name}`);}
  const require=createRequire(import.meta.url),validator=require(join(root,'index.js'));
  assert.equal(validator.version(),VERSION);assert.deepEqual(validator.supportedExtensions(),d.supported_extensions);return validator;
}
export function validateCases(cases){
  assert(Array.isArray(cases)&&cases.length===10);const seen=new Set();
  for(const c of cases){
    keys(c,['id','document','resources','read_resources','max_issues','expected']);assert.match(c.id,/^[a-z_]{1,64}$/);assert(!seen.has(c.id));seen.add(c.id);
    assert(object(c.document)&&object(c.resources));assert(Buffer.byteLength(JSON.stringify(c.document))<=16384);assert(Object.keys(c.resources).length<=1);
    for(const [name,hex] of Object.entries(c.resources)){assert.equal(name,'scene.bin');assert(typeof hex==='string'&&/^(?:[0-9a-f]{2}){1,4096}$/.test(hex));}
    assert.equal(typeof c.read_resources,'boolean');assert([1,128].includes(c.max_issues));keys(c.expected,['num_errors','issue_codes','is_truncated','fixture_gate']);
    assert(integer(c.expected.num_errors,0,128));assert.equal(typeof c.expected.is_truncated,'boolean');assert.equal(typeof c.expected.fixture_gate,'boolean');assert(Array.isArray(c.expected.issue_codes)&&c.expected.issue_codes.every(x=>typeof x==='string'&&/^[A-Z0-9_]+$/.test(x)));
  }
  return cases;
}
function accessor(c,index){
  const a=c.document.accessors[index];assert(object(a));assert(integer(a.count,1,64));assert([5126,5123].includes(a.componentType));assert(['SCALAR','VEC3'].includes(a.type));assert(!a.normalized);
  const view=c.document.bufferViews[a.bufferView],buffer=c.document.buffers[view.buffer];assert(object(view)&&object(buffer));assert.equal(buffer.uri,'scene.bin');assert(Object.hasOwn(c.resources,buffer.uri));
  const bytes=Buffer.from(c.resources[buffer.uri],'hex'),width=a.componentType===5126?4:2,components=a.type==='VEC3'?3:1;
  const offset=(view.byteOffset??0)+(a.byteOffset??0),stride=view.byteStride??width*components;
  assert(integer(offset,0,4096)&&integer(stride,width*components,4096));assert(integer(view.byteLength,1,4096));assert(integer(buffer.byteLength,1,4096));
  const end=offset+(a.count-1)*stride+components*width;assert(end<=bytes.length&&end<=buffer.byteLength&&end<=(view.byteOffset??0)+view.byteLength);
  const values=[];
  for(let i=0;i<a.count;i++){const row=[];for(let j=0;j<components;j++){const p=offset+i*stride+j*width;const v=a.componentType===5126?bytes.readFloatLE(p):bytes.readUInt16LE(p);assert(Number.isFinite(v));row.push(v);}values.push(components===1?row[0]:row);}
  return values;
}
export function projectFixture(c){
  try {
    const d=c.document;assert(d.scenes.length===1&&d.nodes.length===1&&d.meshes.length===1&&d.meshes[0].primitives.length===1);
    const primitive=d.meshes[0].primitives[0];assert.equal(primitive.mode,4);
    return {status:'projected',value:{scene:d.scene,scene_nodes:d.scenes[0].nodes,nodes:d.nodes.map(n=>({mesh:n.mesh,matrix:n.matrix??null,translation:n.translation??null,rotation:n.rotation??null,scale:n.scale??null})),positions:accessor(c,primitive.attributes.POSITION),indices:accessor(c,primitive.indices),animations:(d.animations??[]).map(a=>({name:a.name,samplers:a.samplers.map(s=>({input:accessor(c,s.input),output:accessor(c,s.output),interpolation:s.interpolation??'LINEAR'})),channels:a.channels}))}};
  } catch {return {status:'unavailable_or_outside_tiny_fixture_contract',value:null};}
}
export function validateReport(report,id){
  keys(report,['uri','mimeType','validatorVersion','issues','info']);assert.equal(report.uri,id+'.gltf');assert.equal(report.mimeType,'model/gltf+json');assert.equal(report.validatorVersion,VERSION);assert(object(report.info));
  const q=report.issues;keys(q,['numErrors','numWarnings','numInfos','numHints','messages','truncated']);assert.equal(typeof q.truncated,'boolean');assert(Array.isArray(q.messages)&&q.messages.length<=128);
  const counts=[0,0,0,0];
  for(const item of q.messages){assert(object(item));assert(typeof item.code==='string'&&/^[A-Z0-9_]+$/.test(item.code));assert(typeof item.message==='string'&&item.message.length<=4096);assert(integer(item.severity,0,3));counts[item.severity]++;assert(Object.keys(item).every(k=>['code','message','severity','pointer','offset'].includes(k)));if(Object.hasOwn(item,'pointer'))assert(typeof item.pointer==='string'&&item.pointer.length<=512);if(Object.hasOwn(item,'offset'))assert(integer(item.offset,0,65536));}
  ['numErrors','numWarnings','numInfos','numHints'].forEach((key,i)=>{assert(integer(q[key],0,128));assert.equal(q[key],counts[i]);});return q;
}
export function derive(runs,cases,supported){
  validateCases(cases);assert(Array.isArray(supported)&&supported.length<=64&&supported.every(x=>typeof x==='string'&&/^[A-Z][A-Za-z0-9_]+$/.test(x)));assert.equal(new Set(supported).size,supported.length);
  assert(Array.isArray(runs)&&runs.length===cases.length);const baseline=projectFixture({...original()}).value;assert(baseline!==null);
  const observations=runs.map((run,index)=>{
    const c=cases[index];keys(run,['id','requests','report']);assert.equal(run.id,c.id);assert(Array.isArray(run.requests)&&run.requests.length<=8);
    for(const request of run.requests){keys(request,['uri','found']);assert.equal(request.uri,'scene.bin');assert.equal(typeof request.found,'boolean');assert.equal(request.found,Object.hasOwn(c.resources,request.uri));}
    if(!c.read_resources)assert.equal(run.requests.length,0);
    const q=validateReport(run.report,c.id),codes=q.messages.map(m=>m.code),projection=projectFixture(c);
    const resourcesChecked=c.read_resources&&c.document.buffers.every(b=>run.requests.some(r=>r.uri===b.uri&&r.found));
    const required=c.document.extensionsRequired??[],unsupported=required.filter(name=>!supported.includes(name));
    const gates={report_complete:!q.truncated,zero_validator_errors:q.numErrors===0,external_buffers_supplied:resourcesChecked,validator_supports_required_extensions:unsupported.length===0,fixture_contract_matches:projection.status==='projected'&&equal(projection.value,baseline)};
    const pass=Object.values(gates).every(Boolean);
    const expected=c.expected;const matches=q.numErrors===expected.num_errors&&q.truncated===expected.is_truncated&&equal([...codes].sort(),[...expected.issue_codes].sort())&&pass===expected.fixture_gate;
    return {id:c.id,document_sha256:sha(JSON.stringify(c.document)),resource_sha256:Object.fromEntries(Object.entries(c.resources).map(([n,h])=>[n,sha(Buffer.from(h,'hex'))])),report_sha256:sha(canonical(run.report)),issue_codes:codes,unsupported_required_extensions:unsupported,projection,gates,fixture_gate_passed:pass,matches_expected:matches};
  });
  return {observations,case_count:observations.length,fixture_gates_passed:observations.filter(x=>x.fixture_gate_passed).length,all_expected:observations.every(x=>x.matches_expected)};
}
export function validateReceipt(receipt){
  keys(receipt,['schema_version','scope','recorded_at_utc','runtime','dependency','input_sha256','cases','supported_extensions','runs','observations','case_count','fixture_gates_passed','all_expected','native_acceptance']);assert.equal(receipt.schema_version,1);assert.equal(receipt.scope,SCOPE);assert.equal(receipt.native_acceptance,'not_run');
  assert.match(receipt.recorded_at_utc,/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);assert.equal(new Date(receipt.recorded_at_utc).toISOString(),receipt.recorded_at_utc);
  keys(receipt.runtime,['node','platform','architecture']);for(const v of Object.values(receipt.runtime))assert(typeof v==='string'&&v.length>0&&v.length<=128);
  assert.deepEqual(receipt.dependency,dependency());assert.deepEqual(receipt.input_sha256,identity());assert.deepEqual(receipt.cases,buildCases());assert.deepEqual(receipt.supported_extensions,dependency().supported_extensions);
  const derived=derive(receipt.runs,receipt.cases,receipt.supported_extensions);for(const [key,value]of Object.entries(derived))assert.deepEqual(receipt[key],value);return derived;
}
export async function execute(packageDirectory){
  const validator=verifyPackage(packageDirectory),cases=validateCases(buildCases()),supported=validator.supportedExtensions(),runs=[];
  for(const c of cases){
    const requests=[],options={uri:c.id+'.gltf',writeTimestamp:false,maxIssues:c.max_issues};
    if(c.read_resources)options.externalResourceFunction=async uri=>{const found=Object.hasOwn(c.resources,uri);requests.push({uri,found});if(!found)throw new Error('Resource unavailable in original fixture map');return new Uint8Array(Buffer.from(c.resources[uri],'hex'));};
    const report=await validator.validateString(JSON.stringify(c.document),options);runs.push({id:c.id,requests,report});
  }
  const receipt={schema_version:1,scope:SCOPE,recorded_at_utc:new Date().toISOString(),runtime:{node:process.version,platform:process.platform,architecture:process.arch},dependency:dependency(),input_sha256:identity(),cases,supported_extensions:supported,runs,...derive(runs,cases,supported),native_acceptance:'not_run'};
  validateReceipt(receipt);return receipt;
}
export async function main(args=process.argv.slice(2)){
  try{
    if(args.length===2&&args[0]==='--verify-receipt'){const r=validateReceipt(readJSON(resolve(args[1])));console.log(JSON.stringify({cases:r.case_count,fixture_gates_passed:r.fixture_gates_passed,all_expected:r.all_expected}));return r.all_expected?0:1;}
    assert(args.length===4&&args[0]==='--package'&&args[2]==='--output','Use --package LOCAL_PACKAGE_DIR --output NEW_RECEIPT or --verify-receipt RECEIPT');
    const output=resolve(args[3]);try{lstatSync(output);throw new Error('Output exists; preserve evidence');}catch(e){if(e.code!=='ENOENT')throw e;}
    const receipt=await execute(resolve(args[1]));writeFileSync(output,canonical(receipt),{flag:'wx'});console.log(JSON.stringify({cases:receipt.case_count,fixture_gates_passed:receipt.fixture_gates_passed,all_expected:receipt.all_expected}));return receipt.all_expected?0:1;
  }catch(error){console.error(error.message);return 2;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)process.exitCode=await main();
