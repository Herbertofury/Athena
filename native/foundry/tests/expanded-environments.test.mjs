import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {createLayoutModel} from '../../../dist/workspaces/foundry/layout-state.mjs';
import {renderExpandedEnvironment} from '../../../dist/workspaces/foundry/native-environment.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../../../dist/workspaces/foundry/catalog.json',import.meta.url))).themes;
const source=fs.readFileSync(new URL('../../../feature-foundry/source/src/prototype-v24.ts',import.meta.url),'utf8');
const names=['skyGradient','drawPerspectiveFloor','drawFrutigerWallpaper','drawAurora','drawOcean','drawRainCity','drawDiner'];
const originals=names.map(n=>source.split('\n').find(l=>l.trim().startsWith('function '+n+'('))).join('\n');
function recorder(){const ops=[];let gradients=0;const ctx=new Proxy({}, {get(o,k){if(k==='createLinearGradient'||k==='createRadialGradient')return(...args)=>{const id=++gradients;ops.push([k,id,...args]);return {id,addColorStop(...a){ops.push(['stop',id,...a])}}};return(...args)=>ops.push([k,...args])},set(o,k,v){ops.push(['set',k,v?.id?{gradient:v.id}:v]);return true}});return{ctx,ops};}
for(const [preset,name]of Object.entries({frutiger:'drawFrutigerWallpaper',aurora:'drawAurora',ocean:'drawOcean',raincity:'drawRainCity',diner:'drawDiner'})){
 test(preset+' draws source-exact static operations and persists version10 only',()=>{
  const actual=recorder(),expected=recorder();renderExpandedEnvironment(actual.ctx,preset,1000,600,.48);
  const context={ctx:expected.ctx,environmentConfig:{horizon:48,floor:72}};vm.createContext(context);vm.runInContext(originals+`;ctx.save();ctx.clearRect(0,0,1000,600);${name}(ctx,1000,600,0);ctx.restore();`,context);
  assert.deepEqual(actual.ops,expected.ops);
  const model=createLayoutModel(catalog),before=model.initial(),value=model.upgradeEnvironment(before,{preset,opacity:.82,horizon:.48,target:'room',targetId:null});
  assert.equal(value.version,10);assert.equal(model.parse(model.encode(value)).environment.preset,preset);assert.equal(before.version,1);
  for(const version of [4,5,6,7,8,9])assert.throws(()=>model.validate({...value,version}));
  assert.equal(model.upgradeEnvironment(value,{...value.environment,preset:'off'}).version,10);
 });
}
test('renderer rejects unknown modes and unbounded canvas dimensions',()=>{assert.throws(()=>renderExpandedEnvironment(recorder().ctx,'cosmic'));assert.throws(()=>renderExpandedEnvironment(recorder().ctx,'ocean',1e6,600));});
