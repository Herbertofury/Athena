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
    {name:'card-workspace-reproducibility',command:env.PYTHON||'python3',args:['scripts/build_card_workspace.py','--check'],cwd:root,env,timeout:60000},
    {name:'research-media-reproducibility',command:env.PYTHON||'python3',args:['scripts/build_engineering_workspaces.py','--check'],cwd:root,env,timeout:60000},
    {name:'lab-reproducibility',command:env.PYTHON||'python3',args:['scripts/build_lab_workspace.py','--check'],cwd:root,env,timeout:60000},
    {name:'standalone-media-reproducibility',command:env.PYTHON||'python3',args:['engineering/scripts/build_media_lab.py','--check'],cwd:root,env,timeout:60000},
    {name:'static-browser',command:process.execPath,args:['scripts/test_browser.cjs'],cwd:root,env,timeout:180000},
    {name:'workshop-browser',command:process.execPath,args:['scripts/test_workshops_browser.cjs'],cwd:root,env:{...env,ATHENA_WORKSHOPS_BROWSER_OUTPUT:path.join(output,'workshops')},timeout:300000},
    {name:'accessibility-browser',command:process.execPath,args:['scripts/test_accessibility_browser.cjs'],cwd:root,env:{...env,ATHENA_ACCESSIBILITY_BROWSER_OUTPUT:path.join(output,'accessibility')},timeout:300000},
    {name:'rust-tests',command:'cargo',args:['test','--locked','--all-targets','--target-dir',target],cwd:lab,env:cargoEnv,timeout:900000},
    {name:'rust-clippy',command:'cargo',args:['clippy','--locked','--all-targets','--target-dir',target,'--','-D','warnings'],cwd:lab,env:cargoEnv,timeout:900000},
    {name:'rust-build',command:'cargo',args:['build','--locked','--bin','atlas-lab','--target-dir',target],cwd:lab,env:cargoEnv,timeout:900000},
    {name:'verified-package',command:env.PYTHON||'python3',args:['scripts/package_app.py','--profile','public-preview','--allowlist','config/runtime-public-preview.json','--output',pkg],cwd:root,env,timeout:60000},
    {name:'rust-browser',command:process.execPath,args:['scripts/test_lab_runtime.cjs'],cwd:root,env:{...env,ATHENA_LAB_BINARY:path.join(target,'debug',process.platform==='win32'?'atlas-lab.exe':'atlas-lab'),ATHENA_RUNTIME_PACKAGE:pkg,ATHENA_LAB_TEST_OUTPUT:path.join(output,'lab-runtime'),ATHENA_LAB_HTTP_ONLY:'0'},timeout:240000}
  ];
}
function run(){
  const root=path.resolve(__dirname,'..'),out=path.resolve(root,process.env.ATHENA_BROWSER_OUTPUT||'browser-results');
  fs.mkdirSync(out,{recursive:true});
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'athena-runtime-acceptance-'));
  const report={kind:'Static browser plus actual pinned Rust/browser acceptance',started:new Date().toISOString(),steps:[],result:'running'};
  try{
    for(const step of plan(root,temporary)){
      console.log('Athena acceptance: '+step.name);
      const logPath=path.join(out,step.name+'.log'),fd=fs.openSync(logPath,'w');
      let result;try{result=spawnSync(step.command,step.args,{cwd:step.cwd,env:step.env,stdio:['ignore',fd,fd],timeout:step.timeout,killSignal:'SIGTERM'});}finally{fs.closeSync(fd);}
      const entry={name:step.name,exitCode:result.status,signal:result.signal,error:result.error?.message||null,log:path.basename(logPath)};report.steps.push(entry);
      if(result.status!==0||result.error){console.error(fs.readFileSync(logPath,'utf8').slice(-12000));throw Error(step.name+' did not pass; see '+logPath);}
    }
    report.result='pass';
  }catch(error){report.result='failed';report.failure=error.message;process.exitCode=1;}
  finally{report.finished=new Date().toISOString();fs.writeFileSync(path.join(out,'unified-acceptance.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
}
module.exports={plan};
if(require.main===module)run();
