// Full JSON wire equivalence for structured-cloneable JSON records, not a parser.
// Callers must enforce their schema and byte budgets before allocating.
export function encodeRecordArray(records,expectedBytes) {
  if(!Array.isArray(records)||!Number.isSafeInteger(expectedBytes)||expectedBytes<2||expectedBytes>100*1024*1024)throw new RangeError('Invalid encoding budget');
  const encoder=new TextEncoder(),output=new Uint8Array(expectedBytes);let offset=0;
  const append=text=>{
    const part=encoder.encodeInto(text,output.subarray(offset));
    if(part.read!==text.length)throw new Error('Encoded output exceeds declared length');
    offset+=part.written;
  };
  append('[');
  for(let i=0;i<records.length;i++){
    if(i)append(',');
    const text=JSON.stringify(records[i]);
    // JSON arrays serialize undefined elements as null, but this encoder is for
    // validated JSON records, never arbitrary values or callable toJSON hooks.
    if(typeof text!=='string')throw new TypeError('Non-JSON record');
    append(text);
  }
  append(']');
  if(offset!==expectedBytes)throw new Error('Encoded output differs from declared length');
  return output;
}
