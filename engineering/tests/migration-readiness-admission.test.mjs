import {createHash, webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import {parseHTML} from 'linkedom';

const read = name => readFileSync(new URL('../apps/atlas-lab/ui/migration-readiness.' + name, import.meta.url), 'utf8');
const script = read('js'), markup = read('html'), original = read('json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const scope = 'No source is certified safe to delete.';
function response(body, hash=sha(body)) {
  return new Response(body,{headers:{'content-type':'application/json', ...(hash===null?{}:{'x-athena-snapshot-sha256':hash})}});
}
async function render(reply, code=script, html=markup) {
  const {document} = parseHTML(html);
  const requests = [];
  const pending = runInNewContext(code,{
    document, TextDecoder, crypto:webcrypto, AbortSignal,
    fetch:async (url, opts) => {
      requests.push([url, opts.method ?? 'GET']);
      if(url==='/api/migration/readiness') return reply;
      assert.equal(url,'/api/runtime');
      return new Response(JSON.stringify({application:'Athena',engine_instance:'synthetic'}));
    },
  });
  await pending;
  assert.deepEqual(requests,[['/api/migration/readiness','GET'],['/api/runtime','GET']]);
  return document;
}
function denied(doc) {
  assert.equal(doc.querySelectorAll('#projects article').length,0);
  assert.equal(doc.querySelectorAll('#projects a').length,0);
  assert.equal(doc.querySelector('#scope').textContent,scope);
  assert.equal(doc.querySelector('#snapshot').textContent,'');
  assert.match(doc.querySelector('#status').textContent,/no evidence links shown/i);
}
function altered(update) {
  const value=JSON.parse(original);
  update(value);
  return JSON.stringify(value);
}
test('native migration admits its verified snapshot and preserves seven exact source pins',async()=>{
  const d=await render(response(original));
  assert.equal(d.querySelectorAll('#projects article').length,4);
  assert.equal(d.querySelectorAll('#projects a[href^="https://github.com/Herbertofury/Athena/blob/"]').length,7);
  assert.ok(d.querySelector('#projects a[href="/#continuity"]'));
  assert.match(d.querySelector('#snapshot').textContent,new RegExp(sha(original)));
  assert.match(d.querySelector('#scope').textContent,/not a new live repository audit/);
  assert.equal(d.querySelectorAll('button').length,0);
});
test('a missing late gate refuses the whole snapshot instead of leaving prior cards actionable',async()=>{
  denied(await render(response(altered(v=>delete v.projects[3].gates))));
});
test('a byte-mismatched or missing digest refuses the whole snapshot',async()=>{
  denied(await render(response(original+' ',sha(original))));
  denied(await render(response(original,null)));
});
test('wrong source pin and changed workspace cannot create misleading links',async()=>{
  for(const transform of [
    v=>{v.projects[0].evidence[0].url=v.projects[0].evidence[0].url.replace(v.source_snapshot_commit,'main');},
    v=>{v.projects[0].workspace='/#guidance';},
    v=>{v.projects[0].evidence[0].url+='?ref=other';}
  ]) denied(await render(response(altered(transform))));
});
test('oversized and non-UTF-8 snapshots cannot surface any cards',async()=>{
  denied(await render(response(original+' '.repeat(64*1024))));
  const bytes=Buffer.from(original);bytes[60]=0xff;
  denied(await render(response(bytes)));
});
