import {writeFileSync} from 'node:fs';
import {createArchiveSelection,loadSavedArchive} from '../../apps/atlas-lab/ui/archive-view.mjs';
const selection=createArchiveSelection((id,options)=>loadSavedArchive('upstream',id,{...options,fetchImpl:(path,opts)=>fetch('http://127.0.0.1:41379'+path,opts)}));
await selection.load('serde-json');const good=selection.last;let rejected=false;
try{await selection.load('hls');}catch{rejected=true;}
if(!rejected||selection.last!==good||selection.pending)throw Error('Failed upstream read did not retain prior verified data');
writeFileSync(process.argv[2],JSON.stringify({scope:'Actual reader over owned HTTP; retained public source data; not browser UI',complete:true,failed_source:'hls',retained_source:good.id,kind:good.kind,generation:good.generation,sha256:good.hash,bytes:good.bytes.byteLength},null,2)+'\n');
