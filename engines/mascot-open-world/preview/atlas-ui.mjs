// SPDX-License-Identifier: GPL-3.0-or-later
const {cityCatalog,inspectWorldPoint,planRoadRoute,createDoorVisit}=atlasRules;
const world=cityCatalog(),visit=createDoorVisit(),q=id=>document.getElementById(id);
const map=q('city-map'),floor=q('floorplan'),from=q('from'),to=q('to'),door=q('door');
const x=q('x'),y=q('y');let room=null,setNext='from',zoom=1,route=null,center={x:1600,y:1100};
const svgNS='http://www.w3.org/2000/svg';
function el(type,attrs={},text=''){
 const node=document.createElementNS(svgNS,type);
 for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);
 if(text)node.textContent=text;
 return node;
}
const fragment=document.createDocumentFragment();
const defs=el('defs'),pattern=el('pattern',{id:'grid',width:100,height:100,patternUnits:'userSpaceOnUse'});
pattern.append(el('path',{d:'M 100 0 L 0 0 0 100',fill:'none',stroke:'#211f31','stroke-width':1.5}));
defs.append(pattern);fragment.append(defs);
fragment.append(el('rect',{width:world.width,height:world.height,fill:'#0a0a13'}));
for(const d of world.districts){
 fragment.append(el('rect',{x:d.x,y:d.y,width:d.w,height:d.h,fill:d.base,opacity:.84,stroke:'#3c3356','stroke-width':3}));
}
fragment.append(el('rect',{width:world.width,height:world.height,fill:'url(#grid)'}));
const streets=el('g',{'aria-hidden':'true'});
for(const [i,edges] of world.roads){
 for(const j of edges){
  if(j<=i)continue;
  const a=world.roadNodes[i],b=world.roadNodes[j];
  const coords={x1:a.x,y1:a.y,x2:b.x,y2:b.y,'stroke-linecap':'round'};
  streets.append(el('line',{...coords,stroke:'#545268','stroke-width':39}),el('line',{...coords,stroke:'#242337','stroke-width':29}));
 }
}
fragment.append(streets);
for(const d of world.districts){
 fragment.append(el('text',{x:d.x+35,y:d.y+58,class:'district-label'},d.name.toUpperCase()));
}
for(const b of world.buildings){
 fragment.append(el('rect',{x:b.x,y:b.y,width:b.w,height:b.h,fill:b.fill,opacity:.9,rx:12,stroke:b.roof,'stroke-width':8}),
  el('text',{x:b.x+b.w/2,y:b.y+40,'text-anchor':'middle',class:'build-label'},world.signs[b.id]||b.id));
}
for(const v of world.safehouses){
 fragment.append(el('circle',{cx:v.x,cy:v.y,r:v.radius,fill:'#8be8cd','fill-opacity':.16,stroke:'#8be8cd','stroke-opacity':.55,'stroke-width':5,'aria-hidden':'true'}));
}
const active=el('polyline',{id:'active-route',fill:'none',stroke:'#e6b7ff','stroke-width':20,'stroke-linejoin':'round','stroke-linecap':'round','pointer-events':'none','aria-hidden':'true'});
const cursor=el('circle',{r:32,fill:'none',stroke:'#f9e482','stroke-width':7,'pointer-events':'none','aria-hidden':'true'});
fragment.append(active,cursor);
function action(node,callback){
 node.addEventListener('click',ev=>{ev.stopPropagation();callback();});
 node.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();callback();}});
}
function option(select,value,label){const o=document.createElement('option');o.value=String(value);o.textContent=label;select.append(o);}
for(const [i,p] of world.roadNodes.entries()){
 const marker=el('circle',{cx:p.x,cy:p.y,r:27,fill:'#c7b9ef',stroke:'#11121e','stroke-width':8,
  tabindex:0,role:'button',class:'map-node','data-node':i,'aria-label':'Road node '+i});
 marker.append(el('title',{},'Road node '+i));
 action(marker,()=>{(setNext==='from'?from:to).value=String(i);setNext=setNext==='from'?'to':'from';plot();});
 fragment.append(marker);
 for(const select of [from,to])option(select,i,'Road node '+String(i).padStart(2,'0'));
}
for(const interior of world.interiors){
 option(door,interior.id,interior.name);
 const p=interior.outsideDoor;
 const marker=el('circle',{cx:p.x,cy:p.y,r:25,fill:'#8be8cd',stroke:'#162239','stroke-width':6,
  tabindex:0,role:'button','aria-label':'Visit '+interior.name,class:'map-door','data-door':interior.id});
 marker.append(el('title',{},interior.name));
 action(marker,()=>{if(!room){door.value=interior.id;enter();}});
 fragment.append(marker);
}
map.append(fragment);
from.value='0';to.value='29';

function plot(){
 route=planRoadRoute(Number(from.value),Number(to.value));
 active.setAttribute('points',route.nodes.map(i=>{const p=world.roadNodes[i];return p.x+','+p.y;}).join(' '));
 q('route-status').textContent=route.distance.toLocaleString('en-US')+' map units · '+route.nodes.length+' nodes';
 q('route-detail').textContent=route.nodes.join(' → ');
}
function inspect(){
 try{
  if(x.value===''||y.value==='')throw Error('Fill in both coordinates.');
  const px=Number(x.value),py=Number(y.value),visit=inspectWorldPoint(px,py);
  cursor.setAttribute('cx',px);cursor.setAttribute('cy',py);
  q('point-status').textContent='Node '+visit.nearestRoadNode+' · '+visit.distanceToRoadNode.toFixed(1)+' units. '+
   [...visit.districts,...visit.buildings,...visit.doors].map(id=>world.districts.find(d=>d.id===id)?.name||world.signs[id]||id).filter((v,i,a)=>a.indexOf(v)===i).join(' / ');
 }catch(error){q('point-status').textContent=error.message;}
}
function enter(){
 if(room)return;
 const selected=world.interiors.find(v=>v.id===door.value),p=selected.outsideDoor;
 const result=visit.enter(selected.id,p.x,p.y);
 room=selected;door.disabled=q('enter').disabled=true;q('exit').disabled=false;
 floor.removeAttribute('hidden');floor.setAttribute('viewBox','0 0 '+room.w+' '+room.h);
 floor.setAttribute('aria-label',room.name+' floor plan with authored spawn and exit');
 const items=room.colliders.map(v=>el('rect',{x:v.x,y:v.y,width:v.w,height:v.h,rx:8,fill:'#4b3b69',stroke:'#a78dd0','stroke-width':2}));
 const z=room.exitZone,start=result.position;
 floor.replaceChildren(...items,el('rect',{x:z.x,y:z.y,width:z.w,height:z.h,fill:'#8be8cd'}),el('circle',{cx:start.x,cy:start.y,r:10,fill:'#e6b7ff'}));
 q('door-status').textContent='Inside '+room.name+' · spawn '+start.x+', '+start.y+'.';
 q('exit').focus();
}
function exit(){
 if(!room)return;
 const z=room.exitZone,{position:p}=visit.exit(z.x+z.w/2,z.y+z.h/2);
 room=null;floor.setAttribute('hidden','');floor.replaceChildren();door.disabled=q('enter').disabled=false;q('exit').disabled=true;
 x.value=String(p.x);y.value=String(p.y);inspect();q('door-status').textContent='Returned outside at '+p.x+', '+p.y+'.';
 q('enter').focus();
}
function updateZoom(){
 const w=world.width/zoom,h=world.height/zoom;
 map.setAttribute('viewBox',[Math.max(0,Math.min(world.width-w,center.x-w/2)),Math.max(0,Math.min(world.height-h,center.y-h/2)),w,h].join(' '));
 q('zoom-in').disabled=zoom>=2.5;q('zoom-out').disabled=zoom===1;
}
function changeZoom(direction){
 if(direction>0)center={x:x.value!==''&&Number.isFinite(Number(x.value))?Number(x.value):1600,y:y.value!==''&&Number.isFinite(Number(y.value))?Number(y.value):1100};
 zoom=Math.max(1,Math.min(2.5,zoom+direction*.5));updateZoom();
}
map.addEventListener('click',event=>{
 const c=map.getScreenCTM();
 if(!c)return;
 const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(c.inverse());
 x.value=String(Math.round(p.x));y.value=String(Math.round(p.y));inspect();
});
q('route').addEventListener('click',plot);
q('inspect').addEventListener('click',inspect);
q('enter').addEventListener('click',enter);
q('exit').addEventListener('click',exit);
q('zoom-in').addEventListener('click',()=>changeZoom(1));
q('zoom-out').addEventListener('click',()=>changeZoom(-1));
q('zoom-reset').addEventListener('click',()=>{zoom=1;updateZoom();});
plot();inspect();updateZoom();
