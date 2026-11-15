import {compareGallery} from './compare.mjs';
export const MAX_LOCAL_BYTES=2*1024*1024;
export function createLocalComparison({hash=async bytes=>{const raw=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(raw),b=>b.toString(16).padStart(2,'0')).join('')}}={}){
 let seq=0,last=null;return {get last(){return last},cancel(){seq++},async load(file,card){const own=++seq;try{if(!file||!Number.isSafeInteger(file.size)||file.size<1||file.size>MAX_LOCAL_BYTES||typeof file.arrayBuffer!=='function')throw Error('Choose one JSON file between 1 byte and 2 MiB.');const bytes=await file.arrayBuffer();if(own!==seq)return {status:'superseded'};if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==file.size)throw Error('File length changed or could not be read.');let project;try{project=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch{throw Error('File is not valid UTF-8 project JSON.')}const result=compareGallery(project,card);const digest=await hash(bytes);if(own!==seq)return {status:'superseded'};if(!/^[a-f0-9]{64}$/.test(digest))throw Error('File hash unavailable.');last=Object.freeze({card_id:card.id,result:Object.freeze(result),bytes:bytes.byteLength,sha256:digest});return {status:'ready',record:last}}catch(error){if(own!==seq)return {status:'superseded'};throw error}}};
}

// Export only the narrow derived comparison and digest, never selected file contents.
export function comparisonReceipt(record){
 if(!record||typeof record.card_id!=='string'||!/^modrinth:[A-Za-z0-9]{8}$/.test(record.card_id)||!Number.isSafeInteger(record.bytes)||record.bytes<1||record.bytes>MAX_LOCAL_BYTES||!/^[a-f0-9]{64}$/.test(record.sha256)||!['matching','changed','unknown'].includes(record.result?.status))throw Error('Invalid comparison record.');
 return {schema_version:1,scope:'local gallery URL-pair comparison; not image or source verification',card_id:record.card_id,input_bytes:record.bytes,input_sha256:record.sha256,result:record.result};
}
