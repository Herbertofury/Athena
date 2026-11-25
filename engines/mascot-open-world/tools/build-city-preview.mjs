// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8').replaceAll('\r\n','\n');
const code=['../src/gamesync-city-formulas.mjs','../src/city-traversal.mjs','../preview/city-browser.js'].map(read)
 .join('\n').replace(/^import \{[^\n]+\} from '\.\/[a-z-]+\.mjs';\n/gm,'')
 .replace(/^export \{authoredCityGeometry\};\n/gm,'')
 .replace(/^export (?=(?:const|function) )/gm,'');
assert.ok(!/^(?:import|export)\b|<\/script/im.test(code),'Unexpected module or inline script boundary');
const bundle="(()=>{\n'use strict';\n"+code+'\n})();\n';
const hash=createHash('sha256').update(bundle).digest('base64');
const template=read('../preview/city.html');
assert.equal(template.split('__HASH__').length,2);assert.equal(template.split('__CODE__').length,2);
writeFileSync(process.argv[2]??'Athena-Midnight-City-Walk.html',template.replace('__HASH__',hash).replace('__CODE__',()=>bundle));
