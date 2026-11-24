import {verifyPrepared,verifyPreparedBounded,verifyPreparedForTransfer} from './verified-receiver.0b0bb67b4513ac91.mjs';
self.onmessage=async event=>{
 const {id,lane,prepared,count,bytes,transport='clone'}=event.data;
 try{
  if(!Number.isSafeInteger(id)||!['whole','bounded'].includes(lane)||!['clone','transfer'].includes(transport)||(transport==='transfer'&&lane!=='bounded'))throw Error('Invalid worker request');
  const start=performance.now();
  const verified=transport==='transfer'?await verifyPreparedForTransfer(prepared,count,bytes):await (lane==='whole'?verifyPrepared:verifyPreparedBounded)(prepared,count,bytes);
  const result=transport==='transfer'?verified.result:verified;
  const validation_ms=performance.now()-start;
  if(transport==='transfer'){
   const encoded=verified.encoded;
   self.postMessage({id,ok:true,format:'utf8-records',buffer:encoded.buffer,dataset:result.dataset,preparation_ms:result.preparation_ms,validation_ms,transport_encoding_ms:0,reused_verified_encoding:true},[encoded.buffer]);
  }else self.postMessage({id,ok:true,result,validation_ms});
 }catch(error){self.postMessage({id,ok:false,error:error.message});}
};
