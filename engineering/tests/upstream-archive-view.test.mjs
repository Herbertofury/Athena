import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {loadSavedArchive} from '../apps/atlas-lab/ui/archive-view.mjs';
import {upstreamReviewJob} from '../apps/atlas-lab/ui/collection-input.mjs';
const raw=' {"fixture":"not live","future":18446744073709551617,"body":"雪 <script>inert</script>"} ',bytes=new TextEncoder().encode(raw);
function response(id,kind='upstream'){return new Response(bytes,{headers:{'content-type':'application/json','x-atlas-archive-kind':kind,'x-atlas-canonical-id':id,'x-atlas-generation':'9007199254740993','x-atlas-payload-sha256':createHash('sha256').update(bytes).digest('hex')}});}
test('all existing fixed upstream sources reuse full-byte archive verification',async()=>{
 for(const id of ['rustsec','hls','serde-json']){let url;assert.equal(upstreamReviewJob(id).ReviewUpstream.source,id);const record=await loadSavedArchive('upstream',id,{fetchImpl:async value=>{url=value;return response(id);}});assert.equal(url,'/api/upstream-archive/'+id);assert.equal(record.kind,'upstream');assert.equal(record.id,id);assert.equal(record.text,raw);assert.deepEqual(record.bytes,bytes);assert.equal(record.generation,'9007199254740993');}
});
test('unreviewed upstream ids and URLs cannot initiate an archive request',async()=>{
 let count=0;for(const id of ['https://api.github.com/','../path','HLS','constructor','__proto__','new-unreviewed','sodium','abcdefgh',''])await assert.rejects(loadSavedArchive('upstream',id,{fetchImpl:async()=>{count++;return response(id);}}));assert.equal(count,0);
});
test('upstream response namespace and fixed source identity must both match',async()=>{
 await assert.rejects(loadSavedArchive('upstream','hls',{fetchImpl:async()=>response('hls','project')}),/kind mismatch/);
 await assert.rejects(loadSavedArchive('upstream','hls',{fetchImpl:async()=>response('serde-json')}),/identity mismatch/);
});
test('saved inspector exposes upstream choice without truncating serde-json input',()=>{
 const html=readFileSync(new URL('../apps/atlas-lab/ui/index.html',import.meta.url),'utf8');assert.match(html,/<option value="upstream">/);const input=html.match(/<input id="saved-archive-id"[^>]*>/)?.[0];assert.ok(input);assert.ok(Number(input.match(/maxlength="(\d+)"/)?.[1])>=10);
});
