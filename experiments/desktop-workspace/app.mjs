import {desktopSession} from './model.mjs';

const tools = [
  {id:'projects', icon:'▤', title:'Projects', detail:'Open a reference or review your workspace.'},
  {id:'note', icon:'✎', title:'Scratchpad', detail:'Keep a working draft while switching tools.'},
  {id:'settings', icon:'⚙', title:'Taskbar settings', detail:'Choose which tools stay pinned and in what order.'},
];
const byId = new Map(tools.map(t=>[t.id,t]));
const key = 'athena:desktop-workspace-preview:v1';
const $ = id => document.getElementById(id);
const node = (tag, text) => {const el=document.createElement(tag); if(text!==undefined)el.textContent=text; return el;};
function elementButton(label, action) {
  const control=node('button',label); control.type='button'; control.addEventListener('click',action); return control;
}
function readPreferences(){try {return JSON.parse(localStorage.getItem(key))||{};}catch{return {};}}
function save(){try{localStorage.setItem(key,JSON.stringify(session.preferences()));}catch{say('Preferences could not be saved on this device.');}}
const session = desktopSession(tools.map(t=>t.id),readPreferences());
let draft = '';
const say = message => {$('notice').textContent=message;};
function label(el,text){el.setAttribute('aria-label',text);return el;}
function iconButton(tool, action, prefix='') {
  const b=label(elementButton('',action),prefix+tool.title);
  const glyph=node('span',tool.icon);glyph.className='icon';glyph.setAttribute('aria-hidden','true');
  b.append(glyph,node('span',tool.title));return b;
}

function setMode(enabled) {
  session.setEnabled(enabled);save();render();
  if(!enabled)$('enabled').focus();else $('launcher').focus();
}
function launch(id) {
  session.open(id);setLauncher(false);render();$('_active-title')?.focus();
}
function focusTask(id) {document.querySelector('[data-task="'+id+'"]')?.focus();}
function setLauncher(open, restore=false) {
  $('start').hidden=!open;$('launcher').setAttribute('aria-expanded',String(open));
  if(open){$('search').value='';renderMatches();$('search').focus();}
  else if(restore)$('launcher').focus();
}
function renderMatches() {
  const q=$('search').value.trim().toLowerCase();
  const rows=tools.filter(t=>(t.title+' '+t.detail).toLowerCase().includes(q));
  $('matches').replaceChildren(...(rows.length?rows.map(t=>iconButton(t,()=>launch(t.id),'Open ')):[node('p','No tools match. Try a different search.')]));
}
function renderSettings(body) {
  body.append(node('p','Pinned tools stay available when closed. Move them without dragging.'));
  for(const t of tools){
    const pins=session.state().pins, i=pins.indexOf(t.id);
    const row=node('div'); row.className='pin-layout';
    const pin=elementButton(i>=0?'Unpin '+t.title:'Pin '+t.title,()=>{session.togglePin(t.id);save();render();document.querySelector('[data-pin="'+t.id+'"]')?.focus();});
    pin.dataset.pin=t.id;row.append(pin);
    for(const [offset,direction] of [[-1,'left'],[1,'right']]){
      const move=label(elementButton('Move '+direction,()=>{if(session.movePin(t.id,offset)){save();render();document.querySelector('[data-pin="'+t.id+'"]')?.focus();say(t.title+' moved '+direction+'.');}}),'Move '+t.title+' '+direction);
      move.disabled=i<0||i+offset<0||i+offset>=pins.length;row.append(move);
    }
    body.append(row);
  }
  body.append(elementButton('Turn desktop preview off',()=>setMode(false)));
}
function renderWindow(id) {
  const t=byId.get(id), win=node('section');win.className='tool';win.setAttribute('aria-labelledby','_active-title');
  const bar=node('header');bar.className='titlebar';
  const h=node('h2',t.title);h.id='_active-title';h.tabIndex=-1;
  const buttons=node('div');
  buttons.append(label(elementButton('−',()=>{session.minimize(id);render();focusTask(id);}), 'Minimize '+t.title),label(elementButton('×',()=>{session.close(id);render();if($('_active-title'))$('_active-title').focus();else $('launcher').focus();}), 'Close '+t.title));
  bar.append(h,buttons);const body=node('div');body.className='tool-body';
  if(id==='settings')renderSettings(body);
  if(id==='note'){
    body.append(node('p','This scratchpad stays here while you switch tools. It is not saved when you close this page.'));
    const area=label(node('textarea'),'Scratchpad text');area.rows=4;area.value=draft;area.addEventListener('input',()=>{draft=area.value;});body.append(area);
  }
  if(id==='projects'){
    body.append(node('p','Keep your source material close while you work.'));
    const links=node('ul');
    for(const [title,href] of [['Interface design standard','https://github.com/Herbertofury/Athena/blob/main/guidance/DESIGN_QUALITY_STANDARD.md'],['Motion and themes lab','../interface-motion-lab/']]){
      const li=node('li'), a=node('a',title);a.href=href;li.append(a);links.append(li);
    }
    body.append(links);
  }
  win.append(bar,body);return win;
}
function render(){
  const state=session.state();
  $('enabled').checked=state.enabled;$('desktop').hidden=!state.enabled;$('fallback').hidden=state.enabled;
  if(!state.enabled){setLauncher(false);$('windows').replaceChildren();$('running').replaceChildren();$('shortcuts').replaceChildren();return;}
  $('shortcuts').replaceChildren(...tools.map(t=>iconButton(t,()=>launch(t.id),'Open ')));
  const open=new Set(state.windows.map(w=>w.id));
  const order=[...state.pins,...state.windows.map(w=>w.id).filter(id=>!state.pins.includes(id))];
  $('running').replaceChildren(...order.map(id=>{
    const t=byId.get(id);const b=iconButton(t,()=>{session.activate(id);render();focusTask(id);});
    b.dataset.task=id;b.dataset.running=String(open.has(id));b.setAttribute('aria-pressed',String(state.active===id));
    b.title=t.title+(open.has(id)?(state.active===id?' · active':' · running'):' · pinned');
    b.setAttribute('aria-description',b.title);
    return b;
  }));
  $('windows').replaceChildren(...(state.active?[renderWindow(state.active)]:[]));
  $('show').textContent=state.showingDesktop?'Restore windows':'Show desktop';
  $('show').disabled=!state.showingDesktop&&!state.windows.some(w=>!w.minimized);
}
$('try').onclick=()=>setMode(true);
$('enabled').onchange=()=>setMode($('enabled').checked);
$('launcher').onclick=()=>setLauncher($('start').hidden,true);
$('search').oninput=renderMatches;
$('start').onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();setLauncher(false,true);}};
$('show').onclick=()=>{session.toggleDesktop();render();};
render();
