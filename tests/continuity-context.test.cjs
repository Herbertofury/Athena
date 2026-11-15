const test = require('node:test'), assert = require('node:assert/strict');
const modules = async () => ({...await import('../dist/workspaces/continuity/model.mjs'), ...await import('../dist/workspaces/continuity/context.mjs')});
const note = (id, project = 'A') => ({type:'add', id, project, kind:'decision', text:'Evidence '+id, source:'https://example.org/'+id});
test('explicit cross-project dependencies preserve reviewed revision while changed evidence stays usable', async () => {
 const m=await modules();let s=m.apply(m.fresh(),note('a'),1);s=m.apply(s,note('b','B'),2);s=m.apply(s,{type:'link',id:'a',dependencyId:'b'},3);
 const before=structuredClone(s);s=m.apply(s,{type:'revise',id:'b',text:'Updated evidence',source:'https://example.org/b2'},4);
 const packet=m.compileContext(s,'A');assert.equal(packet.coverage.selectedRoots,1);assert.equal(packet.coverage.includedEntries,2);assert.equal(packet.warnings[0].kind,'changed');assert.equal(packet.links[0].reviewedEvidence.text,'Evidence b');assert.equal(packet.links[0].reviewedEvidence.source,'https://example.org/b');assert.equal(packet.entries.find(e=>e.id==='b').text,'Updated evidence');assert.equal(before.entries[1].revisions.length,1);
 const repeated=m.apply(s,{type:'link',id:'a',dependencyId:'b'},5);assert.equal(repeated.entries[0].dependencies[0].revision,1);assert.equal(repeated.entries[0].history.length,s.entries[0].history.length);
 s=m.apply(s,{type:'review-dependency',id:'a',dependencyId:'b'},6);assert.equal(m.compileContext(s,'A').warnings.length,0);assert.equal(s.entries[0].history.at(-1).previousRevision,1);assert.equal(s.entries[1].revisions.length,2);
});
test('transitive warnings, ignored sources, missing references and cycles remain explicit without hidden cutoff', async () => {
 const m=await modules();let s=m.fresh();for(const id of ['a','b','c'])s=m.apply(s,note(id),1);for(const [id,dependencyId] of [['a','b'],['b','c'],['c','a']])s=m.apply(s,{type:'link',id,dependencyId},2);
 assert.equal(m.compileContext(s).entries.length,3);s=m.apply(s,{type:'ignore',id:'c'},3);const packet=m.compileContext(s);assert.equal(packet.coverage.selectedRoots,2);assert.equal(packet.coverage.includedEntries,3);assert(packet.warnings.some(w=>w.id==='b'&&w.kind==='ignored'));assert(packet.warnings.some(w=>w.id==='a'&&w.kind==='upstream-review'));
 s.entries[0].dependencies.push({id:'missing',revision:2});assert(m.compileContext(s).warnings.some(w=>w.kind==='missing'));
 s.entries[0].dependencies.push({id:'c',revision:99});assert(m.compileContext(s).warnings.some(w=>w.kind==='missing-revision'));
});
test('unlink retains audit history; malformed references rejected; empty context never means complete',async()=>{
 const m=await modules();let s=m.apply(m.apply(m.fresh(),note('a'),1),note('b'),2);s=m.apply(s,{type:'link',id:'a',dependencyId:'b'},3);s=m.apply(s,{type:'unlink',id:'a',dependencyId:'b'},4);assert.equal(s.entries[0].dependencies.length,0);assert.equal(s.entries[0].history.at(-1).action,'unlinked');
 assert.throws(()=>m.apply(s,{type:'link',id:'a',dependencyId:'missing'}));s.entries[0].dependencies=[{id:'b',revision:0}];assert.throws(()=>m.validate(s));
 const packet=m.compileContext(m.fresh(),'A');assert.equal(packet.entries.length,0);assert.match(m.contextMarkdown(packet),/not proof of correctness or completion/);
});
test('context exports complete evidence and does not silently discard large valid collections',async()=>{
 const m=await modules();const s=m.fresh();for(let i=0;i<600;i++)s.entries.push({id:String(i),project:i===599?'A':'B',dependencies:i?[{id:String(i-1),revision:1}]:[],kind:'resource',pinned:false,ignored:false,revisions:[{text:'Evidence'+i+'x'.repeat(500),source:'https://example.org/'+i,at:i}],history:[{action:'created',at:i}]});
 assert.equal(m.validate(s).entries.length,600);const packet=m.compileContext(s,'A');assert.equal(packet.entries.length,600);assert.equal(packet.coverage.selectedRoots,1);assert.equal(packet.links.length,599);assert(m.contextMarkdown(packet).includes('https://example.org/599'));assert.equal('confidence' in packet.entries[0],false);
});
