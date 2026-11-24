// Deduplicate only in-flight work. A rejected attempt must not poison future retries.
export function createRetryableLoader(isReady,start) {
  let pending=null;
  return function load() {
    if(isReady())return Promise.resolve();
    if(pending)return pending;
    const attempt=Promise.resolve().then(start).then(()=>{
      if(!isReady())throw Error('Resource completed without the required capability');
    });
    pending=attempt;
    const clear=()=>{if(pending===attempt)pending=null;};
    attempt.then(clear,clear);
    return attempt;
  };
}
