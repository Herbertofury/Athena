export async function mount({container,search='',theme='dark',signal}={}){
 if(!container?.attachShadow)throw TypeError('Workspace container required');
 const root=container.shadowRoot||container.attachShadow({mode:'open'}),cleanups=[],observers=new Set(),timers=new Set(),frames=new Set(),urls=new Set();
 let disposed=false,cancelRun=()=>{};
 function setTheme(value){container.dataset.theme=value==='light'?'light':'dark';}
 function listenWindow(name,callback,options){window.addEventListener(name,callback,options);cleanups.push(()=>window.removeEventListener(name,callback,options));}
 const PerformanceObserver=class {
  static supportedEntryTypes=globalThis.PerformanceObserver?.supportedEntryTypes||[];
  constructor(callback){this.observer=new globalThis.PerformanceObserver((...args)=>{if(!disposed)callback(...args);});observers.add(this.observer);}
  observe(options){this.observer.observe(options);}
 };
 const requestAnimationFrame=callback=>{const id=globalThis.requestAnimationFrame(time=>{frames.delete(id);if(!disposed)callback(time);});frames.add(id);return id;};
 const cancelAnimationFrame=id=>{frames.delete(id);globalThis.cancelAnimationFrame(id);};
 const setTimeout=(callback,delay)=>{const id=globalThis.setTimeout(()=>{timers.delete(id);if(!disposed)callback();},delay);timers.add(id);return id;};
 const clearTimeout=id=>{timers.delete(id);globalThis.clearTimeout(id);};
 const createObjectURL=blob=>{const url=URL.createObjectURL(blob);urls.add(url);return url;};
 const revokeObjectURL=url=>{urls.delete(url);URL.revokeObjectURL(url);};
 function unmount(){if(disposed)return;disposed=true;cancelRun();for(const observer of observers)observer.disconnect();observers.clear();for(const f of cleanups.splice(0))f();for(const id of timers)globalThis.clearTimeout(id);timers.clear();for(const id of frames)globalThis.cancelAnimationFrame(id);frames.clear();for(const url of urls)URL.revokeObjectURL(url);urls.clear();root.querySelector('dialog[open]')?.close();root.replaceChildren();signal?.removeEventListener('abort',unmount);}
 signal?.addEventListener('abort',unmount,{once:true});
 if(signal?.aborted){unmount();return {unmount,setTheme,setSearch(){},ready:false};}
 root.innerHTML=MARKUP;
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./style.css',import.meta.url).href;root.prepend(style);setTheme(theme);
