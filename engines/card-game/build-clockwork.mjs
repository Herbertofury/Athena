// SPDX-License-Identifier: GPL-3.0-or-later
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
const load=async p=>(await readFile(new URL(p,import.meta.url),'utf8')).replaceAll('\r\n','\n');
const source=(await load('./src/clockwork-encounter.mjs')).replace(/^export (?=const |function |async function )/gm,'');
const code="(()=>{\n'use strict';\n"+source+'\n'+await load('./preview/clockwork-browser.js')+'\n})();\n';
if(/<\/script|^(?:import |export )/im.test(code))throw Error('Unexpected code in offline page.');
const html=await load('./preview/clockwork.html');
for(const k of ['__HASH__','__CODE__'])if(html.split(k).length!==2)throw Error('Unexpected clockwork template.');
await writeFile(process.argv[2]??'Athena-Clockwork-Sentinel.html',
 html.replace('__HASH__',createHash('sha256').update(code).digest('base64')).replace('__CODE__',()=>code),{flag:'wx'});
