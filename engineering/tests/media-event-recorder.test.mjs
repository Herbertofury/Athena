import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMediaEventRecorder} from '../docs/media-lab/media-event-recorder.mjs';
function element(){
 const children=[];const doc={createTextNode(data){return {data,appendData(s){this.data+=s;}};},createElement(){return element();}};
 return {ownerDocument:doc,childNodes:children,fail:false,
 replaceChildren(...nodes){if(this.fail)throw Error('fixture DOM failure');children.splice(0,children.length,...nodes);},
 insertBefore(node,before){if(this.fail)throw Error('fixture DOM failure');const index=children.indexOf(before);if(index<0)throw Error('missing anchor');children.splice(index,0,node);},
 get textContent(){return children.map(n=>n.data).join('');},set textContent(value){this.replaceChildren(doc.createTextNode(value));}};
}
const real=JSON.parse(readFileSync(new URL('../experiments/youtube-identity-lab/live-browser-receipt.json',import.meta.url))).events;
for(const mode of ['baseline','bounded']){
 test(mode+': every real public prefix remains exact',()=>{const e=element(),rows=[],r=createMediaEventRecorder(e,rows,mode);for(const value of real){assert.equal(r.record(value),true);assert.equal(e.textContent,JSON.stringify(rows,null,2));}assert.deepEqual(rows,real);assert.equal(r.state.rendered_events,real.length);});
 test(mode+': nested mutation does not change exported observations',()=>{const e=element(),rows=[],r=createMediaEventRecorder(e,rows,mode),v={nested:{value:'original'}};r.record(v);v.nested.value='changed';assert.equal(rows[0].nested.value,'original');assert.equal(e.textContent,JSON.stringify(rows,null,2));});
 test(mode+': interruption retains all events and explicit recovery restores display',()=>{
  const e=element(),rows=[],r=createMediaEventRecorder(e,rows,mode);
  // Fill the first segment so the next append exercises insertion failure.
  for(let i=0;i<64;i++)r.record({i});const old=e.textContent;e.fail=true;
  assert.equal(r.record({i:64}),false);assert.equal(r.record({i:65}),false);
  assert.equal(rows.length,66);assert.equal(e.textContent,old);assert.equal(r.state.display_current,false);
  assert.equal(r.recover(),false);assert.equal(e.textContent,old);e.fail=false;
  assert.equal(r.recover(),true);assert.equal(r.record({i:66}),true);
  assert.equal(e.textContent,JSON.stringify(rows,null,2));assert.equal(r.state.rendered_events,67);assert.equal(r.state.render_failures,2);
 });
 test(mode+': serialization failures do not mutate evidence',()=>{const e=element(),rows=[],r=createMediaEventRecorder(e,rows,mode);r.record({ok:true});const previous=e.textContent;const cycle={};cycle.self=cycle;for(const value of [undefined,1n,cycle]){assert.throws(()=>r.record(value));assert.equal(rows.length,1);assert.equal(e.textContent,previous);}});
}
test('bounded integration retains large Unicode events with fewer nodes',()=>{const e=element(),rows=[],r=createMediaEventRecorder(e,rows,'bounded');for(let i=0;i<1088;i++)r.record({i,text:'☃😀</pre>'+('x'.repeat(i===99?20000:100))});assert.equal(e.textContent,JSON.stringify(rows,null,2));assert.ok(e.childNodes.length<40);});
test('invalid initialization fails before editing',()=>{for(const mode of ['unknown','',null])assert.throws(()=>createMediaEventRecorder(element(),[],mode));assert.throws(()=>createMediaEventRecorder(element(),[{}],'bounded'));});
