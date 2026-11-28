/* Independently authored Canvas behavior reference; not Obsidian Prism source. */
const root=document.querySelector('#field'), canvas=root.querySelector('canvas'), ctx=canvas.getContext('2d');
const motion=document.querySelector('#motion'), palette=document.querySelector('#palette');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const palettes={indigo:[217,260],warm:[30,358],teal:[171,205]};
let box, path=[], mouse=null, previous=null, frame=0, last=0, lastSkim=0, paints=0;
const cap=7, step=16;
const still=()=>motion.value==='still'||reduce.matches;
const blocked=()=>document.hidden||!ctx||!box;
function stop(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;path=[];mouse=null;previous=null;lastSkim=0;}
function mark(x,y,t,kind){path=path.filter(p=>t-p.t<p.life).slice(-(cap-1));path.push({x,y,t,kind,life:kind==='push'?900:480});}
function draw(now) {
  if(blocked()) return;
  const w=box.width,h=box.height,[base,accent]=palettes[palette.value];
  ctx.clearRect(0,0,w,h);ctx.font='10px ui-monospace, monospace';
  const yCount=Math.ceil(h/step), xCount=Math.ceil(w/step);
  for(let y=0;y<yCount;y++)for(let x=0;x<xCount;x++){
    const cx=x*step+8,cy=y*step+8,line=.46+.54*Math.cos(y*.106+x*.039);
    let boost=0, lift=0;
    if(!still()){
      if(mouse) {
        const age=Math.max(0,1-(now-mouse.t)/420),dist=Math.hypot(cx-mouse.x,cy-mouse.y);
        boost+=Math.max(0,1-dist/112)*age*.55;
      }
      for(const p of path) {
        const age=(now-p.t)/p.life,gap=Math.hypot(cx-p.x,cy-p.y)-(p.kind==='push'?age*270:age*115);
        const energy=Math.exp(-gap*gap/345)*(1-age)*(p.kind==='push'?.85:.36);
        boost+=energy;lift+=Math.sin(gap*.28)*energy*7;
      }
    }
    const level=Math.min(.8,.09+line*.12+boost*.61);
    ctx.fillStyle='hsla('+Math.round(base+(accent-base)*Math.min(1,boost))+' 79% '+Math.round(56+boost*17)+'% / '+level+')';
    const glyph=(x*13+y*17)%31<5?'×':(x+y*2)%7===0?'·':'▪';
    ctx.fillText(glyph,cx,cy+lift);
  }
  paints++;
  root.dataset.paints=String(paints);
}
function tick(now){
  frame=0;if(blocked()||still())return;
  const period=motion.value==='calm'?62:32;
  if(now-last>=period||(!mouse&&!path.length)){last=now;path=path.filter(p=>now-p.t<p.life);if(mouse&&now-mouse.t>420)mouse=null;draw(now);}
  if(mouse||path.length) frame=requestAnimationFrame(tick);
}
function kick(){if(!frame&&!still()&&!blocked())frame=requestAnimationFrame(tick);}
function pos(e){return {x:e.clientX-box.left,y:e.clientY-box.top,t:performance.now()};}
function sortSize(){
  box=root.getBoundingClientRect();
  const dpi=Math.min(1.5,devicePixelRatio||1);
  canvas.width=Math.max(1,Math.round(box.width*dpi));canvas.height=Math.max(1,Math.round(box.height*dpi));
  ctx?.setTransform(dpi,0,0,dpi,0,0);draw(performance.now());
}
function openField(e){return !e.target.closest('button,select,article,.article,input,a');}
root.addEventListener('pointermove',e=>{
  if (!openField(e)||still()||blocked())return;
  const p=pos(e);
  if(previous && p.t-lastSkim>=105&&Math.hypot(previous.x-p.x,previous.y-p.y)>24&&p.t-previous.t<100){
    mark(p.x,p.y,p.t,'skim');lastSkim=p.t;
  }
  previous=p;mouse=p;kick();
},{passive:true});
root.addEventListener('pointerdown',e=>{if(e.isPrimary&&e.button===0&&openField(e)&&!still()&&!blocked()){const p=pos(e);mark(p.x,p.y,p.t,'push');kick();}},{passive:true});
root.addEventListener('pointerleave',()=>{previous=null;mouse=null;kick();},{passive:true});
root.addEventListener('pointercancel',()=>{previous=null;mouse=null;kick();},{passive:true});
document.querySelector('#keyboard').addEventListener('click',()=>{if(!still()&&!blocked()){mark(box.width*.24,box.height*.41,performance.now(),'push');kick();}});
document.querySelector('#localControl').addEventListener('click',()=>document.querySelector('#status').textContent='Ordinary control activated.');
motion.addEventListener('change',()=>{stop();draw(performance.now());});
palette.addEventListener('change',()=>draw(performance.now()));
reduce.addEventListener('change',()=>{stop();draw(performance.now());});
document.addEventListener('visibilitychange',()=>{stop();if(!document.hidden)draw(performance.now());});
window.addEventListener('pagehide',stop);
new ResizeObserver(sortSize).observe(root);
