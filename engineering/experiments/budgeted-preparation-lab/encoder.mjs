// Isolated variant of the tested record-wise encoder. A caller-supplied upper
// bound replaces whole-array stringify just to discover an exact allocation.
export function encodeWithinBudget(records,byteBudget){
 if(!Array.isArray(records)||!Number.isSafeInteger(byteBudget)||byteBudget<2||byteBudget>100*1024*1024)throw RangeError('Invalid encoding budget');
 const began=performance.now(),encoder=new TextEncoder(),output=new Uint8Array(byteBudget);
 let offset=0,serializationMs=0,encodingMs=performance.now()-began;
 const append=text=>{const start=performance.now();const part=encoder.encodeInto(text,output.subarray(offset));if(part.read!==text.length)throw Error('Encoding budget exceeded');offset+=part.written;encodingMs+=performance.now()-start;};
 append('[');
 for(let i=0;i<records.length;i++){
  if(i)append(',');const start=performance.now(),text=JSON.stringify(records[i]);serializationMs+=performance.now()-start;
  if(typeof text!=='string')throw TypeError('Non-JSON record');append(text);
 }
 append(']');
 return {bytes:output.subarray(0,offset),allocated_bytes:byteBudget,serialization_ms:serializationMs,encoding_ms:encodingMs};
}
