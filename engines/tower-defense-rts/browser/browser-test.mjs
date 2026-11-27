import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';

const types = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/outpost.css': ['outpost.css', 'text/css'],
  '/outpost.mjs': ['outpost.mjs', 'text/javascript'],
  '/outpost.wasm': ['outpost.wasm', 'application/wasm'],
};
const staticFiles = new Map(await Promise.all(Object.entries(types).map(async ([url,[filename,type]]) =>
  [url, { type, bytes: await readFile(new URL('./web/'+filename,import.meta.url)) }])));
const server=createServer((req,res)=>{
  if(req.url==='/favicon.ico'&&req.method==='GET'){res.writeHead(204).end();return;}
  const found=staticFiles.get(req.url);
  if(!found||req.method!=='GET'){res.writeHead(404).end();return;}
  res.writeHead(200,{ 'Content-Type': found.type, 'X-Content-Type-Options':'nosniff' });
  res.end(found.bytes);
});
server.listen(0,'127.0.0.1');
await once(server,'listening');
const origin='http://127.0.0.1:'+server.address().port;

let browser;
try {
 browser=await chromium.launch();
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route('**/*',r=>{
    if(new URL(r.request().url()).origin===origin)return r.continue();
    external.push(r.request().url());return r.abort();
  });
  await page.goto(origin);
  await page.getByText('Plan your opening.').waitFor();
  assert.equal(await page.locator('[data-tile]').count(),45);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
  const order=async(mode,p)=>{
    await page.locator('[data-mode="'+mode+'"]').click();
    await page.locator('[data-tile="'+p+'"]').click();
    assert(await page.locator('#issue').isEnabled());
    await page.locator('#issue').click();
  };
  const advance=async(n)=>{
    for(const [step,count] of [[5,Math.floor(n/5)],[1,n%5]])for(let i=0;i<count;i++){
      const button=page.locator('[data-wait="'+step+'"]');
      if(await button.isDisabled())return;
      await button.click();
    }
  };
  await page.locator('[data-tile="9"]').focus();
  await page.keyboard.press('ArrowRight');
  assert(await page.locator('[data-tile="10"]').evaluate(e=>e===document.activeElement));
  await page.locator('[data-mode="2"]').click();
  await page.locator('[data-tile="17"]').click();
  assert(await page.locator('#issue').isDisabled());
  assert.equal(await page.locator('#ore').textContent(),'12');
  await order(1,19);await order(0,22);await advance(5);
  await page.getByText('Outpost held: +2 ore per turn.').waitFor();
  await order(2,25);await advance(6);await order(2,41);await order(1,6);await advance(40);
  await page.getByText('Victory. The bastion holds.').waitFor();
  await page.getByRole('button',{name:'Restart skirmish'}).click();
  await advance(40);await page.getByText('Base lost. Restart to try another approach.').waitFor();
  // Start the explicit Run variant, then export while its first offer is pending.
  await page.getByText('Mode and checkpoints',{exact:true}).click();
  await page.locator('#mode').selectOption('1');
  await page.getByRole('button',{name:'Start selected mode'}).click();
  await order(1,19);await order(0,22);await advance(5);await order(2,25);await advance(40);
  const offerRegion=page.getByRole('region',{name:'Run reward'});
  assert(await offerRegion.isVisible());
  const orderBefore=await offerRegion.getByRole('button').allTextContents();
  const before=Number(await page.locator('#ore').textContent());
  await page.getByRole('button',{name:'Export code'}).click();
  const code=await page.locator('#checkpoint').inputValue();
  assert.match(code,/^outpost\/replay\/1\|run~431\|/);
  await page.reload();
  await page.getByText('Plan your opening.').waitFor();
  await page.getByText('Mode and checkpoints',{exact:true}).click();
  await page.locator('#checkpoint').fill(code);
  await page.getByRole('button',{name:'Resume code'}).click();
  await page.getByText('Start with the matching mode and seed to restore this code.').waitFor();
  assert.equal(await page.locator('#turn').textContent(),'0');
  await page.locator('#mode').selectOption('1');
  await page.getByRole('button',{name:'Start selected mode'}).click();
  await page.getByRole('button',{name:'Resume code'}).click();
  await page.getByText('Checkpoint restored.').waitFor();
  assert.deepEqual(await offerRegion.getByRole('button').allTextContents(),orderBefore);
  assert(await page.locator('[data-wait="1"]').isDisabled());
  await offerRegion.getByRole('button',{name:'+5 ore',exact:true}).click();
  assert.equal(Number(await page.locator('#ore').textContent()),before+5);
  assert(await offerRegion.isHidden());
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await page.close();
  console.log(width+'px: captured and won, restarted and lost, keyboard order, no overflow, no external requests');
 }
} finally {
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
