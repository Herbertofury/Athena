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

test('Lab offers only exact retained DedupExperiment record links and never guesses a numeric binding',()=>{
 const app=mountSource(source,input),id='9007199254740993';
 const experiment={decision:'unproven',reason:'Fixture only',evidence:{trials:[],stress_cases:0}};
 const result=extra=>({experiment,experiment_id:9007199254740992,...extra});
 const links=()=>app.get('jobs').firstChild.children.filter(x=>x.tag==='a');
 const render=(value,state='succeeded',kind='DedupExperiment')=>app.render({counts:{[state]:1},jobs:[{...job(1,state,value),job:kind}]});
 render(result({experiment_id_text:id}));
 assert.deepEqual(links().map(a=>[a.textContent,a.href]),[['Review saved experiment '+id,'/learning#'+id]]);
 const card=app.get('jobs').firstChild;render(result({experiment_id_text:id}));assert.equal(app.get('jobs').firstChild,card);
 for(const bad of [undefined,9007199254740992,'0','01','1\n','9223372036854775808','1?redirect=bad.invalid']){
  render(result({experiment_id_text:bad}));assert.equal(links().length,0);
 }
 render(result({experiment_id_text:id}),'running');assert.equal(links().length,0);
 render(result({experiment_id_text:id}),'succeeded','AnotherJob');assert.equal(links().length,0);
 render(result({experiment_id_text:id}),'failed');assert.equal(links()[0].href,'/learning#'+id);
});
