import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadSavedArchive} from '../../apps/atlas-lab/ui/archive-view.mjs';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8')),results=[];
for(const expected of rows){
 const record=await loadSavedArchive(expected.kind,expected.id,{fetchImpl:(path,options)=>fetch('http://127.0.0.1:41379'+path,options)});
 const actual={kind:record.kind,id:record.id,generation:record.generation,bytes:record.bytes.byteLength,sha256:createHash('sha256').update(record.bytes).digest('hex')};
 if(Object.keys(actual).some(key=>actual[key]!==expected[key]))throw Error('Exact archive parity failed');
 results.push(actual);
}
writeFileSync(process.argv[3],JSON.stringify({scope:'Actual JavaScript verifier against owned loopback server; not browser interaction',complete:true,records:results},null,2)+'\n');
