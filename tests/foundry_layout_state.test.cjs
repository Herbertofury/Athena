const test=require('node:test'),assert=require('node:assert/strict');
const ready=import('../dist/workspaces/foundry/layout-state.mjs').then(m=>m.createLayoutModel([{id:'neutral',rooms:[{id:'room'}],objects:[{id:'orb'}]}]));
test('layout rejects foreign ids, malformed objects and nonfinite positions',async()=>{const m=await ready;for(const p of [{unknown:{x:0,y:0,pinned:false}},{orb:{x:NaN,y:0,pinned:false}},{orb:{x:1.1,y:0,pinned:false}}])assert.throws(()=>m.validate({...m.initial(),placements:p}));});
test('layout export strips private/provider fields',async()=>{const m=await ready;assert.equal('accessToken' in m.validate({...m.initial(),accessToken:'fixture'}),false);});
test('layout rejects prototype placements',async()=>{const m=await ready;assert.throws(()=>m.parse('{"version":1,"themeId":"neutral","roomId":"room","time":"day","placements":{"__proto__":{"x":0,"y":0,"pinned":false}}}'));});
test('layout save reports failure and invalid storage is never silently reset',async()=>{const m=await ready;assert.throws(()=>m.save({setItem(){throw Error('quota');}},'layout',m.initial()),/quota/);let writes=0;assert.throws(()=>m.load({getItem(){return '{bad';},setItem(){writes++;}},'layout'));assert.equal(writes,0);});
test('layout rejects oversized imports before parse',async()=>{const m=await ready;assert.throws(()=>m.parse(' '.repeat(200001)),/limit/);});
