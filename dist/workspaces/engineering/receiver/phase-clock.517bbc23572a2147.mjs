// Shared monotonic timeline only within communicating browser contexts.
// Do not combine these anchors across browser restarts or isolated sessions.
export function phaseBreakdown(anchors) {
 const keys=['request_start','worker_module_ready','worker_received','validation_start','validation_end','send_start','main_received','main_finished'];
 const raw=Object.fromEntries(keys.map(key=>[key,anchors?.[key]===undefined?'missing':typeof anchors[key]==='number'&&!Number.isFinite(anchors[key])?String(anchors[key]):anchors[key]]));
 if(!keys.every(key=>Number.isFinite(anchors?.[key])))return {valid:false,reason:'Missing or non-finite phase anchors',raw};
 for(let i=1;i<keys.length;i++)if(anchors[keys[i]]<anchors[keys[i-1]])return {valid:false,reason:'Non-monotonic cross-context anchors; no clamping or phase attribution',raw};
 const labels=['startup_to_module_ready_ms','module_ready_to_receive_ms','worker_before_validation_ms','validation_ms','worker_after_validation_ms','response_delivery_ms','main_decode_and_binding_ms'];
 const phases=Object.fromEntries(labels.map((label,i)=>[label,anchors[keys[i+1]]-anchors[keys[i]]]));
 return {valid:true,scope:'Communicating-context monotonic timeline; privacy precision and scheduling apply, not pure CPU/network attribution',raw,phases,total_ms:anchors.main_finished-anchors.request_start};
}

export function completeDataSummary(samples) {
 if(!Array.isArray(samples)||samples.length===0||samples.some(sample=>sample?.complete_parity!==true))throw new Error('Cannot summarize incomplete or non-parity samples as complete data');
 let valid=0,rejected=0,unavailable=0;
 for(const sample of samples){if(sample.phase_timeline==null)unavailable++;else if(sample.phase_timeline.valid===true)valid++;else rejected++;}
 return {valid,rejected,unavailable,text:`${samples.length} complete-data samples retained. Worker phase timelines: ${valid} valid, ${rejected} rejected, ${unavailable} not collected. No production or target-project promotion.`};
}
