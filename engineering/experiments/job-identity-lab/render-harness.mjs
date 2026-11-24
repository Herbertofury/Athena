import assert from 'node:assert/strict';
import vm from 'node:vm';
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.parent=null;this.value='';this.handlers=new Map();this.classList={add(){},remove(){}};this.ownText='';}
 set textContent(value){this.ownText=String(value);this.children=[];}
 get textContent(){return this.ownText+this.children.map(child=>child.textContent).join('');}
 get firstChild(){return this.children[0]||null;}
 get nextSibling(){return this.parent?.children[this.parent.children.indexOf(this)+1]||null;}
 append(...nodes){for(const node of nodes)this.insertBefore(node,null);}
 insertBefore(node,cursor){node.remove();const index=cursor===null?this.children.length:this.children.indexOf(cursor);assert.ok(index>=0);this.children.splice(index,0,node);node.parent=this;}
 remove(){if(this.parent){const index=this.parent.children.indexOf(this);this.parent.children.splice(index,1);this.parent=null;}}
 addEventListener(type,fn){this.handlers.set(type,fn);}
 setAttribute(){}
 querySelector(){return this.button??=new Element('button');}
}
export function mount(source,bindings={}, {fetchImpl}={}){const elements=new Map();const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};const context={...bindings,...(fetchImpl?{fetch:fetchImpl,AbortController,DOMException,setTimeout,clearTimeout}:{}),document:{hidden:!fetchImpl,getElementById:get,querySelectorAll:()=>[],addEventListener(){},createElement:tag=>new Element(tag)},window:{addEventListener(){}},location:{hash:'#overview'},createArchiveSelection:()=>({}),setInterval(){}};vm.runInNewContext(source+'\nglobalThis.renderFixture=render;globalThis.refreshFixture=refresh;',context);return {get,refresh:context.refreshFixture,render:(data,instance='0'.repeat(32))=>context.renderFixture(data,instance)};}
