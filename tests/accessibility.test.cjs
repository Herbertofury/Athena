'use strict';
// Focus calls and markup contracts only. LinkeDOM does not implement browser
// focus trapping, rendering, zoom or an assistive-technology accessibility tree.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom');
function setup(options={}){
 const {window}=parseHTML(fs.readFileSync('dist/index.html','utf8')),doc=window.document,store=new Map(Object.entries(options.storage||{}));let focused=doc.body;const closes=[];
 Object.defineProperty(doc,'activeElement',{get:()=>focused});window.HTMLElement.prototype.focus=function(){focused=this;};
 window.AbortController=AbortController;window.AthenaWorkspaceLoaders=options.loaders;window.localStorage={getItem:k=>{if(options.getError)throw Error('storage unavailable');return store.get(k)||null;},setItem:(k,v)=>{if(options.setError)throw Error('storage unavailable');store.set(k,v);}};
 window.location={hash:'#home'};window.confirm=()=>true;window.URL=URL;window.URLSearchParams=URLSearchParams;window.history={replaceState:(_a,_b,hash)=>{window.location.hash=hash;}};window.Blob=Blob;window.setTimeout=()=>1;window.clearTimeout=()=>{};doc.querySelector('#search').value='';
 const dialog=doc.querySelector('dialog');dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{if(!dialog.open)return;dialog.open=false;const event=()=>dialog.dispatchEvent(new window.Event('close'));if(options.queuedClose)closes.push(event);else event();};
 const context=vm.createContext(window);for(const file of ['catalog.js','core.js','workspace-host.js','app.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),context);
 return {window,doc,store,dialog,focus:()=>focused,flush:()=>{while(closes.length)closes.shift()();},go(hash){window.location.hash=hash;window.dispatchEvent(new window.Event('hashchange'));},click(element){element.dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));},key(target,key,flags={}){const e=new window.Event('keydown',{bubbles:true,cancelable:true});Object.assign(e,{key,...flags});if(flags.prePrevented)e.preventDefault();target.dispatchEvent(e);return e;}};
}
function open(s,id){s.click(s.doc.querySelector(`#main [data-lesson="${id}"]`));}
function input(s,el,value){el.value=value;el.dispatchEvent(new s.window.Event('input',{bubbles:true}));}
const tick=()=>new Promise(setImmediate);

test('every learning route has one labelled main heading, updated title and route focus',()=>{
 const s=setup();const routes=['home','certificates','foundations','network','labs','review','coverage','library','missing',...s.window.ATHENA_DATA.certifications.map(x=>'track/'+x.id),'workshops',...s.window.ATHENA_DATA.workshops.map(x=>'workshops/'+x.id)];
 for(const route of routes){s.go('#'+route);const h=s.doc.querySelector('#view-title');assert.ok(h,route);assert.equal(h.getAttribute('tabindex'),'-1');assert.equal(s.doc.querySelector('#main').getAttribute('aria-labelledby'),'view-title');assert.equal(s.focus(),h);assert.ok(s.doc.title.includes(h.textContent.trim()),route);}
});
test('skip link focuses main without changing route',()=>{const s=setup();s.go('#workshops');s.click(s.doc.querySelector('.skip'));assert.equal(s.focus().id,'main');assert.equal(s.window.location.hash,'#workshops');});
test('all 42 workshop lessons start at title, label checks and return to exact opener',()=>{
 const s=setup();for(const p of s.window.ATHENA_DATA.workshops){s.go('#workshops/'+p.id);for(const id of p.lessonIds){const opener=s.doc.querySelector(`[data-lesson="${id}"]`);assert.ok(opener.getAttribute('aria-label').includes(s.window.ATHENA_DATA.lessons.find(x=>x.id===id).title));open(s,id);assert.equal(s.focus().id,'lesson-title');assert.equal(s.dialog.getAttribute('aria-labelledby'),'lesson-title');assert.equal(s.doc.querySelector('#lesson-options').getAttribute('aria-labelledby'),'lesson-question');for(const status of s.dialog.querySelectorAll('[role="status"]')){assert.equal(status.getAttribute('tabindex'),'-1');assert.equal(status.getAttribute('aria-atomic'),'true');}s.click(s.doc.querySelector('#close-lesson'));assert.equal(s.focus().dataset.lesson,id);}}
});
test('a repeated open does not erase in-progress lesson controls or journal text',()=>{const s=setup();s.go('#workshops/programming-workshop');open(s,'prog-values-contract');const content=s.doc.querySelector('#lesson-content').firstElementChild;input(s,s.doc.querySelector('#lesson-note'),'Still drafting');open(s,'prog-trace-control');assert.equal(s.doc.querySelector('#read-check').dataset.id,'prog-values-contract');assert.equal(s.doc.querySelector('#lesson-note').value,'Still drafting');assert.equal(s.doc.querySelector('#lesson-content').firstElementChild,content);});
test('delayed close cannot replace or unfocus a newer open lesson',()=>{
 const s=setup({queuedClose:true});s.go('#workshops/security-foundations');open(s,'sec-risk-story');s.dialog.close();open(s,'sec-identity-lifecycle');s.flush();assert.equal(s.dialog.open,true);assert.equal(s.doc.querySelector('#read-check').dataset.id,'sec-identity-lifecycle');assert.equal(s.focus().id,'lesson-title');s.dialog.close();s.flush();assert.equal(s.focus().dataset.lesson,'sec-identity-lifecycle');
});
test('duplicate closed events are inert after focus moves to newer work',()=>{
 const s=setup();s.go('#workshops/data-workshop');open(s,'data-null-metrics');s.dialog.close();const search=s.doc.querySelector('#search');search.focus();const mainChild=s.doc.querySelector('#main').firstElementChild;s.dialog.dispatchEvent(new s.window.Event('close'));s.dialog.dispatchEvent(new s.window.Event('close'));assert.equal(s.focus(),search);assert.equal(s.doc.querySelector('#main').firstElementChild,mainChild);
});
test('route change closes lesson and does not restore old-route opener',()=>{
 const s=setup({queuedClose:true});s.go('#workshops/security-foundations');open(s,'sec-risk-story');s.go('#workshops/cloud-workshop');s.flush();assert.equal(s.dialog.open,false);assert.equal(s.focus().id,'view-title');assert.ok(s.focus().textContent.startsWith('Cloud Workshop'));s.doc.querySelector('#search').focus();s.dialog.dispatchEvent(new s.window.Event('close'));assert.equal(s.focus().id,'search');
});
test('duplicate Packet Trail opener retains its actual focus target',()=>{const s=setup();s.go('#network');s.click([...s.doc.querySelectorAll('[data-lesson="net-dns-evidence"]')][1]);s.dialog.close();assert.equal(s.focus().textContent,'Study the relevant lesson');});
test('primary and supplemental feedback receives focus and contains text rather than color-only answers',()=>{
 const s=setup();s.go('#workshops/data-workshop');open(s,'data-null-metrics');s.click(s.doc.querySelector('[data-answer="0"]'));assert.equal(s.focus().id,'lesson-feedback');assert.ok(s.focus().textContent.includes('Correct answer:'));const saved=s.store.get('athena-progress-v1');s.click(s.doc.querySelector('[data-answer="1"]'));assert.equal(s.store.get('athena-progress-v1'),saved);for(let i=0;i<2;i++){const block=s.doc.querySelector(`.supplemental-check[data-check-index="${i}"]`);s.click(block.querySelector('[data-supplemental-answer="0"]'));assert.equal(s.focus(),block.querySelector('.supplemental-feedback'));assert.ok(s.focus().textContent.includes('Correct answer:'));s.click(block.querySelector('[data-check-reset]'));assert.equal(s.focus().dataset.supplementalAnswer,'0');}assert.equal(s.store.get('athena-progress-v1'),saved);
});
test('filters, quest selection, incident feedback and next review restore useful focus',()=>{
 const s=setup();s.go('#certificates');s.click(s.doc.querySelector('[data-filter="Cybersecurity"]'));assert.equal(s.focus().dataset.filter,'Cybersecurity');s.go('#track/security-plus');s.click(s.doc.querySelector('[data-select]'));assert.equal(s.focus().dataset.select,'security-plus');s.go('#network');s.click(s.doc.querySelector('[data-case-answer="0"]'));assert.equal(s.focus().id,'case-feedback');s.go('#review');s.click(s.doc.querySelector('[data-review-answer="0"]'));assert.equal(s.focus().id,'review-feedback');s.click(s.doc.querySelector('[data-next-review]'));assert.equal(s.focus().id,'review-question');
});
test('slash ignores modifiers, composition, repeats and prevented events while Shift slash remains usable',()=>{
 const s=setup(),main=s.doc.querySelector('#main');for(const flags of [{ctrlKey:true},{metaKey:true},{altKey:true},{isComposing:true},{keyCode:229},{repeat:true},{prePrevented:true}]){main.focus();s.key(main,'/',flags);assert.equal(s.focus(),main,JSON.stringify(flags));}main.focus();s.key(main,'?',{shiftKey:true});assert.equal(s.focus(),main);s.key(main,'/',{shiftKey:true});assert.equal(s.focus().id,'search');
});
test('slash never steals focus from native fields, editable ancestors, custom textboxes or open lessons',()=>{
 const s=setup();for(const html of ['<input>','<textarea></textarea>','<select><option>A</option></select>','<div contenteditable=""><span tabindex="0">Text</span></div>','<div contenteditable="plaintext-only"><span tabindex="0">Text</span></div>','<div role="textbox" tabindex="0">Editor</div>']){const host=s.doc.createElement('div');host.innerHTML=html;s.doc.body.appendChild(host);const target=host.querySelector('span')||host.firstElementChild;target.focus();s.key(target,'/');assert.equal(s.focus(),target,html);host.remove();}s.go('#workshops');s.go('#workshops/systems-workshop');open(s,'sys-baseline-contract');s.key(s.doc.querySelector('#lesson-title'),'/');assert.equal(s.focus().id,'lesson-title');
});
test('shortcut opt-out persists separately, removes shortcut metadata and leaves learning export schema alone',()=>{
 const s=setup(),toggle=s.doc.querySelector('#search-shortcut-enabled');toggle.checked=false;toggle.dispatchEvent(new s.window.Event('change'));assert.equal(s.doc.querySelector('#search').hasAttribute('aria-keyshortcuts'),false);assert.equal(s.doc.querySelector('#shortcut-hint').hidden,true);assert.equal(s.store.has('athena-progress-v1'),false);const saved=Object.fromEntries(s.store);const again=setup({storage:saved});assert.equal(again.doc.querySelector('#search-shortcut-enabled').checked,false);const main=again.doc.querySelector('#main');main.focus();again.key(main,'/');assert.equal(again.focus(),main);
});
test('unavailable preference storage is safe and session toggles still work',()=>{
 const s=setup({getError:true,setError:true});assert.equal(s.doc.querySelector('#search-shortcut-enabled').checked,false);const toggle=s.doc.querySelector('#search-shortcut-enabled');toggle.checked=true;toggle.dispatchEvent(new s.window.Event('change'));assert.ok(s.doc.querySelector('#toast').textContent.includes('session only'));assert.equal(s.doc.querySelector('#search').getAttribute('aria-keyshortcuts'),'/');
});
test('search live status stays outside replaced results and Escape clears without moving focus',()=>{
 const s=setup(),search=s.doc.querySelector('#search'),status=s.doc.querySelector('#learning-status');search.focus();input(s,search,'Terraform');assert.equal(s.focus(),search);assert.match(status.textContent,/\d+ lessons/);assert.equal(s.doc.querySelector('#main').contains(status),false);input(s,search,'zzzznoresult');assert.match(status.textContent,/0 lessons/);const event=s.key(search,'Escape');assert.equal(event.defaultPrevented,true);assert.equal(search.value,'');assert.equal(s.focus(),search);assert.equal(status.textContent,'');
});
test('theme button exposes pressed state after change and imported progress',async()=>{
 const s=setup(),theme=s.doc.querySelector('#theme');assert.equal(theme.getAttribute('aria-label'),'Light color theme');assert.equal(theme.getAttribute('aria-pressed'),'false');s.click(theme);assert.equal(theme.getAttribute('aria-pressed'),'true');const state=s.window.AthenaCore.fresh(),control=s.doc.querySelector('#import');control.files=[{size:30,text:async()=>JSON.stringify(state)}];control.value='same.json';control.onchange({target:control});await tick();assert.equal(theme.getAttribute('aria-pressed'),'false');assert.equal(control.value,'');
});
test('slow older import cannot replace newer selected progress and cancelled import remains unchanged',async()=>{
 const s=setup(),control=s.doc.querySelector('#import'),a=s.window.AthenaCore.fresh(),b=s.window.AthenaCore.fresh();a.notes.identity='old';b.notes.identity='new';let release;control.files=[{size:50,text:()=>new Promise(r=>{release=r;})}];control.onchange({target:control});control.files=[{size:50,text:async()=>JSON.stringify(b)}];control.onchange({target:control});await tick();release(JSON.stringify(a));await tick();assert.equal(JSON.parse(s.store.get('athena-progress-v1')).notes.identity,'new');const saved=s.store.get('athena-progress-v1');s.window.confirm=()=>false;control.files=[{size:50,text:async()=>JSON.stringify(a)}];control.value='same.json';control.onchange({target:control});await tick();assert.equal(s.store.get('athena-progress-v1'),saved);assert.equal(control.value,'');assert.match(s.doc.querySelector('#toast').textContent,/cancelled/);
});
test('mobile import restores replacement input focus without stealing it after a route change',async()=>{
 const s=setup(),control=s.doc.querySelector('#main [data-import]'),state=s.window.AthenaCore.fresh();control.files=[{size:20,text:async()=>JSON.stringify(state)}];control.dispatchEvent(new s.window.Event('change',{bubbles:true}));await tick();assert.equal(s.focus(),s.doc.querySelector('#main [data-import]'));let release;const old=s.doc.querySelector('#main [data-import]');old.files=[{size:20,text:()=>new Promise(r=>{release=r;})}];old.dispatchEvent(new s.window.Event('change',{bubbles:true}));s.go('#workshops');const search=s.doc.querySelector('#search');search.focus();release(JSON.stringify(state));await tick();assert.equal(s.focus(),search);
});
test('learning controls keep labels, referenced IDs, button names and unique IDs across routes',()=>{
 const s=setup();for(const hash of ['#home','#certificates','#foundations','#labs','#review','#network','#workshops',...s.window.ATHENA_DATA.workshops.map(x=>'#workshops/'+x.id)]){s.go(hash);const ids=[...s.doc.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length,hash);for(const el of s.doc.querySelectorAll('[aria-labelledby],[aria-describedby]')){for(const name of ['aria-labelledby','aria-describedby'])for(const id of (el.getAttribute(name)||'').split(/\s+/).filter(Boolean))assert.ok(s.doc.getElementById(id),id);}for(const button of s.doc.querySelectorAll('button'))assert.ok((button.getAttribute('aria-label')||button.textContent).trim());for(const field of s.doc.querySelectorAll('input,textarea,select'))assert.ok(field.getAttribute('aria-label')||field.getAttribute('aria-labelledby')||field.closest('label')||[...s.doc.querySelectorAll('label[for]')].some(l=>l.getAttribute('for')===field.id),field.outerHTML);}
});
test('new CSS has forced-color, reduced-motion and non-color-only focus affordances',()=>{
 const css=fs.readFileSync('dist/styles.css','utf8');for(const token of ['@media(forced-colors:active)','CanvasText','Highlight','@media(prefers-reduced-motion:reduce)','#lesson-title:focus-visible','.feedback-host:focus-visible','.keyboard-options summary'])assert.ok(css.includes(token),token);assert.equal(/outline\s*:\s*(?:none|0)\s*[;}]/.test(css.replace('.feedback-host:empty{outline:none}','')),false);assert.equal(/forced-color-adjust\s*:\s*none/.test(css),false);
});

// Synthetic focus-order model for the explicit boundary handler. Real rendering
// and tab traversal still require the unchanged Chromium acceptance suite.
function modelTabStops(s){
 s.window.getComputedStyle=el=>({visibility:el.dataset.testVisibility||'visible'});
 s.window.HTMLElement.prototype.getClientRects=function(){return this.dataset.testRects==='none'?[]:[{}];};
 const controls=[...s.dialog.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')];
 for(const el of controls)Object.defineProperty(el,'tabIndex',{configurable:true,get(){const a=this.getAttribute('tabindex');return a===null?0:Number(a);}});
 return controls.filter(el=>el.tabIndex>=0&&!el.matches(':disabled')&&!el.closest('[hidden],[inert]')&&el.getClientRects().length&&s.window.getComputedStyle(el).visibility==='visible');
}
test('lesson Tab and Shift+Tab wrap at visible enabled boundaries',()=>{
 const s=setup();s.go('#workshops/security-foundations');open(s,'sec-risk-story');const items=modelTabStops(s),first=items[0],last=items.at(-1);
 last.focus();assert.equal(s.key(last,'Tab').defaultPrevented,true);assert.equal(s.focus()===first,true);
 first.focus();assert.equal(s.key(first,'Tab',{shiftKey:true}).defaultPrevented,true);assert.equal(s.focus()===last,true);
 const middle=items[1];middle.focus();assert.equal(s.key(middle,'Tab').defaultPrevented,false);assert.equal(s.focus()===middle,true);
});
test('title and feedback focus enter the modal tab order without escaping',()=>{
 const s=setup();s.go('#workshops/security-foundations');open(s,'sec-risk-story');let items=modelTabStops(s),title=s.doc.querySelector('#lesson-title');
 title.focus();assert.equal(s.key(title,'Tab').defaultPrevented,true);assert.equal(s.focus()===items[0],true);
 title.focus();assert.equal(s.key(title,'Tab',{shiftKey:true}).defaultPrevented,true);assert.equal(s.focus()===items.at(-1),true);
 s.click(s.doc.querySelector('[data-answer="0"]'));items=modelTabStops(s);const feedback=s.doc.querySelector('#lesson-feedback');assert.equal(s.focus()===feedback,true);s.key(feedback,'Tab');assert.equal(s.focus()===items[0],true);
});
test('modal boundaries exclude hidden inert disabled and nonsequential controls',()=>{
 const s=setup();s.go('#workshops/security-foundations');open(s,'sec-risk-story');let items=modelTabStops(s);const first=items[0],last=items.at(-1);
 const extras=s.doc.createElement('div');extras.innerHTML='<button disabled>disabled</button><button hidden>hidden</button><div inert><button>inert</button></div><button tabindex="-1">negative</button><input type="hidden"><button data-test-rects="none">display none</button><button data-test-visibility="hidden">visibility hidden</button><button data-test-visibility="collapse">visibility collapse</button>';s.dialog.append(extras);modelTabStops(s);
 last.focus();s.key(last,'Tab');assert.equal(s.focus()===first,true);first.focus();s.key(first,'Tab',{shiftKey:true});assert.equal(s.focus()===last,true);
 for(const el of s.dialog.querySelectorAll('button,a[href],input,select,textarea,[tabindex]'))el.dataset.testRects='none';const title=s.doc.querySelector('#lesson-title');title.focus();assert.equal(s.key(title,'Tab').defaultPrevented,true);assert.equal(s.focus()===title,true);
});
test('boundary handler respects Escape modifiers prevented events and closed dialogs',()=>{
 const s=setup();s.go('#workshops/security-foundations');open(s,'sec-risk-story');const items=modelTabStops(s),last=items.at(-1);
 for(const flags of [{ctrlKey:true},{metaKey:true},{altKey:true},{isComposing:true},{keyCode:229}]){last.focus();assert.equal(s.key(last,'Tab',flags).defaultPrevented,false);assert.equal(s.focus()===last,true);}
 last.focus();s.key(last,'Tab',{prePrevented:true});assert.equal(s.focus()===last,true);assert.equal(s.key(last,'Escape').defaultPrevented,false);
 s.dialog.close();last.focus();assert.equal(s.key(last,'Tab').defaultPrevented,false);assert.equal(s.focus()===last,true);
});

test('late native lesson close cannot erase newer route interaction or steal focus',()=>{
 const s=setup({queuedClose:true});s.go('#workshops/security-foundations');open(s,'sec-risk-story');s.dialog.close();
 s.go('#review');s.click(s.doc.querySelector('[data-review-answer="0"]'));
 const feedback=s.doc.querySelector('#review-feedback'),html=feedback.innerHTML,card=s.doc.querySelector('.review-card');
 s.flush();assert.equal(s.doc.querySelector('.review-card')===card,true);assert.equal(feedback.innerHTML,html);assert.equal(s.focus(),feedback);
});

test('Escape cancel settles close synchronously before subsequent keyboard movement',()=>{
 const s=setup({queuedClose:true});s.go('#workshops/security-foundations');open(s,'sec-risk-story');const event=new s.window.Event('cancel',{cancelable:true});s.dialog.dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(s.dialog.open,false);const next=s.doc.querySelector('[data-lesson="sec-identity-lifecycle"]');next.focus();s.flush();assert.equal(s.focus()===next,true);assert.equal(s.doc.querySelector('[data-lesson="sec-identity-lifecycle"]')===next,true);
});
