import {pathToFileURL} from 'node:url';
import fs from 'node:fs';import path from 'node:path';
if(process.argv.length!==4)throw Error('Usage: node build.mjs STAGE TRUSTED_ESBUILD_INSTALL');
const root=path.resolve(process.argv[2]),tools=path.resolve(process.argv[3]);
if(JSON.parse(fs.readFileSync(path.join(tools,'node_modules/esbuild/package.json'))).version!=='0.28.2')throw Error('Expected esbuild 0.28.2');
const {build}=await import(pathToFileURL(path.join(tools,'node_modules/esbuild/lib/main.js')));
for(const version of ['1.7.3','1.7.4']){
 const define=Object.fromEntries(['SUBTITLES','ALT_AUDIO','EME_DRM','CMCD','CONTENT_STEERING','VARIABLE_SUBSTITUTION','M2TS_ADVANCED_CODECS','MEDIA_CAPABILITIES','INTERSTITIALS','IFRAMES'].map(x=>['__USE_'+x+'__','true']));define.__VERSION__=JSON.stringify(version);
 const result=await build({absWorkingDir:root,define,entryPoints:[path.join(root,'packages','source-'+version,'src/loader/m3u8-parser.ts')],bundle:true,platform:'node',format:'esm',nodePaths:[path.join(root,'packages/helpers/node_modules')],outfile:path.join(root,'parser-'+version+'.mjs'),metafile:true,logLevel:'silent'});
 fs.writeFileSync(path.join(root,'parser-'+version+'-metafile.json'),JSON.stringify(result.metafile,null,2));
}
