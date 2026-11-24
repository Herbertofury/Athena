import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createMediaEventRecorder} from '../docs/media-lab/media-event-recorder.mjs';

test('bounded recovery continues into new segments after nodes move to the visible DOM',()=>{
 const {document}=parseHTML('<html><body><pre id="events"></pre></body></html>'),host=document.getElementById('events'),events=[];
 // Linkedom accepts an insertBefore reference owned by another node. Browsers
 // reject this with NotFoundError, so enforce that DOM invariant explicitly.
 const checked=element=>{const insert=element.insertBefore;element.insertBefore=function(node,before){if(before?.nodeType===3&&before.parentNode!==this)throw new DOMException('Reference node belongs to another parent','NotFoundError');return insert.call(this,node,before);};return element;};
 const create=document.createElement.bind(document);document.createElement=(...args)=>checked(create(...args));checked(host);
 const r=createMediaEventRecorder(host,events,'bounded');
 for(let i=0;i<64;i++)assert.equal(r.record({i}),true);
 const insert=host.insertBefore;host.insertBefore=()=>{throw Error('Generated transient DOM failure');};
 assert.equal(r.record({i:64}),false);host.insertBefore=insert;assert.equal(r.recover(),true);
 for(let i=65;i<193;i++){
  assert.equal(r.record({i}),true,'recovered renderer failed at event '+i);
  assert.equal(r.state.display_current,true);assert.equal(host.textContent,JSON.stringify(events,null,2));
 }
 assert.equal(events.length,193);assert.equal(r.state.rendered_events,193);assert.equal(r.state.render_failures,1);
});

test('repeated recovery and oversized events keep exact visible text and small node counts',()=>{
 const {document}=parseHTML('<html><body><pre id="events"></pre></body></html>'),host=document.getElementById('events'),events=[],r=createMediaEventRecorder(host,events,'bounded');
 const create=document.createElement.bind(document);document.createElement=(...args)=>{const node=create(...args),insert=node.insertBefore;node.insertBefore=function(value,before){if(before?.nodeType===3&&before.parentNode!==this)throw new DOMException('Foreign reference','NotFoundError');return insert.call(this,value,before);};return node;};
 for(let cycle=0;cycle<4;cycle++){assert.equal(r.record({cycle,text:'☃ </pre> '+ 'x'.repeat(20000)}),true);assert.equal(r.recover(),true);for(let i=0;i<80;i++)assert.equal(r.record({cycle,i}),true);assert.equal(host.textContent,JSON.stringify(events,null,2));}
 assert.equal(r.state.display_current,true);assert.equal(r.state.rendered_events,324);assert.equal(r.state.render_failures,0);assert.ok(host.childNodes.length<20);
});

test('failed DOM replacement preserves last-good display and a later recovery can continue',()=>{
 const {document}=parseHTML('<html><body><pre id="events"></pre></body></html>'),host=document.getElementById('events'),events=[],r=createMediaEventRecorder(host,events,'bounded');
 for(let i=0;i<64;i++)r.record({i});const prior=host.textContent,replace=host.replaceChildren;
 host.replaceChildren=()=>{throw Error('Generated replacement failure');};assert.equal(r.recover(),false);assert.equal(host.textContent,prior);assert.equal(r.record({i:64}),false);assert.equal(events.length,65);
 host.replaceChildren=replace;assert.equal(r.recover(),true);assert.equal(host.textContent,JSON.stringify(events,null,2));
 for(let i=65;i<150;i++)assert.equal(r.record({i}),true);assert.equal(host.textContent,JSON.stringify(events,null,2));
});

test('blocked writer rejects a target from a different document without changing either display',async()=>{
 const {createBlockedEventLogView}=await import('../docs/media-lab/event-log-view.mjs');
 const a=parseHTML('<html><pre id="a"></pre></html>').document,b=parseHTML('<html><pre id="b">keep</pre></html>').document;
 const source=a.getElementById('a'),target=b.getElementById('b'),writer=createBlockedEventLogView(source);writer.append({n:1});const before=source.textContent;
 assert.throws(()=>writer.attachTo(target),/share its document/);assert.equal(source.textContent,before);assert.equal(target.textContent,'keep');writer.append({n:2});assert.equal(source.textContent,JSON.stringify([{n:1},{n:2}],null,2));
});
