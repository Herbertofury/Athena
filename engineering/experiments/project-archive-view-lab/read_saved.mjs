import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadSavedProject,createArchiveSelection} from '../../apps/atlas-lab/ui/archive-view.mjs';
const expected=JSON.parse(readFileSync(process.argv[2],'utf8')),checks=[];
const fetchImpl=(path,options)=>fetch('http://127.0.0.1:41379'+path,options);
for(const [id,want]of Object.entries(expected)){
 const record=await loadSavedProject(id,{fetchImpl});
 assert.equal(record.generation,want.generation);assert.equal(record.hash,want.sha256);assert.equal(record.bytes.byteLength,want.bytes);
 assert.equal(createHash('sha256').update(Buffer.from(record.text,'utf8')).digest('hex'),want.sha256);
 checks.push({id,exact_byte_hash:true,text_reencodes_exactly:true,generation:record.generation,bytes:record.bytes.byteLength});
}
const selected=createArchiveSelection((id,options)=>loadSavedProject(id,{...options,fetchImpl}));await selected.load('AANobbMI');const good=selected.last;
for(const bad of ['MISS0001','CORRUPT1','BIG00001']){await assert.rejects(selected.load(bad));assert.equal(selected.last,good);checks.push({id:bad,last_good_retained:true});}
const pending=selected.load('TEST0001');selected.cancel();assert.equal((await pending).status,'superseded');assert.equal(selected.last,good);checks.push({cancelled_request_retained_last_good:true});
const receipt={scope:'actual JavaScript reader against owned loopback server; no DOM/native-browser interaction or provider requests',harness_sha256:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),reader_sha256:createHash('sha256').update(readFileSync(new URL('../../apps/atlas-lab/ui/archive-view.mjs',import.meta.url))).digest('hex'),checks,completed:true};writeFileSync(process.argv[3],JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({checks:checks.length,completed:true}));
