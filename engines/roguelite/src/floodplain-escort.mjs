// SPDX-License-Identifier: GPL-3.0-or-later
// Distinct moving-objective encounter: the skiff is safe only at the far dock.
// Driven by the existing run clock and ordinary player position, no timers.
export function createFloodplainEscort(seed){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw RangeError('Invalid floodplain seed');
 const mix=Math.imul(seed^0x73d9f815,0x846ca68b)>>>0,sign=(mix&1)?1:-1;
 const x=sign*(3520+(mix>>>18)%131),y=-sign*(1340+(mix>>>6)%93);
 const start=Object.freeze({x,y}), bend=Object.freeze({x:x+sign*176,y:y-sign*163});
 const dock=Object.freeze({x:x+sign*370,y:y-sign*74});
 const nodes=[start,bend,dock],roster=['Mira the Ferryman','Kael the Ferryman','Iona the Ferryman'];
 const companion=roster[(mix>>>7)%roster.length],distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 let position=start,hull=100,leg=0,state='unseen',recruited=false;
 const result=kind=>({kind,companion});
 function advance(player,dt){
  if(!Number.isFinite(player?.x)||!Number.isFinite(player?.y)||!Number.isFinite(dt)||dt<0)throw RangeError('Invalid floodplain tick');
  if(state==='unseen'){
   if(distance(player,start)>105)return null;
   state='waiting';return result('discover');
  }
  if(state==='waiting'){
   if(distance(player,start)>44||dt===0)return null;
   state='escorting';return result('launch');
  }
  if(state==='docked'&&!recruited&&distance(player,dock)<=29){
   recruited=true;return result('recruit');
  }
  if(state!=='escorting')return null;
  const beside=distance(player,position)<=115, pace=beside?68:28;
  hull=Math.max(0,hull-dt*(beside?1.2:11));
  if(hull===0){state='lost';return result('lost');}
  let meter=pace*dt;
  while(leg<2&&meter>0){
   const next=nodes[leg+1],d=distance(position,next);
   if(d<=meter){leg++;position=next;meter-=d;continue;}
   position={x:position.x+(next.x-position.x)*(meter/d),y:position.y+(next.y-position.y)*(meter/d)};
   break;
  }
  if(leg===2){state='docked';return result('dock');}
  return null;
 }
 function snapshot(){return {start,bend,dock,position:{...position},hull,leg,state,recruited,companion};}
 return Object.freeze({advance,snapshot});
}
