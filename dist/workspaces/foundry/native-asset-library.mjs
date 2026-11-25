// Reviewed catalog-only adaptation of original AssetVault Add -> spawnObject.
export function attachNativeAssetLibrary({host,signal,onAdd}){
 const doc=host.ownerDocument;
 let disposed=false,generation=0,current=null,buttons=[];
 host.innerHTML='<h2>Current theme object catalog</h2><p>Add an independent instance at the world center, including after the room is empty. Current theme only; no asset downloads, autoplay or cross-theme imports. Adding explicitly adopts existing instance format v6 if needed.</p><label>Search current theme objects <input type="search" maxlength="200" data-asset-library-search placeholder="Name, shape, role, material, tags or affordances"></label><label>Material <select data-asset-library-material><option value="">All materials</option></select></label><p>Material and affordance labels come from Feature Foundry. They describe the original objects, not available native effects.</p><p data-asset-library-summary aria-live="polite"></p><div data-asset-library-list></div><p role="status" data-asset-library-status></p>';
 const list=host.querySelector('[data-asset-library-list]'),summary=host.querySelector('[data-asset-library-summary]'),status=host.querySelector('[data-asset-library-status]'),search=host.querySelector('[data-asset-library-search]'),material=host.querySelector('[data-asset-library-material]');
 function syncSummary(){
  const {name,count,objects}=current;
  const label=String(name)+' · '+count+'/100 instances · '+buttons.length+'/'+objects.length+' catalog objects';
  if(summary.textContent!==label)summary.textContent=label;
 }
 function render(){
  if(disposed||!current)return;
  const {key,objects,count}=current,token=++generation,terms=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches=objects.filter(o=>{
   const facts=o.sourceLabels;
   const text=[o.name,o.shape,o.role,facts?.material,...(facts?.tags||[]),...(facts?.affordances||[])].join(' ').toLowerCase();
   return (!material.value||material.value===facts?.material)&&terms.every(term=>text.includes(term));
  });
  list.replaceChildren();
  buttons=[];
  for(const o of matches){
   const row=doc.createElement('div'),label=doc.createElement('span'),button=doc.createElement('button');
   label.textContent=String(o.name)+' · '+String(o.shape)+' · '+String(o.role)+' ';
   button.textContent='Add '+String(o.name);
   button.dataset.addCatalogObject=o.id;
   button.disabled=count>=100;
   button.addEventListener('click',()=>{
    if(disposed||token!==generation||current.count>=100||!host.contains(button))return;
    try{
     const id=onAdd(key,o.id);
     status.textContent='Added independent instance '+id+'. Undo removes this addition.';
    }catch(e){status.textContent=String(e.message||'Add failed; no instance created.');}
   });
   buttons.push(button);
   row.append(label,button);
   if(o.sourceLabels){
    const source=doc.createElement('small');source.className='catalog-source-labels';
    const {material,tags,affordances}=o.sourceLabels;
    source.textContent='Material: '+material+' · Tags: '+tags.join(', ')+' · Source affordances: '+affordances.join(', ');
    row.append(source);
   }
   list.append(row);
  }
  if(!buttons.length){
   const empty=doc.createElement('p');
   empty.textContent='No matching objects in this theme. Change or clear the search.';
   list.append(empty);
  }
  syncSummary();
 }
 function update({key,name,objects,count}){
  if(disposed)return;
  const prior=current;
  current={key,name,objects,count};
  // The owner passes the same immutable theme catalog on room redraws.
  // Count changes must not detach the active keyboard control.
  if(prior?.key===key&&prior.objects===objects){
   if((prior.count>=100)!==(count>=100))for(const button of buttons)button.disabled=count>=100;
   syncSummary();
  }else{
   if(prior?.objects!==objects){
    const kept=material.value;
    const options=[...new Set(objects.map(o=>o.sourceLabels?.material).filter(Boolean))].sort();
    while(material.children.length>1)material.lastChild.remove();
    material.firstElementChild.toggleAttribute('selected',!options.includes(kept));
    for(const value of options){
     const option=doc.createElement('option');option.value=value;option.textContent=value;
     if(value===kept)option.setAttribute('selected','');
     material.append(option);
    }
   }
   render();
  }
  const text=count>=100?'Instance limit reached. Remove an instance before adding.':'Choose an object to add; existing room content is retained.';
  if(status.textContent!==text)status.textContent=text;
 }
 function dispose(){
  if(disposed)return;
  disposed=true;
  generation++;
  current=null;
  buttons=[];
  search.removeEventListener('input',render);material.removeEventListener('change',render);
  signal?.removeEventListener('abort',dispose);
  host.replaceChildren();
 }
 search.addEventListener('input',render);material.addEventListener('change',render);
 signal?.addEventListener('abort',dispose,{once:true});
 if(signal?.aborted)dispose();
 return{update,dispose};
}
