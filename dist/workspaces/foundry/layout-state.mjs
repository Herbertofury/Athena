/** Athena native Foundry layout state. No credentials, provider sessions or source provenance. */
export function createLayoutModel(catalog) {
 const blendModes=['normal','multiply','screen','overlay','soft-light','hard-light','difference','color-dodge','luminosity'];
 const themes=new Map(catalog.map(t=>[t.id,t]));
 if(!themes.size)throw new Error('A reviewed theme catalog is required.');
 const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
 const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
 const fields=(value,allowed,label)=>{if(Reflect.ownKeys(value).some(key=>typeof key!=='string'||!allowed.includes(key)))throw Error(`Unsupported fields in ${label}. Keep the original file; this version cannot preserve those fields.`);};
 function validate(input){
  if(!plain(input)||![1,2,3,4,5,6,7,8,9,10,11].includes(input.version)||!themes.has(input.themeId))throw new Error('Unsupported layout or theme.');
  fields(input,input.version>=4?['version','themeId','roomId','time','placements','environment']:['version','themeId','roomId','time','placements'],'layout');
  const theme=themes.get(input.themeId);
  if(!theme.rooms.some(r=>r.id===input.roomId))throw new Error('Room does not belong to selected theme.');
  if(!['dawn','day','dusk','night'].includes(input.time))throw new Error('Invalid time.');
  if(!plain(input.placements))throw new Error('Invalid placements.');
  const allowed=new Set(theme.objects.map(o=>o.id));if(Object.keys(input.placements).length>100)throw Error('At most 100 object instances per room.');const placements=Object.create(null);
  for(const [id,p] of Object.entries(input.placements)){
   if(!(input.version>=6?(allowed.has(id)||/^instance-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id))&&allowed.has(p?.objectId):allowed.has(id))||!plain(p)||!finite(p.x,0,1)||!finite(p.y,0,1)||typeof p.pinned!=='boolean')throw new Error('Invalid object placement.');
   fields(p,input.version>=11?['x','y','pinned','rotation','scaleX','scaleY','scope','anchor','objectId','opacity','visible','zIndex','skewX','skewY','brightness','contrast','saturation','hue','blur','transformOrigin','blendMode']:input.version>=9?['x','y','pinned','rotation','scaleX','scaleY','scope','anchor','objectId','opacity','visible','zIndex','skewX','skewY','brightness','contrast','saturation','hue','blur','transformOrigin']:input.version>=8?['x','y','pinned','rotation','scaleX','scaleY','scope','anchor','objectId','opacity','visible','zIndex','skewX','skewY','brightness','contrast','saturation','hue','blur']:input.version>=7?['x','y','pinned','rotation','scaleX','scaleY','scope','anchor','objectId','opacity','visible','zIndex']:input.version>=6?['x','y','pinned','rotation','scaleX','scaleY','scope','anchor','objectId']:input.version>=3?['x','y','pinned','rotation','scaleX','scaleY','scope','anchor']:input.version===2?['x','y','pinned','rotation','scaleX','scaleY']:['x','y','pinned'],'object placement');
   if(input.version>=2&&(!finite(p.rotation,-360,360)||![p.scaleX,p.scaleY].every(v=>finite(v,-8,8)&&Math.abs(v)>=.05)))throw Error('Transform requires rotation -360 to 360 and signed scale magnitude 0.05 to 8.');
   if(input.version>=3&&(!['world','ui','sticker'].includes(p.scope)||(p.scope==='sticker'?(typeof p.anchor!=='string'||!/^[-a-z0-9]{1,64}$/.test(p.anchor)):p.anchor!==null)))throw Error('Scoped placement requires world/ui with null anchor or sticker with a stable anchor key.');
   if(input.version>=7&&(!finite(p.opacity,0,1)||typeof p.visible!=='boolean'||!Number.isInteger(p.zIndex)||!finite(p.zIndex,0,100000)))throw Error('Appearance requires opacity 0..1, visible boolean and integer zIndex 0..100000.');
   if(input.version>=8&&(!finite(p.skewX,-85,85)||!finite(p.skewY,-85,85)||![p.brightness,p.contrast,p.saturation].every(v=>finite(v,0,2.5))||!finite(p.hue,-180,180)||!finite(p.blur,0,20)))throw Error('Skew/filter values exceed supported source bounds.');
   if(input.version>=9&&!["tl","tc","tr","ml","mc","mr","bl","bc","br"].includes(p.transformOrigin))throw Error("Unsupported transform origin.");
   if(input.version>=11&&!blendModes.includes(p.blendMode))throw Error('Unsupported blend mode.');
   placements[id]={...(input.version>=11?{blendMode:p.blendMode}:{}),...(input.version>=9?{transformOrigin:p.transformOrigin}:{}),...(input.version>=8?{skewX:p.skewX,skewY:p.skewY,brightness:p.brightness,contrast:p.contrast,saturation:p.saturation,hue:p.hue,blur:p.blur}:{}),...(input.version>=7?{opacity:p.opacity,visible:p.visible,zIndex:p.zIndex}:{}),...(input.version>=6?{objectId:p.objectId}:{}),x:p.x,y:p.y,pinned:p.pinned,...(input.version>=2?{rotation:p.rotation,scaleX:p.scaleX,scaleY:p.scaleY}:{}),...(input.version>=3?{scope:p.scope,anchor:p.anchor}:{})};
  }
  if(input.version>=5&&input.environment?.target==='object'&&!allowed.has(input.environment.targetId)&&!(input.version>=6&&/^instance-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(input.environment.targetId)))throw Error('Environment object target must belong to this room theme.');
  return {version:input.version,themeId:theme.id,roomId:input.roomId,time:input.time,placements,...(input.version>=4?{environment:environment(input.environment,input.version>=10?10:Math.min(5,input.version))}:{})};
 }
 function upgradeLayout(value){const prior=validate(value);if(prior.version>=2)return prior;return validate({...prior,version:2,placements:Object.fromEntries(Object.entries(prior.placements).map(([id,p])=>[id,{...p,rotation:0,scaleX:1,scaleY:1}]))});}
 function upgradeScopes(value){const prior=upgradeLayout(value);if(prior.version>=3)return prior;return validate({...prior,version:3,placements:Object.fromEntries(Object.entries(prior.placements).map(([id,p])=>[id,{...p,scope:'world',anchor:null}]))});}
 function environment(value,version=value?.target===undefined?4:5){if(!plain(value))throw Error('Environment configuration required.');fields(value,version>=5?['preset','opacity','horizon','target','targetId']:['preset','opacity','horizon'],'environment');if(version>=5&&(!['room','object'].includes(value.target)||(value.target==='room'?value.targetId!==null:typeof value.targetId!=='string'||!/^[-a-z0-9:]{1,100}$/.test(value.targetId))))throw Error('Environment requires room/null or object/stable object ID target.');if(!(version>=10?['off','vapor','backrooms','frutiger','aurora','ocean','raincity','diner']:['off','vapor','backrooms']).includes(value.preset)||!finite(value.opacity,0,1)||!finite(value.horizon,.1,.9))throw Error('Unsupported environment preset for this version, opacity 0..1 and horizon 0.1..0.9.');return {preset:value.preset,opacity:value.opacity,horizon:value.horizon,...(version>=5?{target:value.target,targetId:value.targetId}:{})};}
 function upgradeEnvironment(value,config){const expanded=!['off','vapor','backrooms'].includes(config.preset);const prior=expanded?upgradeOrigins(value):upgradeScopes(value);const version=Math.max(prior.version,expanded?10:config.target===undefined?4:5);return validate({...prior,version,environment:environment(config,version>=10?10:config.target===undefined?4:5)});}
 function upgradeInstances(value){const old=validate(value);if(old.version>=6)return old;const prior=upgradeEnvironment(old,{...(old.environment||{preset:'off',opacity:.82,horizon:.48}),target:old.environment?.target||'room',targetId:old.environment?.targetId||null});return validate({...prior,version:6,placements:Object.fromEntries(themes.get(prior.themeId).objects.map((o,i)=>[o.id,{objectId:o.id,x:.15+(i%3)*.32,y:.25+Math.floor(i/3)*.4,pinned:false,rotation:0,scaleX:1,scaleY:1,scope:'world',anchor:null,...prior.placements[o.id]}]))});}
 function upgradeAppearance(value){const prior=upgradeInstances(value);if(prior.version>=7)return prior;return validate({...prior,version:7,placements:Object.fromEntries(Object.entries(prior.placements).map(([id,p],i)=>[id,{...p,opacity:1,visible:true,zIndex:i+1}]))});}
 function upgradeFilters(value){const prior=upgradeAppearance(value);if(prior.version>=8)return prior;return validate({...prior,version:8,placements:Object.fromEntries(Object.entries(prior.placements).map(([id,p])=>[id,{...p,skewX:0,skewY:0,brightness:1,contrast:1,saturation:1,hue:0,blur:0}]))});}
 function upgradeOrigins(value){const prior=upgradeFilters(value);if(prior.version>=9)return prior;return validate({...prior,version:9,placements:Object.fromEntries(Object.entries(prior.placements).map(([id,p])=>[id,{...p,transformOrigin:"mc"}]))});}
 function upgradeBlendModes(value){const prior=upgradeOrigins(value);if(prior.version>=11)return prior;return validate({...prior,version:11,placements:Object.fromEntries(Object.entries(prior.placements).map(([id,p])=>[id,{...p,blendMode:'normal'}]))});}
 /** Source prototype-v24 resetSelectedTransform; native pin/anchor are not source lock/origin. */
 function resetSelectedTransform(value,id){
  const next=validate(value),p=next.placements[id];if(!p)throw Error('Select a stored object instance to reset.');
  const defaults={rotation:0,scaleX:1,scaleY:1,opacity:1,visible:true,skewX:0,skewY:0,brightness:1,contrast:1,saturation:1,hue:0,blur:0,transformOrigin:'mc',blendMode:'normal'};
  for(const [key,v] of Object.entries(defaults))if(Object.hasOwn(p,key))p[key]=v;
  return validate(next);
 }
 function workspaceVersion({active,layouts={},savedLayouts=[]}){return Math.max(active.version,...Object.values(layouts).map(v=>v.version),...savedLayouts.map(v=>v.layout.version));}
 function initial(themeId=catalog[0].id){const theme=themes.get(themeId);if(!theme)throw new Error('Unknown theme.');return validate({version:1,themeId,roomId:theme.rooms[0].id,time:'day',placements:{}});}
 function parse(text){if(typeof text!=='string'||text.length>200000)throw new Error('Layout exceeds import limit.');return validate(JSON.parse(text));}
 function encode(value){return JSON.stringify(validate(value));}
 function save(storage,key,value){const encoded=encode(value);storage.setItem(key,encoded);return parse(encoded);}
 function load(storage,key){const raw=storage.getItem(key);return raw===null?{state:initial(),recovery:null}:{state:parse(raw),recovery:null};}
 function view(input){if(input===undefined)return {inspectorDock:'right',inspectorWidth:240};if(!plain(input)||!['left','right','hidden'].includes(input.inspectorDock))throw Error('Unsupported inspector layout.');fields(input,['inspectorDock','inspectorWidth'],'inspector view');const inspectorWidth=input.inspectorWidth===undefined?240:input.inspectorWidth;if(!Number.isInteger(inspectorWidth)||!finite(inspectorWidth,180,480))throw Error('Inspector width must be an integer from 180 to 480.');return {inspectorDock:input.inspectorDock,inspectorWidth};}
 function savedLayouts(input){
  if(input===undefined)return [];if(!Array.isArray(input)||input.length>20)throw Error('At most 20 saved layouts are allowed.');
  const names=new Set();return input.map(item=>{if(!plain(item)||typeof item.name!=='string'||!item.name.trim()||item.name!==item.name.trim()||item.name.length>80||names.has(item.name))throw Error('Saved layout names must be unique, nonempty and at most 80 characters.');fields(item,['name','layout'],'named layout');names.add(item.name);return {name:item.name,layout:validate(item.layout)};});
 }
 function workspace(input){
  if(!plain(input)||![1,2,3,4,5,6,7,8,9,10,11].includes(input.version)||!plain(input.layouts))throw new Error('Unsupported workspace backup.');
  fields(input,['version','active','layouts','view','savedLayouts'],'workspace backup');
  const active=validate(input.active),layouts=Object.create(null);
  for(const [id,value] of Object.entries(input.layouts)){
   const checked=validate(value);if(id!==checked.roomId)throw new Error('Layout key mismatch.');
   layouts[id]=checked;
  }
  layouts[active.roomId]=active;
  const presets=savedLayouts(input.savedLayouts);if(workspaceVersion({active,layouts,savedLayouts:presets})>input.version)throw Error('Contained layouts require matching workspace format version 2 through 8.');
  return {version:input.version,active,layouts,view:view(input.view),savedLayouts:presets};
 }
 function parseWorkspace(text){if(typeof text!=='string'||text.length>1000000)throw new Error('Workspace exceeds import limit.');return workspace(JSON.parse(text));}
 function encodeWorkspace(value){return JSON.stringify(workspace(value));}
 return {resetSelectedTransform,blendModes,upgradeBlendModes,validate,upgradeLayout,upgradeScopes,environment,upgradeEnvironment,upgradeInstances,upgradeAppearance,upgradeFilters,upgradeOrigins,workspaceVersion,initial,parse,encode,save,load,view,savedLayouts,workspace,parseWorkspace,encodeWorkspace};
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
