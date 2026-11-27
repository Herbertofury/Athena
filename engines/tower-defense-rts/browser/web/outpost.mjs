const get = (s) => document.querySelector(s);
const modes = [...document.querySelectorAll('[data-mode]')];
const waits = [...document.querySelectorAll('[data-wait]')];
const choices = [...document.querySelectorAll('[data-choice]')];
const messages = ['Order accepted.', 'This skirmish is over.', 'Select a build pad.', 'That pad is occupied.', 'Not enough ore.', 'No squad available.', 'No route to this tile.', 'Unknown command.', 'Choose a wave reward before continuing.', 'This reward is no longer available.', 'Checkpoint is invalid or too large.', 'Start with the matching mode and seed to restore this code.'];
const surfaces = ['Ridge', 'Lane', 'Bastion', 'Guarded outpost', 'Held outpost', 'Build pad', 'Bolt tower', 'Pulse tower'];
const glyphs = ['·', ' ', '◆', '◉', '◉', '+', 'B', 'P'];
try {
  const response = await fetch('./outpost.wasm');
  if (!response.ok) throw new Error('simulation missing');
  const {instance} = await WebAssembly.instantiate(await response.arrayBuffer());
  const {outpost_view:view,outpost_tile:tile,outpost_reset:reset,outpost_preview:preview,outpost_command:command} = instance.exports;
  const width=view(0), height=view(1);
  const rewardNames=['','+5 ore','+1 bastion HP (up to 5)'];
  const exported=instance.exports;
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
    const end=view(7),offer=view(9);
    get('#active-mode').textContent=view(12)===1?'Active mode: Run draft':'Active mode: Classic';
    get('#draft').hidden=!offer;
    for (const [i,b] of choices.entries()) b.textContent=rewardNames[view(10+i)];
    const legal=selected>=0?preview(action,selected):null;
    get('#selection').textContent=legal===null?'Select a tile to preview an order.':legal===0? 'Ready: '+cells[selected].getAttribute('aria-label'):messages[legal];
    get('#issue').disabled=end!==0||legal!==0;
    for(const button of waits)button.disabled=end!==0||offer!==0;
    if(end)say(end===1?'Victory. The bastion holds.':'Base lost. Restart to try another approach.');
  }
  for(const b of modes)b.addEventListener('click',()=>{action=Number(b.dataset.mode);for(const x of modes)x.setAttribute('aria-pressed',String(x===b));paint();});
  for(const b of waits)b.addEventListener('click',()=>{command(3,Number(b.dataset.wait));say(view(5)===0?'Outpost held: +2 ore per turn.':'Squad HP: '+view(8)+'.');paint();});
  get('#issue').addEventListener('click',()=>{say(messages[command(action,selected)]);paint();});
  get('#restart').addEventListener('click',()=>{reset();selected=-1;action=0;modes.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===0)));say('New skirmish.');paint();});
  for(const [i,b] of choices.entries())b.addEventListener('click',()=>{
    say(messages[exported.outpost_choose(view(9),i)]);paint();
  });
  get('#start-mode').addEventListener('click',()=>{
    const run=Number(get('#mode').value),raw=get('#seed').value;
    if(run&&!/^\d{1,20}$/.test(raw)){say('Enter an unsigned seed.');return;}
    const seed=run?BigInt(raw):0n;
    if(seed>18446744073709551615n){say('Seed is too large.');return;}
    exported.outpost_new(run,Number(seed&0xffffffffn),Number(seed>>32n));
    selected=-1;action=0;modes.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===0)));
    say(run?'Run draft enabled for this skirmish.':'Classic skirmish started.');paint();
  });
  get('#export-save').addEventListener('click',()=>{
    const length=exported.outpost_prepare_save();
    const bytes=Uint8Array.from({length},(_,i)=>exported.outpost_save_byte(i));
    get('#checkpoint').value=new TextDecoder().decode(bytes).replaceAll(' ','~').replaceAll('\n','|');
    say('Checkpoint code ready to copy.');
  });
  get('#import-save').addEventListener('click',()=>{
    const raw=get('#checkpoint').value.trim();
    const text=raw.replaceAll('~',' ').replaceAll('|','\n');
    const bytes=new TextEncoder().encode(text);
    const start=exported.outpost_begin_restore(bytes.length);
    if(start){say(messages[start]);return;}
    for(const b of bytes){const status=exported.outpost_restore_byte(b);if(status){say(messages[status]);return;}}
    const status=exported.outpost_finish_restore();
    if(status){say(messages[status]);return;}
    selected=-1;say('Checkpoint restored.');paint();
  });
  say('Plan your opening.');paint();
} catch {
  get('#status').textContent='Could not load the Rust simulation. Serve this folder over HTTP and try again.';
  for(const b of [...modes,...waits,...choices,get('#restart'),get('#start-mode'),get('#export-save'),get('#import-save')])b.disabled=true;
}
