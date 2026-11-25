// SPDX-License-Identifier: GPL-3.0-or-later
import {createInterface} from 'node:readline/promises';
import {createSurvivorsRun} from './survivors.mjs';

const args=process.argv.slice(2);
const demo=args[0]==='--demo';
if(demo)args.shift();
if(args.length>2){
 console.error('Usage: node play.mjs [--demo] [seed] [seconds]');
 process.exitCode=2;
}else{
 try{
  const seed=args[0]===undefined?123:Number(args[0]),seconds=args[1]===undefined?90:Number(args[1]);
  const run=createSurvivorsRun({seed,seconds});
  if(demo){
   for(let i=0;i<seconds*65;i++){
    const phase=run.step();
    if(phase==='won'||phase==='lost')break;
    if(phase==='draft')run.step({upgrade:run.inspect().pending.at(-1).id});
   }
   const {phase,activeTicks,kills,player}=run.inspect();
   console.log(JSON.stringify({seed,seconds,phase,activeTicks,kills,level:player.level,hp:player.hp}));
  }else{
   console.log('Mascot Survivors • Athena fixed-step prototype');
   console.log('w/a/s/d move, q/e/z/c diagonals, x wait, e! dash northeast; exit leaves.');
   const input=createInterface({input:process.stdin,output:process.stdout});
   try{
    for(;;){
     const s=run.inspect(),p=s.player;
     console.log('\n'+map(s));
     console.log(`${s.phase.toUpperCase()} | ${s.time.toFixed(1)}/${seconds}s | HP ${Math.max(0,p.hp).toFixed(1)}/${p.maxHp} | rank ${p.level} | XP ${p.xp}/${p.xpToNext} | kills ${s.kills}`);
     if(s.phase==='won'||s.phase==='lost')break;
     if(s.phase==='draft')console.log(s.pending.map((v,i)=>`${i+1}. ${v.name}`).join('   '));
     const choice=(await input.question(s.phase==='draft'?'Choose an upgrade > ':'Move, wait, or exit > ')).trim().toLowerCase();
     if(choice==='exit')break;
     if(s.phase==='draft'){
      const pick=s.pending[Number(choice)-1];
      if(!/^[1-3]$/.test(choice)||!pick){console.log('Choose an offered number. The run clock is paused.');continue;}
      run.step({upgrade:pick.id});continue;
     }
     const directions={w:[0,-1],a:[-1,0],s:[0,1],d:[1,0],q:[-1,-1],e:[1,-1],z:[-1,1],c:[1,1],x:[0,0]};
     if(!/^[wasdqezcx]!?$/.test(choice)){console.log('Use a listed move. Nothing advanced.');continue;}
     const [dx,dy]=directions[choice[0]];
     for(let i=0;i<60;i++)if(run.step({dx,dy,dash:i===0&&choice.endsWith('!')})!=='running')break;
    }
   }finally{input.close();}
  }
 }catch(error){console.error(error.message);process.exitCode=2;}
}

function map({player,enemies,gems,projectiles}){
 const w=35,h=15,cx=w>>1,cy=h>>1;
 const rows=Array.from({length:h},()=>Array(w).fill('·'));
 function plot(x,y,symbol){
  const gx=cx+Math.round((x-player.x)/18),gy=cy+Math.round((y-player.y)/24);
  if(gx>=0&&gx<w&&gy>=0&&gy<h)rows[gy][gx]=symbol;
 }
 for(const entry of gems)plot(entry.x,entry.y,'+');
 for(const entry of enemies)plot(entry.x,entry.y,'E');
 for(const entry of projectiles)plot(entry.x,entry.y,'*');
 rows[cy][cx]='@';
 return rows.map(row=>row.join('')).join('\n');
}
