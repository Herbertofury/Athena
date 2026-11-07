import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mount as mountSource} from '../experiments/job-identity-lab/render-harness.mjs';
import * as input from '../apps/atlas-lab/ui/collection-input.mjs';
const source=readFileSync(new URL('../apps/atlas-lab/ui/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const job=(id,state,result)=>({id,id_text:String(id),job:'DedupExperiment',state,attempt:1,result});
function setup(){const app=mountSource(source,input);app.render({counts:{queued:1},jobs:[job(1,'queued')]});return app;}
const bad=()=>({counts:{succeeded:999,failed:23},jobs:[job(1,'succeeded',{error:'UNCOMMITTED RESULT'}),job(2,'succeeded',{project:{title:'Malformed fixture',id:'fixture',versions:null}})]});
test('late card preparation failure retains last-good cards and all metrics',()=>{
 const app=setup(),nodes=[...app.get('jobs').children],metrics=['pending','completed','failed'].map(id=>app.get(id).textContent);
 assert.throws(()=>app.render(bad()));
 assert.deepEqual(app.get('jobs').children,nodes);
 assert.deepEqual(['pending','completed','failed'].map(id=>app.get(id).textContent),metrics);
});
test('failed preparation cannot poison keyed reuse on the next successful refresh',()=>{
 const app=setup();assert.throws(()=>app.render(bad()));
 app.render({counts:{succeeded:1},jobs:[job(1,'succeeded',{error:'VERIFIED NEXT RESULT'})]});
 assert.match(app.get('jobs').textContent,/VERIFIED NEXT RESULT/);
 assert.doesNotMatch(app.get('jobs').textContent,/UNCOMMITTED RESULT/);
 const node=app.get('jobs').firstChild;
 app.render({counts:{succeeded:1},jobs:[job(1,'succeeded',{error:'VERIFIED NEXT RESULT'})]});
 assert.equal(app.get('jobs').firstChild,node,'unchanged successful cards must still be reused');
});
