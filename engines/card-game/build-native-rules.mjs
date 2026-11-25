// SPDX-License-Identifier: GPL-3.0-or-later
// Native consumers compile in exactly these generated, importable assets.
// Do not read live GameSync content or spawn Node during a native launch.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildReplay} from './build-replay.mjs';

const dir=await mkdtemp(resolve(tmpdir(),'warden-native-rules-'));
try{
 const bundle=resolve(dir,'rules');
 await buildReplay(bundle);
 const generated=fileURLToPath(new URL('./generated/',import.meta.url));
 const verify=process.argv.includes('--check');
 if(!verify)await mkdir(generated,{recursive:true});
 for(const f of ['engine.mjs','match-state.mjs','card-terms.mjs']){
  const data=await readFile(resolve(bundle,f),'utf8');
  const target=resolve(generated,f);
  if(verify)assert.equal((await readFile(target,'utf8')).replaceAll('\r\n','\n'),data,'Unexpected native game asset: '+f);
  else await writeFile(target,data);
 }
}finally{await rm(dir,{recursive:true,force:true});}
