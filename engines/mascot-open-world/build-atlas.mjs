// SPDX-License-Identifier: GPL-3.0-or-later
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTopology} from './build-topology.mjs';

const here=dirname(fileURLToPath(import.meta.url));
export async function buildAtlas(destination){
 const dir=await mkdtemp(resolve(tmpdir(),'mascot-city-atlas-'));
 try{
  const artifact=resolve(dir,'engine');
  await buildTopology(artifact);
  const editable=async path=>(await readFile(path,'utf8')).replace(/\r\n/g,'\n');
  const [template,css,ui,topology,logic]=await Promise.all([
   editable(resolve(here,'preview/atlas.html')),editable(resolve(here,'preview/atlas.css')),
   editable(resolve(here,'preview/atlas-ui.mjs')),readFile(resolve(artifact,'city-source.mjs'),'utf8'),
   editable(resolve(artifact,'city.mjs'))
  ]);
  if(!/\nexport \{[^\n]+\};\n$/.test(topology)||!/^\/\/ SPDX[^\n]+\nimport [^\n]+ from '\.\/city-source\.mjs';\n/m.test(logic)){
   throw Error('Unexpected pinned topology module shape');
  }
  // Bundle only the just-generated local modules, not a user-supplied script.
  const core=topology.replace(/\nexport \{[^\n]+\};\n$/,'')+'\n'+
   logic.replace(/^import [^\n]+ from '\.\/city-source\.mjs';\n/m,'').replace(/^export function /gm,'function ');
  const script='const atlasRules=(()=>{\n'+core+'\nreturn {cityCatalog,inspectWorldPoint,planRoadRoute,createDoorVisit};\n})();\n'+ui;
  if(!template.includes('/*__ATLAS_STYLE__*/')||!template.includes('/*__ATLAS_CODE__*/')|| /<\/script/i.test(script)||/<\/style/i.test(css)){
   throw Error('Unexpected embedded atlas contents');
  }
  const html=template.replace('/*__ATLAS_STYLE__*/',()=>css).replace('/*__ATLAS_CODE__*/',()=>script);
  await writeFile(resolve(destination),html,{encoding:'utf8',flag:'wx'});
 }finally{await rm(dir,{recursive:true,force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==3)throw Error('Usage: node build-atlas.mjs NEW-HTML-FILE');
 await buildAtlas(process.argv[2]);
}
