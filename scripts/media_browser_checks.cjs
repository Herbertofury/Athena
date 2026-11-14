/* Actual-browser DOM acceptance with synthetic callbacks, never provider playback.
 * Called by the existing browser lane; this module never launches a browser.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');

async function runMediaBrowserChecks({page,origin,root,report,check}){
  await check('Media accepts exact Nexus large-preview URLs without automatic image requests',async()=>{
    const fixture={schema_version:1,access:'public-only',private_data_included:false,cards:[
      {game:1151,mod:42147,domain:'fallout4',name:'F4SE preview fixture',image:'42147-1574018373-1181117442.jpeg',bucket:'42'},
      {game:4187,mod:106,domain:'starfield',name:'SFSE preview fixture',image:'106-1692987450-947775764.png',bucket:'10'},
    ].map(value=>({id:`nexus:${value.game}:${value.mod}`,provider:'Nexus Mods',kind:'mod',title:value.name,
      creator:'Synthetic browser projection',summary:'Recorded public API URL examples; no live collection in this check.',
      source:`https://www.nexusmods.com/${value.domain}/mods/${value.mod}`,
      cover:`https://images.nexusmods.com/mod-images/${value.game}/t/large/${value.bucket}/${value.mod}/${value.image}`,
      gallery:[{preview:`https://images.nexusmods.com/mod-images/${value.game}/t/large/${value.bucket}/${value.mod}/${value.image}`,
        original:`https://staticdelivery.nexusmods.com/mods/${value.game}/images/${value.mod}/${value.image}`}],videos:[],
      completeness:'One cover/preview pair only; full gallery and file payloads unverified.'}))};
    const fixtureUrl=origin+'/workspaces/engineering/media/public-fixtures.json';
    const body=JSON.stringify(fixture),handler=route=>route.fulfill({status:200,contentType:'application/json',body});
    await page.route(fixtureUrl,handler);
    try{
      const result=await page.evaluate(async fixture=>{
        const {mount}=await import('/workspaces/engineering/media/index.mjs');
        const container=document.createElement('section');document.body.append(container);let controller;
        const require=(condition,message)=>{if(!condition)throw Error(message);};
        try{
          controller=await mount({container,route:'#media?q=',theme:'dark'});require(controller.ready,'Nexus fixture did not mount');
          const root=container.shadowRoot,cards=[...root.querySelectorAll('article.card')];require(cards.length===2,'Missing Nexus cards');
          for(const [index,card]of cards.entries()){
            const expected=fixture.cards[index];require(card.dataset.cardId===expected.id,'Wrong Nexus identity');
            require(card.querySelector('.source').href===expected.source,'Wrong source link');
            require(card.querySelector('.gallery a').href===expected.gallery[0].original,'Original image URL changed');
            const images=[...card.querySelectorAll('img')];require(images.length===2,'Missing cover or preview');
            for(const image of images){require(image.dataset.source===expected.cover,'Large preview URL lost');require(!image.hasAttribute('src'),'Image loaded without explicit action');}
            require(card.querySelectorAll('video,audio,iframe').length===0,'Unexpected player');
          }
          const receipt=controller.exportState().receipt;require(receipt.fixture_counts.cards===2&&receipt.fixture_counts.gallery_images===2&&receipt.fixture_counts.video_entries===0,'Wrong receipt counts');
          controller.unmount();require(root.childNodes.length===0,'Unmount left Nexus workspace DOM');
          return {cards:cards.length,pendingImages:4,automaticImages:0,players:0,fixtureSHA256:receipt.fixture_sha256,
            scope:'Actual native-workspace DOM with synthetic projection of recorded API URLs; no live image decode, full gallery or file download acceptance'};
        }finally{controller?.unmount();container.remove();}
      },fixture);
      assert.equal(result.fixtureSHA256,crypto.createHash('sha256').update(body).digest('hex'));
      assert.equal(result.cards,2);assert.equal(result.pendingImages,4);assert.equal(result.automaticImages,0);assert.equal(result.players,0);report.nexusLargePreview=result;
    }finally{await page.unroute(fixtureUrl,handler);}
  });
  await check('Media served correction modules match the reviewed runtime bytes',async()=>{
    const names=['index.mjs','event-log-view.mjs','media-event-recorder.mjs','media-core.mjs'];
    const identities=await page.evaluate(async names=>{
      const result={};for(const name of names){const response=await fetch('/workspaces/engineering/media/'+name,{cache:'no-store'});if(!response.ok)throw Error('Media module unavailable: '+name);const bytes=await response.arrayBuffer();result[name]=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}return result;
    },names);
    for(const name of names)assert.equal(identities[name],crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'workspaces/engineering/media',name))).digest('hex'));
    report.mediaCorrectionModules=identities;
  });
  await check('Media bounded recovery survives real DOM moves and later segment boundaries',async()=>{
    const result=await page.evaluate(async()=>{
      const {createMediaEventRecorder}=await import('/workspaces/engineering/media/media-event-recorder.mjs');
      const host=document.createElement('pre');document.body.append(host);const events=[],recorder=createMediaEventRecorder(host,events,'bounded');
      const require=(condition,message)=>{if(!condition)throw Error(message);};
      const same=()=>require(host.textContent===JSON.stringify(events,null,2),'Visible log differs from complete retained events');
      const insert=host.insertBefore,replace=host.replaceChildren;
      try{
        for(let i=0;i<64;i++)require(recorder.record({type:'synthetic_event',i}),'Initial record failed');
        host.insertBefore=()=>{throw Error('Synthetic transient insertion failure');};
        require(recorder.record({type:'synthetic_event',i:64})===false,'Expected retained insertion failure');host.insertBefore=insert;
        require(events.length===65&&!recorder.state.display_current,'Failed event was not retained');require(recorder.recover(),'First recovery failed');same();
        for(let i=65;i<193;i++){require(recorder.record({type:'synthetic_event',i}),'Recovery failed at segment event '+i);same();}
        const lastGood=host.textContent;host.replaceChildren=()=>{throw Error('Synthetic pre-mutation replacement failure');};
        require(recorder.recover()===false,'Expected replacement failure');require(host.textContent===lastGood,'Last-good display changed');
        require(recorder.record({type:'synthetic_event',i:193})===false&&events.length===194,'Unavailable display lost an event');host.replaceChildren=replace;
        require(recorder.recover(),'Second recovery failed');
        for(let i=194;i<260;i++)require(recorder.record({type:'synthetic_event',i,text:i===259?'☃ </pre> '+ 'x'.repeat(20000):''}),'Later segment failed '+i);
        same();require(recorder.state.rendered_events===260&&recorder.state.display_current,'Recovered state incomplete');
        require(recorder.state.render_failures===2,'Failure evidence lost');require(host.childNodes.length<16,'Unbounded text nodes');
        return {events:events.length,state:{...recorder.state},textNodes:host.childNodes.length,exactVisibleJSON:true,scope:'Real DOM; synthetic failure injection and event data; no performance comparison'};
      }finally{host.insertBefore=insert;host.replaceChildren=replace;host.remove();}
    });
    assert.equal(result.events,260);assert.equal(result.state.render_failures,2);assert.equal(result.exactVisibleJSON,true);report.mediaRecovery=result;
  });
  await check('Media terminal failures fence callback evidence and permit explicit reload in the native workspace',async()=>{
    const result=await page.evaluate(async()=>{
      const {mount}=await import('/workspaces/engineering/media/index.mjs');
      const results=[];const require=(condition,message)=>{if(!condition)throw Error(message);};
      for(const mode of ['youtube','native','hls']){
        const previous={YT:Object.getOwnPropertyDescriptor(window,'YT'),Hls:Object.getOwnPropertyDescriptor(window,'Hls')};
        const originalCreate=document.createElement,players=[],videos=[];let hlsError,controller;const container=originalCreate.call(document,'section');document.body.append(container);
        const calls={play:0,pause:0,destroy:0,sourceAssignments:0};
        class Hls{static version='1.7.3';static Events={ERROR:'error'};static isSupported(){return true;}on(_name,callback){hlsError=callback;}loadSource(){calls.sourceAssignments++;}attachMedia(){}destroy(){calls.destroy++;}}
        const YT={Player:class{constructor(_host,options){players.push(options);}playVideo(){calls.play++;}pauseVideo(){calls.pause++;}destroy(){calls.destroy++;}}};
        Object.defineProperty(window,'YT',{configurable:true,writable:true,value:YT});Object.defineProperty(window,'Hls',{configurable:true,writable:true,value:Hls});
        document.createElement=function(tag,...args){const element=originalCreate.call(this,tag,...args);if(String(tag).toLowerCase()==='video'){
          // Mock transport before attachment. Never assign remote media or poster
          // to a native URL property, so outside requests cannot be hidden by abort.
          for(const key of ['src','poster'])Object.defineProperty(element,key,{configurable:true,get(){return this.dataset['mock_'+key]||'';},set(value){this.dataset['mock_'+key]=String(value);calls.sourceAssignments++;}});
          Object.assign(element,{canPlayType:()=>mode==='hls'?'':'probably',pause(){calls.pause++;},load(){},async play(){calls.play++;}});videos.push(element);
        }return element;};
        try{
          controller=await mount({container,route:'#media?event_view=bounded',theme:'dark'});require(controller.ready,'Media did not mount');
          const root=container.shadowRoot,provider=mode==='youtube'?'YouTube':'Steam';
          const article=[...root.querySelectorAll('article.card')].find(card=>card.querySelector('.provider').textContent.includes(provider));require(article,'Missing provider card');
          const button=text=>[...article.querySelectorAll('button')].find(item=>item.textContent===text);
          const load=async()=>{button('Load selected player').click();await new Promise(resolve=>setTimeout(resolve,0));};
          await load();const oldCallbacks=mode==='youtube'?players.at(-1).events:null,oldVideo=videos.at(-1),emit=(video,type)=>video.dispatchEvent(new Event(type));
          if(oldCallbacks){
            require(players.at(-1).playerVars.autoplay===0,'Autoplay must remain off');oldCallbacks.onReady();
            // Exercise both corrections together through the real native UI:
            // recover an interrupted receipt, cross more segment boundaries,
            // then ensure a terminal player error cannot invent later evidence.
            const log=root.getElementById('events'),insert=log.insertBefore;
            try{log.insertBefore=()=>{throw Error('Synthetic native receipt interruption');};for(let n=0;n<200&&controller.exportState().receipt.event_view.display_current;n++)oldCallbacks.onStateChange({data:3});}
            finally{log.insertBefore=insert;}
            require(!controller.exportState().receipt.event_view.display_current,'Expected native receipt interruption');root.getElementById('recover-log').click();
            require(controller.exportState().receipt.event_view.display_current,'Native receipt recovery failed');
            for(let n=0;n<200;n++)oldCallbacks.onStateChange({data:3});
            require(controller.exportState().receipt.event_view.display_current,'Native recovered receipt failed at later boundary');oldCallbacks.onError({data:150});
          }
          else{emit(oldVideo,'canplay');if(mode==='hls')hlsError(null,{fatal:true,type:'networkError',details:'synthetic failure'});else emit(oldVideo,'error');}
          const failure=article.querySelector('.player-state').textContent,before=controller.exportState().receipt.events.length;
          if(oldCallbacks){oldCallbacks.onReady();for(const data of [1,2,3,0])oldCallbacks.onStateChange({data});oldCallbacks.onAutoplayBlocked();}
          else for(const type of ['canplay','playing','pause','ended'])emit(oldVideo,type);
          require(article.querySelector('.player-state').textContent===failure,'Terminal failure was overwritten');require(button('Play').disabled&&button('Pause').disabled,'Athena controls not disabled');
          require(controller.exportState().receipt.events.length===before,'Failed attempt added callback evidence');require(calls.play===0,'Playback requested automatically');
          await load();const eventsBeforeOld=controller.exportState().receipt.events.length;
          if(oldCallbacks){oldCallbacks.onReady();oldCallbacks.onStateChange({data:1});}else{emit(oldVideo,'canplay');emit(oldVideo,'playing');}
          require(controller.exportState().receipt.events.length===eventsBeforeOld,'Superseded callbacks added evidence');
          if(oldCallbacks)players.at(-1).events.onReady();else emit(videos.at(-1),'canplay');
          require(!button('Play').disabled,'Explicit reload did not recover controls');
          if(oldCallbacks)players.at(-1).events.onStateChange({data:1});else emit(videos.at(-1),'playing');
          const receipt=controller.exportState().receipt,failType={youtube:'youtube_error',native:'video_error',hls:'hls_error'}[mode];
          require(receipt.events.filter(event=>event.type===failType).length===1,'Failure receipt missing or duplicated');
          require(receipt.events.filter(event=>event.type==='youtube_playing'||event.type==='video_playing').length===1,'Only new-attempt playing callback should be recorded');
          require(root.getElementById('events').textContent===JSON.stringify(receipt.events,null,2),'Bounded native receipt display is incomplete');
          controller.unmount();require(root.childNodes.length===0,'Unmount left workspace DOM');
          results.push({mode,viewRenderFailures:receipt.event_view.render_failures,terminalFailure:failType,retainedFailureCount:1,newAttemptPlayingCallbacks:1,events:receipt.events.length,fixtureSHA256:receipt.fixture_sha256,exactVisibleJSON:true,calls:{...calls},scope:'Real browser DOM and native module; synthetic provider/media callbacks, not actual playback'});
        }finally{controller?.unmount();document.createElement=originalCreate;container.remove();for(const key of ['YT','Hls']){if(previous[key])Object.defineProperty(window,key,previous[key]);else delete window[key];}}
      }
      return results;
    });
    assert.equal(result.length,3);for(const row of result){assert.equal(row.retainedFailureCount,1);assert.equal(row.newAttemptPlayingCallbacks,1);assert.equal(row.calls.play,0);assert.equal(row.viewRenderFailures,row.mode==='youtube'?1:0);assert.match(row.fixtureSHA256,/^[a-f0-9]{64}$/);}report.mediaTerminalStates=result;
  });
}
module.exports={runMediaBrowserChecks};
