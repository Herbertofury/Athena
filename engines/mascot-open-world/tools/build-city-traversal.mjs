// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
const cityPin='4d004092a3dd8d164869457b5cebab0ef9109dabb118d553bd0f3765b2fdc628';
const corePin='f6c4f182ec271a1aefe2decea72cd9da0d120cfa8e649126c04e55d15a4b038e';
const read=(file,pin)=>{
 const bytes=readFileSync(new URL(file,import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),pin);
 return bytes.toString('utf8');
};
const city=read('../upstream/gamesync/game-openworld.js',cityPin);
const core=read('../../shared-game-runtime/upstream/gamesync/game-core.js',corePin);
const slice=(s,re)=>{const hit=s.match(re);assert.ok(hit,re);return hit[0];};
const constant=name=>slice(city,new RegExp('  const '+name+' = Object\\.freeze\\(\\[[\\s\\S]+?(?:\\n  )?\\]\\);'));
const fn=(name,width=4)=>slice(city,new RegExp('^'+' '.repeat(width)+'function '+name+'\\([^\\n]*\\)[\\s\\S]+?\\n'+' '.repeat(width)+'}', 'm'));
const field=['currentInterior','sceneBounds','nearInteriorDoor','nearInteriorExit','distance','pointInRect','roofById','roofContainsPoint','roofHeightUnits','roofHeightPx','currentRoofBounds','entitySupportRoofId','entityAbsoluteZ','clearRoofState','attachEntityToRoof','detachEntityFromRoof','enterInterior','exitInterior','moveWithBuildingCollision','updateRoofTraversalAfterMove'];
const data=['BUILDINGS','DISTRICTS','INTERIORS'].map(constant).join('\n\n');
const generated=`// SPDX-License-Identifier: GPL-3.0-or-later
// Original GameSync pinned 2D city facts and exact movement stages.
// City SHA-256 ${cityPin}, shared core ${corePin}.
${slice(city,/  const WORLD_W = \d+;\n  const WORLD_H = \d+;/)}
${slice(city,/  const BRAND = Object\.freeze\(\{[\s\S]+?\n  \}\);/)}
${slice(core,/  const clamp = [^\n]+/)}
${fn('s',2)}
${data}

export function authoredCityGeometry(){
 return structuredClone({width:WORLD_W,height:WORLD_H,buildings:BUILDINGS,districts:DISTRICTS,interiors:INTERIORS});
}

export function bindOriginalTraversal(state,setMessage){
${field.map(k=>fn(k)).join('\n\n')}
 return {currentInterior,sceneBounds,nearInteriorDoor,nearInteriorExit,pointInRect,entityAbsoluteZ,
   moveWithBuildingCollision,updateRoofTraversalAfterMove,enterInterior,exitInterior,
   district:(x,y)=>DISTRICTS.find(entry=>pointInRect(x,y,entry))?.name??null};
}
`;
const target=new URL('../src/gamesync-city-formulas.mjs',import.meta.url);
if(process.argv.includes('--check'))assert.equal(readFileSync(target,'utf8').replaceAll('\r\n','\n'),generated);
else writeFileSync(target,generated);
