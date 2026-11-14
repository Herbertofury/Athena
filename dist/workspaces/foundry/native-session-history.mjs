// Adapted workflow: original prototype-v24.ts jumpHistory/renderHistory 632–634.
// Session snapshots only, not durable SQLite revisions or original source history.
export function attachSessionHistory({host,getHistory,onJump,signal}){
 const doc=host.ownerDocument;let disposed=false,generation=0;
 host.innerHTML='<h2>Session history</h2><p>Jump between retained workspace states across rooms. Future states remain available for Redo. Entries are bounded and expire on navigation away; this is not a native backup. Unsaved inspector inputs are not snapshots.</p><div data-session-history-list></div><p data-session-history-status role="status"></p>';
 const list=host.querySelector('[data-session-history-list]'),status=host.querySelector('[data-session-history-status]');
 list.style.display='grid';list.style.gap='.4rem';
 function update(){if(disposed||signal.aborted)return;const version=++generation,data=getHistory();list.replaceChildren();for(const [i,row] of data.entries.entries()){const button=doc.createElement('button');button.type='button';button.dataset.historyId=String(row.id);button.textContent=`${i+1}. ${row.state}: ${row.themeId} / ${row.roomId}`;button.disabled=row.state==='current';button.style.textAlign='left';if(button.disabled){button.setAttribute('aria-current','true');button.style.color='inherit';button.style.background='transparent';button.style.opacity='1';}button.addEventListener('click',()=>{if(disposed||signal.aborted||version!==generation||!list.contains(button))return;try{onJump(row.id,data.epoch);}catch{status.textContent='History changed or restoration could not complete. Inspect the current workspace and select a fresh entry.';update();}});list.append(button);}}
 function dispose(){if(disposed)return;disposed=true;generation++;signal.removeEventListener('abort',dispose);host.replaceChildren();}
 signal.addEventListener('abort',dispose,{once:true});update();return {update,dispose};
}
