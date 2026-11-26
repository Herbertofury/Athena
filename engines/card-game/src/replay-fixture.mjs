// SPDX-License-Identifier: GPL-3.0-or-later
// An authored lab-only deck. It does not import anyone's library or installed mods.
const MINIONS=[
 ['cinder','Cinder Courier',1,2,1,['charge']],['bastion','Basalt Bastion',2,1,4,['taunt']],
 ['gleam','Gleam Moth',1,1,3,[]],['piper','Lantern Piper',2,2,3,[]],
 ['moss','Moss Archivist',1,1,2,[]],['rook','Mint Rook',3,4,3,[]],
 ['ember','Ember Needle',2,3,1,['charge']],['gravel','Gravel Guard',2,2,3,['taunt']],
 ['kite','Neon Kite',1,1,2,['charge']],['forge','Glass Forge',3,2,5,[]],
 ['rail','Rail Scout',1,2,2,[]],['lumen','Lumen Giant',4,5,5,[]],
];
export const CARDS=Object.freeze(Object.fromEntries(MINIONS.map(([id,title,cost,attack,health,keywords])=>
 [id,Object.freeze({id,title,type:'minion',cost,attack,health,keywords:Object.freeze(keywords)})])));
export const HEROES=Object.freeze({
 'green-warden':Object.freeze({id:'green-warden',name:'Green Warden',hpMax:24,powerKey:'ward'}),
 'neon-warden':Object.freeze({id:'neon-warden',name:'Neon Warden',hpMax:24,powerKey:'flare'}),
});
export const FIXTURE='athena-card-foundry.warden-duel.v1';
const ALL=Object.freeze(Object.keys(CARDS));
export const decks=Object.freeze({
 player:Object.freeze([...ALL,...ALL.slice(0,8)]),enemy:Object.freeze([...ALL.slice(4),...ALL,...ALL.slice(1,5)]),
});
export const powerFor=hero=>hero.powerKey==='ward'?{type:'HERO_POWER_ARMOR',amount:2}:{type:'HERO_POWER_PING',damage:1};
