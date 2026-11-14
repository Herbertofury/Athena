import {createLayoutModel,createLayoutHistory} from './layout-state.mjs';
// Native Athena authoring module. Deliberately excludes artist provenance and account sessions.
export async function mount(context){
 const {container,signal,notify=()=>{}}=context;const doc=container.ownerDocument;
 const response=await fetch(new URL('./catalog.json',import.meta.url),{signal});if(!response.ok)throw Error('Foundry catalog unavailable.');
 const {themes}=await response.json();if(signal.aborted)return {unmount(){}};
 const model=createLayoutModel(themes);let current=model.initial(),layouts={},query=String(context.search||''),disposed=false,drag=null,invalidSavedState=false,importGeneration=0,selectedObject=null;
 try{if(context.state!==undefined){const envelope=context.state;if(!envelope||envelope.version!==1||!envelope.active||!envelope.layouts||typeof envelope.layouts!=='object'||Array.isArray(envelope.layouts))throw Error('Unsupported saved envelope.');for(const [id,value] of Object.entries(envelope.layouts)){const checked=model.validate(value);if(id!==checked.roomId)throw Error('Layout key mismatch.');layouts[id]=checked;}current=model.validate(envelope.active);}}catch{invalidSavedState=true;notify('Saved Foundry data is invalid and will not be overwritten. Imported layouts are recovery drafts only; original data requires manual recovery.');}
 const history=createLayoutHistory(model);
 const root=doc.createElement('section');root.className='foundry-workspace';root.dataset.theme=context.theme==='light'?'light':'dark';
 const css=doc.createElement('link');css.rel='stylesheet';css.href=new URL('./style.css',import.meta.url).href;container.append(css,root);
 root.innerHTML='<header><p class="eyebrow">NATIVE BUILD WORKSPACE · LAYOUT AUTHORING</p><h1>Shape a living workspace</h1><p>17 source themes, 34 rooms and all 85 ecology objects. Arrange, pin and preserve room layouts inside Athena.</p></header><p class="foundry-boundary">This authoring phase is not full Living World parity. Original 3D rendering, animated mascots, artist worlds, native SQLite and provider account controls remain pending. No media autoplay or account requests.</p><div class="foundry-toolbar"><button type="button" data-undo disabled>Undo</button><button type="button" data-redo disabled>Redo</button><label>Theme <select data-theme-select></select></label><label>Room <select data-room-select></select></label><label>Time <select data-time><option value="dawn">dawn</option><option value="day">day</option><option value="dusk">dusk</option><option value="night">night</option></select></label><button type="button" data-reset-room>Reset room arrangement</button><button type="button" data-export>Export this layout</button><label class="foundry-import">Import layout<input type="file" accept="application/json,.json" data-import></label><button type="button" data-export-workspace>Back up all rooms</button><label class="foundry-import">Restore rooms from backup<input type="file" accept="application/json,.json" data-import-workspace></label></div><p class="foundry-status" role="status" aria-live="polite"></p><div class="foundry-grid"><div class="foundry-scene" role="group" aria-label="Room layout. Tab to objects; arrow keys move, P pins or unpins."></div><aside><section class="foundry-inspector" aria-label="Object inspector"><h2>Object inspector</h2><label>Object <select data-inspect-object></select></label><p data-inspect-description></p><label>Horizontal position (%) <input data-inspect-x type="number" min="0" max="100" step="any"></label><label>Vertical position (%) <input data-inspect-y type="number" min="0" max="100" step="any"></label><label><input data-inspect-pin type="checkbox"> Pin object</label><button type="button" data-inspect-apply>Apply position</button></section><h2>Object ecology</h2><p>Drag or use arrow keys to position. Press P to pin. Positions are normalized to the room.</p><ul class="foundry-objects"></ul></aside></div>';
 const one=s=>root.querySelector(s),themeSelect=one('[data-theme-select]'),roomSelect=one('[data-room-select]'),timeSelect=one('[data-time]'),scene=one('.foundry-scene'),list=one('.foundry-objects'),status=one('.foundry-status');
 for(const t of themes){const o=doc.createElement('option');o.value=t.id;o.textContent=t.name;themeSelect.append(o);}
 const text=s=>{status.textContent=s;};
 const draftSnapshot=()=>({version:1,active:model.validate(current),layouts:Object.fromEntries(Object.entries(layouts).map(([k,v])=>[k,model.validate(v)]))});
 const syncHistory=()=>{one('[data-undo]').disabled=!history.canUndo;one('[data-redo]').disabled=!history.canRedo;};
 const checkpoint=()=>{history.record(draftSnapshot());syncHistory();};
 const snapshot=()=>{if(invalidSavedState)throw Error('Invalid existing state is retained for recovery.');return {version:1,active:model.validate(current),layouts:Object.fromEntries(Object.entries(layouts).map(([k,v])=>[k,model.validate(v)]))};};
 function save(){syncHistory();layouts[current.roomId]=model.validate(current);try{context.setState?.(snapshot());text('Layout updated. Athena reports storage failures separately; export a backup for recovery.');}catch{ text('Could not save this layout. Export a backup before leaving.');}}
 const pos=(id,i)=>current.placements[id]||{x:.15+(i%3)*.32,y:.25+Math.floor(i/3)*.4,pinned:false};
 function position(button,p){button.style.left=`clamp(var(--foundry-edge-x, 60px), ${p.x*100}%, calc(100% - var(--foundry-edge-x, 60px)))`;button.style.top=`clamp(85px, ${p.y*100}%, calc(100% - 85px))`;button.setAttribute('aria-pressed',String(p.pinned));}
 function syncInspector(){
  const t=themes.find(t=>t.id===current.themeId),select=one('[data-inspect-object]');
  if(!t.objects.some(o=>o.id===selectedObject))selectedObject=t.objects[0].id;
  select.replaceChildren();for(const o of t.objects){const option=doc.createElement('option');option.value=o.id;option.textContent=o.name;select.append(option);}select.value=selectedObject;
  const i=t.objects.findIndex(o=>o.id===selectedObject),o=t.objects[i],p=pos(o.id,i);
  one('[data-inspect-description]').textContent=`${o.shape} · ${o.role}`;
  one('[data-inspect-x]').value=String(Math.round(p.x*10000)/100);one('[data-inspect-y]').value=String(Math.round(p.y*10000)/100);one('[data-inspect-pin]').checked=p.pinned;
  one('[data-inspect-x]').disabled=p.pinned;one('[data-inspect-y]').disabled=p.pinned;one('[data-inspect-apply]').disabled=p.pinned;
 }
 function draw(){drag=null;
  const t=themes.find(t=>t.id===current.themeId);for(let i=0;i<4;i++)scene.style.setProperty(`--foundry-color-${i}`,/^#[0-9a-f]{6}$/i.test(t.colors?.[i])?t.colors[i]:['#67d9ff','#7cf6a5','#e9fbff','#146b93'][i]);themeSelect.value=t.id;roomSelect.replaceChildren();for(const r of t.rooms){const o=doc.createElement('option');o.value=r.id;o.textContent=r.name;roomSelect.append(o);}roomSelect.value=current.roomId;timeSelect.value=current.time;scene.dataset.time=current.time;scene.replaceChildren();list.replaceChildren();
  let visible=0;
  t.objects.forEach((o,i)=>{if(query&&!`${t.name} ${o.name} ${o.shape} ${o.role}`.toLowerCase().includes(query.toLowerCase()))return;visible++;
   const b=doc.createElement('button');b.type='button';b.className='foundry-object';b.dataset.id=o.id;b.dataset.shape=o.shape;const form=doc.createElement('span');form.className='foundry-object-form';form.setAttribute('aria-hidden','true');const label=doc.createElement('span');label.className='foundry-object-label';label.textContent=o.name;b.append(form,label);b.title=`${o.shape} · ${o.role}`;b.setAttribute('aria-label',`${o.name}; arrow keys move; P toggles pin`);position(b,pos(o.id,i));scene.append(b);
   const li=doc.createElement('li');li.textContent=`${o.name} · ${o.shape} · ${o.role}`;list.append(li);
  });syncInspector();text(`${visible} of ${t.objects.length} objects visible in ${t.rooms.find(r=>r.id===current.roomId).name}.`);
 }
 function switchRoom(themeId,roomId){checkpoint();importGeneration++;layouts[current.roomId]=model.validate(current);current=layouts[roomId]?model.validate(layouts[roomId]):{...model.initial(themeId),roomId};draw();save();}
 const onTheme=()=>{const t=themes.find(t=>t.id===themeSelect.value);switchRoom(t.id,t.rooms[0].id);};const onRoom=()=>switchRoom(current.themeId,roomSelect.value);const onTime=()=>{checkpoint();importGeneration++;current.time=timeSelect.value;scene.dataset.time=current.time;save();};
 themeSelect.addEventListener('change',onTheme);roomSelect.addEventListener('change',onRoom);timeSelect.addEventListener('change',onTime);
 function update(id,change){if(!drag||!drag.recorded){checkpoint();if(drag)drag.recorded=true;}importGeneration++;const t=themes.find(t=>t.id===current.themeId),i=t.objects.findIndex(o=>o.id===id);if(i<0)return;const old=pos(id,i);current.placements[id]={...old,...change};const b=Array.from(scene.children).find(b=>b.dataset.id===id);if(b)position(b,current.placements[id]);selectedObject=id;syncInspector();save();}
 const down=e=>{const b=e.target.closest?.('[data-id]');if(!b||!scene.contains(b)||e.button!==0)return;const t=themes.find(t=>t.id===current.themeId),p=pos(b.dataset.id,t.objects.findIndex(o=>o.id===b.dataset.id));if(p.pinned){text('Object is pinned. Press P to unpin.');return;}drag={id:b.dataset.id,pointer:e.pointerId,button:b};b.setPointerCapture?.(e.pointerId);};
 const move=e=>{if(!drag||drag.pointer!==e.pointerId)return;const box=scene.getBoundingClientRect();if(box.width&&box.height)update(drag.id,{x:Math.min(.94,Math.max(.06,(e.clientX-box.left)/box.width)),y:Math.min(.94,Math.max(.06,(e.clientY-box.top)/box.height))});};
 const up=()=>{drag=null;};
 const key=e=>{const b=e.target.closest?.('[data-id]');if(!b||!scene.contains(b))return;const t=themes.find(t=>t.id===current.themeId),p=pos(b.dataset.id,t.objects.findIndex(o=>o.id===b.dataset.id));if(e.key.toLowerCase()==='p'){e.preventDefault();update(b.dataset.id,{pinned:!p.pinned});return;}const delta={ArrowLeft:[-.02,0],ArrowRight:[.02,0],ArrowUp:[0,-.02],ArrowDown:[0,.02]}[e.key];if(!delta)return;e.preventDefault();if(p.pinned){text('Object is pinned. Press P to unpin.');return;}update(b.dataset.id,{x:Math.min(.94,Math.max(.06,p.x+delta[0])),y:Math.min(.94,Math.max(.06,p.y+delta[1]))});};
 const selectObject=e=>{const b=e.target.closest?.('[data-id]');if(b&&scene.contains(b)){selectedObject=b.dataset.id;syncInspector();}};
 scene.addEventListener('focusin',selectObject);scene.addEventListener('click',selectObject);
 one('[data-inspect-object]').addEventListener('change',()=>{selectedObject=one('[data-inspect-object]').value;syncInspector();});
 one('[data-inspect-pin]').addEventListener('change',()=>{drag=null;update(selectedObject,{pinned:one('[data-inspect-pin]').checked});});
 one('[data-inspect-apply]').addEventListener('click',()=>{
  const t=themes.find(t=>t.id===current.themeId),i=t.objects.findIndex(o=>o.id===selectedObject);if(i<0||pos(selectedObject,i).pinned)return;
  const raw=[one('[data-inspect-x]').value,one('[data-inspect-y]').value],values=raw.map(Number);
  if(raw.some(v=>!String(v).trim())||values.some(v=>!Number.isFinite(v)||v<0||v>100)){text('Position must contain two numbers from 0 to 100. No changes applied.');return;}
  const old=pos(selectedObject,i),preserve=(axis,index)=>raw[index]===String(Math.round(old[axis]*10000)/100)?old[axis]:values[index]/100;
  drag=null;update(selectedObject,{x:preserve('x',0),y:preserve('y',1)});
 });
 scene.addEventListener('pointerdown',down);scene.addEventListener('pointermove',move);scene.addEventListener('pointerup',up);scene.addEventListener('pointercancel',up);scene.addEventListener('lostpointercapture',up);scene.addEventListener('keydown',key);
 let objectUrl=null;const exportButton=one('[data-export]'),importInput=one('[data-import]');
 const downloadValue=(encoded,filename)=>{if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(new Blob([encoded],{type:'application/json'}));const a=doc.createElement('a');a.href=objectUrl;a.download=filename;a.click();};
 const download=()=>downloadValue(model.encode(current),'athena-room-layout.json');
 const backup=()=>{try{downloadValue(model.encodeWorkspace(snapshot()),'athena-foundry-workspace.json');}catch{ text('Existing saved state needs recovery. Export this room instead; the invalid workspace has not been overwritten.');}};
 const upload=async()=>{const generation=++importGeneration;const file=importInput.files?.[0];if(!file)return;try{if(file.size>200000)throw Error('Layout exceeds import limit.');const value=model.parse(await file.text());if(disposed||signal.aborted||generation!==importGeneration)return;layouts[current.roomId]=model.validate(current);checkpoint();current=value;draw();save();text(invalidSavedState?'Layout opened for recovery only. Original invalid saved data is retained; export this room before leaving.':'Validated room layout imported. Other rooms were preserved.');}catch(e){if(!disposed&&generation===importGeneration)text(`Import not applied: ${e.message}`);}finally{if(!disposed&&generation===importGeneration)importInput.value='';}};
 const workspaceInput=one('[data-import-workspace]');
 const restore=async()=>{
  const generation=++importGeneration,file=workspaceInput.files?.[0];if(!file)return;
  try{
   if(file.size>1000000)throw Error('Workspace exceeds import limit.');
   const restored=model.parseWorkspace(await file.text());
   if(disposed||signal.aborted||generation!==importGeneration)return;
   checkpoint();layouts[current.roomId]=model.validate(current);
   layouts={...layouts,...restored.layouts};current=restored.active;
   draw();save();text(invalidSavedState?'Backup opened for recovery only. Original invalid saved data is retained and has not been overwritten.':'Validated workspace restored. Included rooms were replaced; other rooms were preserved.');
  }catch(e){if(!disposed&&generation===importGeneration)text(`Restore not applied: ${e.message}`);}
  finally{if(!disposed&&generation===importGeneration)workspaceInput.value='';}
 };
 const rollback=direction=>{importGeneration++;drag=null;const value=history[direction](draftSnapshot());if(!value)return;current=value.active;layouts=value.layouts;draw();save();text(invalidSavedState?'Recovery draft changed; original invalid saved data remains protected.':`${direction==='undo'?'Undid':'Redid'} workspace edit. Rollback history lasts for this workspace session.`);};
 const resetRoom=()=>{
  importGeneration++;drag=null;
  if(!Object.keys(current.placements).length){text('Room arrangement is already at its defaults.');return;}
  checkpoint();current={...current,placements:{}};draw();save();
  text(invalidSavedState?'Recovery draft reset; original invalid saved data remains protected.':'Room arrangement reset, including pins. Other rooms and time were preserved. Undo restores the previous arrangement.');
 };
 one('[data-reset-room]').addEventListener('click',resetRoom);
 one('[data-undo]').addEventListener('click',()=>rollback('undo'));one('[data-redo]').addEventListener('click',()=>rollback('redo'));
 one('[data-export-workspace]').addEventListener('click',backup);workspaceInput.addEventListener('change',restore);
 exportButton.addEventListener('click',download);importInput.addEventListener('change',upload);draw();
 function unmount(){if(disposed)return;disposed=true;drag=null;if(objectUrl)URL.revokeObjectURL(objectUrl);root.remove();css.remove();signal.removeEventListener('abort',unmount);}
 signal.addEventListener('abort',unmount,{once:true});
 return {unmount,exportState:snapshot,setSearch(q){query=String(q||'');drag=null;draw();},setTheme(t){root.dataset.theme=t==='light'?'light':'dark';}};
}
