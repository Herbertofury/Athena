const {test}=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../dist/workspaces/projects/model.mjs');
const input={name:'Space adventure',ownership:'own',stage:'idea',goal:'Diablo-like health and mana',next:'Explore',blockers:'',decisions:'',resources:'Diablo I–IV, Path of Exile, EVE Online, No Man’s Sky',source:'https://example.org',version:'',release:''};
test('projects preserve revisions, classify ownership and archive reversibly',async()=>{const m=await load();const original=m.change(m.empty(),'space',input,1),next=m.change(original,'space',{...input,stage:'building'},2);assert.equal(original.entries[0].revisions.length,1);assert.equal(next.entries[0].revisions.length,2);assert.equal(m.browse(next,{ownership:'followed'}).length,0);assert.equal(m.browse(next,{query:'mana'}).length,1);const archived=m.archive(next,'space');assert.equal(m.browse(archived).length,0);assert.deepEqual(m.archive(archived,'space'),next);assert.deepEqual(m.validate(JSON.parse(JSON.stringify(next))),next);});
test('unsafe source URLs, schema and malformed revisions refused',async()=>{const m=await load();for(const source of ['javascript:alert(1)','http://example.org','https://user:password@example.org'])assert.throws(()=>m.change(m.empty(),'space',{...input,source}));assert.throws(()=>m.validate({schema:2,entries:[]}));assert.throws(()=>m.change(m.empty(),'space',{...input,ownership:'invalid'}));});
test('backup import is additive, preserves unknown metadata, idempotent and atomic on conflict',async()=>{const m=await load(),{parseBackup,mergeBackup}=await import('../dist/workspaces/projects/import.mjs');const current=m.change(m.empty(),'a',input,1);const incoming=m.change(m.empty(),'b',{...input,ownership:'followed'},2);incoming.extensions={future:true};const parsed=parseBackup(Buffer.from(JSON.stringify(incoming)));const merged=mergeBackup(current,parsed);assert.equal(merged.data.entries.length,2);assert.deepEqual(merged.data.entries[0],current.entries[0]);assert.deepEqual(merged.data.extensions,incoming.extensions);assert.deepEqual(mergeBackup(merged.data,parsed).data,merged.data);assert.throws(()=>mergeBackup(current,m.change(current,'a',{...input,name:'Conflict'},3)));assert.equal(current.entries[0].revisions.length,1);assert.throws(()=>parseBackup(Buffer.from('{"schema":1,"schema":1,"entries":[]}')));});

test('saved revision search is field-scoped, newest-first evidence and filtered by current project',async()=>{
 const m=await load();let data=m.change(m.empty(),'a',{...input,name:'Old comet',decisions:'Keep provenance',extra:'secrets never indexed'},1);
 data=m.change(data,'a',{...input,name:'Current orbit',ownership:'followed',stage:'testing',release:'https://example.org/old-comet'},2);
 const idx=m.createBrowseIndex(data);
 assert.deepEqual(idx.find({query:'  OLD COMET ',history:true,ownership:'followed',stage:'testing'}).map(p=>p.id),['a']);
 assert.deepEqual(idx.find({query:'old comet'}),[]);
 for(const bad of [{query:'old comet',ownership:'own'},{query:'old comet',stage:'idea'},{query:'old comet',archived:true},{query:'secrets never indexed'}])
  assert.deepEqual(idx.find({...bad,history:true}),[]);
 assert.deepEqual(m.matchingSavedRevisions(data.entries[0],'old'),[{index:1,fields:['release']},{index:0,fields:['name']}]);
 assert.deepEqual(m.matchingSavedRevisions(data.entries[0],'   '),[]);
});
