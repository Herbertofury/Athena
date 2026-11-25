// SPDX-License-Identifier: GPL-3.0-or-later
// Deterministic late-route terrain. Nothing runs when the parent route is paused.
// Cairns on the surface indicate the order of three underground mirrors.
const make=(id,x,y,r)=>Object.freeze({id,x,y,r});
export function createAshglassCavern(seed) {
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw RangeError('Invalid cavern seed');
 const mix=Math.imul(seed^0xa5a8eae9,0x9e3779b1)>>>0, sign=mix&1?1:-1;
 const x=sign*(2540+(mix>>>17)%223),y=sign*(620+(mix>>>8)%92);
 const mouth=make('ashglass-mouth',x,y,100);
 const pedestal=make('ashglass-pedestal',x+sign*248,y,30);
 const mirrors=Object.freeze([
  make('ashglass-amber',x+sign*108,y-82,23),
  make('ashglass-blue',x+sign*109,y+80,23),
  make('ashglass-white',x+sign*173,y-6,23),
 ]);
 const n=(mix>>>4)%3, s=mix&2?2:1;
 const order=Object.freeze([n,(n+s)%3,(n+s*2)%3]);
 let entered=false, aligned=0, last=-1, wrongTurns=0, taken=false;
 let vaultOpen=false;
 function visit({x:px,y:py}){
  if(!Number.isFinite(px)||!Number.isFinite(py))throw RangeError('Invalid cavern coordinates');
  const within=p=>(px-p.x)**2+(py-p.y)**2<=p.r**2;
  if(!entered&&!within(mouth))return null;
  if(!entered){entered=true;return {kind:'discover'};}
  if(vaultOpen){
   if(!taken&&within(pedestal)){taken=true;return {kind:'claim',gold:34};}
   return null;
  }
  const i=mirrors.findIndex(within);
  if(i<0){last=-1;return null;}
  if(i===last)return null;
  last=i;
  if(i!==order[aligned]){
   wrongTurns++;
   aligned=i===order[0]?1:0;
   return {kind:'realign',next:mirrors[order[aligned]].id};
  }
  aligned++;
  if(aligned===mirrors.length){vaultOpen=true;return {kind:'unlock'};}
  return {kind:'align',next:mirrors[order[aligned]].id};
 }
 function snapshot(){return {mouth,pedestal,mirrors,order,entered,aligned,wrongTurns,vaultOpen,taken};}
 return Object.freeze({visit,snapshot});
}
