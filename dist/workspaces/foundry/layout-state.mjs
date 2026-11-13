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
 return {validate,initial,parse,encode,save,load};
}
