// Original vector concept plates, not reconstructed or imported creator artwork.
// Immutable swatches interpret the curated color directions. The stable IDs
// select 10 independently composed colorways; no text or URL is rendered as HTML.
const PALETTES=Object.freeze({
 'world.frawgy.verdant-conservatory':['#081c1c','#265c3b','#91e9bb','#ffc277','#ef785e', 'wetland',2],
 'world.frawgy.lilypad-nocturne':['#110f2d','#422c79','#9f9bfa','#ef94d8','#a9e0ff', 'wetland',9],
 'world.lightweaver.sigil-neon-atelier':['#11152e','#25378e','#71a4ff','#ff71e0','#e2d7fa','city',4],
 'world.lightweaver.chromatic-rain-alley':['#070d1b','#22316d','#4bd1ff','#9be967','#a586ef','city',10],
 'world.dreamrelicc.cathedral-orbit':['#10121e','#464860','#e8edfe','#fed597','#e28a77','relic',3],
 'world.dreamrelicc.astral-relic-market':['#141015','#51462f','#e7d8bf','#ffa868','#d87387','relic',6],
 'world.karoline.entomorphosis-cabinet':['#171513','#594e36','#eddfbc','#e29c9d','#a6c9db','cabinet',7],
 'world.karoline.physis-metamorphosis-atelier':['#210f1a','#4f3940','#efdbc9','#d79d9c','#b8d7b6','cabinet',5],
 'world.saveroom.paradise-zero-archipelago':['#091a38','#1e4d89','#b7eee8','#f8d593','#72c3ed','islands',8],
 'world.saveroom.last-island-starcaster-sanctuary':['#201638','#3a416f','#d2c8fc','#f2abc7','#7bd2e6','islands',11],
});
const MOTIFS=Object.freeze({
 wetland:'Floating leaves, terraced water and an illuminated canopy',
 city:'A layered skyline with wet reflections and neon window grids',
 relic:'Angular arches and a slowly receding ring of stone silhouettes',
 cabinet:'A symmetrical exhibit of layered wings and specimen frames',
 islands:'Floating landforms, pool reflections and a distant horizon',
});

// Artist-scoped, original lighting recipes: sky tint, horizon opacity, sun height.
// No clock, animation, reconstruction claim, or third-party artwork.
const PHASES=Object.freeze({
 'time.frawgy.dawn':['#ffc594',.20,126],
 'time.frawgy.day':['#e9ffb1',.16,51],
 'time.frawgy.dusk':['#d272ca',.22,148],
 'time.frawgy.night':['#5a78ea',.21,49],
 'time.lightweaver.silver-noon':['#d8e4fa',.19,42],
 'time.lightweaver.blue-hour':['#516ff3',.24,109],
 'time.lightweaver.magenta-midnight':['#e34ab1',.18,32],
 'time.lightweaver.signal-dawn':['#cbfb83',.17,135],
 'time.dreamrelicc.matins':['#ead2c1',.21,123],
 'time.dreamrelicc.zenith':['#fbd293',.20,38],
 'time.dreamrelicc.vespers':['#bb90df',.23,151],
 'time.dreamrelicc.midnight':['#73729e',.23,47],
 'time.karoline.cabinet-morning':['#ffeccf',.19,111],
 'time.karoline.botanical-noon':['#c8deb5',.16,44],
 'time.karoline.imago-dusk':['#d298bd',.22,145],
 'time.karoline.menagerie-night':['#7487b6',.20,46],
 'time.saveroom.paradise-noon':['#f9e0a4',.17,39],
 'time.saveroom.blue-hour-voyage':['#4a8be5',.22,101],
 'time.saveroom.lavender-sunset':['#dc9ddf',.23,147],
 'time.saveroom.starcaller-midnight':['#8875e3',.22,33],
});

const W=640,H=320;
export function describePlate(id){
 const a=PALETTES[id];
 if(!Object.hasOwn(PALETTES,id))throw new RangeError('World colorway not reviewed');
 return {motif:MOTIFS[a[5]],swatches:a.slice(0,5)};
}
export function drawPlate(canvas,id,weather,phaseId){
 if(!Object.hasOwn(PALETTES,id))throw new RangeError('World colorway not reviewed');
 const c=canvas.getContext('2d');
 if(!c)throw Error('Canvas drawing unavailable');
 const [bg,field,glow,light,accent,kind,seed]=PALETTES[id];
 const phase=Object.hasOwn(PHASES,phaseId)&&phaseId.split('.')[1]===id.split('.')[1]?PHASES[phaseId]:null;
 const intensity=weather?.intensity??'clear';
 const style=Object.hasOwn(WEATHER,weather?.id)?WEATHER[weather.id]:null;
 const value=style&&Object.hasOwn(DENSITY,intensity)?DENSITY[intensity]:0;
 canvas.width=W;canvas.height=H;
 c.clearRect(0,0,W,H);
 const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,bg);g.addColorStop(.8,field);g.addColorStop(1,bg);
 c.fillStyle=g;c.fillRect(0,0,W,H);
 const rnd=prng(seed),wx=prng(seed ^ (style?hashLabel(weather.id):123));
 const shape=(path,color,alpha=1)=>{c.fillStyle=color;c.globalAlpha=alpha;c.beginPath();c.moveTo(...path[0]);for(const p of path.slice(1))c.lineTo(...p);c.closePath();c.fill();c.globalAlpha=1;};
 const oval=(x,y,rx,ry,color,alpha=1)=>{c.fillStyle=color;c.globalAlpha=alpha;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();c.globalAlpha=1;};
 const box=(x,y,w,h,color,alpha=1)=>{c.fillStyle=color;c.globalAlpha=alpha;c.fillRect(x,y,w,h);c.globalAlpha=1;};
 const line=(x,y,tx,ty,color,alpha=1)=>{c.strokeStyle=color;c.globalAlpha=alpha;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();c.globalAlpha=1;};
 if(phase)box(0,0,W,H,phase[0],phase[1]);
 const lightY=phase?.[2]??77;
 oval(400+seed*11,lightY,65,65,phase?.[0]??glow,.10);
 oval(400+seed*11,lightY,43,43,light,.16);
 oval(400+seed*11,lightY,21,21,light,.88);
 for(let i=0;i<38;i++)oval(rnd()*W,14+rnd()*170,.65+rnd()*1.5,.65+rnd()*1.5,glow,.32);
 if(kind==='wetland'||kind==='islands'){
  for(let i=0;i<6;i++){
   const x=i*122+(rnd()-.5)*90,y=135+rnd()*100,r=27+rnd()*56;
   if(kind==='islands'){
    oval(x,y,r,r*.2,glow,.7);shape([[x-r,y],[x+r,y],[x+.3*r,y+.7*r],[x-.35*r,y+.45*r]],bg);
    line(x+r*.22,y-2,x+r*.37,y+r*.8,accent,.7);
   }else{
    oval(x,y,r,r*.16,bg);oval(x,y-1,r*.95,r*.12,glow,.28);
    for(let k=-1;k<=1;k++)oval(x+k*r*.27,y-15-Math.abs(k)*5,9,3+Math.abs(k)*2,k===0?light:accent,.78);
   }
   oval(x,y+42,r*.6,2.2,accent,.35);
  }
  for(let i=0;i<9;i++){const y=208+12*i;line(0,y,640,y,glow,.13);}
 }else if(kind==='city'){
  for(let i=0;i<14;i++){
   const x=i*51-27,y=80+rnd()*128,r=28+rnd()*31;
   box(x,y,r,235-y,bg,.95);box(x+r-2,y,2,235-y,accent,.55);
   for(let j=0;j<10&&y+12+j*12<230;j++){
    box(x+7,y+9+j*12,r-14,2,j%3===0?light:glow,.50);
   }
   shape([[x,239],[x+r,239],[x+r*.8,313],[x-8,288]],glow,.12);
  }
  line(0,238,W,238,light,.88);
 }else if(kind==='relic'){
  for(let i=0;i<6;i++){
   const x=70+i*100, y=86+rnd()*90;
   shape([[x-37,224],[x-37,y+42],[x,y],[x+37,y+42],[x+37,224],[x+29,224],[x+29,y+48],[x,y+17],[x-29,y+48],[x-29,224]],bg);
   line(x,y+6,x+34,y+44,light,.58);oval(x,235,44,4,accent,.45);
  }
  for(let i=0;i<8;i++)line(320+i*81-283,319,320+(i-4)*16,236,light,.16);
 }else{
  for(const dx of [83,237,390,544]){
   box(dx-52,83,104,155,bg,.8);box(dx-50,85,100,151,light,.16);
   for(const s of [-1,1]){
    shape([[dx,175],[dx+s*4,128],[dx+s*42,105],[dx+s*36,151],[dx+s*48,204],[dx+s*8,195]],s===1?accent:glow,.65);
    line(dx,178,dx+s*35,113,light,.58);
   }
   line(dx,123,dx,210,light,.9);box(dx-25,220,50,1,accent,.52);
  }
 }
 for(let i=0;i<value;i++){
  const x=wx()*W,y=wx()*H;
  if(style==='fall')line(x,y,x-4,y+6+wx()*12,accent,.52);
  else if(style==='veil')oval(x,y,8+wx()*34,1.1+wx()*7,glow,.14);
  else if(style==='flare'){
   const r=1+wx()*5;line(x-r,y,x+r,y,light,.64);line(x,y-r,x,y+r,light,.64);
  }else if(style==='fragment'){
   const r=1+wx()*4;shape([[x,y-r],[x+r*.8,y],[x,y+r],[x-r*.8,y]],accent,.55);
  }else oval(x,y,.8+wx()*2,1.1+wx()*1.3,light,.5);
 }
 return {motif:MOTIFS[kind],marks:value};
}

// The named weather studies interpret, rather than mimic, effects in the source.
const WEATHER=Object.freeze({
 'weather.frawgy.dew-bloom':'flare','weather.frawgy.spore-shower':'dust',
 'weather.frawgy.candy-rain':'fragment','weather.frawgy.moon-mist':'veil',
 'weather.lightweaver.neon-rain':'fall','weather.lightweaver.sigil-storm':'fragment',
 'weather.lightweaver.iris-haze':'veil','weather.lightweaver.glass-condensation':'dust',
 'weather.dreamrelicc.star-incense':'dust','weather.dreamrelicc.halo-flare':'flare',
 'weather.dreamrelicc.relic-drift':'fragment','weather.dreamrelicc.red-eye-omen':'veil',
 'weather.karoline.gold-threadfall':'fall','weather.karoline.wing-pollen':'dust',
 'weather.karoline.silk-veil':'veil','weather.karoline.porcelain-hairline':'fragment',
 'weather.saveroom.sunshower-bloom':'flare','weather.saveroom.moonfall-threads':'fall',
 'weather.saveroom.sapphire-tide':'fragment','weather.saveroom.lavender-afterglow':'veil',
});
function hashLabel(id){
 let v=2166136261;
 for(const ch of id)v=Math.imul(v^ch.codePointAt(0),16777619);
 return v;
}
const DENSITY=Object.freeze({clear:0,subtle:9,gentle:16,calm:16,medium:26,playful:34,dramatic:46});
function prng(seed) {
 let n=seed;
 return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
}
