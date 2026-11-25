// SPDX-License-Identifier: GPL-3.0-or-later
// An isolated side run. This component never writes or clones the main run's
// mutable game objects; it simply stops stepping that run until the rift ends.
export const RIFT_DURATIONS = Object.freeze([10,20,30]);

export function createRiftSession({main,createSide}={}) {
 if(!main?.step||!main?.snapshot||!main?.choose||typeof createSide!=='function')throw new TypeError('Rift needs main and side simulation hosts');
 let active=null, routeCount=0, last=null, earned={crystal:0,gold:0};
 function enter({minutes,seed}) {
  if(active)throw new Error('Leave the current rift first');
  if(!RIFT_DURATIONS.includes(minutes)||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new RangeError('Invalid rift contract');
  const parent=main.snapshot();
  if(parent.run.gameOver||parent.offers)throw new Error('Resolve the main run first');
  const side=createSide({minutes,seed});
  if(!side?.step||!side?.snapshot||!side?.choose)throw new Error('Rift host creation failed');
  routeCount++;
  active={side,minutes,seed,route:routeCount,frozen:parent};
 }
 function finish(result) {
  const {side,minutes,route}=active;
  const end=side.snapshot();
  if(result==='won'&&(end.gameTime+1e-6<minutes*60||!end.run.won))throw Error('Unverified rift win');
  const reward=result==='won'?{crystal:6*(minutes/10),gold:12*(minutes/10)}:{crystal:0,gold:0};
  earned.crystal+=reward.crystal;earned.gold+=reward.gold;
  last={result,minutes,route,reward};active=null;
  return {...last,reward:{...reward}};
 }
 function step(input){
  if(!active)return main.step(input);
  const reply=active.side.step(input);
  if(reply.status!=='finished')return reply;
  const rift=finish(active.side.snapshot().run.won?'won':'lost');
  // Parent frame is not advanced with the final side input.
  return {status:'running',audio:reply.audio,rift};
 }
 return Object.freeze({
  enter,step,choose:id=>(active?.side??main).choose(id),
  abandon:()=>active?finish('abandoned'):null,
  captureSuspended:()=>active?{main:structuredClone(active.frozen),sideEntropy:active.side.entropyCursor?.()??null}:null,
  snapshot:()=>project(false), frameView:()=>project(true),
 });
 function project(frame){
   const {side,minutes,seed,route,frozen}=active??{};
   const target=side??main;
   return {...(frame&&target.frameView?target.frameView():target.snapshot()),rift:{
    active:side?{minutes,seed,route}:null,earned:{...earned},last:last?{...last,reward:{...last.reward}}:null,
    ...(frozen?{mainTime:frozen.gameTime}:{}),
   }};
 }
}
