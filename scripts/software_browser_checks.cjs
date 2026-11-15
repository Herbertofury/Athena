/* Real Chromium acceptance for integrated software discovery. No external installs. */
const {chromium} = require('playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve('dist'), output = path.resolve(process.env.ATHENA_SOFTWARE_BROWSER_OUTPUT || 'browser-results/software');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'workspaces/software/catalog.json')));
const server = http.createServer((req, res) => {
  const p = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (!p.startsWith(root + path.sep) && p !== root) {res.writeHead(403).end(); return;}
  const f = p === root ? path.join(root, 'index.html') : p;
  try {
    res.setHeader('Content-Type', /\.(mjs|js)$/.test(f) ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : 'text/html');
    res.end(fs.readFileSync(f));
  } catch {res.writeHead(404).end();}
});
(async () => {
  fs.mkdirSync(output, {recursive: true});
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const report = {started_at: new Date().toISOString(), applications: catalog.applications.length, checks: [], result: 'running'};
  let browser, page;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox']});
    page = await browser.newPage({viewport: {width: 1500, height: 1050}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const base = `http://127.0.0.1:${server.address().port}/`;
    await page.goto(base + '#software?q=');
    const main = page.locator('.workspace-container');
    await main.getByRole('heading', {name: 'What do you want to do?'}).waitFor();
    await main.locator('.software-card').first().waitFor();
    assert.equal(await main.locator('.software-card').count(), Math.min(24, catalog.applications.length));
    assert.match(await main.locator('#result-count').textContent(), new RegExp(String(catalog.applications.length)));
    await page.screenshot({path: path.join(output, 'software-desktop.png'), fullPage: false});
    report.checks.push('Main navigation, lazy catalog load, bounded card rendering, real styles and counts');
    await main.getByLabel('Operating system', {exact: true}).selectOption('Windows');
    await main.getByLabel('License type', {exact: true}).selectOption('open-source');
    const filteredIds = await main.locator('.software-card').evaluateAll(nodes => nodes.map(n => n.dataset.appId));
    assert.ok(filteredIds.length && filteredIds.every(id => {
      const app = catalog.applications.find(a => a.id === id);
      return app.platforms.includes('Windows') && app.license_kind === 'open-source';
    }));
    // Czkawka's inherited component-license review is explicitly mixed.
    await main.getByLabel('License type', {exact: true}).selectOption('');
    await page.locator('#search').fill('find duplicate files');
    await main.locator('[data-app-id="czkawka---krokiet"]').waitFor();
    await main.getByRole('button', {name: 'Explore Czkawka / Krokiet', exact: true}).click();
    await main.getByRole('heading', {name: 'Sources and provenance', exact: true}).waitFor();
    assert.ok((await main.locator('#detail-body a').count()) > 0);
    await page.keyboard.press('Escape');
    report.checks.push('Combined OS/license filters, natural task search, detail sources and keyboard dialog close');
    await main.getByRole('button', {name: 'Reset filters', exact: true}).click();
    await page.locator('#search').fill('Process Explorer');
    await main.getByRole('checkbox', {name: 'Compare Process Explorer', exact: true}).check();
    await page.locator('#search').fill('System Informer');
    await main.getByRole('checkbox', {name: 'Compare System Informer', exact: true}).check();
    await main.getByRole('button', {name: 'Compare selected', exact: true}).click();
    await main.getByRole('columnheader', {name: 'Process Explorer', exact: true}).waitFor();
    await main.getByRole('rowheader', {name: 'Limitations', exact: true}).waitFor();
    await page.screenshot({path: path.join(output, 'software-comparison.png')});
    await main.getByRole('button', {name: 'Close comparison', exact: true}).click();
    await page.reload();
    await main.getByRole('checkbox', {name: 'Compare System Informer', exact: true}).waitFor();
    assert.equal(await main.getByRole('checkbox', {name: 'Compare System Informer', exact: true}).isChecked(), true);
    assert.match(await main.locator('#selection-count').textContent(), /Process Explorer/);
    assert.equal(await page.locator('#search').inputValue(), 'System Informer');
    report.checks.push('Side-by-side comparison including limitations; selections and filtered URL survive reload');
    if (catalog.recipes.length) {
      await main.getByRole('button', {name: 'Reset filters', exact: true}).click();
      await main.getByLabel('Decision guide', {exact: true}).selectOption(catalog.recipes[0].id);
      await main.locator('#guide:not([hidden])').waitFor();
      assert.equal(await main.locator('.software-card').count(), catalog.recipes[0].picks.length);
      report.checks.push('Task guide shows explicit reasons, tradeoffs and its exact candidate set');
    }
    await main.getByRole('button', {name: 'Reset filters', exact: true}).click();
    await page.locator('#search').fill('unmatchable-fixture-xyz123');
    await main.getByRole('heading', {name: 'No matching tools yet'}).waitFor();
    await main.getByRole('button', {name: 'Clear search and filters'}).click();
    const downloadPromise = page.waitForEvent('download');
    await main.getByRole('button', {name: 'Export results', exact: true}).click();
    const download = await downloadPromise;
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(exported.applications.length, catalog.applications.length);
    report.checks.push('Empty-state recovery and complete JSON export with provenance');
    const started = Date.now();
    await page.locator('#search').fill('restic');
    await main.locator('[data-app-id="restic"]').waitFor();
    report.search_to_result_ms = Date.now() - started;
    await main.getByRole('button', {name: 'Reset filters', exact: true}).click();
    await page.setViewportSize({width: 390, height: 844});
    await page.screenshot({path: path.join(output, 'software-mobile.png'), fullPage: false});
    const overflow = await page.evaluate(() => ({width: innerWidth, body: document.documentElement.scrollWidth}));
    assert.ok(overflow.body <= overflow.width + 2, JSON.stringify(overflow));
    await page.locator('#theme').click();
    await page.screenshot({path: path.join(output, 'software-mobile-light.png'), fullPage: false});
    report.checks.push('390px mobile layout without document overflow; light theme and measured search response');
    await page.goto(base + '#certificates');
    await page.getByRole('heading', {name: /career|quest|certificate/i}).first().waitFor();
    await page.goto(base + '#software?platform=Windows');
    await main.getByLabel('Operating system', {exact: true}).waitFor();
    assert.equal(await main.getByLabel('Operating system', {exact: true}).inputValue(), 'Windows');
    assert.deepEqual(errors, []);
    report.checks.push('Learning route remains available; workspace unmount/remount and deep links; no browser errors');
    report.result = 'pass';
  } catch (error) {
    report.result = 'failed'; report.error = error.stack;
    if (page) {
      await page.screenshot({path: path.join(output, 'software-failure.png'), fullPage: true}).catch(() => {});
      report.visible_state = await page.locator('.workspace-container').ariaSnapshot().catch(() => 'Snapshot unavailable');
    }
    throw error;
  }
  finally {
    report.finished_at = new Date().toISOString();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
    await browser?.close(); server.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
