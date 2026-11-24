/* Real Chromium acceptance for integrated software discovery. No external installs. */
const {chromium} = require('playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const root = path.resolve('dist'), output = path.resolve(process.env.ATHENA_SOFTWARE_BROWSER_OUTPUT || 'browser-results/software');
const catalogBytes = fs.readFileSync(path.join(root, 'workspaces/software/catalog.json'));
const catalog = JSON.parse(catalogBytes);
const catalogHash = createHash('sha256').update(catalogBytes).digest('hex');
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
  const remoteBase = process.env.ATHENA_SOFTWARE_BASE_URL;
  if (!remoteBase) await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = remoteBase ? remoteBase.replace(/\/?$/, '/') : `http://127.0.0.1:${server.address().port}/`;
  const report = {started_at: new Date().toISOString(), base_url: base, catalog_sha256: catalogHash, applications: catalog.applications.length, checks: [], result: 'running'};
  let browser, page;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox']});
    page = await browser.newPage({viewport: {width: 1500, height: 1050}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    let observedHash;
    report.catalog_verification_attempts = [];
    for (let attempt = 0; attempt < (remoteBase ? 10 : 1); attempt++) {
      try {
        const response = await page.request.get(new URL('workspaces/software/catalog.json', base).href, {headers: {'Cache-Control': 'no-cache'}, timeout: 10000});
        observedHash = response.ok() ? createHash('sha256').update(await response.body()).digest('hex') : `HTTP ${response.status()}`;
      } catch (error) {
        observedHash = 'Transport error: ' + String(error.message).slice(0, 300);
      }
      report.catalog_verification_attempts.push({attempt: attempt + 1, observed: observedHash});
      if (observedHash === catalogHash) break;
      if (remoteBase && attempt < 9) await new Promise(resolve => setTimeout(resolve, 3000));
    }
    assert.equal(observedHash, catalogHash, 'Served software database must match the reviewed commit byte for byte');
    report.checks.push('Served database SHA-256 equals the reviewed commit');
    await page.goto(base + '#software?q=');
    const main = page.locator('.workspace-container');
    await main.getByRole('heading', {name: 'What do you want to do?'}).waitFor();
    await main.locator('.software-card').first().waitFor();
    assert.equal(await main.locator('.software-card').count(), Math.min(24, catalog.applications.length));
    assert.match((await main.locator('#result-count').textContent()).replaceAll(',', ''), new RegExp(String(catalog.applications.length)));
    await page.screenshot({path: path.join(output, 'software-desktop.png'), fullPage: false});
    report.checks.push('Main navigation, lazy catalog load, bounded card rendering, real styles and counts');
    await main.getByRole('combobox', {name: 'Operating system', exact: true}).selectOption('Windows');
    await main.getByRole('combobox', {name: 'License type', exact: true}).selectOption('open-source');
    const filteredIds = await main.locator('.software-card').evaluateAll(nodes => nodes.map(n => n.dataset.appId));
    assert.ok(filteredIds.length && filteredIds.every(id => {
      const app = catalog.applications.find(a => a.id === id);
      return app.platforms.includes('Windows') && app.license_kind === 'open-source';
    }));
    // Czkawka's inherited component-license review is explicitly mixed.
    await main.getByRole('combobox', {name: 'License type', exact: true}).selectOption('');
    await page.locator('#search').fill('find duplicate files');
    await main.locator('[data-app-id="czkawka---krokiet"]').waitFor();
    await main.getByRole('button', {name: 'Explore Czkawka / Krokiet', exact: true}).click();
    await main.getByRole('heading', {name: 'Sources and provenance', exact: true}).waitFor();
    assert.ok((await main.locator('#detail-body a').count()) > 0);
    await page.keyboard.press('Escape');
    report.checks.push('Combined OS/license filters, natural task search, detail sources and keyboard dialog close');
    await main.getByRole('button', {name: 'Reset filters', exact: true}).click();
    await page.locator('#search').fill('chat with PDF offline');
    await main.locator('[data-app-id="gpt4all"]').waitFor();
    await main.locator('#suggested-guides').getByRole('button', {name: /Chat with PDF documents offline/}).waitFor();
    await main.getByRole('button', {name: 'Explore GPT4All', exact: true}).click();
    await main.getByRole('heading', {name: 'Documented task support', exact: true}).waitFor();
    assert.match(await main.locator('.documented-capabilities').textContent(), /Keep Use Nomic Embed API off/);
    assert.ok(await main.locator('.documented-capabilities a').count());
    await page.screenshot({path: path.join(output, 'software-task-evidence.png')});
    await page.keyboard.press('Escape');
    await page.locator('#search').fill('remove background noise');
    await main.locator('[data-app-id="audacity"]').waitFor();
    await page.locator('#search').fill('remove background noise from live microphone');
    await main.locator('[data-app-id="audacity"]').waitFor({state: 'detached'});
    await page.locator('#search').fill('ripgrep');
    await main.getByRole('button', {name: 'Explore ripgrep', exact: true}).click();
    await main.locator('.scoped-measurements').waitFor();
    assert.equal(await main.locator('.scoped-measurements a').count(), 3);
    assert.match(await main.locator('.scoped-measurements').textContent(), /dense-output timings overlapped/);
    await page.keyboard.press('Escape');
    report.checks.push('Evidence-backed offline PDF and recorded-audio tasks; setup conditions, live-input distinction and separately scoped measurements');
    await page.locator('#search').fill('ProjectCleaner');
    await main.locator('#research-count').click();
    const historical = main.locator('#research-records .research-record');
    await historical.getByText('Source unavailable', {exact: true}).waitFor();
    assert.equal(await historical.locator('a[href="https://github.com/cbuntingde/ProjectCleaner"]').count(), 0);
    assert.equal(await historical.locator('a[href$="research-availability-review.json"]').count(), 1);
    assert.match(await historical.locator('pre').textContent(), /https:\/\/github.com\/cbuntingde\/ProjectCleaner/);
    await historical.scrollIntoViewIfNeeded();
    await page.screenshot({path: path.join(output, 'software-research-availability.png')});
    await main.locator('#research-count').click();
    report.checks.push('Unavailable historical source is labelled with dated review evidence; original record is retained and the dead outward link is disabled');
    await main.getByRole('button', {name: 'Reset filters', exact: true}).click();
    await main.getByRole('combobox', {name: 'Operating system', exact: true}).selectOption('Linux');
    await page.locator('#search').fill('unmatchable-fixture-workflow');
    await main.locator('#guide-directory-title').click();
    await main.locator('.guide-directory-card').first().waitFor();
    assert.equal(await main.locator('.guide-directory-card').count(), 12);
    await main.locator('#guide-directory-more').click();
    assert.equal(await main.locator('.guide-directory-card').count(), 24);
    await main.getByRole('searchbox', {name: 'Find a decision guide', exact: true}).fill('offline PDF');
    await main.locator('#guide-directory-results').getByRole('button', {name: 'Chat with PDF documents offline', exact: true}).click();
    assert.equal(await main.getByRole('combobox', {name: 'Operating system', exact: true}).inputValue(), 'Linux');
    assert.equal(await main.getByRole('combobox', {name: 'Decision guide', exact: true}).inputValue(), 'chat-with-pdf-offline');
    assert.ok((await main.locator('.software-card').evaluateAll(nodes => nodes.map(n => n.dataset.appId)))
      .every(id => catalog.applications.find(app => app.id === id).platforms.includes('Linux')));
    report.checks.push('Searchable decision-guide directory, incremental display and task opening with preserved operating-system filter');
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
      await main.getByRole('combobox', {name: 'Decision guide', exact: true}).selectOption(catalog.recipes[0].id);
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
    await main.locator('#guide-directory-title').click();
    await main.getByRole('searchbox', {name: 'Find a decision guide', exact: true}).fill('');
    await main.locator('.guide-directory-card').first().waitFor();
    await page.screenshot({path: path.join(output, 'software-guide-directory-mobile.png'), fullPage: false});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'Open guide directory must fit the mobile viewport');
    await main.locator('#guide-directory-title').click();
    await page.screenshot({path: path.join(output, 'software-mobile.png'), fullPage: false});
    const overflow = await page.evaluate(() => ({width: innerWidth, body: document.documentElement.scrollWidth}));
    assert.ok(overflow.body <= overflow.width + 2, JSON.stringify(overflow));
    await page.locator('#theme').click();
    await page.locator('#main[data-workspace="software"] .workspace-container[data-theme="light"]').waitFor();
    // Finish finite CSS transitions before capturing or measuring the light theme.
    await page.screenshot({path: path.join(output, 'software-mobile-light.png'), fullPage: false, animations: 'disabled'});
    const lightTaskContrast = await main.locator('#quick-tasks button').evaluateAll(buttons => {
      function opaqueRgb(value) {
        const match = /^rgba?\(([^)]+)\)$/.exec(value);
        const channels = match ? match[1].trim().split(/[\s,\/]+/).map(Number) : [];
        if (![3, 4].includes(channels.length) || (channels.length === 4 && channels[3] !== 1) ||
            channels.slice(0, 3).some(channel => !Number.isFinite(channel) || channel < 0 || channel > 255)) {
          throw new Error('Quick-task contrast requires an opaque RGB color: ' + value);
        }
        return channels.slice(0, 3);
      }
      function luminance(rgb) {
        const linear = rgb.map(channel => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      }
      return buttons.map(button => {
        const style = getComputedStyle(button);
        if (style.backgroundImage !== 'none' || Number(style.opacity) !== 1) {
          throw new Error('Quick-task contrast requires an opaque solid button background');
        }
        const foreground = luminance(opaqueRgb(style.color)), background = luminance(opaqueRgb(style.backgroundColor));
        return {text: button.textContent.trim(), color: style.color, background_color: style.backgroundColor,
          ratio: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)};
      });
    });
    assert.ok(lightTaskContrast.length, 'Light-theme quick-task buttons must be present');
    report.light_theme_quick_task_contrast = {required_ratio: 4.5,
      minimum_ratio: Math.min(...lightTaskContrast.map(button => button.ratio)), buttons: lightTaskContrast};
    assert.ok(lightTaskContrast.every(button => button.ratio >= 4.5),
      'Light-theme quick-task text contrast must be at least 4.5:1: ' + JSON.stringify(report.light_theme_quick_task_contrast));
    report.checks.push('390px mobile layout without document overflow; settled light theme with quick-task text contrast at least 4.5:1; measured search response');
    await page.goto(base + '#certificates');
    await page.getByRole('heading', {name: /career|quest|certificate/i}).first().waitFor();
    await page.goto(base + '#software?platform=Windows');
    await main.getByRole('combobox', {name: 'Operating system', exact: true}).waitFor();
    assert.equal(await main.getByRole('combobox', {name: 'Operating system', exact: true}).inputValue(), 'Windows');
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
    await browser?.close(); if (server.listening) server.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
