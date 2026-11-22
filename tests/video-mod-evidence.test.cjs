const {test}=require('node:test'),assert=require('node:assert/strict'),{parseHTML}=require('linkedom');
const modulePath='../dist/workspaces/engineering/media/video-mod-evidence.mjs';
const source='https://www.youtube.com/watch?v=f0iYkTUx5Rs';
test('formal review retains manual evidence basis, original row order, and exact elapsed milliseconds',async()=>{
 const {reviewVideoModCues}=await import(modulePath);
 const text='0:41.091..0:43.4 | visible | Exact example α\n\n1:07 | spoken | Spoken example\n0:20.8 | inferred | Possible Name | no confirmation';
 const review=reviewVideoModCues(source,text);
 assert.equal(review.verification,'user-supplied-unverified');
 assert.deepEqual(review.cues.map(c=>[c.line,c.start_ms,c.end_ms,c.basis,c.text]),[
  [1,41091,43400,'visible','Exact example α'],[3,67000,null,'spoken','Spoken example'],[4,20800,null,'inferred','Possible Name | no confirmation']
 ]);
 assert.equal(review.source.url,source);
});
test('source identity keeps Bilibili part, strips incidental parameters, refuses unsafe or ambiguous sources',async()=>{
 const {reviewVideoModCues}=await import(modulePath);
 const cue='1:02:03.004 | spoken | Example';
 for(const [input,expected] of [
  ['https://youtu.be/f0iYkTUx5Rs?si=discard','https://www.youtube.com/watch?v=f0iYkTUx5Rs'],
  ['https://www.youtube.com/shorts/f0iYkTUx5Rs#discard',source],
  ['https://www.bilibili.com/video/BV1xx411c7mD/?p=2&session=discard','https://www.bilibili.com/video/BV1xx411c7mD/?p=2'],
  ['https://twitter.com/Example/status/1000000000000000000?s=20','https://x.com/Example/status/1000000000000000000'],
 ]){
  const review=reviewVideoModCues(input,cue);
  assert.equal(review.source.url,expected);
  assert.equal(review.cues[0].start_ms,3_723_004);
 }
 for(const bad of ['javascript:alert(1)','https://youtube.com.evil.test/watch?v=f0iYkTUx5Rs','https://secret@youtube.com/watch?v=f0iYkTUx5Rs','https://www.youtube.com/playlist?list=private',source+'&v=another1234','https://www.bilibili.com/video/BV1xx411c7mD/?p=3&p=4','https://www.youtube.com:8123/watch?v=f0iYkTUx5Rs','https://x.com/Example/likes','https://twitter.com/Example/status/1000/analytics']){
  assert.throws(()=>reviewVideoModCues(bad,cue),/without credentials/);
 }
});
test('bad range, unsupported evidence basis and bounds fail closed for the entire review',async()=>{
 const {reviewVideoModCues}=await import(modulePath);
 const good='0:03 | visible | Valid cue';
 const bad=['0:13..0:04 | visible | backwards','0:60 | spoken | malformed','24:00:00 | visible | beyond cap','1:1:02 | visible | malformed','0:56 | verified | unrecognized','0:03 | __proto__ | invalid','0:03 | visible | a\u0000b','0:01 | visible | '+'語'.repeat(513)];
 for(const line of bad)assert.throws(()=>reviewVideoModCues(source,good+'\n'+line),/Line 2:/);
 assert.throws(()=>reviewVideoModCues(source,''),/at least one/);
 assert.throws(()=>reviewVideoModCues(source,Array(65).fill(good).join('\n')),/64 cue rows/);
 assert.throws(()=>reviewVideoModCues(source,' '.repeat(32769)),/32,768 characters/);
});
test('cue preview keeps content inert, clears edited previews explicitly, and does not write or fetch',async()=>{
 const {mountVideoModEvidence}=await import(modulePath);
 const {document,Event}=parseHTML('<body><section></section></body>'), host=document.querySelector('section');
 const oldFetch=globalThis.fetch;
 globalThis.fetch=()=>assert.fail('No fetch allowed by cue reviewer');
 let tray;
 try{
  tray=mountVideoModEvidence(host);
  const form=host.querySelector('form'),url=form.querySelector('[name="source"]'),text=form.querySelector('[name="notes"]');
  url.value=source+'&session=private-token';text.value='0:03 | inferred | <img src=x onerror=alert(1)>';
  assert.equal(host.querySelector('a'),null);
  form.dispatchEvent(new Event('submit'));
  assert.match(host.textContent,/Inference, unconfirmed/);
  assert.equal(host.querySelector('img,video,audio,iframe'),null);
  assert.equal(host.querySelector('a').getAttribute('href'),source);
  assert.equal(host.querySelector('a').getAttribute('rel'),'noopener noreferrer');
  assert.doesNotMatch(host.querySelector('pre').textContent,/private-token/);
  text.value+=' changed';form.dispatchEvent(new Event('input'));
  assert.equal(host.querySelector('ol,pre'),null);assert.match(host.textContent,/Inputs changed/);
  form.dispatchEvent(new Event('submit'));
  const clear=form.querySelector('[data-clear]');clear.click();
  assert.equal(host.querySelector('a'),null);
  assert.match(text.value,/onerror/);
  text.value='bad row';form.dispatchEvent(new Event('submit'));
  assert.equal(host.querySelector('ol,pre'),null);
  assert.match(host.querySelector('[role="status"]').textContent,/Line 1/);
  tray.dispose();assert.equal(host.childNodes.length,0);
  form.dispatchEvent(new Event('submit'));assert.equal(host.childNodes.length,0);
 }finally{tray?.dispose();globalThis.fetch=oldFetch;}
});
