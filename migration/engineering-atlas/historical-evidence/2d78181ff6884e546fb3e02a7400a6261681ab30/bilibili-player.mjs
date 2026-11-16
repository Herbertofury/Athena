// Official documented embed only. Frame load is not player readiness or playback.
export function bilibiliEmbedUrl(id) {
  if(typeof id!=='string'||!/^BV[A-Za-z0-9]{10}$/.test(id))throw Error('Invalid Bilibili video identity');
  const url=new URL('https://player.bilibili.com/player.html');
  url.searchParams.set('bvid',id);url.searchParams.set('autoplay','0');url.searchParams.set('poster','1');url.searchParams.set('danmaku','0');
  return url.href;
}
export function createBilibiliController({host,createFrame,report,setTimer=setTimeout,clearTimer=clearTimeout}) {
  let active=null,generation=0,timer=null;
  function clear(){generation++;if(timer!==null)clearTimer(timer);timer=null;if(active){active.onload=null;active.onerror=null;active.remove();active=null;}}
  return {
    load(id){
      const src=bilibiliEmbedUrl(id); // Reject before disturbing an existing valid frame.
      clear();const current=generation,frame=createFrame();let settled=false;active=frame;
      frame.title='Official Bilibili player';frame.allow='fullscreen; picture-in-picture';frame.allowFullscreen=true;
      frame.referrerPolicy='strict-origin-when-cross-origin';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');
      const currentFrame=()=>current===generation&&active===frame;
      const finish=(type)=>{if(!currentFrame()||settled)return;settled=true;frame.onload=null;frame.onerror=null;if(timer!==null)clearTimer(timer);timer=null;report(type,{video_id:id,autoplay:false});};
      frame.onload=()=>finish('bilibili_frame_loaded');
      frame.onerror=()=>finish('bilibili_frame_failed');
      timer=setTimer(()=>{if(currentFrame()){timer=null;report('bilibili_frame_unverified_timeout',{video_id:id,autoplay:false});}},20000);
      frame.src=src;
      try{host.append(frame);}catch(error){clear();throw error;}
      report('bilibili_frame_requested',{video_id:id,autoplay:false});
    },
    unload(){clear();report('bilibili_frame_unloaded',{});},
  };
}
