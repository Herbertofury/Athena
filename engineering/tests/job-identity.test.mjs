import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mount as mountSource} from '../experiments/job-identity-lab/render-harness.mjs';
import * as input from '../apps/atlas-lab/ui/collection-input.mjs';
const source=readFileSync(new URL('../apps/atlas-lab/ui/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
function mount(){return mountSource(source,input);}
const data=()=>JSON.parse('{"counts":{"succeeded":2},"jobs":[{"id":9007199254740992,"id_text":"9007199254740992","job":"DedupExperiment","state":"succeeded","attempt":1},{"id":9007199254740993,"id_text":"9007199254740993","job":"DedupExperiment","state":"succeeded","attempt":1}]}');
test('actual renderer keeps two distinct cards even when legacy JSON numbers collide',()=>{
 const app=mount(),value=data();assert.equal(value.jobs[0].id,value.jobs[1].id,'fixture must exercise actual JSON rounding');app.render(value);const cards=app.get('jobs').children;assert.equal(cards.length,2);assert.match(cards[0].textContent,/Job 9007199254740992 /);assert.match(cards[1].textContent,/Job 9007199254740993 /);
});
test('invalid or repeated exact identities cannot partially replace good cards or counts',()=>{
 const app=mount();app.render(data());const previous=[...app.get('jobs').children],count=app.get('completed').textContent;
 for(const jobs of [[{...data().jobs[0],id_text:'01'}],[{id:1,id_text:'1'},{id:1,id_text:'1'}]]){
  assert.throws(()=>app.render({counts:{succeeded:999},jobs}),/identit/i);assert.deepEqual(app.get('jobs').children,previous);assert.equal(app.get('completed').textContent,count);
 }
});
test('safe legacy ids and later exact fields reuse the same keyed cards',()=>{
 const app=mount(),value={counts:{succeeded:1},jobs:[{id:7,job:'DedupExperiment',state:'succeeded',attempt:1}]};app.render(value);const node=app.get('jobs').firstChild;value.jobs[0].id_text='7';app.render(value);assert.equal(app.get('jobs').firstChild,node);assert.equal(app.get('jobs').children.length,1);
});
test('exact identity reader retains full positive SQLite ids and rejects unsafe legacy fallback',()=>{
 assert.equal(typeof input.jobIdentity,'function');
 for(const id of ['1','9007199254740993','9223372036854775807'])assert.equal(input.jobIdentity({id:Number(id),id_text:id}),id);
 assert.equal(input.jobIdentity({id:7}),'7');
 for(const job of [null,[],{id:9007199254740993},{id:0},{id:1.5},{id:1,id_text:'2'},{id:1,id_text:'01'},{id:1,id_text:null},{id:1,id_text:'9223372036854775808'}])assert.throws(()=>input.jobIdentity(job),/identit/i);
});
