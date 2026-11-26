import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describePlate,drawPlate} from '../engineering/apps/atlas-lab/ui/foundry-artist-concept.mjs';
const index=JSON.parse(readFileSync(new URL('../engineering/apps/atlas-lab/ui/foundry-artist-index.json',import.meta.url)));
const commands=()=>{
 const log=[];
 const gradient={addColorStop:(...args)=>log.push(['stop',...args])};
 const getContext=kind=>{
  assert.equal(kind,'2d');
  const ctx=new Proxy({},{
   set(t,k,v){if(k!=='fillStyle'||v!==gradient)log.push(['set',k,v]);return Reflect.set(t,k,v);},
   get(t,k){return k==='createLinearGradient'?()=>gradient:(...args)=>{
    assert.ok(args.every(x=>typeof x!=='number'||Number.isFinite(x)));
    log.push([k,...args]);
   };}
  });
  return ctx;
 };
 return {log,canvas:{getContext}};
};
function draw(id,mode,phase){const {log,canvas}=commands();const result=drawPlate(canvas,id,mode,phase);assert.equal(canvas.width,640);assert.equal(canvas.height,320);return {log,result};}
test('all ten exact authority variants use deterministic independent plates and bounded weather',()=>{
 const worlds=index.artists.flatMap(a=>a.worlds);
 const knownWeather=[];
 assert.equal(worlds.length,10);
 const layouts=new Set(),motifs=new Set();
 for(const world of worlds){
  const {motif,swatches}=describePlate(world.id);
  assert.ok(motif&&swatches.length===5&&swatches.every(x=>/^#[a-f0-9]{6}$/.test(x)));
  const first=draw(world.id);
  assert.deepEqual(first,draw(world.id));
  assert.equal(first.result.marks,0);
  const own=index.artists.find(a=>a.worlds.includes(world)).weather;
  for(const w of own){
   const study=draw(world.id,w);
   assert.ok(study.result.marks>0&&study.result.marks<=46);
   assert.notDeepEqual(first.log,study.log);
   assert.ok(study.log.length<1700,'Renderer is single-shot and bounded');
   knownWeather.push(JSON.stringify(study.log));
  }
  assert.deepEqual(first,draw(world.id,{id:'unsupported',intensity:'dramatic'}));
  layouts.add(JSON.stringify(first.log));motifs.add(motif);
 }
 assert.equal(layouts.size,10);assert.equal(motifs.size,5);
 assert.equal(new Set(knownWeather).size,40);
 assert.throws(()=>describePlate('__proto__'),RangeError);
});

test('all artist-level phases are deterministic, compose with weather and reject cross-artist recipes',()=>{
 const seen=new Set();
 for(const artist of index.artists)for(const world of artist.worlds){
  assert.equal(artist.timeflow.length,4);
  const base=draw(world.id),rain=artist.weather[0],wet=draw(world.id,rain);
  for(const phase of artist.timeflow){
   const dryPhase=draw(world.id,null,phase.id),wetPhase=draw(world.id,rain,phase.id);
   assert.deepEqual(wetPhase,draw(world.id,rain,phase.id));
   assert.notDeepEqual(dryPhase.log,base.log);
   assert.notDeepEqual(wetPhase.log,wet.log);
   assert.equal(wetPhase.result.marks,wet.result.marks);
   assert.ok(wetPhase.log.length<=wet.log.length+5);
   seen.add(JSON.stringify(wetPhase.log));
  }
  const other=index.artists.find(x=>x!==artist).timeflow[0].id;
  for(const unknown of [other,'__proto__','unknown',undefined])
   assert.deepEqual(wet,draw(world.id,rain,unknown));
 }
 assert.equal(seen.size,40);
});
