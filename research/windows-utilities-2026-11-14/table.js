'use strict';
(function(root){
 function ordered(tools,key,source='SourceForge',scale=5){
  const value=t=>key==='stars'?t.github?.stars:key==='rating'?(t.user_rating?.source===source&&t.user_rating.scale===scale?t.user_rating.value:null):key==='reviews'?(t.user_rating?.source===source&&t.user_rating.scale===scale?t.user_rating.count:null):t.priority;
  return [...tools].sort((a,b)=>{const x=value(a),y=value(b);if(x==null&&y!=null)return 1;if(y==null&&x!=null)return -1;if(x!=null&&y!=null&&x!==y)return key==='priority'?x-y:y-x;return a.name.localeCompare(b.name);});
 }
 if(typeof module!=='undefined')module.exports={ordered};
 if(!root.document)return;
 const $=id=>document.getElementById(id);
 fetch('catalog.json').then(r=>{if(!r.ok)throw Error('Catalog unavailable');return r.json();}).then(c=>{
  for(const cat of [...new Set(c.tools.map(t=>t.category))].sort()){const o=document.createElement('option');o.value=cat;o.textContent=cat;$('category').append(o);}
  function cell(row,text,url){const td=document.createElement('td');if(url){const a=document.createElement('a');a.href=url;a.textContent=text;td.append(a);}else td.textContent=text;row.append(td);}
  function draw(){const q=$('query').value.toLowerCase(),cat=$('category').value;const rows=ordered(c.tools.filter(t=>(!cat||t.category===cat)&&JSON.stringify(t).toLowerCase().includes(q)),$('sort').value);$('rows').replaceChildren();for(const t of rows){const tr=document.createElement('tr');cell(tr,t.name,t.official_url);cell(tr,t.category);cell(tr,String(t.priority));cell(tr,t.github?`${t.github.stars.toLocaleString()} · ${t.github.observed_at.slice(0,10)}`:'Not recorded',t.github?.url);const v=t.user_rating;cell(tr,v?`${v.value}/${v.scale} · ${v.count} reviews · ${v.source} · ${v.observed_at}`:'Not rated in this snapshot',v?.url);cell(tr,t.standout_features);cell(tr,t.license+' — '+t.reuse);cell(tr,t.risk);$('rows').append(tr);}$('count').textContent=`${rows.length} of ${c.tools.length} tools shown`;}
  for(const id of ['query','category','sort'])$(id).addEventListener('input',draw);draw();
 }).catch(e=>{$('count').textContent=e.message+'; use catalog.json or README.md.';});
})(globalThis);
