// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8').replaceAll('\r\n','\n');
// Explicit dependency order and fixed source paths. No downloaded input, dynamic imports or eval.
const sources=['gamesync-spawn-formulas','gamesync-pickup-formulas','gamesync-movement-formulas','gamesync-upgrade-formulas','upgrade-draft','gamesync-combat-formulas','arena-formats','roaming-points','legacy-survivor-run','rift-session','rift-director','rift-expedition','arena-replay'];
const code=sources.map(name=>{
 const source=read('../src/'+name+'.mjs');
 const exposed=[...source.matchAll(/^export (?:const|(?:async )?function) ([\w$]+)/gm)].map(m=>m[1]);
 assert.ok(exposed.length>0);
 const body=source.replace(/^import \{[^\n]+\} from '\.\/[a-z-]+\.mjs';\n/gm,'')
 .replace(/^export (?=(?:const|(?:async )?function) )/gm,'');
 assert.ok(!/^(?:import|export)\b/m.test(body),'Unexpected module boundary');
 return 'const {'+exposed.join(',')+'}=(()=>{\n'+body+'\nreturn {'+exposed.join(',')+'};\n})();';
}).join('\n');
const bundle="(()=>{\n'use strict';\n"+code+'\n'+read('../preview/arena-browser.js')+'\n})();\n';
assert.ok(!/<\/script/i.test(bundle),'Unsafe script end marker');
const hash=createHash('sha256').update(bundle).digest('base64');
const template=read('../preview/arena-template.html');
assert.equal(template.split('__SCRIPT_HASH__').length,2);
assert.equal(template.split('__BUNDLE__').length,2);
const html=template.replace('__SCRIPT_HASH__',hash).replace('__BUNDLE__',()=>bundle);
writeFileSync(process.argv[2]??'Athena-Survivor-Arena.html',html);
