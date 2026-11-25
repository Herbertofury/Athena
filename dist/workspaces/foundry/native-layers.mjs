// Adapted behavior from source prototype-v24.ts renderLayers; no source assets or private records.
const byStack=(a,b)=>b.zIndex-a.zIndex||(a.id<b.id?-1:a.id>b.id?1:0);
const groupOf=r=>r.scope==='sticker'?'Sticker: '+r.anchor:r.scope==='ui'?'Foundry UI':'World scene';
const description=r=>r.name+' · '+r.id+' · stack '+r.zIndex+(r.unavailable?' · anchor unavailable':'')+(r.filtered?' · filtered from scene':'');
const pressed=(button,value)=>button.setAttribute('aria-pressed',String(value));
function reorder(parent,nodes){
 let cursor=parent.firstElementChild;
 for(const node of nodes){
  if(node===cursor)cursor=cursor.nextElementSibling;
  else parent.insertBefore(node,cursor);
 }
}
export function attachNativeLayers({host,signal,onSelect,onVisible,onPin}){
 const doc=host.ownerDocument;
 let disposed=false,room=null,priorSelected=null;
 const rendered=new Map(),sections=new Map();
 host.innerHTML='<h2>Room layers</h2><p>All authored instances, including hidden and filtered objects. Groups follow native surfaces, not original left/right worlds. Pin is a native position pin, not the original lock. Visibility toggles explicitly adopt format v7 when needed.</p><div data-layer-groups></div><p data-layer-status role="status"></p>';
 const groups=host.querySelector('[data-layer-groups]'),status=host.querySelector('[data-layer-status]');
 function clear(){rendered.clear();sections.clear();groups.replaceChildren();priorSelected=null;}
 function property(button,value,negative,positive){
  button.textContent=value?positive:negative;pressed(button,value);
 }
 function create(row,selected){
  const item=doc.createElement('li');item.dataset.layerId=row.id;
  const label=doc.createElement('p'),buttons={};
  label.textContent=description(row);item.append(label);
  for(const action of ['select','visible','pin']){
   const button=doc.createElement('button');button.type='button';button.dataset.layerAction=action;
   // Keep visible copy compact but expose which layer each control acts on.
   button.setAttribute('aria-describedby',labelId(row.id));item.append(button);buttons[action]=button;
  }
  label.id=labelId(row.id);
  buttons.select.textContent='Select instance';pressed(buttons.select,row.id===selected);
  property(buttons.visible,row.visible,'Show instance','Hide instance');
  property(buttons.pin,row.pinned,'Pin position','Unpin position');
  return {item,label,buttons,row,group:groupOf(row)};
 }
 // The room model validates stable ASCII instance IDs. One mounted editor owns the layer panel.
 const labelId=id=>'foundry-layer-label-'+id;
 function update(rows,selected,roomKey){
  if(disposed||signal.aborted)return;
  if(room!==roomKey){clear();room=roomKey;}
  let topology=rendered.size!==rows.length;
  const incoming=new Set();
  for(const row of rows){
   incoming.add(row.id);
   const entry=rendered.get(row.id);
   if(!entry){rendered.set(row.id,create(row,selected));topology=true;continue;}
   const old=entry.row,group=groupOf(row);
   if(old.zIndex!==row.zIndex||entry.group!==group)topology=true;
   if(old.name!==row.name||old.zIndex!==row.zIndex||old.unavailable!==row.unavailable||old.filtered!==row.filtered)
    entry.label.textContent=description(row);
   if(old.visible!==row.visible)property(entry.buttons.visible,row.visible,'Show instance','Hide instance');
   if(old.pinned!==row.pinned)property(entry.buttons.pin,row.pinned,'Pin position','Unpin position');
   if((row.id===priorSelected)!==(row.id===selected))pressed(entry.buttons.select,row.id===selected);
   entry.row=row;entry.group=group;
  }
  if(topology){
   const focused=host.getRootNode().activeElement;
   for(const [id,entry] of rendered)if(!incoming.has(id)){entry.item.remove();rendered.delete(id);}
   const desired=new Map();
   for(const row of [...rows].sort(byStack)){
    const entry=rendered.get(row.id);
    if(!desired.has(entry.group))desired.set(entry.group,[]);
    desired.get(entry.group).push(entry.item);
   }
   for(const [key,items] of desired){
    if(!sections.has(key)){
     const section=doc.createElement('section'),heading=doc.createElement('h3'),list=doc.createElement('ul');
     heading.textContent=key;section.append(heading,list);sections.set(key,{section,list});
    }
    reorder(sections.get(key).list,items);
   }
   for(const [key,value] of sections)if(!desired.has(key)){value.section.remove();sections.delete(key);}
   reorder(groups,[...desired.keys()].map(key=>sections.get(key).section));
   if(focused&&groups.contains(focused)&&host.getRootNode().activeElement!==focused)focused.focus({preventScroll:true});
  }
  priorSelected=selected;
  const next=rows.length?rows.length+' instances; selection does not change saved state.':'Room has no object instances.';
  if(status.textContent!==next)status.textContent=next;
 }
 function click(event){
  if(disposed||signal.aborted)return;
  const button=event.target.closest?.('[data-layer-action]'),item=button?.closest('[data-layer-id]');
  if(!item||!groups.contains(item))return;
  const entry=rendered.get(item.dataset.layerId),action=button.dataset.layerAction;
  if(entry?.item!==item||entry.buttons[action]!==button)return;
  const row=entry.row;
  try{
   if(action==='select')onSelect(row.id);
   else if(action==='visible')onVisible(row.id,!row.visible);
   else if(action==='pin')onPin(row.id,!row.pinned);
  }catch{status.textContent='Layer action failed; inspect the current workspace before retrying.';}
 }
 host.addEventListener('click',click);
 function dispose(){if(disposed)return;disposed=true;host.removeEventListener('click',click);signal.removeEventListener('abort',dispose);clear();}
 signal.addEventListener('abort',dispose,{once:true});if(signal.aborted)dispose();
 return {update,dispose};
}
