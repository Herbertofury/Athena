const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const {create,MAX_BYTES}=require('./store.cjs');
function adapter(file){return {read:()=>fs.existsSync(file)?fs.readFileSync(file,'utf8'):null,writeAtomic:bytes=>{const temp=file+'.pending';fs.writeFileSync(temp,bytes);fs.renameSync(temp,file);}};}
if(process.argv[2]==='--read'){const store=create(adapter(process.argv[3]));console.log(JSON.stringify({revision:store.revision(),ids:store.search('quasar recovery').map(l=>l.id)}));process.exit();}
const root=path.resolve(__dirname,'../..'),context={};vm.createContext(context);vm.runInContext(fs.readFileSync(root+'/dist/catalog.js','utf8'),context);
const lessons=JSON.parse(JSON.stringify(context.ATHENA_DATA.lessons)),dir=fs.mkdtempSync(path.join(os.tmpdir(),'athena-index-')),file=path.join(dir,'snapshot.json'),results=[];
function check(name,fn){fn();results.push({name,passed:true});}
try{
 let reject=false;const disk=adapter(file),storage={read:disk.read,writeAtomic:bytes=>{if(reject)throw Error('simulated quota failure');disk.writeAtomic(bytes);}},store=create(storage);
 const baseline=store.prepare({schema:1,revision:'actual-corpus-v1',lessons});store.commit(baseline);
 check('Real 98-lesson initial snapshot',()=>assert.equal(store.search('').length,98));
 check('Search results cannot mutate the index',()=>{const rows=store.search('subnet');rows[0].title='poison';assert.notEqual(store.search('subnet')[0].title,'poison');});
 const changed=structuredClone(lessons);changed.find(l=>l.id==='sys-durable-database').summary+=' quasar recovery';
 const draft=store.prepare({schema:1,revision:'synthetic-local-edit-v2',lessons:changed});
 check('Prepared draft does not alter active corpus',()=>assert.equal(store.search('quasar recovery').length,0));
 check('Caller mutation cannot alter prepared draft',()=>{changed[0].id='altered';assert.equal(JSON.parse(draft).lessons[0].id,'troubleshooting');});
 const failures=[];
 check('Quota failure preserves memory and exact disk, draft export remains usable',()=>{reject=true;assert.throws(()=>store.commit(draft),e=>{failures.push(e.message);return /quota/.test(e.message);});assert.equal(store.export(),baseline);assert.equal(fs.readFileSync(file,'utf8'),baseline);reject=false;});
 check('Malformed and duplicate snapshots preserve last good',()=>{for(const bad of ['{broken',JSON.stringify({schema:1,revision:'bad',lessons:[lessons[0],lessons[0]]}),JSON.stringify({schema:1,revision:'bad',lessons:[{...lessons[0],tags:[null]}]})]){assert.throws(()=>store.commit(bad),e=>{failures.push(e.message);return true;});assert.equal(store.export(),baseline);assert.equal(fs.readFileSync(file,'utf8'),baseline);}});
 check('Oversized snapshot explicitly rejected without loss',()=>{assert.throws(()=>store.prepare({schema:1,revision:'huge',lessons:[{...lessons[0],summary:'x'.repeat(MAX_BYTES)}]}),/budget/);assert.equal(store.export(),baseline);});
 store.commit(draft);
 check('Committed local edit becomes discoverable',()=>assert(store.search('quasar recovery').some(l=>l.id==='sys-durable-database')));
 check('New process reopens disk snapshot and changed findings',()=>{const reopened=JSON.parse(cp.execFileSync(process.execPath,[__filename,'--read',file],{encoding:'utf8'}));assert.equal(reopened.revision,'synthetic-local-edit-v2');assert(reopened.ids.includes('sys-durable-database'));});
 check('Explicit rollback restores exact prior disk and results',()=>{store.commit(baseline);assert.equal(store.revision(),'actual-corpus-v1');assert.equal(store.search('quasar recovery').length,0);assert.equal(fs.readFileSync(file,'utf8'),baseline);});
 check('Untrusted serialized function remains data, never executed',()=>{const poison=JSON.parse(baseline);poison.lessons[0].summary='(()=>{throw Error("executed")})()';store.commit(store.prepare(poison));assert(store.search('executed').some(l=>l.id==='troubleshooting'));store.commit(baseline);});
 console.log(JSON.stringify({scope:'R&D lifecycle with actual 98-lesson corpus and explicitly synthetic local edit/quota fault',node:process.version,tests:results,failures_retained:failures,baseline_sha256:crypto.createHash('sha256').update(baseline).digest('hex'),changed_sha256:crypto.createHash('sha256').update(draft).digest('hex'),source_catalog_sha256:crypto.createHash('sha256').update(fs.readFileSync(root+'/dist/catalog.js')).digest('hex'),limits:'Single writer; rename atomicity tested, no fsync/power-loss guarantee; no app integration; bounded 4 MiB; functions are data, no eval in store'},null,2));
}finally{fs.rmSync(dir,{recursive:true,force:true});}
