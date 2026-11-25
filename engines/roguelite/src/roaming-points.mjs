// SPDX-License-Identifier: GPL-3.0-or-later
// Optional (not used by Classic). Calls use simulated time, never timers or I/O.
const DESIGNS = Object.freeze({
  geode: Object.freeze({kind:'geode', name:'Crystalback Geode Worm', color:'#77efdc', hp:40, size:21, orbit:49, speed:27, xp:20, resource:'crystal', amount:12}),
  goblin: Object.freeze({kind:'goblin', name:'Lockbox Loot Goblin', color:'#ffc36d', hp:24, size:13, orbit:0, speed:104, xp:14, resource:'gold', amount:24}),
});
const dir = (x, y, fx = 1, fy = 0) => {
  const d = Math.hypot(x,y);
  return d > 1e-9 ? [x/d,y/d] : [fx,fy];
};
const mix = (seed, ordinal) => {
  let v = (seed ^ Math.imul(ordinal,0x9e3779b9)) >>> 0;
  v = Math.imul(v ^ (v >>> 16),0x21f0aaad);
  v = Math.imul(v ^ (v >>> 15),0x735a2d97);
  return ((v ^ (v >>> 15)) >>> 0) / 4294967296;
};
export function createRoamingPoints(seed) {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('Invalid roaming encounter seed');
  let elapsed=0, next=24, ordinal=0, live=null;
  const balance={crystal:0,gold:0}, caches=[];
  function advance(player,dt) {
    if (!Number.isFinite(dt) || dt<0 || dt>300 || !Number.isFinite(player?.x) || !Number.isFinite(player?.y)) throw new RangeError('Invalid roaming tick');
    elapsed+=dt;
    if (live && elapsed>=live.until) live=null;
    if (!live && elapsed>=next) {
      ordinal++;
      const spec=DESIGNS[ordinal%2?'geode':'goblin'];
      const angle=mix(seed,ordinal)*Math.PI*2, dx=Math.cos(angle),dy=Math.sin(angle);
      live={spec,anchorX:player.x+dx*173,anchorY:player.y+dy*173,dx,dy,angle,until:elapsed+42,
        node:{...spec,maxHp:spec.hp,x:player.x+dx*173,y:player.y+dy*173,hitFlash:0}};
      next=elapsed+58+mix(seed,ordinal+1000)*19;
    }
    if (!live) return null;
    const a=live, s=a.spec;
    if (s.kind==='geode') {
      // The mineable target rides at the front of a moving multi-segment body.
      const phase=a.angle+elapsed*.045;
      a.anchorX+=Math.cos(phase)*s.speed*dt;a.anchorY+=Math.sin(phase)*s.speed*dt;
      a.node.x=a.anchorX+Math.cos(phase)*s.orbit;a.node.y=a.anchorY+Math.sin(phase)*s.orbit;
    } else {
      const [dx,dy]=dir(a.anchorX-player.x,a.anchorY-player.y,a.dx,a.dy);
      a.anchorX+=dx*s.speed*dt;a.anchorY+=dy*s.speed*dt;
      a.node.x=a.anchorX;a.node.y=a.anchorY;
    }
    a.node.hitFlash=Math.max(0,a.node.hitFlash-dt);
    return a.node;
  }
  function resolve() {
    if (!live || live.node.hp>0) return null;
    const {resource,amount,xp}=live.spec, {x,y}=live.node;
    live=null;
    const cache={resource,amount,xp,x,y,until:elapsed+28};
    caches.push(cache);
    return {...cache};
  }
  function collect({x,y}) {
    const found=[];
    for(let i=caches.length-1;i>=0;i--){
      const cache=caches[i];
      if(cache.until<=elapsed){caches.splice(i,1);continue;}
      if(Math.hypot(cache.x-x,cache.y-y)>24)continue;
      caches.splice(i,1);balance[cache.resource]+=cache.amount;
      found.push({...cache});
    }
    return found;
  }
  return Object.freeze({advance,resolve,collect,target:()=>live?.node??null,snapshot:()=>({
    live:live?{...live.node,anchorX:live.anchorX,anchorY:live.anchorY,remaining:Math.max(0,live.until-elapsed)}:null,
    caches:caches.map(c=>({...c})),balance:{...balance}
  })});
}
