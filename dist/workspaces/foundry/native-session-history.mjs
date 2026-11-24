// Adapted workflow: original prototype-v24.ts jumpHistory/renderHistory 632–634.
// Session snapshots only, not durable SQLite revisions or original source history.
export function attachSessionHistory({host,getHistory,onJump,signal}){
 const doc=host.ownerDocument;let disposed=false,generation=0;
 host.innerHTML='<h2>Session history</h2><p>Review or jump between retained workspace states across rooms. Future states remain available for Redo. Entries are bounded and expire on navigation away; this is not a native backup. Unsaved inspector inputs are not snapshots.</p><div data-session-history-list></div><section data-session-history-review hidden aria-label="Reviewed session state"></section><p data-session-history-status role="status"></p>';
 const list=host.querySelector('[data-session-history-list]'),review=host.querySelector('[data-session-history-review]'),status=host.querySelector('[data-session-history-status]');
 list.style.display='grid';list.style.gap='.4rem';
 const element=(tag,label)=>{const node=doc.createElement(tag);if(label!==undefined)node.textContent=label;return node;};
 const button=label=>{const node=element('button',label);node.type='button';return node;};
 const closeReview=()=>{review.hidden=true;review.replaceChildren();};
 function update(){
  if(disposed||signal.aborted)return;
  const version=++generation,data=getHistory();list.replaceChildren();closeReview();
  for(const [i,row] of data.entries.entries()){
   const actions=element('div');actions.style.display='flex';actions.style.flexWrap='wrap';actions.style.gap='.4rem';
   const jump=button(`${i+1}. ${row.state}: ${row.themeId} / ${row.roomId}`);
   jump.dataset.historyId=String(row.id);jump.disabled=row.state==='current';jump.style.textAlign='left';
   const live=()=>!disposed&&!signal.aborted&&version===generation&&list.contains(jump);
   if(jump.disabled){jump.setAttribute('aria-current','true');jump.style.color='inherit';jump.style.background='transparent';jump.style.opacity='1';}
   const restore=()=>{
    if(!live()||jump.disabled)return;
    try{onJump(row.id,data.epoch);}
    catch{status.textContent='History changed or restoration could not complete. Inspect the current workspace and select a fresh entry.';update();}
   };
   jump.addEventListener('click',restore);actions.append(jump);
   if(!jump.disabled&&typeof data.inspect==='function'){
    const open=button('Review');
    open.dataset.historyReview=String(row.id);open.setAttribute('aria-label','Review session state '+(i+1));
    open.addEventListener('click',()=>{
     if(!live())return;
     closeReview();
     let summary;
     try{summary=data.inspect(row.id,data.epoch);}
     catch{status.textContent='History changed or this state is no longer retained. Choose a fresh entry.';update();return;}
     const title=element('h3','State '+(i+1)+': '+row.themeId+' / '+row.roomId);title.tabIndex=-1;
     const rows=element('ul');
     for(const line of [
      'Active room time: '+summary.time,'Objects in active room: '+summary.placements,
      'Room layouts in snapshot: '+summary.rooms,'Inspector dock: '+summary.dock,
     ])rows.append(element('li',line));
     const names=element('li','Named layouts: ');
     if(summary.namedLayouts.length){
      const named=element('ul');named.style.overflowWrap='anywhere';
      for(const name of summary.namedLayouts)named.append(element('li',name));
      names.append(named);
     }else names.append(doc.createTextNode('none'));
     rows.append(names);
     const apply=button('Jump to reviewed state'),close=button('Close review');
     apply.dataset.jumpReviewedHistory='';close.dataset.closeHistoryReview='';
     apply.addEventListener('click',()=>{if(review.contains(apply))restore();});
     close.addEventListener('click',()=>{if(!live()||!review.contains(close))return;closeReview();open.focus();});
     review.append(title,element('p','Summary only. Nothing has changed. Jumping replaces the whole workspace and may discard unapplied inspector inputs.'),rows,apply,close);
     review.hidden=false;title.focus();
    });
    actions.append(open);
   }
   list.append(actions);
  }
 }
 function dispose(){if(disposed)return;disposed=true;generation++;signal.removeEventListener('abort',dispose);host.replaceChildren();}
 signal.addEventListener('abort',dispose,{once:true});update();return {update,dispose};
}
