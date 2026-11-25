// SPDX-License-Identifier: GPL-3.0-or-later
import {createHash} from 'node:crypto';
import {mkdir,readFile,realpath,writeFile} from 'node:fs/promises';
import {basename,dirname,isAbsolute,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const pin='313239010031905568f2349f7d8f43bf4d533fd0';
const revision='bce6c1bcb31c63d31c64185fef143a53d9c4d35f';
function cut(source,first,last){
 const i=source.indexOf(first),j=source.indexOf(last,i+first.length);
 if(i<0||j<=i)throw Error('Pinned city section missing');
 return source.slice(i,j);
}
export async function buildTopology(dest){
 dest=resolve(dest);dest=resolve(await realpath(dirname(dest)),basename(dest));
 const rel=relative(await realpath(here),dest);
 if(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep))throw Error('Use a new directory outside the engine source');
 const source=await readFile(resolve(here,'upstream/gamesync/game-openworld.js'));
 if(createHash('sha1').update('blob '+source.length+'\0').update(source).digest('hex')!==pin)throw Error('Pinned GameSync source did not match');
 const text=new TextDecoder('utf-8',{fatal:true}).decode(source);
 const world='// SPDX-License-Identifier: GPL-3.0-or-later\n// Pinned GameSync '+revision+' world topology.\n'+
  cut(text,'  const WORLD_W =','  const SAVE_KEY')+
  cut(text,'  const ROAD_NODES =','  const BENCHES =')+
  cut(text,'  function buildRoadGraph(nodes) {','  function createOpenWorldGame')+
  '\nexport {WORLD_W,WORLD_H,ROAD_NODES,DISTRICTS,BUILDINGS,BUILDING_SIGN_TEXT,SAFEHOUSES,INTERIORS,buildRoadGraph};\n';
 const [logic,license,explore]=await Promise.all([readFile(resolve(here,'src/city-topology.mjs')),readFile(resolve(here,'LICENSE')),readFile(resolve(here,'src/explore.mjs'))]);
 await mkdir(dest,{mode:0o700});
 for(const [name,bytes] of [['city-source.mjs',world],['city.mjs',logic],['LICENSE',license],['explore.mjs',explore]]){
  await writeFile(resolve(dest,name),bytes,{flag:'wx'});
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==3)throw Error('Usage: node build-topology.mjs NEW-DIRECTORY');
 await buildTopology(process.argv[2]);
}
