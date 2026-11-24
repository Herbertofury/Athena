import {createBlockedEventLogView} from './event-log-view.8da785a48d10552f.mjs';

// Integration lane: own immutable JSON snapshots while retaining every event
// even when its display fails. No provider data is interpreted as HTML.
export function createMediaEventRecorder(element, events, mode='baseline') {
  if(!Array.isArray(events)||events.length||!['baseline','bounded'].includes(mode))throw TypeError('Invalid recorder initialization');
  let view=mode==='bounded'?createBlockedEventLogView(element):null;
  if(mode==='baseline')element.textContent='[]';
  const state={mode,rendered_events:0,render_failures:0,recovery_attempts:0,display_current:true};
  function renderAll(){
    if(mode==='bounded'){
      const staging=element.ownerDocument.createElement('pre');
      const candidate=createBlockedEventLogView(staging);
      for(const value of events)candidate.append(value);
      element.replaceChildren(...staging.childNodes);
      view=candidate;
    }else element.textContent=JSON.stringify(events,null,2);
    state.rendered_events=events.length;state.display_current=true;
  }
  return {
    state,
    record(value){
      // Validate serializability before committing. Detach nested caller data
      // so later mutation cannot make the export disagree with the visible log.
      const serialized=JSON.stringify(value);
      if(serialized===undefined)throw TypeError('Event must be JSON serializable');
      const snapshot=JSON.parse(serialized);
      events.push(snapshot);
      try{
        if(!state.display_current) return false;
        if(mode==='bounded')view.append(snapshot);
        else element.textContent=JSON.stringify(events,null,2);
        state.rendered_events=events.length;
        return true;
      }catch{state.render_failures++;state.display_current=false;return false;}
    },
    recover(){
      state.recovery_attempts++;
      try{renderAll();return true;}
      catch{state.render_failures++;state.display_current=false;return false;}
    },
  };
}
