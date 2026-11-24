import {encodeRecordArray} from './bounded-encoding.b3c034a08dcad316.mjs';
import {verifyPrepared,verifyPreparedBounded} from './verified-receiver.b14bb9fdc0aaa39e.mjs';
self.onmessage=async event=>{
 const {id,lane,prepared,count,bytes,transport='clone'}=event.data;
 try{
  if(!Number.isSafeInteger(id)||!['whole','bounded'].includes(lane)||!['clone','transfer'].includes(transport))throw Error('Invalid worker request');
  const start=performance.now();const result=await (lane==='whole'?verifyPrepared:verifyPreparedBounded)(prepared,count,bytes);
  const validation_ms=performance.now()-start;
  if(transport==='transfer'){
   const encodingStart=performance.now(),encoded=encodeRecordArray(result.records,result.dataset.serialized_bytes);
   self.postMessage({id,ok:true,format:'utf8-records',buffer:encoded.buffer,dataset:result.dataset,preparation_ms:result.preparation_ms,validation_ms,transport_encoding_ms:performance.now()-encodingStart},[encoded.buffer]);
  }else self.postMessage({id,ok:true,result,validation_ms});
 }catch(error){self.postMessage({id,ok:false,error:error.message});}
};
