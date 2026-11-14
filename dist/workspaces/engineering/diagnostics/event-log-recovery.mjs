// Generated structural faults against real DOM in the browser, or a DOM double
// in unit tests. No providers, accounts, media requests or production mutation.
export function runEventLogRecoveryChecks(doc,factory) {
  const scenarios=[
    {name:'first segment',prefix:[]},
    {name:'entry-count boundary',prefix:Array.from({length:64},(_,i)=>({type:'fixture',index:i}))},
    {name:'text-size boundary',prefix:[{type:'fixture',padding:'x'.repeat(16000)}]},
  ];
  return scenarios.map(({name,prefix})=>{
    const element=doc.createElement('pre'),view=factory(element);
    for(const event of prefix)view.append(event);
    const before=element.textContent,closing=element.lastChild;
    element.removeChild(closing);
    const event={type:'recovery_fixture',unknown:'y'.repeat(500)};
    let rejected=false;try{view.append(event);}catch{rejected=true;}
    element.append(closing);
    const retained=element.textContent===before&&view.count===prefix.length;
    let retryError=null;try{view.append(event);}catch(error){retryError=String(error.message||error);}
    const expected=JSON.stringify([...prefix,event],null,2),equal=element.textContent===expected;
    return {scenario:name,generated_fault:true,initial_attempt_rejected:rejected,
      previous_text_and_count_retained:retained,retry_error:retryError,
      complete_output_equal:equal,count:view.count,expected_count:prefix.length+1,
      passed:rejected&&retained&&retryError===null&&equal&&view.count===prefix.length+1};
  });
}
