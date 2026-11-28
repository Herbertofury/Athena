// Actual isolated Chromium against the extracted native Lab, not the public site.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {gzipSync} from 'node:zlib';
import {chromium} from 'playwright';

const root=path.resolve(process.argv[2]);
const manifest=JSON.parse(readFileSync(path.join(root,'native-package.json'),'utf8'));
const work=mkdtempSync(path.join(tmpdir(),'athena-local-review '));
const origin='http://127.0.0.1:41379';
const program=spawn(path.join(root,manifest.engine),['serve-athena',path.join(work,'journal.sqlite'),path.join(root,'runtime')],
  {cwd:work,stdio:'ignore',windowsHide:true});
const exited=new Promise(resolve=>{program.once('exit',resolve);program.once('error',resolve);});
const marker='synthetic-private-value';
const markerName='private-filename';
const gzip=gzipSync;
const hash=input=>createHash('sha256').update(input).digest('hex');
const data=Object.fromEntries('providers projects chats turns turnRevisions outputSnapshots files knowledgeItems knowledgeSources projectContinuity events checkpoints syncReceipts catalogRuns'.split(' ').map(k=>[k,[]]));
Object.assign(data,{schema:'project-constellation',schemaVersion:7,summary:{events:12001,checkpoints:0},meta:{name:marker}});
data.events=Array.from({length:12000},()=>({})); // deliberately above normal 4 KiB local API cap
const plain=Buffer.from(JSON.stringify(data)), zipped=gzip(plain);
let browser;
try {
  for(let ready=false,i=0;!ready;i++){
    if(i>=100 || program.exitCode!==null || program.pid===undefined) throw Error('Extracted native reviewer did not start');
    try{ready=(await fetch(origin+'/api/runtime')).ok;}catch{}
    if(!ready)await delay(100);
  }
  const endpoint=origin+'/api/migration/constellation/review';
  const headers={'Content-Type':'application/octet-stream','Origin':origin,'X-Atlas-Request':'local-ui'};
  for(const [init,status] of [
    [{method:'POST',body:plain},403],
    [{method:'POST',headers:{...headers,Origin:'https://not-local.invalid'},body:plain},403],
    [{method:'POST',headers:{...headers,'Content-Type':'text/plain'},body:plain},415],
    [{method:'POST',headers:{...headers,'Content-Encoding':'gzip'},body:zipped},415],
    [{method:'POST',headers,body:Buffer.alloc(16*1024*1024+1)},413],
  ]) {
    const response=await fetch(endpoint,init);assert.equal(response.status,status);await response.arrayBuffer();
  }
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});
  const context=await browser.newContext({viewport:{width:390,height:820}});
  const external=[], errors=[];
  await context.route('**/*',route=>{
    if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}
    return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/migration');
  await page.getByRole('link',{name:'Review a saved Constellation export'}).click();
  await page.getByRole('heading',{name:'Review a Constellation export'}).waitFor();
  const choose=(name,buffer)=>page.getByLabel('Constellation backup',{exact:true}).setInputFiles({name,mimeType:'application/octet-stream',buffer});
  const start=()=>page.getByRole('button',{name:'Review backup',exact:true}).click();
  await choose(markerName+'.json',plain);
  await start();
  await page.getByText('Review complete. No data was imported.',{exact:true}).waitFor();
  assert.equal(await page.locator('main').evaluate(e=>e.scrollWidth <= document.documentElement.clientWidth),true);
  await page.getByLabel('Show only missing, capped or incomplete collections',{exact:true}).check();
  await page.getByText('Known omissions: 1',{exact:true}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Chats',exact:true}).count(),0);
  const save=async()=>{
    const [d]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Save count-only receipt',exact:true}).click()]);
    const content=readFileSync(await d.path(),'utf8');
    assert(!content.includes(marker)&&!content.includes(markerName));
    return JSON.parse(content);
  };
  let report=await save();
  assert.equal(report.exact_input_sha256,undefined);assert.equal(report.selected_gzip_sha256,undefined);
  assert.equal(report.slices.find(x=>x.kind==='events').retained,12000);
  await page.setViewportSize({width:1440,height:900});
  await choose(markerName+'.gz',zipped);
  await page.getByLabel('Include SHA-256 fingerprints',{exact:true}).check();
  await start();
  await page.getByText('Review complete. No data was imported.',{exact:true}).waitFor();
  report=await save();
  assert.equal(report.exact_input_sha256,hash(plain));assert.equal(report.selected_gzip_sha256,hash(zipped));
  await choose(markerName+'.gz',Buffer.concat([zipped,zipped]));await start();
  await page.getByText('Gzip export contains trailing bytes or multiple members',{exact:true}).waitFor();
  assert(!(await page.getByRole('button',{name:'Save count-only receipt',exact:true}).isVisible()));
  assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
  console.log('PASS actual extracted native browser: local navigation, precise bounded JSON/gzip, refused origins, private receipt, filtering, compact layout, and no outside requests.');
} finally {
  await browser?.close();
  program.kill();await exited;
  rmSync(work,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
