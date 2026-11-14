const test=require('node:test'),assert=require('node:assert/strict');
const ready=import('../dist/workspaces/foundry/layout-state.mjs').then(m=>m.createLayoutModel([{id:'neutral',rooms:[{id:'room'}],objects:[{id:'orb'}]}]));
test('layout rejects foreign ids, malformed objects and nonfinite positions',async()=>{const m=await ready;for(const p of [{unknown:{x:0,y:0,pinned:false}},{orb:{x:NaN,y:0,pinned:false}},{orb:{x:1.1,y:0,pinned:false}}])assert.throws(()=>m.validate({...m.initial(),placements:p}));});
test('layout export strips private/provider fields',async()=>{const m=await ready;assert.equal('accessToken' in m.validate({...m.initial(),accessToken:'fixture'}),false);});
test('layout rejects prototype placements',async()=>{const m=await ready;assert.throws(()=>m.parse('{"version":1,"themeId":"neutral","roomId":"room","time":"day","placements":{"__proto__":{"x":0,"y":0,"pinned":false}}}'));});
test('layout save reports failure and invalid storage is never silently reset',async()=>{const m=await ready;assert.throws(()=>m.save({setItem(){throw Error('quota');}},'layout',m.initial()),/quota/);let writes=0;assert.throws(()=>m.load({getItem(){return '{bad';},setItem(){writes++;}},'layout'));assert.equal(writes,0);});
test('layout rejects oversized imports before parse',async()=>{const m=await ready;assert.throws(()=>m.parse(' '.repeat(200001)),/limit/);});
test('workspace backups validate every room and strip unrecognized private fields',async()=>{
 const fs=require('node:fs');const catalog=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../dist/workspaces/foundry/catalog.json')));
 const model=(await import('../dist/workspaces/foundry/layout-state.mjs')).createLayoutModel(catalog.themes);
 const active=model.initial();const backup={version:1,active:{...active,token:'secret'},layouts:{[active.roomId]:active},privateData:'secret'};
 const encoded=model.encodeWorkspace(backup);assert.doesNotMatch(encoded,/secret|privateData|token/);assert.deepEqual(model.parseWorkspace(encoded).active,active);
 assert.throws(()=>model.workspace({...backup,version:2}));
 assert.throws(()=>model.workspace({...backup,layouts:{wrong:active}}));
 assert.throws(()=>model.parseWorkspace(' '.repeat(1000001)));
});
test('rollback is bounded, cloned, reversible and new edits discard redo',async()=>{
 const {createLayoutHistory}=await import('../dist/workspaces/foundry/layout-state.mjs'),m=await ready,h=createLayoutHistory(m,2);
 const state=time=>({version:1,active:{...m.initial(),time},layouts:{}});
 h.record(state('dawn'));h.record(state('day'));h.record(state('dusk'));assert.equal(h.size,2);
 const previous=h.undo(state('night'));assert.equal(previous.active.time,'dusk');previous.active.time='dawn';
 assert.equal(h.redo(state('dusk')).active.time,'night');h.undo(state('night'));h.record(state('day'));assert.equal(h.canRedo,false);assert.equal(h.size,2);
 assert.throws(()=>h.record({version:99}));assert.equal(h.size,2);
});
test('workspace view defaults old backups, validates docks and strips unknown view data',async()=>{
 const m=await ready,base={version:1,active:m.initial(),layouts:{}};assert.deepEqual(m.workspace(base).view,{inspectorDock:'right',inspectorWidth:240});for(const inspectorDock of ['left','right','hidden'])assert.deepEqual(m.workspace({...base,view:{inspectorDock,token:'secret'}}).view,{inspectorDock,inspectorWidth:240});for(const view of [null,{},'left',{inspectorDock:'floating'}])assert.throws(()=>m.workspace({...base,view}),/inspector/);
});
test('named layouts are bounded, validated and sanitize unknown fields',async()=>{
 const m=await ready,layout=m.initial();assert.deepEqual(m.savedLayouts(),[]);assert.deepEqual(m.savedLayouts([{name:'safe',layout,token:'secret'}]),[{name:'safe',layout}]);for(const input of [null,{},[{name:'',layout}],[{name:' x',layout}],[{name:'x'.repeat(81),layout}],[{name:'x',layout},{name:'x',layout}],Array.from({length:21},(_,i)=>({name:String(i),layout})),[{name:'x',layout:{...layout,themeId:'unknown'}}]])assert.throws(()=>m.savedLayouts(input));
});

test('inspector width defaults legacy data, rejects invalid sizes and survives workspace encoding',async()=>{const m=await ready;assert.equal(m.view({inspectorDock:'left'}).inspectorWidth,240);for(const width of [180,240,480])assert.equal(m.view({inspectorDock:'right',inspectorWidth:width}).inspectorWidth,width);for(const width of [null,'240',179,481,Infinity,NaN,240.5])assert.throws(()=>m.view({inspectorDock:'right',inspectorWidth:width}),/width/);const data={version:1,active:m.initial(),layouts:{},view:{inspectorDock:'left',inspectorWidth:320}};assert.deepEqual(m.parseWorkspace(m.encodeWorkspace(data)).view,data.view);});
