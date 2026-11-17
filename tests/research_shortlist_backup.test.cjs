const {test}=require('node:test'),assert=require('node:assert/strict'),{parseHTML}=require('linkedom');
const catalog={snapshot_date:'2026-11-17',entries:[{id:'a'},{id:'b'}]};
const mod=()=>import('../native/research/shortlist-backup.mjs');
async function fixture(){
 const m=await mod(),{document,window}=parseHTML('<html><body><div id="host"></div></body></html>');
 const root=document.getElementById('host').attachShadow({mode:'open'});root.innerHTML='<div id="catalog"></div>';
 let ids=['a'],stored='["a"]',fail=false;const abort=new AbortController(),downloads=[];
 const close=m.mountBackup({root,catalog,signal:abort.signal,getIds:()=>ids,getStored:()=>stored,replaceIds:next=>{if(fail)throw Error('Storage unavailable');stored=JSON.stringify(next);ids=next;},download:(...x)=>downloads.push(x)});
 const get=s=>root.querySelector('[data-backup-'+s+']');
 const change=file=>{Object.defineProperty(get('file'),'files',{configurable:true,value:file?[file]:[]});get('file').dispatchEvent(new window.Event('change'));};
 const flush=()=>new Promise(r=>setImmediate(r));
 return {m,root,get,change,flush,abort,close,downloads,ids:()=>ids,stored:()=>stored,setIds:v=>{ids=v;},setStored:v=>{stored=v;},fail:()=>{fail=true;}};
}
test('backup round trips exact IDs and rejects plans, duplicates, unknowns and excess bytes',async()=>{
 const m=await mod(),text=m.createBackup(['b','a'],catalog);assert.deepEqual(m.parseBackup(text,catalog).ids,['b','a']);
 const good=JSON.parse(text);for(const value of [{schema_version:1,evidence:'proposal_not_run'},{...good,version:2},{...good,candidate_ids:['a','a']},{...good,candidate_ids:['missing']},{...good,extra:true},{...good,candidate_ids:['a','b','a','b','a']}])assert.throws(()=>m.validateBackup(value,catalog));
 assert.throws(()=>m.parseBackup(' '.repeat(16385),catalog));assert.throws(()=>m.parseBackup('{',catalog));
 assert.equal(m.validateBackup({...good,catalog_snapshot:'old'},catalog).snapshotChanged,true);
});
test('explicit restore persists ordered IDs only after review and exports independently',async()=>{
 const f=await fixture();try{const text=f.m.createBackup(['b'],catalog);f.change({size:text.length,text:async()=>text});await f.flush();assert.deepEqual(f.ids(),['a']);assert.equal(f.get('restore').hidden,false);f.get('restore').click();assert.deepEqual(f.ids(),['b']);assert.equal(f.stored(),'["b"]');f.get('export').click();assert.deepEqual(f.m.parseBackup(f.downloads[0][1],catalog).ids,['b']);}finally{f.close();}
});
test('invalid or oversized input and failed persistence preserve prior state',async()=>{
 const f=await fixture();try{let read=false;f.change({size:16385,text:async()=>{read=true;return '{}';}});await f.flush();assert.equal(read,false);assert.deepEqual(f.ids(),['a']);
 f.change({size:2,text:async()=>'{}'});await f.flush();assert.equal(f.get('restore').hidden,true);assert.deepEqual(f.ids(),['a']);
 const text=f.m.createBackup([],catalog);f.change({size:text.length,text:async()=>text});await f.flush();f.fail();f.get('restore').click();assert.deepEqual(f.ids(),['a']);assert.equal(f.stored(),'["a"]');assert.match(f.get('status').textContent,/Storage unavailable/);
 }finally{f.close();}
});
test('changed session or other-tab storage invalidates pending replacement',async()=>{
 for(const mutate of [f=>f.setIds(['b']),f=>f.setStored('["b"]')]){const f=await fixture();try{const text=f.m.createBackup([],catalog);f.change({size:text.length,text:async()=>text});await f.flush();mutate(f);f.get('restore').click();assert.match(f.get('status').textContent,/changed while reviewing/);}finally{f.close();}}
});
test('cancel, newer file and unmount prevent delayed admission',async()=>{
 for(const action of ['cancel','new','abort']){const f=await fixture();let resolve;const text=f.m.createBackup(['b'],catalog);f.change({size:text.length,text:()=>new Promise(r=>{resolve=r;})});
 if(action==='cancel')f.get('cancel').click();if(action==='new')f.change({size:2,text:async()=>'{}'});if(action==='abort')f.abort.abort();resolve(text);await f.flush();assert.deepEqual(f.ids(),['a']);if(action==='abort')assert.equal(f.root.querySelector('section'),null);else assert.equal(f.get('restore').hidden,true);f.close();}
});
