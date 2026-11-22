import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import {parseHTML} from 'linkedom';

const ui = new URL('../apps/atlas-lab/ui/', import.meta.url);
const selected = '9007199254740993', pinned = '9223372036854775807', third = '9007199254740994';
const evidence = '{\r\n  "exact":12345678901234567890, "note":"ε😀", "escaped":"\\u0061"\r\n}\r\n';
const completeRun = '\n{ "time": 1.000, "project": "雪" }';
const sourceRecord = (id, fields = {}) => ({
  id, recorded_at:'2026-11-22T00:00:00Z', decision:'Unproven', scope:'Local synthetic text only.',
  evidence, run:completeRun, ...fields,
});
const summary = id => ({id, recorded_at:'2026-11-22', candidate:'Candidate '+id, baseline:'Known baseline', decision:'Unproven'});
const flush = async () => {for (let i=0;i<16;i++) await Promise.resolve();};

test('displayed native history downloads only the chosen retained UTF-8 text', async t => {
  const {window,document} = parseHTML(await readFile(new URL('learning-history.html',ui),'utf8'));
  const downloaded=[], requests=[], blobs=new Map(), revocations=[], timers=[];
  const response = data => ({ok:true,json:async()=>data});
  let resolveThird, population='normal';
  function fetch(url) {
    requests.push(url);
    if (url==='/api/learning/history') return response({records:[pinned,third,selected].map(summary),next_before:null});
    if (url===`/api/learning/history/${pinned}`) return response(sourceRecord(pinned,{evidence:'Pinned only\r\n'}));
    if (url===`/api/learning/history/${third}`) return new Promise(resolve=>{resolveThird=resolve;});
    if (url===`/api/learning/history/${selected}`) {
      const value=population==='invalid'?'\uD800':population==='tooLarge'?'雪'.repeat(701000):evidence;
      return response(sourceRecord(selected,{run:null,evidence:value}));
    }
    assert.fail('unexpected request '+url);
  }
  t.mock.method(URL,'createObjectURL',blob=>{const url='blob:fixture-'+(blobs.size+1);blobs.set(url,blob);return url;});
  t.mock.method(URL,'revokeObjectURL',url=>revocations.push(url));
  t.mock.method(globalThis,'setTimeout',(callback,delay)=>{timers.push([callback,delay]); return timers.length;});
  t.mock.method(window.HTMLAnchorElement.prototype,'click', function () {
    downloaded.push({name:this.getAttribute('download'), url:this.getAttribute('href')});
  });
  const originals = {};
  for (const [name,value] of Object.entries({document,fetch,location:{hash:''},history:{replaceState(){}}})) {
    originals[name]=Object.getOwnPropertyDescriptor(globalThis,name);
    Object.defineProperty(globalThis,name,{value,writable:true,configurable:true});
  }
  t.after(()=>{for (const [name,descriptor] of Object.entries(originals)) {
    if (descriptor) Object.defineProperty(globalThis,name,descriptor); else delete globalThis[name];
  }});
  await import(new URL('learning-history.js?native-download-test',ui));
  await flush();
  const choose=id=>document.querySelector(`#records li[data-record-id="${id}"] button`).click();
  const button=(id, label)=>Array.from(document.querySelectorAll(`.record-panel[data-record-id="${id}"] button`)).find(b=>b.textContent===label);
  const download=(id,label)=>{const b=button(id,label);assert.ok(b,'missing visible download for '+label);b.click();};
  assert.equal(downloaded.length,0);

  choose(pinned); await flush();
  document.querySelector('#pin-comparison').click();
  const stale = button(pinned,'Download Evidence text');
  assert.ok(stale?.getAttribute('aria-label')?.includes(pinned));
  choose(third); await flush(); // leave third pending; stale panel has detached
  stale.click();
  assert.equal(downloaded.length,0);
  choose(selected); await flush();
  resolveThird(response(sourceRecord(third,{evidence:'late, not the displayed record'})));
  await flush();
  assert.equal(document.querySelector(`.record-panel[data-record-id="${third}"]`),null);
  const before = requests.length;
  download(pinned,'Download Complete run text');
  download(selected,'Download Evidence text');
  const disabled = button(selected,'Download Complete run text');
  assert.ok(disabled?.disabled);
  disabled.click();
  assert.equal(requests.length,before);
  assert.deepEqual(downloaded.map(x=>x.name),[`athena-experiment-${pinned}-complete-run.txt`,`athena-experiment-${selected}-evidence.txt`]);
  for (const [i,value] of [completeRun,evidence].entries()) {
    const blob=blobs.get(downloaded[i].url);
    assert.equal(blob.type,'text/plain;charset=utf-8');
    assert.deepEqual(Buffer.from(await blob.arrayBuffer()),Buffer.from(value,'utf8'));
  }
  assert.equal(timers.length,2);
  timers.forEach(([fn,ms])=>{assert.ok(ms>0);fn();});
  assert.deepEqual(revocations,downloaded.map(x=>x.url));

  for (const mode of ['invalid','tooLarge']) {
    population=mode;
    choose(selected);await flush();
    download(selected,'Download Evidence text');
    assert.equal(downloaded.length,2);
    assert.match(button(selected,'Download Evidence text').nextElementSibling.textContent,/not downloaded/i);
  }
});
