const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),catalog=JSON.parse(fs.readFileSync(path.join(root,'dist/workspaces/engineering/research/catalog.json'))),revision='af594fd2cdd5c00f01178ee353965a54b01b05d7',original='4ed47c5c324231d65b81c3c846bd8fa3f880bee8';
const prefix='https://github.com/Herbertofury/Athena/blob/'+revision+'/engineering/experiments/json-lab/';
test('Every migrated local measurement links to byte-identical immutable Athena evidence with original provenance',()=>{
 const records=[...catalog.results.cohorts,...catalog.results.observations],mirrored=records.filter(x=>x.source_provenance);
 assert.equal(mirrored.length,36);assert.ok(records.every(x=>!x.source_url.includes('Herbertofury/Engineering-Atlas')));
 for(const record of mirrored){const file=record.source_url.slice(prefix.length);assert.ok(['README.md','results-2026-10-26.json'].includes(file));assert.equal(record.source_url,prefix+file);const bytes=fs.readFileSync(path.join(root,'engineering/experiments/json-lab',file)),p=record.source_provenance;
  assert.equal(p.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));assert.equal(p.git_blob_sha,crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex'));assert.equal(p.preserved_revision,revision);assert.equal(p.original_revision,original);assert.equal(p.original_url,'https://github.com/Herbertofury/Engineering-Atlas/blob/'+original+'/experiments/json-lab/'+file);
 }
});
test('Research citation and deterministic-import regressions remain in normal Athena checks',()=>{
 const result=spawnSync('python3',['-m','unittest','discover','-s','engineering/tests','-p','test_research_explorer.py'],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(result.error,undefined,result.error?.message);assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
});
