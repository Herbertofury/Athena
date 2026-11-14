// Serial source-parity acceptance. Each script owns a fresh browser and synthetic data.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const cases=['canvas','center_fit','history_keys','layers','tones'].map(name=>({name,script:`scripts/test_foundry_${name}_browser.cjs`}));
function runCases({root=path.resolve(__dirname,'..'),out=path.resolve('browser-results/foundry-parity'),items=cases,timeout=120000}={}){
 fs.mkdirSync(out,{recursive:true});const report={scope:'Synthetic native feature acceptance, not full original fidelity or private-data migration',cases:[],result:'pass'};
 for(const item of items){
  const dir=path.join(out,item.name);fs.mkdirSync(dir,{recursive:true});const started=Date.now();
  const r=spawnSync(process.execPath,[path.resolve(root,item.script)],{cwd:root,env:{...process.env,ATHENA_BROWSER_OUTPUT:dir},encoding:'utf8',timeout,maxBuffer:4*1024*1024});
  fs.writeFileSync(path.join(dir,'stdout.log'),r.stdout||'');fs.writeFileSync(path.join(dir,'stderr.log'),r.stderr||'');
  const passed=!r.error&&r.status===0;
  report.cases.push({name:item.name,script:item.script,result:passed?'pass':'failed',exitCode:r.status,signal:r.signal||null,error:r.error?.code||null,durationMs:Date.now()-started});
  if(!passed)report.result='failed';
  // Preserve the partial aggregate even if an unrelated later case is interrupted.
  fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(report,null,2)+'\n');
 }
 return report;
}
if(require.main===module){const report=runCases();console.log(JSON.stringify(report,null,2));if(report.result!=='pass')process.exitCode=1;}
module.exports={cases,runCases};
