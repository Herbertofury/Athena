// SPDX-License-Identifier: GPL-3.0-or-later
const q=id=>document.getElementById(id);
const map=q('map'),ctx=map.getContext('2d'),start=q('start'),trigger=q('interact');
const g=authoredCityGeometry();
const areas=new Map(g.interiors.map(i=>[i.id,i]));
const insideRect=(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
function approach(door){
 // Pick a tick-safe outdoor starting point near the real source doorway,
 // outside any footprint. The actual interaction still uses source radius.
 const r=door.outsideDoor;
 for(const offset of [r.r-8,r.r-4,r.r-1]){
  for(const [dx,dy] of [[0,offset],[0,-offset],[-offset,0],[offset,0]]){
   const x=r.x+dx,y=r.y+dy;
   if(x>=24&&y>=24&&x<=g.width-24&&y<=g.height-24&&!g.buildings.some(b=>insideRect(x,y,b)))return {x,y};
  }
 }
 return null;
}
const starts=new Map([['street',{name:'Hideout Row street',x:430,y:2000}]]);
for(const floor of g.interiors){
 const p=approach(floor);
 if(p)starts.set(floor.id,{name:floor.name+' approach',...p});
}
for(const [id,p] of starts)start.append(Object.assign(document.createElement('option'),{value:id,textContent:p.name}));
const dirs={KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0],KeyW:[0,-1],ArrowUp:[0,-1],KeyS:[0,1],ArrowDown:[0,1]};
const pressed=new Set();
let host=createCityTraversal(starts.get('street')),raf=0,last=0;
const text=(id,v)=>{const e=q(id);if(e.textContent!==v)e.textContent=v;};
const limit=(v,lo,hi)=>Math.max(lo,Math.min(v,hi));
function render(){
 const s=host.snapshot(),floor=areas.get(s.interior?.id);
 const W=map.width,H=map.height,x=limit(s.x-W/2,Math.min(0,(s.bounds.w-W)/2),Math.max(0,s.bounds.w-W)),y=limit(s.y-H/2,Math.min(0,(s.bounds.h-H)/2),Math.max(0,s.bounds.h-H));
 const rect=(r,color)=>{ctx.fillStyle=color;ctx.fillRect(r.x-x,r.y-y,r.w,r.h);};
 const dot=(px,py,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(px-x,py-y,r,0,Math.PI*2);ctx.fill();};
 const name=(t,px,py)=>{ctx.fillStyle='#ecf0ff';ctx.font='16px system-ui';ctx.fillText(t,px-x,py-y);};
 ctx.fillStyle='#080a11';ctx.fillRect(0,0,W,H);
 if(floor)rect({x:0,y:0,w:floor.w,h:floor.h},floor.floor);
 else for(const d of g.districts)rect(d,d.base);
 ctx.strokeStyle='#697fc22a';ctx.beginPath();
 for(let k=(40-x%40)%40;k<W;k+=40){ctx.moveTo(k,0);ctx.lineTo(k,H);}
 for(let k=(40-y%40)%40;k<H;k+=40){ctx.moveTo(0,k);ctx.lineTo(W,k);}ctx.stroke();
 if(floor){
  for(const item of floor.colliders)rect(item,floor.prop);
  rect(floor.exitZone,s.action==='exit'?'#76eac3':'#416860');name('Exit',floor.exitZone.x,floor.exitZone.y-9);
 }else{
  for(const building of g.buildings){
   rect(building,building.fill);ctx.strokeStyle=building.roof;ctx.strokeRect(building.x-x,building.y-y,building.w,building.h);
   if(building.x-x>0)name(building.id.replaceAll('-',' '),building.x+14,building.y+25);
  }
  for(const i of g.interiors){
   dot(i.outsideDoor.x,i.outsideDoor.y,14,s.action==='enter'&&s.target===i.name?'#96ffe7':'#d1a66c');
   dot(i.outsideDoor.x,i.outsideDoor.y,5,'#131820');
  }
 }
 dot(s.x,s.y,13,'#1e3d5e');dot(s.x,s.y,8,'#91f6ca');
 text('scene',s.interior?.name??s.district??'Between districts');
 text('point',Math.round(s.x)+' · '+Math.round(s.y));
 text('target',s.action==='exit'?'Exit to street':s.action==='enter'?s.target:'None in reach');
 trigger.disabled=!s.action;trigger.textContent=s.action==='enter'?'Enter '+s.target:s.action==='exit'?'Exit to street':'Interact';
}
function clear(){pressed.clear();if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
function tick(now){
 raf=0;if(!pressed.size||document.hidden){last=0;return;}
 const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
 const axes=[...pressed].map(k=>dirs[k]).reduce(([x,y],[dx,dy])=>[x+dx,y+dy],[0,0]);
 const norm=Math.max(1,Math.hypot(...axes));
 if(axes[0]||axes[1]){host.move(210*dt*axes[0]/norm,210*dt*axes[1]/norm);render();}
 raf=requestAnimationFrame(tick);
}
function interact(){
 const result=host.interact();
 if(result.changed)text('walk-status',result.feedback.message);
 render();map.focus();
}
map.addEventListener('keydown',e=>{
 if(e.code==='KeyE'&&!e.repeat){e.preventDefault();interact();return;}
 if(!Object.hasOwn(dirs,e.code))return;
 e.preventDefault();pressed.add(e.code);if(!raf)raf=requestAnimationFrame(tick);
});
window.addEventListener('keyup',e=>{pressed.delete(e.code);if(!pressed.size)clear();});
map.addEventListener('blur',clear);window.addEventListener('blur',clear);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
trigger.addEventListener('click',interact);
q('reset').addEventListener('click',()=>{
 clear();const p=starts.get(start.value);if(!p)return;
 host=createCityTraversal(p);text('walk-status','Practice start: '+p.name);render();map.focus();
});
render();
