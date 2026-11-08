/* Run static browser acceptance, then the real pinned Rust runtime. Never deploy. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
function plan(root,temporary,env=process.env){
  const lab=path.join(root,'engineering/apps/atlas-lab'),target=path.join(temporary,'target');
  const output=path.resolve(root,env.ATHENA_BROWSER_OUTPUT||'browser-results');
  const pkg=path.join(temporary,'package');
  const cargoEnv={...env,CARGO_BUILD_JOBS:'2'};
  return [
    {name:'research-media-reproducibility',command:env.PYTHON||'python3',args:['scripts/build_engineering_workspaces.py','--check'],cwd:root,env,timeout:60000},
    {name:'lab-reproducibility',command:env.PYTHON||'python3',args:['scripts/build_lab_workspace.py','--check'],cwd:root,env,timeout:60000},
    {name:'standalone-media-reproducibility',command:env.PYTHON||'python3',args:['engineering/scripts/build_media_lab.py','--check'],cwd:root,env,timeout:60000},
    {name:'static-browser',requires:['research-media-reproducibility','lab-reproducibility','standalone-media-reproducibility'],command:process.execPath,args:['scripts/test_browser.cjs'],cwd:root,env,timeout:180000},
    {name:'foundry-browser',command:process.execPath,args:['scripts/test_foundry_workspace.mjs'],cwd:root,env:{...env,FOUNDRY_EVIDENCE:path.join(output,'foundry')},timeout:240000},
    {name:'workshop-browser',command:process.execPath,args:['scripts/test_workshops_browser.cjs'],cwd:root,env:{...env,ATHENA_WORKSHOPS_BROWSER_OUTPUT:path.join(output,'workshops')},timeout:300000},
    {name:'accessibility-browser',command:process.execPath,args:['scripts/test_accessibility_browser.cjs'],cwd:root,env:{...env,ATHENA_ACCESSIBILITY_BROWSER_OUTPUT:path.join(output,'accessibility')},timeout:300000},
    {name:'rust-tests',command:'cargo',args:['test','--locked','--all-targets','--target-dir',target],cwd:lab,env:cargoEnv,timeout:900000},
    {name:'rust-clippy',command:'cargo',args:['clippy','--locked','--all-targets','--target-dir',target,'--','-D','warnings'],cwd:lab,env:cargoEnv,timeout:900000},
    {name:'rust-build',command:'cargo',args:['build','--locked','--bin','atlas-lab','--target-dir',target],cwd:lab,env:cargoEnv,timeout:900000},
    {name:'verified-package',requires:['research-media-reproducibility','lab-reproducibility','standalone-media-reproducibility'],command:env.PYTHON||'python3',args:['scripts/package_app.py','--profile','integration-candidate','--allowlist','config/runtime-integration-candidate.json','--output',pkg],cwd:root,env,timeout:60000},
    {name:'rust-browser',requires:['rust-build','verified-package'],command:process.execPath,args:['scripts/test_lab_runtime.cjs'],cwd:root,env:{...env,ATHENA_LAB_BINARY:path.join(target,'debug',process.platform==='win32'?'atlas-lab.exe':'atlas-lab'),ATHENA_RUNTIME_PACKAGE:pkg,ATHENA_LAB_TEST_OUTPUT:path.join(output,'lab-runtime'),ATHENA_LAB_HTTP_ONLY:'0'},timeout:240000}
  ];
}
// A failed independent gate must not prevent evidence from other gates. Every
// failure still fails the aggregate, and dependent checks are explicitly skipped.
function executePlan(steps,invoke,onFailure=()=>{}){
  const known=new Set(),states=new Map(),entries=[];
  for(const step of steps){
    if(known.has(step.name)||(step.requires||[]).some(name=>!known.has(name)))throw Error('Invalid acceptance dependency plan: '+step.name);
    known.add(step.name);
  }
  for(const step of steps){
    const blocked=(step.requires||[]).filter(name=>states.get(name)!=='passed');
    if(blocked.length){const entry={name:step.name,status:'skipped',reason:'Prerequisites did not pass: '+blocked.join(', '),exitCode:null,signal:null,error:null,log:null};entries.push(entry);states.set(step.name,'skipped');continue;}
    let result;try{result=invoke(step);}catch(error){result={status:null,signal:null,error};}
    const entry={name:step.name,status:result.status===0&&!result.error?'passed':'failed',exitCode:result.status,signal:result.signal||null,error:result.error?.message||null,log:result.log||null};
    entries.push(entry);states.set(step.name,entry.status);if(entry.status==='failed')onFailure(step,entry);
  }
  return {steps:entries,result:entries.every(entry=>entry.status==='passed')?'pass':'failed'};
}
function run(){
  const root=path.resolve(__dirname,'..'),out=path.resolve(root,process.env.ATHENA_BROWSER_OUTPUT||'browser-results');
  fs.mkdirSync(out,{recursive:true});
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'athena-runtime-acceptance-'));
  const report={kind:'Static browser plus actual pinned Rust/browser acceptance',started:new Date().toISOString(),steps:[],result:'running'};
  try{
    Object.assign(report,executePlan(plan(root,temporary),step=>{
      console.log('Athena acceptance: '+step.name);
      const logPath=path.join(out,step.name+'.log'),fd=fs.openSync(logPath,'w');
      let result;try{result=spawnSync(step.command,step.args,{cwd:step.cwd,env:step.env,stdio:['ignore',fd,fd],timeout:step.timeout,killSignal:'SIGTERM'});}finally{fs.closeSync(fd);}
      return {...result,log:path.basename(logPath)};
    },(_step,entry)=>{if(entry.log)console.error(fs.readFileSync(path.join(out,entry.log),'utf8').slice(-12000));}));
    if(report.result!=='pass'){report.failure=report.steps.filter(step=>step.status!=='passed').map(step=>step.name+': '+step.status).join('; ');process.exitCode=1;}
  }catch(error){report.result='failed';report.failure=error.message;process.exitCode=1;}
  finally{report.finished=new Date().toISOString();fs.writeFileSync(path.join(out,'unified-acceptance.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
}
module.exports={plan,executePlan};
if(require.main===module)run();
