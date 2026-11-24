import {demo,validateSnapshot,parseStorageReport,formatBytes,formatMeasurement} from './model.mjs';
const $=id=>document.getElementById(id); let generation=0;
function render(snapshot) {
  if(snapshot.source==='imported-measurement')return renderMeasurement(snapshot);
  $('mode-description').textContent='Choose a category below to inspect its share. Categories must not overlap.';
  $('source').textContent=snapshot.source==='demo'?'DEMO DATA · NOT YOUR DEVICE':'IMPORTED SNAPSHOT · NOT DISK-VERIFIED';
  $('used').textContent=formatBytes(snapshot.usedBytes);
  $('capacity').textContent=`allocated of ${formatBytes(snapshot.capacityBytes)} capacity`;
  $('free').textContent=`${formatBytes(snapshot.freeBytes)} unallocated (calculated)`;
  $('categories').replaceChildren(); $('bands').replaceChildren();
  for (const [index,category] of snapshot.categories.entries()) {
    const button=document.createElement('button'); button.type='button'; button.className=`category tone-${index%5}`; button.setAttribute('aria-pressed','false');
    const name=document.createElement('span'); name.textContent=category.name;
    const value=document.createElement('strong'); value.textContent=`${formatBytes(category.bytes)} · ${(category.share*100).toFixed(1)}%`;
    button.append(name,value); button.onclick=()=>{
      for (const other of $('categories').children) other.setAttribute('aria-pressed','false');
      button.setAttribute('aria-pressed','true');
      $('selection').textContent=`${category.name}: ${formatBytes(category.bytes)}, ${(category.share*100).toFixed(1)}% of stated capacity. Read-only; no cleanup action is available.`;
    }; $('categories').append(button);
    const meter=document.createElement('meter'); meter.min=0; meter.max=snapshot.capacityBytes; meter.value=category.bytes; meter.className=`tone-${index%5}`; meter.title=category.name; $('bands').append(meter);
  }
  $('selection').textContent=snapshot.categories.length?'Choose a category.':'No categories in this snapshot.';
}
function renderMeasurement(snapshot){
  const fmt=formatMeasurement;
  const {totals,skipped,stops}=snapshot;
  $('source').textContent=`IMPORTED LINUX MEASUREMENT · NOT VERIFIED BY THIS PAGE${snapshot.partial?' · PARTIAL':''}`;
  $('used').textContent=fmt(totals.allocatedBytes);
  $('capacity').textContent=`allocated across ${totals.physicalFiles.toLocaleString()} unique files (${totals.files.toLocaleString()} pathnames; ${fmt(totals.logicalBytes)} logical)`;
  $('free').textContent=`Observed ${snapshot.observedAt} · no free-space estimate. Excluded: ${skipped.links} links, ${skipped.mounts} mounts, ${skipped.special} special entries.`;
  const detail=`Limits or gaps: entry limit ${stops.entryLimit}, depth skips ${stops.depthLimit}, deadline ${stops.deadline}, unreadable ${stops.unreadable}, changed ${stops.changed}.`;
  $('mode-description').textContent='Share of observed allocated file bytes only, not drive capacity. Hardlinks across categories have a separate shared allocation.'+(snapshot.partial?' '+detail:'');
  $('categories').replaceChildren();$('bands').replaceChildren();
  for(const [index,row] of snapshot.categories.entries()){
    const button=document.createElement('button');button.type='button';button.className=`category tone-${index%5}`;button.setAttribute('aria-pressed','false');
    const name=document.createElement('span');name.textContent=row.name;
    const value=document.createElement('strong');value.textContent=`${fmt(row.allocatedBytes)} allocated · ${fmt(row.logicalBytes)} logical`;
    button.append(name,value);button.onclick=()=>{
      for(const other of $('categories').children)other.setAttribute('aria-pressed','false');
      button.setAttribute('aria-pressed','true');$('selection').textContent=`${row.name}: ${row.files.toLocaleString()} pathnames, ${fmt(row.logicalBytes)} logical and ${fmt(row.allocatedBytes)} allocated. Read-only.`;
    };$('categories').append(button);
    const meter=document.createElement('meter');meter.min=0;meter.max=totals.allocatedBytes||1;meter.value=row.allocatedBytes;meter.className=`tone-${index%5}`;meter.title=row.name;$('bands').append(meter);
  }
  $('selection').textContent=snapshot.categories.length?'Choose a category.':'No files reported in this observation.';
}
$('file').addEventListener('change',async event=>{
  const input=event.target; const ticket=++generation; const file=input.files[0]; if(!file)return;
  try {if(file.size>65536)throw Error('JSON snapshot must be 64 KiB or smaller.');const text=await file.text(); if(ticket!==generation)return; const snapshot=parseStorageReport(text); render(snapshot); $('error').textContent='';}
  catch(error){if(ticket===generation)$('error').textContent=`Import rejected: ${error.message} Previous snapshot preserved.`;}
  finally{if(ticket===generation)input.value='';}
});
$('reset').onclick=()=>{++generation;$('file').value='';$('error').textContent='';render(validateSnapshot(demo));};
render(validateSnapshot(demo));
