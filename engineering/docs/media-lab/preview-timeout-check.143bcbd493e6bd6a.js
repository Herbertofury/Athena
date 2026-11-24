import {createPreviewLoader} from './preview-loader.2eff415295af8405.mjs';
const output=document.getElementById('output');
document.getElementById('run').addEventListener('click',async event=>{
 event.target.disabled=true;
 const img=document.createElement('img');img.alt='Generated one-pixel timeout fixture';
 img.dataset.source='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';
 document.getElementById('image').replaceChildren(img);
 const originalDecode=img.decode.bind(img);let late;
 img.decode=()=>new Promise(resolve=>{late=resolve;});
 const events=[],loader=createPreviewLoader([img],{timeoutMs:30,report:(type,details)=>events.push({type,...details})});
 try{
  const first=await loader.run();
  await new Promise(requestAnimationFrame);
  const sourceDetached=!img.hasAttribute('src'),identityRetained=img.dataset.source.startsWith('data:image/svg+xml,');
  late();await Promise.resolve();const lateStillFailed=loader.counts().failed===1;
  img.decode=originalDecode;const retry=await loader.run();
  const result={harness:'atlas-native-preview-timeout-v1',generated_stalled_decode:true,network_requests:false,first,sourceDetached,identityRetained,lateStillFailed,retry,width:img.naturalWidth,height:img.naturalHeight,events,passed:first.failed===1&&sourceDetached&&identityRetained&&lateStillFailed&&retry.decoded===1&&img.naturalWidth===1&&img.naturalHeight===1,limits:'Actual DOM removal and native data-image retry; no live provider timeout or socket cancellation timing.'};
  output.textContent=JSON.stringify(result,null,2);
 }catch(error){output.textContent=JSON.stringify({passed:false,error:String(error.message)},null,2);}
 finally{event.target.disabled=false;}
});
