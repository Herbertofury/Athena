// Explicit retries preserve successful decodes; no automatic network retry loop.
export function createPreviewLoader(images,{concurrency=4,timeoutMs=30000,report=()=>{},setTimer=setTimeout,clearTimer=clearTimeout}={}) {
  if(!Array.isArray(images)||!Number.isInteger(concurrency)||concurrency<1||concurrency>16||!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>30000)throw Error('Invalid preview loader budget');
  const entries=images.map(image=>({image,state:'unattempted',attempts:0}));let pending=null,reportErrors=0;const totals={decoded:0,failed:0,unattempted:entries.length};
  const counts=()=>({total:entries.length,...totals,report_errors:reportErrors});
  const transition=(entry,state)=>{totals[entry.state]--;entry.state=state;totals[state]++;};
  const notify=(type,details)=>{try{report(type,details);}catch{reportErrors++;}};
  function decode(entry){return new Promise((resolve,reject)=>{
    let settled=false,timer=null;
    const finish=(ok,error)=>{if(settled)return;settled=true;if(timer!==null)clearTimer(timer);timer=null;ok?resolve():reject(error);};
    timer=setTimer(()=>finish(false,Error('Image decode timed out')),timeoutMs);
    try{entry.image.src=entry.image.dataset.source;Promise.resolve(entry.image.decode()).then(()=>finish(true),error=>finish(false,error));}catch(error){finish(false,error);}
  });}
  return {
    counts,
    run(){if(pending)return pending;
      const work=entries.filter(e=>e.state!=='decoded');let next=0;
      async function worker(){while(next<work.length){const entry=work[next++];entry.attempts++;const began=performance.now();try{await decode(entry);transition(entry,'decoded');entry.image.classList.remove('failed');notify('image_decoded',{source:entry.image.dataset.source,width:entry.image.naturalWidth,height:entry.image.naturalHeight,elapsed_ms:performance.now()-began,attempt:entry.attempts});}catch{transition(entry,'failed');entry.image.classList.add('failed');notify('image_failed',{source:entry.image.dataset.source,attempt:entry.attempts});}}}
      const attempt=Promise.all(Array.from({length:Math.min(concurrency,work.length)},worker)).then(()=>({...counts(),attempted:work.length}));pending=attempt;
      const clear=()=>{if(pending===attempt)pending=null;};attempt.then(clear,clear);return attempt;
    },
  };
}
