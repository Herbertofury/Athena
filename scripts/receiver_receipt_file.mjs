// A chosen file is an unverified read-only view, never current or last-good evidence.
const RECEIVER_SOURCE_V9='atlas-complete-receiver-v9-explicit-phase-status';

function rejectDuplicateReceiptFields(text){
 // JSON.parse already checked syntax; this bounded pass rejects ambiguous
 // object keys, including escape-equivalent spellings that parse identically.
 const tokens=text.match(/"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\]:,]/g)||[];
 let next=0;
 function visit(depth){
  if(depth>32)throw Error('Receipt nesting exceeds the review limit.');
  const token=tokens[next++];
  if(token==='{'){
   const keys=new Set();
   while(tokens[next]!=='}'){
    const key=JSON.parse(tokens[next++]);
    if(keys.has(key))throw Error('Duplicate receipt property.');
    keys.add(key);next++;visit(depth+1);
    if(tokens[next]===',')next++;
   }
   next++;
  }else if(token==='['){
   while(tokens[next]!==']'){
    visit(depth+1);if(tokens[next]===',')next++;
   }
   next++;
  }
 }
 visit(0);
}

const receiverTimestamp=value=>typeof value==='string'&&value.length===24&&
 Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;

export async function reviewReceiverFile(file){
 if(!file||typeof file.arrayBuffer!=='function')throw Error('Choose a local JSON receipt.');
 if(file.type!=='application/json'&&!(file.type===''&&typeof file.name==='string'&&/\.json$/i.test(file.name)))
  throw Error('Choose a JSON receipt, not another file type.');
 const size=file.size;
 if(!Number.isSafeInteger(size)||size<1||size>MAX_RECEIPT)
  throw Error('Choose a nonempty receipt no larger than 256 KiB.');
 let raw;
 try{raw=await file.arrayBuffer();}catch{throw Error('Could not read the selected local receipt.');}
 if(!(raw instanceof ArrayBuffer)||raw.byteLength!==size)throw Error('Receipt size changed during reading.');
 let text,r;
 try{text=new TextDecoder('utf-8',{fatal:true}).decode(raw);r=JSON.parse(text);}
 catch{throw Error('The selected receipt is not valid UTF-8 JSON.');}
 rejectDuplicateReceiptFields(text);
 if(r?.harness!=='athena-native-complete-receiver-v1'||r.source_harness!==RECEIVER_SOURCE_V9)
  throw Error('This is an older or different Receiver format; keep the original file.');
 if(!receiverTimestamp(r.started_at)||!receiverTimestamp(r.finished_at)||r.finished_at<r.started_at||
  typeof r.dataset?.sha256!=='string'||!/^[a-f0-9]{64}$/.test(r.dataset.sha256)||
  !['main','worker','transport','receipt','build'].includes(r.execution))
  throw Error('Receipt identity or timestamp fields are invalid.');
 if(!Array.isArray(r.samples)||r.samples.some(sample=>!sample||typeof sample!=='object'||Array.isArray(sample)))
  throw Error('Receipt does not contain valid lane sample records.');
 validateReceiverObject(r);
 let hash;
 try{hash=await globalThis.crypto.subtle.digest('SHA-256',raw);}
 catch{throw Error('Exact file fingerprint could not be computed here.');}
 return {name:typeof file.name==='string'?file.name.slice(0,160):'Selected JSON file',size,
  sha256:[...new Uint8Array(hash)].map(number=>number.toString(16).padStart(2,'0')).join(''),
  started:r.started_at,finished:r.finished_at,execution:r.execution,count:r.count,bytes:r.bytes,
  dataset:r.dataset.sha256,samples:r.samples.map(({round,lane,request_ms})=>[round+1,lane,request_ms])};
}

function attachReceiverFileReview(root){
 const input=root.getElementById('receipt-file'),status=root.getElementById('receipt-file-status');
 const output=root.getElementById('receipt-file-output'),clear=root.getElementById('receipt-file-clear');
 const doc=input.ownerDocument;
 let operation=0,disposed=false;
 function el(tag,text){
  const node=doc.createElement(tag);if(text!==undefined)node.textContent=String(text);
  return node;
 }
 function render(result){
  const description=el('p','Unverified file evidence. Reported values were not rerun. The file fingerprint identifies these exact bytes; it does not authenticate the author or measurements.');
  const fields=el('dl');
  for(const [label,value,identity] of [
   ['File',result.name],['File size (bytes)',result.size],['File SHA-256',result.sha256,true],
   ['Recorded input SHA-256',result.dataset],['Execution lane set',result.execution],
   ['Records',result.count],['Bytes per record',result.bytes],['Reported start (UTC)',result.started],['Reported finish (UTC)',result.finished],
  ]){
   const dd=el('dd',value);
   if(identity)dd.dataset.receiverFileDigest='';
   fields.append(el('dt',label),dd);
  }
  const table=el('table'),head=el('thead'),labels=el('tr'),body=el('tbody');
  for(const label of ['Round','Lane','Reported request time (ms)']){
   const th=el('th',label);th.scope='col';labels.append(th);
  }
  head.append(labels);
  for(const sample of result.samples){
   const row=el('tr');row.append(...sample.map(value=>el('td',value)));body.append(row);
  }
  table.append(el('caption','Complete lane samples reported by the file'),head,body);
  output.replaceChildren(description,fields,table);output.hidden=false;clear.disabled=false;
 }
 async function choose(){
  if(disposed)return;
  const file=input.files?.[0];input.value='';if(!file)return;
  const token=++operation;
  clear.disabled=false;status.textContent='Reading the selected local receipt…';
  try{
   const result=await reviewReceiverFile(file);
   if(disposed||token!==operation)return;
   render(result);status.textContent='Showing an unverified local file. Current and last-good receipts were not changed.';
  }catch(error){
   if(disposed||token!==operation)return;
   clear.disabled=output.hidden;
   status.textContent=error.message+(output.hidden?'':' Previous file review retained.');
  }
 }
 function clearView(){
  if(disposed)return;
  operation++;output.replaceChildren();output.hidden=true;clear.disabled=true;
  status.textContent='No downloaded receipt selected.';
 }
 input.addEventListener('change',choose);clear.addEventListener('click',clearView);
 return ()=>{disposed=true;operation++;input.removeEventListener('change',choose);clear.removeEventListener('click',clearView);};
}
