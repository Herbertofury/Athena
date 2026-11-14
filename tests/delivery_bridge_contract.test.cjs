'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
test('all reviewed native package paths including Delivery remain explicitly admitted by the bridge',()=>{
 const code=`import ast,json,pathlib\nr=pathlib.Path('.')\nt=ast.parse((r/'native/foundry/bridge.py').read_text())\na=next(n for n in t.body if isinstance(n,ast.Assign) and any(isinstance(x,ast.Name) and x.id=='STATIC_PATHS' for x in n.targets))\npaths=set(ast.literal_eval(a.value.args[0]))\nreviewed={x['path'] for x in json.loads((r/'config/runtime-public-preview.json').read_text())['files']}\nassert reviewed <= paths, sorted(reviewed-paths)\nassert 'workshops/delivery/learner-pack.zip' in paths\nassert 'private.sqlite' not in paths and 'workshops/delivery/arbitrary.zip' not in paths\n`;
 const r=spawnSync(process.env.ATHENA_FOUNDRY_PYTHON||(process.platform==='win32'?'python':'python3'),['-c',code],{encoding:'utf8'});assert.equal(r.status,0,r.stderr||r.stdout);
});
