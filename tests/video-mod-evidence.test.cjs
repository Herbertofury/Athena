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

test('timed actions open only on activation, and only for YouTube offsets below one hour',async()=>{
 const {mountVideoModEvidence}=await import(modulePath);
 const {document,Event,window}=parseHTML('<body><section></section></body>'),host=document.querySelector('section');
 const oldOpen=window.open,oldFetch=globalThis.fetch,opened=[];
 window.open=(...args)=>opened.push(args);
 globalThis.fetch=()=>assert.fail('Cue review must not fetch');
 let tray;
 try{
  tray=mountVideoModEvidence(host);
  const form=host.querySelector('form'),url=form.querySelector('[name="source"]'),notes=form.querySelector('[name="notes"]');
  const buttons=()=>[...host.querySelectorAll('ol button')];
  const review=(value)=>{url.value=value;form.dispatchEvent(new Event('submit'));};
  notes.value=['0:00.3 | visible | Zero','0:41.999..0:44.123 | inferred | Start only','59:59.999 | spoken | Cap minus one','1:00:00 | visible | At cap','23:59:59.999 | visible | Still valid evidence'].join('\n');
  review('https://youtu.be/f0iYkTUx5Rs?t=3m21s&si=discard#ignore');
  assert.equal(buttons().length,3);
  assert.equal(host.querySelectorAll('a').length,1,'No outbound timed href is inserted before clicking');
  assert.deepEqual(opened,[]);
  for(const button of buttons()){
   assert.equal(button.getAttribute('type'),'button');
   button.click();
  }
  assert.deepEqual(opened,['0m00s','0m41s','59m59s'].map(t=>['https://youtu.be/f0iYkTUx5Rs?t='+t,'_blank','noopener,noreferrer']));
  const reviewJson=JSON.parse(host.querySelector('pre').textContent);
  assert.equal(reviewJson.source.url,source);
  assert.deepEqual(reviewJson.cues.map(cue=>[cue.start_ms,cue.end_ms]),[[300,null],[41999,44123],[3599999,null],[3600000,null],[86399999,null]]);
  const stale=buttons()[0];form.dispatchEvent(new Event('input'));stale.click();
  assert.equal(buttons().length,0);assert.equal(opened.length,3);
  for(const [input,plain] of [
   ['https://www.bilibili.com/video/BV1xx411c7mD/?p=2&unused=discard','https://www.bilibili.com/video/BV1xx411c7mD/?p=2'],
   ['https://twitter.com/example/status/10000?s=20','https://x.com/example/status/10000']
  ]){
   review(input);
   assert.equal(buttons().length,0);
   assert.equal(host.querySelector('a').getAttribute('href'),plain);
   assert.equal(opened.length,3);
  }
 }finally{tray?.dispose();window.open=oldOpen;globalThis.fetch=oldFetch;}
});

test('explicit download and reopen losslessly preserve the reviewed artifact and leave local drafts intact',async()=>{
 const {mountVideoModEvidence}=await import(modulePath);
 const {document,Event,window}=parseHTML('<body><section></section></body>'),host=document.querySelector('section');
 const view=mountVideoModEvidence(host),downloads=[],blobs=new Map(),revoked=[],settle=()=>new Promise(resolve=>setImmediate(resolve));
 const old={create:URL.createObjectURL,revoke:URL.revokeObjectURL,fetch:globalThis.fetch,open:window.open};
 const create=document.createElement.bind(document);
 document.createElement=(tag,...opts)=>{const node=create(tag,...opts);
  if(tag==='a')node.click=()=>downloads.push({href:node.href,name:node.download});return node;
 };
 URL.createObjectURL=blob=>{const url='blob:synthetic-'+blobs.size;blobs.set(url,blob);return url;};
 URL.revokeObjectURL=url=>revoked.push(url);
 globalThis.fetch=()=>assert.fail('Local portability does not fetch');
 window.open=()=>assert.fail('Local portability does not navigate');
 try{
  const file=host.querySelector('input[type="file"][data-reopen-cues]');
  assert.ok(file,'the reviewer can reopen a selected portable cue file');
  const form=host.querySelector('form'),url=form.querySelector('[name="source"]'),draft=form.querySelector('[name="notes"]');
  const preview=()=>host.querySelector('pre')?.textContent;
  const state=()=>host.querySelector('[role="status"]')?.textContent;
  const load=(size,arrayBuffer)=>{
   Object.defineProperty(file,'files',{configurable:true,value:[{size,arrayBuffer}]});
   file.dispatchEvent(new Event('change'));
  };
  url.value=source+'&session=not-retained';
  draft.value='0:41.091..0:43.4 | visible | Exact α\n\n0:44 | inferred | <img src=x>';
  form.dispatchEvent(new Event('submit'));
  const review=preview(),exportButton=[...host.querySelectorAll('button')].find(x=>x.textContent==='Download reviewed cue JSON');
  assert.ok(exportButton);assert.deepEqual(downloads,[]);
  exportButton.click();
  assert.equal(downloads[0].name,'athena-video-mod-cues.json');
  const selected=blobs.get(downloads[0].href);
  assert.equal(await selected.text(),review+'\n');assert.doesNotMatch(review,/not-retained/);
  url.value='https://x.com/Example/status/2000';draft.value='local draft, not part of the chosen file';
  form.dispatchEvent(new Event('input'));assert.equal(preview(),undefined);
  exportButton.click();assert.equal(downloads.length,1,'an edited review cannot still export stale bytes');
  load(selected.size,()=>selected.arrayBuffer());await settle();
  assert.equal(preview(),review);assert.match(state(),/Reopened local file. Draft unchanged/);
  assert.equal(url.value,'https://x.com/Example/status/2000');assert.match(draft.value,/local draft/);
  assert.match(host.textContent,/Inference, unconfirmed/);
  assert.equal(host.querySelector('img,iframe,video,audio'),null);
  const wrong=new Blob([review.replace('user-supplied-unverified','official')]);
  load(wrong.size,()=>wrong.arrayBuffer());await settle();
  assert.match(state(),/Cue file refused/);assert.equal(preview(),review);assert.match(draft.value,/local draft/);
  load(256*1024+1,()=>assert.fail('Oversized file must not be read'));await settle();
  assert.match(state(),/Cue file refused/);assert.equal(preview(),review);
  let release;
  load(selected.size,()=>new Promise(resolve=>{release=resolve;}));
  draft.value='0:25 | spoken | Newer draft';form.dispatchEvent(new Event('input'));
  form.dispatchEvent(new Event('submit'));
  release(await selected.arrayBuffer());await settle();
  assert.match(preview(),/Newer draft/);assert.doesNotMatch(preview(),/Exact α/);
  load(selected.size,()=>new Promise(resolve=>{release=resolve;}));
  view.dispose();release(await selected.arrayBuffer());await settle();
  assert.equal(host.children.length,0);assert.deepEqual(revoked,[downloads[0].href]);
 }finally{view.dispose();URL.createObjectURL=old.create;URL.revokeObjectURL=old.revoke;globalThis.fetch=old.fetch;window.open=old.open;}
});

test('portable cue parser accepts structurally valid manual edits but never promotes them',async()=>{
 const {reviewVideoModCues,parseVideoModCueFile}=await import(modulePath);
 assert.equal(typeof parseVideoModCueFile,'function','reviewed structured evidence has a checked re-entry path');
 const encode=value=>new TextEncoder().encode(JSON.stringify(value));
 const original=reviewVideoModCues('https://www.bilibili.com/video/BV1xx411c7mD/?p=2&session=discard','\n0:41.091..0:43.4 | visible | 名称 α\n\n1:07 | spoken | mentioned "name"\n0:20.8 | inferred | Possible | not confirmed');
 assert.deepEqual(parseVideoModCueFile(encode(original)),original);
 const edited={...original,cues:original.cues.map((x,i)=>i===0?{...x,text:'A corrected manual cue'}:x)};
 assert.deepEqual(parseVideoModCueFile(encode(edited)),edited);
 assert.equal(parseVideoModCueFile(encode(edited)).verification,'user-supplied-unverified');
 const bad=[
  {...original,verification:'official'}, {...original,schema:2}, {...original,extra:'must not be discarded'},
  {...original,source:{...original.source,part:3}},
  {...original,source:{...original.source,url:original.source.url+'&session=not-retained'}},
  {...original,cues:[{...original.cues[0],start_ms:41092}]},
  {...original,cues:[{...original.cues[0],line:40000}]},
  {...original,cues:[{...original.cues[0],basis:'official'}]},
  {...original,cues:[...original.cues].reverse()},
  {...original,cues:[original.cues[0],original.cues[0]]},
  {...original,cues:[{...original.cues[0],release_url:'https://example.invalid/official'}]}
 ];
 for(const value of bad)assert.throws(()=>parseVideoModCueFile(encode(value)),/Invalid reviewed cue file/);
 const duplicate=JSON.stringify(original).replace('"verification":','"\\u0076erification":"official","verification":');
 assert.throws(()=>parseVideoModCueFile(new TextEncoder().encode(duplicate)),/Invalid reviewed cue file/);
 assert.throws(()=>parseVideoModCueFile(new Uint8Array([255])),/Invalid reviewed cue file/);
 assert.throws(()=>parseVideoModCueFile(new Uint8Array(256*1024+1)),/Invalid reviewed cue file/);
});
