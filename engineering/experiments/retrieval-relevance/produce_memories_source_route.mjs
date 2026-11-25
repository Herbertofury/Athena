// Produce a route receipt from the actual reviewed Memories matcher and catalog.
// Accept only the exact previously verified public source bytes. No network.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {join,resolve} from 'node:path';
const base=resolve(process.argv[2]??'');
const fixturePath=new URL('./source-routing-fixture.json',import.meta.url);
const raw=readFileSync(fixturePath), fixture=JSON.parse(raw.toString('utf8'));
if(process.argv.length!==3)throw Error('Supply the exact reviewed Memories checkout path.');
const pins={
 'docs/memory-search.js':'788f4c8c9a3eef552b92c6435b1dcd8b69259680',
 'docs/data.json':'b1cf2ee0deb5329e1530c55a7ee448219674ec12',
};
const bytes={};
for(const [name,sha] of Object.entries(pins)){
 const data=readFileSync(join(base,name));
 const actual=createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
 if(actual!==sha)throw Error('Wrong source bytes for '+name);
 bytes[name]=data;
}
const module={exports:{}};
runInNewContext(bytes['docs/memory-search.js'].toString('utf8'),{module,URL},{filename:'pinned-memory-search.js',timeout:1000});
const api=module.exports;
const catalog=JSON.parse(bytes['docs/data.json'].toString('utf8')).items;
const cases=fixture.cases.map(({id,query})=>{
 const selector=api.lookup(query);
 const mode=selector.kind==='exact-x-post'?'exact':'text';
 const rows=catalog.filter(selector.match).map(r=>({id:r.id,title:r.name,source:r.url}));
 return {id,mode,rows};
});
console.log(JSON.stringify({schema:'athena-source-route-receipt-v1',fixture_sha256:createHash('sha256').update(raw.toString('utf8').replaceAll('\r\n','\n')).digest('hex'),
 candidate:'Memories shared offline matcher',source_commit:fixture.source_commit,cases},null,2));
