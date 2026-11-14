/** Athena native Foundry layout state. No credentials, provider sessions or source provenance. */
export function createLayoutModel(catalog) {
 const themes=new Map(catalog.map(t=>[t.id,t]));
 if(!themes.size)throw new Error('A reviewed theme catalog is required.');
 const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
 const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
 function validate(input){
  if(!plain(input)||input.version!==1||!themes.has(input.themeId))throw new Error('Unsupported layout or theme.');
  const theme=themes.get(input.themeId);
  if(!theme.rooms.some(r=>r.id===input.roomId))throw new Error('Room does not belong to selected theme.');
  if(!['dawn','day','dusk','night'].includes(input.time))throw new Error('Invalid time.');
  if(!plain(input.placements))throw new Error('Invalid placements.');
  const allowed=new Set(theme.objects.map(o=>o.id));const placements=Object.create(null);
  for(const [id,p] of Object.entries(input.placements)){
   if(!allowed.has(id)||!plain(p)||!finite(p.x,0,1)||!finite(p.y,0,1)||typeof p.pinned!=='boolean')throw new Error('Invalid object placement.');
   placements[id]={x:p.x,y:p.y,pinned:p.pinned};
  }
  return {version:1,themeId:theme.id,roomId:input.roomId,time:input.time,placements};
 }
 function initial(themeId=catalog[0].id){const theme=themes.get(themeId);if(!theme)throw new Error('Unknown theme.');return validate({version:1,themeId,roomId:theme.rooms[0].id,time:'day',placements:{}});}
 function parse(text){if(typeof text!=='string'||text.length>200000)throw new Error('Layout exceeds import limit.');return validate(JSON.parse(text));}
 function encode(value){return JSON.stringify(validate(value));}
 function save(storage,key,value){const encoded=encode(value);storage.setItem(key,encoded);return parse(encoded);}
 function load(storage,key){const raw=storage.getItem(key);return raw===null?{state:initial(),recovery:null}:{state:parse(raw),recovery:null};}
 function view(input){if(input===undefined)return {inspectorDock:'right'};if(!plain(input)||!['left','right','hidden'].includes(input.inspectorDock))throw Error('Unsupported inspector layout.');return {inspectorDock:input.inspectorDock};}
 function savedLayouts(input){
  if(input===undefined)return [];if(!Array.isArray(input)||input.length>20)throw Error('At most 20 saved layouts are allowed.');
  const names=new Set();return input.map(item=>{if(!plain(item)||typeof item.name!=='string'||!item.name.trim()||item.name!==item.name.trim()||item.name.length>80||names.has(item.name))throw Error('Saved layout names must be unique, nonempty and at most 80 characters.');names.add(item.name);return {name:item.name,layout:validate(item.layout)};});
 }
 function workspace(input){
  if(!plain(input)||input.version!==1||!plain(input.layouts))throw new Error('Unsupported workspace backup.');
  const active=validate(input.active),layouts=Object.create(null);
  for(const [id,value] of Object.entries(input.layouts)){
   const checked=validate(value);if(id!==checked.roomId)throw new Error('Layout key mismatch.');
   layouts[id]=checked;
  }
  layouts[active.roomId]=active;
  return {version:1,active,layouts,view:view(input.view),savedLayouts:savedLayouts(input.savedLayouts)};
 }
 function parseWorkspace(text){if(typeof text!=='string'||text.length>1000000)throw new Error('Workspace exceeds import limit.');return workspace(JSON.parse(text));}
 function encodeWorkspace(value){return JSON.stringify(workspace(value));}
 return {validate,initial,parse,encode,save,load,view,savedLayouts,workspace,parseWorkspace,encodeWorkspace};
}

/** Bounded session-only rollback. Every retained snapshot is schema validated. */
export function createLayoutHistory(model,limit=50){
 if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('Invalid history bound.');
 const past=[],future=[];const copy=value=>model.parseWorkspace(model.encodeWorkspace(value));
 return {
  record(value){past.push(copy(value));if(past.length>limit)past.shift();future.length=0;},
  undo(value){if(!past.length)return null;const current=copy(value);future.push(current);return copy(past.pop());},
  redo(value){if(!future.length)return null;const current=copy(value);past.push(current);if(past.length>limit)past.shift();return copy(future.pop());},
  get canUndo(){return past.length>0;},get canRedo(){return future.length>0;},
  get size(){return past.length+future.length;}
 };
}
