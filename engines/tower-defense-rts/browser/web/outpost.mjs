const get = (s) => document.querySelector(s);
const modes = [...document.querySelectorAll('[data-mode]')];
const waits = [...document.querySelectorAll('[data-wait]')];
const messages = ['Order accepted.', 'This skirmish is over.', 'Select a build pad.', 'That pad is occupied.', 'Not enough ore.', 'No squad available.', 'No route to this tile.', 'Unknown command.'];
const surfaces = ['Ridge', 'Lane', 'Bastion', 'Guarded outpost', 'Held outpost', 'Build pad', 'Bolt tower', 'Pulse tower'];
const glyphs = ['·', ' ', '◆', '◉', '◉', '+', 'B', 'P'];
try {
  const response = await fetch('./outpost.wasm');
  if (!response.ok) throw new Error('simulation missing');
  const {instance} = await WebAssembly.instantiate(await response.arrayBuffer());
  const {outpost_view:view,outpost_tile:tile,outpost_reset:reset,outpost_preview:preview,outpost_command:command} = instance.exports;
  const width=view(0), height=view(1);
  let action=0, selected=-1;
  const board=get('#board'), cells=[];
  const say = (s) => get('#status').textContent=s;
  for(let i=0;i<width*height;i++){
    const b=document.createElement('button');
    b.type='button'; b.className='cell'; b.dataset.tile=i;
    b.addEventListener('click',()=>{selected=i;paint();});
    b.addEventListener('keydown',(e)=>{
      const offset={ArrowLeft:-1,ArrowRight:1,ArrowUp:-width,ArrowDown:width}[e.key];
      if(offset===undefined)return;
      const j=i+offset;
      if(j<0||j>=cells.length||(Math.abs(offset)===1&&Math.floor(i/width)!==Math.floor(j/width)))return;
      e.preventDefault();cells[j].focus();
    });
    board.append(b);cells.push(b);
  }
  function paint(){
    get('#turn').textContent=view(2);get('#ore').textContent=view(3);get('#base').textContent=view(4)+' HP';
    get('#wave').textContent=view(6)||'None';
    for(let i=0;i<cells.length;i++){
      const bits=tile(i),surface=bits&15, squad=Boolean(bits&16), enemies=bits>>>8;
      const b=cells[i];b.dataset.surface=surface;b.dataset.threat=String(enemies>0);
      b.textContent=squad?'●':enemies?'▲':glyphs[surface];b.setAttribute('aria-pressed',String(i===selected));
      b.setAttribute('aria-label',`${surfaces[surface]} ${i%width}, ${Math.floor(i/width)}${squad?', squad':''}${enemies?', invaders '+enemies:''}`);
    }
    const end=view(7);
    const legal=selected>=0?preview(action,selected):null;
    get('#selection').textContent=legal===null?'Select a tile to preview an order.':legal===0? 'Ready: '+cells[selected].getAttribute('aria-label'):messages[legal];
    get('#issue').disabled=end!==0||legal!==0;
    for(const button of waits)button.disabled=end!==0;
    if(end)say(end===1?'Victory. The bastion holds.':'Base lost. Restart to try another approach.');
  }
  for(const b of modes)b.addEventListener('click',()=>{action=Number(b.dataset.mode);for(const x of modes)x.setAttribute('aria-pressed',String(x===b));paint();});
  for(const b of waits)b.addEventListener('click',()=>{command(3,Number(b.dataset.wait));say(view(5)===0?'Outpost held: +2 ore per turn.':'Squad HP: '+view(8)+'.');paint();});
  get('#issue').addEventListener('click',()=>{say(messages[command(action,selected)]);paint();});
  get('#restart').addEventListener('click',()=>{reset();selected=-1;action=0;modes.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===0)));say('New skirmish.');paint();});
  say('Plan your opening.');paint();
} catch {
  get('#status').textContent='Could not load the Rust simulation. Serve this folder over HTTP and try again.';
  for(const b of [...modes,...waits,get('#restart')])b.disabled=true;
}
