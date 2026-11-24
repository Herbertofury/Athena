const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL,fileURLToPath}=require('node:url'),{webcrypto}=require('node:crypto'),{parseHTML}=require('linkedom');
const target=process.env.MEDIA_NATIVE||path.resolve(__dirname,'../dist/workspaces/engineering/media/index.mjs');

function setup(mode){
 const {window,document}=parseHTML('<html><head></head><body><section id="workspace"></section></body></html>');
 const prior=new Map(),calls=[],videos=[],players=[];let hlsCallback;
 const create=document.createElement.bind(document);
 document.createElement=(tag,...args)=>{const node=create(tag,...args);if(tag==='video'){
  Object.assign(node,{currentTime:0,videoWidth:0,videoHeight:0,canPlayType:()=>mode==='hls'?'':'probably',pause(){},load(){},play:async()=>{}});videos.push(node);
 }return node;};
 const YT={Player:class {constructor(_host,options){players.push(options);}destroy(){}playVideo(){}pauseVideo(){}}};
 class Hls{static version='1.7.3';static Events={ERROR:'error'};static isSupported(){return true;}on(_type,fn){hlsCallback=fn;}loadSource(){}attachMedia(){}destroy(){}}
 window.YT=YT;window.Hls=Hls;
 for(const [name,value] of Object.entries({window,document,YT,Hls,location:new URL('https://athena.example/#media'),navigator:{userAgent:'Synthetic native adapter DOM test'},crypto:webcrypto,
  fetch:async(url)=>{calls.push(String(url));assert.equal(new URL(url).protocol,'file:','No provider network permitted');const bytes=fs.readFileSync(fileURLToPath(url));return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}
 })){
  prior.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
 }
 const select=window.HTMLSelectElement.prototype,oldValue=Object.getOwnPropertyDescriptor(select,'value');
 Object.defineProperty(select,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value||this.querySelector('option')?.value||'';},set(v){for(const option of this.querySelectorAll('option')){if(option.value===String(v))option.setAttribute('selected','');else option.removeAttribute('selected');}}});
 return {window,document,calls,videos,players,container:document.getElementById('workspace'),fatal(){hlsCallback(null,{fatal:true,type:'networkError',details:'generated'});},restore(){if(oldValue)Object.defineProperty(select,'value',oldValue);for(const [key,value] of prior){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}};
}

for(const mode of ['youtube','native','hls'])test(`generated native Media retains ${mode} terminal failure and supports explicit retry`,async()=>{
 const env=setup(mode);let controller;
 try{
  controller=await(await import(pathToFileURL(target).href)).mount({container:env.container});
  assert.equal(controller.ready,true);const root=env.container.shadowRoot;
  const provider=mode==='youtube'?'YouTube':'Steam';
  const article=[...root.querySelectorAll('article.card')].find(e=>e.querySelector('.provider').textContent.includes(provider));
  assert.ok(article);const button=text=>[...article.querySelectorAll('button')].find(e=>e.textContent===text);
  button('Load selected player').click();await new Promise(setImmediate);
  const callbacks=mode==='youtube'?env.players.at(-1).events:null;
  const video=env.videos.at(-1);const emit=type=>video.dispatchEvent(new env.window.Event(type));
  if(callbacks){callbacks.onReady();callbacks.onError({data:150});}
  else{emit('canplay');if(mode==='hls')env.fatal();else emit('error');}
  const failure=article.querySelector('.player-state').textContent;
  const before=controller.exportState().receipt.events.length;
  if(callbacks){callbacks.onReady();callbacks.onStateChange({data:1});callbacks.onAutoplayBlocked();}
  else{emit('canplay');emit('playing');emit('pause');}
  assert.equal(article.querySelector('.player-state').textContent,failure);
  assert.equal(button('Play').disabled,true);assert.equal(button('Pause').disabled,true);
  assert.equal(controller.exportState().receipt.events.length,before);
  button('Load selected player').click();await new Promise(setImmediate);
  if(callbacks)env.players.at(-1).events.onReady();else env.videos.at(-1).dispatchEvent(new env.window.Event('canplay'));
  assert.equal(button('Play').disabled,false);assert.match(article.querySelector('.player-state').textContent,/ready/);
  const receipt=controller.exportState().receipt;
  assert.ok(receipt.events.some(e=>e.type===({youtube:'youtube_error',native:'video_error',hls:'hls_error'}[mode])));
  assert.equal(receipt.events.some(e=>e.type==='youtube_playing'||e.type==='video_playing'),false);
  // A genuine callback from the explicit new attempt remains recordable.
  if(callbacks)env.players.at(-1).events.onStateChange({data:1});else env.videos.at(-1).dispatchEvent(new env.window.Event('playing'));
  const current=controller.exportState().receipt;
  assert.equal(current.events.filter(e=>e.type==='youtube_playing'||e.type==='video_playing').length,1);
  assert.ok(current.events.some(e=>e.type===({youtube:'youtube_error',native:'video_error',hls:'hls_error'}[mode])));
  assert.equal(env.calls.length,1);assert.equal(root.querySelector('iframe'),null);
 }finally{controller?.unmount();env.restore();}
});

test('combined native Media recovery survives later player events and a terminal failure',async()=>{
 const env=setup('youtube');let controller;
 try{
  // Linkedom does not enforce text-anchor ownership. Preserve the browser rule
  // so the original moved-writer defect cannot silently pass this model test.
  const checked=node=>{const insert=node.insertBefore;node.insertBefore=function(value,before){if(before?.nodeType===3&&before.parentNode!==this)throw new DOMException('Foreign reference','NotFoundError');return insert.call(this,value,before);};return node;};
  const create=env.document.createElement.bind(env.document);env.document.createElement=(...args)=>checked(create(...args));
  controller=await(await import(pathToFileURL(target).href)).mount({container:env.container,route:'#media?event_view=bounded'});
  const root=env.container.shadowRoot,log=checked(root.getElementById('events'));
  const article=[...root.querySelectorAll('article.card')].find(card=>card.querySelector('.provider').textContent.includes('YouTube'));
  const button=text=>[...article.querySelectorAll('button')].find(e=>e.textContent===text);
  button('Load selected player').click();await new Promise(setImmediate);const callback=env.players.at(-1).events;callback.onReady();
  const insert=log.insertBefore;log.insertBefore=()=>{throw Error('Synthetic transient insertion failure');};
  for(let n=0;n<200&&controller.exportState().receipt.event_view.display_current;n++)callback.onStateChange({data:3});
  assert.equal(controller.exportState().receipt.event_view.display_current,false);log.insertBefore=insert;
  root.getElementById('recover-log').click();assert.equal(controller.exportState().receipt.event_view.display_current,true);
  for(let n=0;n<200;n++)callback.onStateChange({data:3});
  let receipt=controller.exportState().receipt;assert.equal(receipt.event_view.display_current,true);assert.equal(log.textContent,JSON.stringify(receipt.events,null,2));
  callback.onError({data:150});const failure=article.querySelector('.player-state').textContent;
  const retained=controller.exportState().receipt.events.length;callback.onReady();callback.onStateChange({data:1});
  assert.equal(controller.exportState().receipt.events.length,retained);assert.equal(article.querySelector('.player-state').textContent,failure);assert.equal(button('Play').disabled,true);
  button('Load selected player').click();await new Promise(setImmediate);env.players.at(-1).events.onReady();env.players.at(-1).events.onStateChange({data:1});
  receipt=controller.exportState().receipt;assert.equal(receipt.event_view.render_failures,1);assert.equal(receipt.event_view.display_current,true);
  assert.equal(receipt.events.filter(e=>e.type==='youtube_error').length,1);assert.equal(receipt.events.filter(e=>e.type==='youtube_playing').length,1);
  assert.equal(log.textContent,JSON.stringify(receipt.events,null,2));assert.equal(env.calls.length,1);
 }finally{controller?.unmount();env.restore();}
});
