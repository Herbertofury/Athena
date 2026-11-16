const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {readFileSync}=require('node:fs');const {parseHTML}=require('linkedom');
const root=__dirname+'/../engineering/apps/atlas-lab/ui/';
const script=readFileSync(root+'learning-history.js','utf8').replace(/^import .*;\n/gm,'');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function mount(){
 const {document}=parseHTML(readFileSync(root+'learning-history.html','utf8'));const calls=[],pending=new Map();
 const rows={'1':{id:'1',recorded_at:'now',decision:'unproven',scope:'fixture',evidence:'{"n":18446744073709551617}',run:'<img src=x onerror=bad()>raw'},'2':{id:'2',recorded_at:'later',decision:'unproven',scope:'fixture',evidence:null,run:'different'}};
 const context={document,location:{hash:''},history:{replaceState(){}},AbortSignal,setTimeout,submitJob(){throw Error('must never execute');},fetch:async(url,options)=>{calls.push({url,options});if(pending.has(url))return pending.get(url);return {ok:true,json:async()=>url==='/api/learning/history'?{records:Object.values(rows).map(r=>({...r,candidate:'candidate'+r.id,baseline:'base'})),next_before:null}:rows[url.split('/').pop()]};}};
 vm.runInNewContext(script,context);return {document,calls,pending,rows};
}
test('pin compares exact raw evidence, preserves missing state and clears without writes',async()=>{
 const app=mount();await settle();const d=app.document;
 d.querySelectorAll('#records button')[0].click();await settle();d.querySelector('#pin-comparison').click();d.querySelector('#pin-comparison').click();
 assert.match(d.querySelector('#comparison-result').textContent,/Same record/);
 d.querySelectorAll('#records button')[1].click();await settle();
 const panels=d.querySelectorAll('.comparison-grid .record-panel');assert.equal(panels.length,2);
 assert.equal(panels[0].querySelector('pre').textContent,app.rows['1'].evidence);assert.equal(panels[0].querySelectorAll('pre')[1].textContent,app.rows['1'].run);
 assert.match(d.querySelector('#comparison-result').textContent,/evidence: comparison unavailable/);assert.match(d.querySelector('#comparison-result').textContent,/run: retained text differs/);
 assert.equal(d.querySelectorAll('#detail img').length,0);
 d.querySelector('#clear-comparison').click();assert.equal(d.querySelectorAll('.comparison-grid').length,0);assert.equal(d.querySelectorAll('#detail pre')[1].textContent,'different');
 assert.ok(app.calls.every(c=>!c.options.method));
});
test('slow stale selection cannot replace newer selection or be pinned',async()=>{
 const app=mount();await settle();let resolve;
 app.pending.set('/api/learning/history/1',new Promise(r=>resolve=r));
 const buttons=app.document.querySelectorAll('#records button');buttons[0].click();assert.equal(app.document.querySelector('#pin-comparison').disabled,true);buttons[1].click();await settle();
 resolve({ok:true,json:async()=>app.rows['1']});await settle();app.document.querySelector('#pin-comparison').click();
 assert.match(app.document.querySelector('#comparison-status').textContent,/Pinned experiment 2/);
});
test('oversized or invalid record leaves existing pin intact and selection unpinnable',async()=>{
 const app=mount();await settle();const d=app.document;d.querySelectorAll('#records button')[0].click();await settle();d.querySelector('#pin-comparison').click();
 app.rows['2'].run='x'.repeat(2097153);d.querySelectorAll('#records button')[1].click();await settle();
 assert.match(d.querySelector('#detail').textContent,/display budget/);assert.equal(d.querySelector('#pin-comparison').disabled,true);assert.match(d.querySelector('#comparison-status').textContent,/Pinned experiment 1/);
 d.querySelector('#clear-comparison').click();assert.equal(d.querySelector('#clear-comparison').disabled,true);
});
