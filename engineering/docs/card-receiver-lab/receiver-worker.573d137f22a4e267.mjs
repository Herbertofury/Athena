import {verifyPrepared,verifyPreparedBounded} from './verified-receiver.b14bb9fdc0aaa39e.mjs';
self.onmessage=async event=>{
 const {id,lane,prepared,count,bytes}=event.data;
 try{
  if(!Number.isSafeInteger(id)||!['whole','bounded'].includes(lane))throw Error('Invalid worker request');
  const start=performance.now();const result=await (lane==='whole'?verifyPrepared:verifyPreparedBounded)(prepared,count,bytes);
  const validation_ms=performance.now()-start;
  self.postMessage({id,ok:true,result,validation_ms});
 }catch(error){self.postMessage({id,ok:false,error:error.message});}
};
