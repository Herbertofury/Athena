// Finish every record, but yield between bounded main-thread creation slices.
// A single record may exceed the time budget; this is cooperative, not preemptive.
export async function createInSlices(records,{appendRecord,yieldTask,check=()=>{},now=()=>performance.now(),budgetMs=4}) {
  if(!Array.isArray(records)||records.length>3000||typeof appendRecord!=='function'||typeof yieldTask!=='function'||typeof check!=='function'||typeof now!=='function'||!Number.isFinite(budgetMs)||budgetMs<=0||budgetMs>16)throw TypeError('Invalid cooperative creation contract');
  let start=now(),previous=start,maxSlice=0,yields=0,completed=0;
  if(!Number.isFinite(start))throw Error('Invalid creation clock');
  const elapsed=()=>{const current=now();if(!Number.isFinite(current)||current<previous)throw Error('Invalid creation clock');previous=current;return current-start;};
  check();
  for(let index=0;index<records.length;index++){
    appendRecord(records[index],index);completed++;
    const duration=elapsed();
    if(duration>=budgetMs&&index+1<records.length){
      maxSlice=Math.max(maxSlice,duration);check();await yieldTask();check();yields++;
      start=now();if(!Number.isFinite(start)||start<previous)throw Error('Invalid creation clock');previous=start;
    }
  }
  maxSlice=Math.max(maxSlice,elapsed());check();
  return {completed_records:completed,yield_count:yields,max_creation_slice_ms:maxSlice,budget_ms:budgetMs};
}
