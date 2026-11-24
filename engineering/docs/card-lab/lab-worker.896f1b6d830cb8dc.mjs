import {prepareDataset} from './preparation-core.4599a540506a9447.mjs';
self.onmessage=async event=>{
  const {id,count,bytes}=event.data||{};
  if(!Number.isSafeInteger(id)||id<1)return;
  try {const result=await prepareDataset(count,bytes);self.postMessage({id,ok:true,result});}
  catch(error){self.postMessage({id,ok:false,error:String(error?.message||'Preparation failed')});}
};
