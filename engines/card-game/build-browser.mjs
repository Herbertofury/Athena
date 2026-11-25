// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {buildReplay} from './build-replay.mjs';
import {readFile,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

const temp=await mkdtemp(resolve(tmpdir(),'athena-warden-site-'));
try{
 const bundle=resolve(temp,'rules');
 await buildReplay(bundle);
 const inputs=[
  ['match-state.mjs','blankMatchState','blankMinionState'],
  ['card-terms.mjs','CARD_TYPES','KEYWORDS'],
  ['engine.mjs','createEngine'],
  ['replay-entropy.mjs','createReplayEntropy'],
  ['replay-fixture.mjs','CARDS','HEROES','FIXTURE','decks','powerFor'],
  ['warden-match.mjs','cards','newMatch','replayTape','MAX_TAPE_BYTES'],
 ];
 const placed=[];
 for(const [source,...publicSymbols] of inputs){
  const raw=(await readFile(resolve(bundle,source),'utf8')).replaceAll('\r\n','\n');
  const code=raw.replace(/^import \{[^\n]+\} from ["']\.\/[a-z-]+\.mjs["'];\n/gm,'').replace(/^export (?=(?:const|function) )/gm,'');
  assert.doesNotMatch(code,/^(?:export|import)\s/m);
  const exposed=publicSymbols.join(',');
  placed.push(`const {${exposed}}=(()=>{\n${code}\nreturn {${exposed}};\n})();`);
 }
 const client=(await readFile(new URL('./preview/warden-browser.js',import.meta.url),'utf8')).replaceAll('\r\n','\n');
 const script="(()=>{\n'use strict';\n"+placed.join('\n')+'\n'+client+'\n})();\n';
 assert.doesNotMatch(script,/<\/script/i);
 const template=(await readFile(new URL('./preview/warden.html',import.meta.url),'utf8')).replaceAll('\r\n','\n');
 for(const mark of ['__HASH__','__CODE__'])assert.equal(template.split(mark).length,2);
 const digest=createHash('sha256').update(script).digest('base64');
 await writeFile(process.argv[2]??'Athena-Warden-Duel.html',template.replace('__HASH__',digest).replace('__CODE__',()=>script),{flag:'wx'});
}finally{await rm(temp,{recursive:true,force:true});}
