// SPDX-License-Identifier: GPL-3.0-or-later
// A separate rules experiment. It does not modify Warden Duel or its tape.
export const CLOCKWORK_RULES='athena.card.clockwork-sentinel.v1';
export const CLOCKWORK_LIMIT=16*1024;
const cards=Object.freeze({
  prime:Object.freeze({ label:'Prime the coil', ticks:2 }),
  brace:Object.freeze({ label:'Brace the frame', ticks:1 }),
  spark:Object.freeze({ label:'Arc discharge', ticks:2 }),
});
const MAX_COMMANDS=64;
const hand=()=>Object.keys(cards);
const clone=structuredClone;
const hash=async text=>Array.from(new Uint8Array(await globalThis.crypto.subtle.digest(
  'SHA-256',new TextEncoder().encode(text)
)),b=>b.toString(16).padStart(2,'0')).join('');

export function newClockworkEncounter(){
  const state={health:18,sentinel:15,shield:0,charged:false,timer:3,turn:1,hand:hand(),outcome:null};
  const commands=[],frames=[];
  const view=()=>clone({state,choices:state.outcome?[]:[...state.hand,'end'],last:frames.at(-1)??[]});
  function preview(action){
    const ticks=action==='end'?1:state.hand.includes(action)?cards[action].ticks:0;
    if(state.outcome||!ticks)return null;
    const damage=action==='spark'?(state.charged?9:3):0;
    return {ticks,damage,intercept:damage<state.sentinel&&ticks>=state.timer,
      shield:action==='brace'?6:state.shield};
  }
  function apply(action){
    const proposal=preview(action);
    if(!proposal||commands.length>=MAX_COMMANDS)throw Error('Unavailable Clockwork Sentinel move.');
    const frame=[];
    if(action==='end'){
      state.turn++;state.hand=hand();state.charged=false;
      frame.push({type:'NEW_HAND'});
    }else{
      state.hand.splice(state.hand.indexOf(action),1);
      if(action==='prime'){state.charged=true;frame.push({type:'COIL_PRIMED'});}
      if(action==='brace'){state.shield=6;frame.push({type:'BRACED',shield:6});}
      if(action==='spark'){
        state.sentinel=Math.max(0,state.sentinel-proposal.damage);
        state.charged=false;frame.push({type:'DISCHARGE',damage:proposal.damage});
      }
    }
    state.timer=Math.max(0,state.timer-proposal.ticks);
    frame.push({type:'TIMER_SPENT',ticks:proposal.ticks});
    if(state.sentinel===0){state.outcome='win';frame.push({type:'SENTINEL_DOWN'});}
    else if(proposal.intercept){
      const blocked=Math.min(state.shield,6), damage=6-blocked;
      state.shield-=blocked;state.health=Math.max(0,state.health-damage);
      frame.push({type:'SENTINEL_STRIKE',blocked,damage});
      state.timer=3;
      if(state.health===0)state.outcome='lose';
    }
    if(!state.outcome&&commands.length+1===MAX_COMMANDS)state.outcome='limit';
    commands.push(action);frames.push(frame);return view();
  }
  async function tape(){
    const snapshot={rules:CLOCKWORK_RULES,commands:[...commands]};
    const proof=JSON.stringify({snapshot,state,frames});
    return {...snapshot,sha256:await hash(proof)};
  }
  return Object.freeze({view,apply,preview,tape});
}
export async function openClockworkTape(raw){
  if(typeof raw!=='string'||raw.length>CLOCKWORK_LIMIT||new TextEncoder().encode(raw).byteLength>CLOCKWORK_LIMIT)
    throw Error('Clockwork tape exceeds 16 KiB.');
  const parsed=JSON.parse(raw);
  if(!parsed||Object.getPrototypeOf(parsed)!==Object.prototype||Object.keys(parsed).length!==3||
     parsed.rules!==CLOCKWORK_RULES||!Array.isArray(parsed.commands)||parsed.commands.length>MAX_COMMANDS||
     !/^[a-f0-9]{64}$/.test(parsed.sha256)||typeof parsed.sha256!=='string')
    throw Error('Not a valid Clockwork Sentinel tape.');
  const encounter=newClockworkEncounter();
  for(const c of parsed.commands)encounter.apply(c);
  if((await encounter.tape()).sha256!==parsed.sha256)throw Error('Clockwork tape verification failed.');
  return encounter;
}
export const clockworkCards=cards;
