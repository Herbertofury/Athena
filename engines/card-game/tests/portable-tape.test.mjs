// SPDX-License-Identifier: GPL-3.0-or-later
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rename,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {buildReplay} from '../build-replay.mjs';

async function fixture(t){
 const temp=await mkdtemp(resolve(tmpdir(),'athena-card-tape-'));t.after(()=>rm(temp,{recursive:true,force:true}));
 const old=resolve(temp,'assemble');await buildReplay(old);
 const bundle=resolve(temp,'Moved bundle');await rename(old,bundle);
 const api=await import(pathToFileURL(resolve(bundle,'portable-tape.mjs')));
 function cli(args,input){
  return spawnSync(process.execPath,[resolve(bundle,'tape-cli.mjs'),...args],{cwd:temp,encoding:'utf8',input,timeout:15000});
 }
 return {temp,bundle,api,cli};
}

test('portable demo matches real combat win, verifies from a moved folder, no overwrite',async t=>{
 const {cli,temp}=await fixture(t);
 const a=cli(['demo','sample.json']);assert.equal(a.status,0,a.stderr);assert.match(a.stdout,/win · 62 actions/);
 const path=resolve(temp,'sample.json'),received=await readFile(path,'utf8');
 const b=cli(['verify',path]);assert.equal(b.status,0,b.stderr);
 const r=JSON.parse(b.stdout);
 assert.deepEqual([r.verified,r.phase,r.result,r.seed,r.commands.length],[true,'ended','win',42,62]);
 assert.ok(r.commands.some(c=>c.type==='attack-hero'));
 assert.ok(r.commands.some(c=>c.type==='attack'));
 assert.ok(r.commands.some(c=>c.type==='power'));
 assert.notEqual(cli(['demo',path]).status,0,'No overwrite');
 assert.equal(await readFile(path,'utf8'),received);
 const c=cli(['demo','regenerated.json']);assert.equal(c.status,0,c.stderr);
 assert.equal(await readFile(resolve(temp,'regenerated.json'),'utf8'),received);
});

test('resume matches midway state and newly issued actions; malformed, illegal and edited records refuse',async t=>{
 const {api,cli,temp}=await fixture(t);
 const m=api.newMatch(42);
 const initial=api.encodeTape(m);
 assert.throws(()=>m.apply({type:'play',hand:0}),/Cannot play/);
 assert.throws(()=>m.apply({type:'mulligan',kept:[1,1]}),/unique/);
 assert.throws(()=>m.apply(JSON.parse('{"type":"end","__proto__":{}}')),/shape/);
 assert.equal(api.encodeTape(m),initial);
 m.apply({type:'mulligan',kept:[0]});m.apply({type:'end'});
 const midway=api.encodeTape(m);
 const replay=api.decodeTape(midway);assert.deepEqual(replay.view(),m.view());
 assert.ok(!Object.hasOwn(replay.view().state,'enemyHandCards'));
 assert.throws(()=>api.decodeTape(midway.replace('"seed":42','"seed":43')),/digests/);
 assert.throws(()=>api.decodeTape(midway.replace('"seed":42','"seed":9,"seed":42')),/canonical/);
 assert.throws(()=>api.decodeTape(midway.slice(0,-1)),/canonical/);
 const illegal=JSON.parse(midway);illegal.commands[0]={type:'end'};
 assert.throws(()=>api.verifyTape(illegal),/mulligan/);
 assert.throws(()=>api.decodeTape(' '.repeat(api.MAX_TAPE_BYTES+1)),/size/);
 const forged=JSON.parse(midway);forged.rules='unknown';
 assert.throws(()=>api.verifyTape(forged),/Incompatible/);
 await writeFile(resolve(temp,'midway.json'),midway);
 const resumed=cli(['resume','midway.json'],'end\nsave resumed.json\nquit\n');
 assert.equal(resumed.status,0,resumed.stderr);assert.match(resumed.stdout,/Saved new replay tape/);
 m.apply({type:'end'});
 assert.equal(await readFile(resolve(temp,'resumed.json'),'utf8'),api.encodeTape(m));
});

test('fixture exposes only legal card slots/targets and refuses post-game commands',async t=>{
 const {api}=await fixture(t);
 const m=api.newMatch(42);
 m.apply({type:'mulligan',kept:[0,2]});
 const {choices}=m.view();
 assert.deepEqual(choices.play,[1,2,3]);
 assert.throws(()=>m.apply({type:'play',hand:0}),/Cannot play/);
 assert.equal(choices.power,false);
 assert.throws(()=>m.apply({type:'power'}),/unavailable/);
 assert.throws(()=>m.apply({type:'attack',from:0,to:0}),/Cannot attack/);
 m.apply({type:'concede'});
 assert.throws(()=>m.apply({type:'end'}),/after the match ends/);
});
