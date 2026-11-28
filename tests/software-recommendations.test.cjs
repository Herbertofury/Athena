const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const getModule=()=>import('../src/software/recommendations.mjs');
test('recommendations, metrics and unknown values remain distinct',async()=>{
 const {chooseRepositories}=await getModule();
 const rows=[
   {name:'Alpha',category:'Auth',recommendation:'Start here',stars:18,downloads:null,reviews:null},
   {name:'Beta',category:'Auth',recommendation:'Reference',stars:30,downloads:1,reviews:3.5},
   {name:'Gamma',category:'Tools',recommendation:'Review only',stars:100,downloads:0,reviews:null}
 ];
 for(const [sort,expected] of [['recommendations',['Alpha','Beta','Gamma']],['stars',['Gamma','Beta','Alpha']],['downloads',['Beta','Gamma','Alpha']],['reviews',['Beta','Alpha','Gamma']]]){
   assert.deepEqual(chooseRepositories(rows,'','',sort).map(r=>r.name),expected);
 }
 assert.deepEqual(chooseRepositories(rows,'auth','Auth','stars').map(r=>r.name),['Beta','Alpha']);
 assert.deepEqual(rows.map(r=>r.name),['Alpha','Beta','Gamma'],'sorting must not alter captured source records');
});
test('exact recommendation seeds use dated source metrics, and no release means unknown downloads',async()=>{
 const {repositoryRows}=await getModule();
 const d=JSON.parse(fs.readFileSync('src/software/repository-recommendations.json','utf8'));
 const rows=repositoryRows(d);
 assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
 for(const row of rows) {
   assert.match(row.observed,/^\d{4}-\d\d-\d\d$/);
   assert.match(row.repositoryEvidence,/^https:\/\/api.github.com\/repos\//);
   if(row.downloads!==null)assert.ok(row.downloadEvidence&&row.downloadScope);
 }
 const find=id=>rows.find(r=>r.id===id);
 assert.equal(find('ripienaar--free-for-dev').downloads,null);
 assert.equal(find('elementalsouls--claude-bughunter').recommendation,'Review only');
 assert.equal(find('mjmirza--app-store-compliance').links.length,2);
 assert.deepEqual(repositoryRows({schema_version:1,repositories:[{name:'a',id:'a',category:'b',repository:'https://github.com.evil.invalid/a/b'}]}),[]);
});
