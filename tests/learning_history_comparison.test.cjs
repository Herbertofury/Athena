const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {readFileSync}=require('node:fs');const {parseHTML}=require('linkedom');
const root=__dirname+'/../engineering/apps/atlas-lab/ui/';
const script=readFileSync(root+'learning-history.js','utf8').replace(/^import .*;\n/gm,'');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function mount(listPages){
 const {document}=parseHTML(readFileSync(root+'learning-history.html','utf8'));const calls=[],pending=new Map();
 const rows={'1':{id:'1',recorded_at:'now',decision:'unproven',scope:'fixture',evidence:'{"n":18446744073709551617}',run:'<img src=x onerror=bad()>raw'},'2':{id:'2',recorded_at:'later',decision:'unproven',scope:'fixture',evidence:null,run:'different'}};
 const context={document,location:{hash:''},history:{replaceState(){}},AbortSignal,setTimeout,submitJob(){throw Error('must never execute');},fetch:async(url,options)=>{calls.push({url,options});if(pending.has(url))return pending.get(url);return {ok:true,json:async()=>url==='/api/learning/history'||url.startsWith('/api/learning/history?')?(listPages?.[url]??{records:Object.values(rows).reverse().map(r=>({...r,candidate:'candidate'+r.id,baseline:'base'})),next_before:null}):rows[url.split('/').pop()]};}};
 vm.runInNewContext(script,context);return {document,calls,pending,rows};
}
test('pin compares exact raw evidence, preserves missing state and clears without writes',async()=>{
 const app=mount();await settle();const d=app.document;
 d.querySelector('#records [data-record-id="1"] button').click();await settle();d.querySelector('#pin-comparison').click();d.querySelector('#pin-comparison').click();
 assert.match(d.querySelector('#comparison-result').textContent,/Same record/);
 d.querySelector('#records [data-record-id="2"] button').click();await settle();
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
 const button=id=>app.document.querySelector('#records [data-record-id="'+id+'"] button');button('1').click();assert.equal(app.document.querySelector('#pin-comparison').disabled,true);button('2').click();await settle();
 resolve({ok:true,json:async()=>app.rows['1']});await settle();app.document.querySelector('#pin-comparison').click();
 assert.match(app.document.querySelector('#comparison-status').textContent,/Pinned experiment 2/);
});
test('oversized or invalid record leaves existing pin intact and selection unpinnable',async()=>{
 const app=mount();await settle();const d=app.document;d.querySelector('#records [data-record-id="1"] button').click();await settle();d.querySelector('#pin-comparison').click();
 app.rows['2'].run='x'.repeat(2097153);d.querySelector('#records [data-record-id="2"] button').click();await settle();
 assert.match(d.querySelector('#detail').textContent,/display budget/);assert.equal(d.querySelector('#pin-comparison').disabled,true);assert.match(d.querySelector('#comparison-status').textContent,/Pinned experiment 1/);
 d.querySelector('#clear-comparison').click();assert.equal(d.querySelector('#clear-comparison').disabled,true);
});

const summary=(id,candidate,baseline='Baseline',decision='Unproven',recorded_at='2026-11-22')=>({id,candidate,baseline,decision,recorded_at});
const visible=(document)=>[...document.querySelectorAll('#records li:not([hidden])')].map(row=>row.querySelector('button').textContent);
const change=(document,selector,value,event)=>{
 const el=document.querySelector(selector);
 if(selector==='#history-sort')Object.defineProperty(el,'value',{configurable:true,value});
 else el.value=value;
 el.dispatchEvent(new document.defaultView.Event(event));
};
test('loaded history sorts and searches metadata locally without changing active selection or comparison pin',async()=>{
 const url='/api/learning/history', latest=summary('9007199254740995','Zeta','Fixture baseline','Escalate','2026-10-02');
 const previous=summary('2','Beta','Another baseline'),earlier=summary('1','Alpha');
 const app=mount({[url]:{records:[latest,previous,earlier],next_before:null}}),d=app.document;
 await settle();assert.deepEqual(visible(d),['Zeta / Fixture baseline','Beta / Another baseline','Alpha / Baseline']);
 d.querySelectorAll('#records button')[1].click();await settle();d.querySelector('#pin-comparison').click();
 const requests=app.calls.length,detail=d.querySelector('#detail').textContent;
 change(d,'#history-sort','candidate','change');assert.equal(visible(d)[0],'Alpha / Baseline');
 change(d,'#history-search','#9007199254740995 escalate','input');assert.deepEqual(visible(d),['Zeta / Fixture baseline']);
 assert.match(d.querySelector('#history-results').textContent,/1 of 3 loaded/);
 change(d,'#history-search','#9007199254740994','input');assert.deepEqual(visible(d),[]);
 assert.match(d.querySelector('#history-results').textContent,/No loaded experiments match/);
 assert.equal(d.querySelector('#detail').textContent,detail);
 assert.match(d.querySelector('#comparison-status').textContent,/Pinned experiment 2/);
 change(d,'#history-search','','input');assert.equal(visible(d).length,3);
 assert.equal(app.calls.length,requests);
});
test('unmatched search does not hide manual pagination and sort does not change the exact cursor',async()=>{
 const url='/api/learning/history',cursor='9007199254740993',next=url+'?before='+cursor;
 const first=Array.from({length:20},(_,i)=>summary(String(BigInt(cursor)+BigInt(19-i)),'Initial '+i));
 const app=mount({[url]:{records:first,next_before:cursor},[next]:{records:[summary('2','Older-only exact item')],next_before:null}}),d=app.document;
 await settle();
 change(d,'#history-search','older-only','input');
 change(d,'#history-sort','older','change');
 assert.deepEqual(app.calls.map(c=>c.url),[url]);
 assert.equal(visible(d).length,0);assert.equal(d.querySelector('#more').hidden,false);
 assert.match(d.querySelector('#history-results').textContent,/Older unloaded records may still match/);
 d.querySelector('#more').click();await settle();
 assert.deepEqual(app.calls.map(c=>c.url),[url,next]);assert.deepEqual(visible(d),['Older-only exact item / Baseline']);
 assert.equal(d.querySelector('#more').hidden,true);
});

test('malformed older page leaves prior ordering, visible rows and exact retry cursor intact',async()=>{
 const url='/api/learning/history',cursor='10',next=url+'?before='+cursor;
 const first=Array.from({length:20},(_,i)=>summary(String(29-i),'Initial '+i));
 const pages={[url]:{records:first,next_before:cursor},[next]:{records:[summary('19','Invalid repeat')],next_before:null}};
 const app=mount(pages),d=app.document;await settle();
 const before=visible(d);
 d.querySelector('#more').click();await settle();
 assert.deepEqual(visible(d),before);assert.match(d.querySelector('#status').textContent,/Previously loaded records are unchanged/);
 pages[next]={records:[summary('9','Valid older entry')],next_before:null};
 d.querySelector('#more').click();await settle();assert.equal(visible(d).at(-1),'Valid older entry / Baseline');
 assert.deepEqual(app.calls.map(x=>x.url),[url,next,next]);
});

test('strict descending exact IDs reject a reversed page without changing prior rows or pagination',async()=>{
 const url='/api/learning/history',cursor='9007199254740995',next=url+'?before='+cursor;
 const first=Array.from({length:20},(_,i)=>summary(String(BigInt(cursor)+BigInt(19-i)),'Initial '+i));
 const older=summary('9007199254740993','Older boundary'),newer=summary('9007199254740994','Newer boundary');
 const pages={[url]:{records:first,next_before:cursor},[next]:{records:[older,newer],next_before:null}};
 const app=mount(pages),d=app.document;await settle();
 const before=visible(d);
 d.querySelector('#more').click();await settle();
 assert.deepEqual(visible(d),before);
 assert.equal(d.querySelector('#more').hidden,false);
 assert.match(d.querySelector('#status').textContent,/Previously loaded records are unchanged/);
 pages[next]={records:[newer,older],next_before:null};
 d.querySelector('#more').click();await settle();
 assert.deepEqual(visible(d).slice(-2),['Newer boundary / Baseline','Older boundary / Baseline']);
 assert.deepEqual(app.calls.map(x=>x.url),[url,next,next]);
});

test('an exact learning selection refuses a different returned experiment ID without pinning it',async()=>{
 const app=mount(),d=app.document;await settle();
 app.pending.set('/api/learning/history/1',Promise.resolve({ok:true,json:async()=>app.rows['2']}));
 d.querySelector('#records [data-record-id="1"] button').click();await settle();
 assert.match(d.querySelector('#detail').textContent,/identity does not match/i);
 assert.equal(d.querySelector('#pin-comparison').disabled,true);
 assert.equal(d.querySelector('#detail pre'),null);
});
