// SPDX-License-Identifier: GPL-3.0-or-later
// A camp is an in-run decision, never an account, persistent currency or purchase.
const offers=Object.freeze([
 Object.freeze({id:'camp-totem',name:'Build a health totem',icon:'✚',resource:'crystal',price:12,cap:3,perk:'health'}),
 Object.freeze({id:'camp-quiver',name:'Upgrade your weapon rack',icon:'⚔',resource:'gold',price:24,cap:3,perk:'damage'}),
]);
const stay=Object.freeze({id:'camp-stay',name:'Leave the camp',icon:'↶',kind:'camp'});
export function createCampWorkshop() {
 let mark=null,sequence=0,next=45,prompt=false,spent={crystal:0,gold:0},ranks={health:0,damage:0};
 function step({clock,player,choicePending}){
  if(mark&&clock>=mark.until&&!prompt)mark=null;
  if(!mark&&clock>=next){
   sequence++;
   const y=sequence%2?140:-140;
   mark={x:player.x+110,y:player.y+y,until:clock+85};
   next=clock+95;
  }
  if(!prompt&&mark&&!choicePending&&Math.hypot(player.x-mark.x,player.y-mark.y)<=28)prompt=true;
  return prompt;
 }
 const balance=wallet=>({crystal:wallet.crystal-spent.crystal,gold:wallet.gold-spent.gold});
 function choices(wallet){
  const money=balance(wallet);
  return [...offers.filter(o=>ranks[o.perk]<o.cap&&money[o.resource]>=o.price).map(o=>({
   id:o.id,name:o.name+' · '+o.price+' '+o.resource,icon:o.icon,kind:'camp',
  })),stay];
 }
 function choose(id,wallet,apply){
  if(!prompt)throw Error('No camp decision');
  if(id===stay.id){prompt=false;mark=null;return {id};}
  const o=offers.find(o=>o.id===id);const money=balance(wallet);
  if(!o||ranks[o.perk]>=o.cap||money[o.resource]<o.price)throw Error('Camp offer is not available');
  apply(o.perk);spent[o.resource]+=o.price;ranks[o.perk]++;
  prompt=false;mark=null;
  return {id,perk:o.perk,rank:ranks[o.perk],price:o.price,resource:o.resource};
 }
 const snapshot=wallet=>({mark:mark&&{...mark},sequence,next,prompt,spent:{...spent},ranks:{...ranks},balance:balance(wallet)});
 return Object.freeze({step,choose,choices,snapshot});
}
