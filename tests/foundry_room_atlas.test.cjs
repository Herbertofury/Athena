'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const file=process.env.FOUNDRY_EXTRACTION_MODULE||path.join(__dirname,'../dist/workspaces/foundry/index.js');
const source=fs.readFileSync(file,'utf8');
const start=source.indexOf('function extractRoomObjectToAtlas('),end=source.indexOf('\n\t\tfunction extractAllRoomObjects()',start);
assert.ok(start>=0&&end>start,'actual module extraction implementation found');
function fixture(existing=false,collision=false) {
  const selected={id:'selected-existing'},owned={id:'owned-room',sourceRoom:'saved room'},oldScratch={id:'room-sofa-test',sourceRoom:'previously saved room'};
  const assets=[selected,...existing?[owned]:[],...collision?[oldScratch]:[]],assetById=Object.fromEntries(assets.map(a=>[a.id,a]));
  const obj={id:'sofa',name:'Synthetic Sofa',detachable:true,physics:'Static',role:'Seat',actions:['Sit'],mascot:'Test',atlasId:existing?owned.id:null};
  const calls=[];const context={assets,assetById,selectedAsset:selected,currentTheme:'test',roomSemanticState:{sourceName:'synthetic room'},roomRoleArt:()=>'<svg/>',selectedRoomObject:()=>obj,$:()=>null,Date:{now:()=>123},console};
  for(const name of ['toast','selectAsset','renderAssetGrid','renderFloatingAssetGrid','renderRoomIntelligence','saveRoomSemanticState','recordHistory'])context[name]=(...args)=>calls.push({name,args});
  vm.createContext(context);vm.runInContext(source.slice(start,end),context);
  return {context,obj,selected,owned,oldScratch,calls};
}
for(const existing of [false,true])for(const collision of [false,true])test(`self-test extraction is isolated with existing=${existing}, collision=${collision}`,()=>{
  const f=fixture(existing,collision),before=f.context.assets.slice(),prior=f.obj.atlasId;
  const result=f.context.extractRoomObjectToAtlas(f.obj,{test:true,notify:true});
  assert.equal(f.context.assets.length,before.length+1);
  assert.equal(result.sourceRoom,'synthetic room');
  assert.ok(!before.includes(result));assert.equal(f.context.assetById[result.id],result);
  assert.equal(f.context.selectedAsset,f.selected);assert.deepEqual(f.calls,[]);
  if(existing)assert.equal(f.context.assetById[f.owned.id],f.owned);
  if(collision)assert.equal(f.context.assetById[f.oldScratch.id],f.oldScratch);
  // Exact runtime self-test cleanup must remove only its newly-created asset.
  f.context.assets.splice(f.context.assets.indexOf(result),1);delete f.context.assetById[result.id];f.obj.atlasId=prior;
  assert.deepEqual(f.context.assets,before);assert.equal(f.obj.atlasId,prior);
});
test('ordinary repeated extraction still selects the existing asset without duplicate or persistence',()=>{
  const f=fixture(true,true),count=f.context.assets.length;
  assert.equal(f.context.extractRoomObjectToAtlas(f.obj,{notify:false}),f.owned);
  assert.equal(f.context.assets.length,count);assert.equal(f.context.selectedAsset,f.owned);
  assert.deepEqual(f.calls.map(c=>c.name),['selectAsset']);
});
test('ordinary new extraction retains rendering, selection, persistence and history',()=>{
  const f=fixture(),result=f.context.extractRoomObjectToAtlas(f.obj);
  assert.equal(result.id,'room-sofa-123');assert.equal(f.obj.atlasId,result.id);
  assert.equal(f.context.selectedAsset,result);
  assert.deepEqual(f.calls.map(c=>c.name),['renderAssetGrid','renderFloatingAssetGrid','selectAsset','renderRoomIntelligence','saveRoomSemanticState','toast','recordHistory']);
});
test('non-detachable object remains unmodified',()=>{
  const f=fixture();f.obj.detachable=false;const before=f.context.assets.slice();
  assert.equal(f.context.extractRoomObjectToAtlas(f.obj,{test:true,notify:false}),null);
  assert.deepEqual(f.context.assets,before);assert.deepEqual(f.calls,[]);
});
test('actual self-test cleanup restores prior atlas reference when its assertion computation throws',()=>{
  const f=fixture(true,true),before=f.context.assets.slice(),prior=f.obj.atlasId;
  f.context.roomObjectById=()=>f.obj;f.context.results={};
  const begin=source.indexOf('const testRoomObj = roomObjectById("sofa")');
  const finish=source.indexOf('\n\t\t\t\troomSemanticState.tableAssetId = null;',begin);
  assert.ok(begin>=0&&finish>begin);
  // The first read constructs the isolated asset; the second computes the result.
  let reads=0;Object.defineProperty(f.context.roomSemanticState,'sourceName',{get(){if(++reads===2)throw Error('synthetic check failure');return 'synthetic room'}});
  assert.throws(()=>vm.runInContext(source.slice(begin,finish),f.context),/synthetic check failure/);
  assert.deepEqual(f.context.assets,before);assert.equal(f.obj.atlasId,prior);
  assert.equal(f.context.assetById[f.owned.id],f.owned);assert.equal(f.context.assetById[f.oldScratch.id],f.oldScratch);
  assert.equal(f.context.selectedAsset,f.selected);assert.deepEqual(f.calls,[]);
});
