// Optional local pixels, not app state, model input or part of an experiment.
const WIDTH=768,HEIGHT=96,MAX_BYTES=524288;
const SIGNATURE=[137,80,78,71,13,10,26,10];
export async function readLocalArtwork(file){
 if(!file||file.size<45||file.size>MAX_BYTES)throw Error('Choose a transparent 768 × 96 PNG under 512 KiB.');
 const raw=await file.arrayBuffer();
 if(raw.byteLength!==file.size)throw Error('The file changed while being read.');
 const view=new DataView(raw);
 if(!SIGNATURE.every((byte,i)=>view.getUint8(i)===byte)||view.getUint32(8)!==13||
  view.getUint32(12)!==0x49484452||view.getUint32(16)!==WIDTH||view.getUint32(20)!==HEIGHT||
  view.getUint8(24)!==8||view.getUint8(25)!==6||view.getUint8(26)!==0||view.getUint8(27)!==0||view.getUint8(28)!==0)
  throw Error('Choose a non-interlaced 768 × 96 RGBA PNG sprite strip.');
 let data=false,end=false;
 for(let offset=8;offset+12<=raw.byteLength;){
  const count=view.getUint32(offset),type=view.getUint32(offset+4),next=offset+12+count;
  if(next>raw.byteLength||type===0x6143544c||type===0x6663544c||type===0x66644154||
    (type===0x49484452&&offset!==8))throw Error('The PNG is truncated, animated, or malformed.');
  if(type===0x49444154&&count>0)data=true;
  if(type===0x49454e44){end=count===0&&next===raw.byteLength;break;}
  offset=next;
 }
 if(!data||!end)throw Error('The PNG is missing required image data or its ending.');
 return new Blob([raw],{type:'image/png'});
}
const terminal=new Set(['succeeded','failed','cancelled','canceled']);
const validId=id=>typeof id==='string'&&/^[1-9][0-9]{0,18}$/.test(id)&&BigInt(id)<=9223372036854775807n;
export function learningActivity({indicator,canvas,doc,view=doc.defaultView}){
 let active=null,disposed=false,art=null,painted=null;
 let shown=false;
 const draw=()=>{
  const show=!disposed&&!doc.hidden&&active?.phase==='running';
  if(show!==shown){indicator.hidden=!show;shown=show;}
  const ready=show&&art!==null&&painted===art;
  if(ready){if(indicator.dataset.strip!=='ready')indicator.dataset.strip='ready';}
  else if(indicator.hasAttribute('data-strip'))indicator.removeAttribute('data-strip');
  if(!show||!art||ready||active.attempted===art||typeof view?.createImageBitmap!=='function')return;
  const asset=art,job=active;job.attempted=asset;
  const obsolete=()=>disposed||active!==job||art!==asset;
  const pause=()=>{
   if(obsolete())return true;
   if(doc.hidden||job.phase!=='running'){job.attempted=null;return true;}
   return false;
  };
  Promise.resolve().then(()=>pause()?null:view.createImageBitmap(asset)).then(frame=>{
   if(!frame)return;
   try {
    if(pause()||frame.width!==WIDTH||frame.height!==HEIGHT)return;
    const context=canvas.getContext('2d',{alpha:true});
    if(!context)return;
    context.clearRect(0,0,WIDTH,HEIGHT);context.drawImage(frame,0,0);
    painted=asset;draw();
   }finally{frame.close();}
  }).catch(()=>{}); // Invalid pixels cannot replace the plain status indicator.
 };
 function stop(){active=null;draw();}
 function begin(id){
  if(disposed||!validId(id))return null;
  stop();const job=active={id,phase:'queued',attempted:null};
  return Object.freeze({
   observe(row){
    if(active!==job)return 'stale';
    if(row?.id!==id||!['queued','running'].includes(row.state)&&!terminal.has(row.state)){stop();return 'uncertain';}
    if(terminal.has(row.state)){stop();return row.state;}
    job.phase=row.state;draw();return row.state;
   },
   stop(){if(active===job)stop();}
  });
 }
 function setArtwork(blob){
  if(disposed||blob===art)return;
  art=blob;painted=null;
  canvas.width=WIDTH; // Clear any old pixels and discard the backing store.
  draw();
 }
 function pageHide(){stop();setArtwork(null);}
 function dispose(){
  if(disposed)return;
  pageHide();disposed=true;
  doc.removeEventListener('visibilitychange',draw);
  view?.removeEventListener?.('pagehide',pageHide);
 }
 indicator.hidden=true;
 doc.addEventListener('visibilitychange',draw);
 view?.addEventListener?.('pagehide',pageHide);
 return Object.freeze({begin,setArtwork,dispose});
}
