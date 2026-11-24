const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const catalog = JSON.parse(fs.readFileSync('dist/workspaces/software/catalog.json'));
const model = import('../src/software/model.mjs');
test('software task search finds original and newly researched applications without mutating catalog', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const before = JSON.stringify(catalog), index = indexCatalog(catalog);
  const find = q => queryCatalog(index, {...parseState(), q}, catalog);
  assert.equal(find('Process Explorer')[0].id, 'process-explorer');
  assert.ok(find('find duplicate files').some(a => /czkawka/i.test(a.name)));
  assert.ok(find('back up').some(a => a.id === 'restic'));
  assert.deepEqual(find('unmatchable-fixture-xyz123'), []);
  assert.equal(JSON.stringify(catalog), before);
});
test('filters combine and explicit empty URLs reset saved filters', async () => {
  const {indexCatalog, queryCatalog, parseState, encodeState} = await model;
  const state = parseState('software?platform=Windows&license=open-source');
  const results = queryCatalog(indexCatalog(catalog), state, catalog);
  assert.ok(results.length);
  assert.ok(results.every(a => a.platforms.includes('Windows') && a.license_kind === 'open-source'));
  assert.equal(parseState('software?q=', {q: 'old', platform: 'Linux'}).platform, '');
  assert.equal(parseState('software', {platform: 'Linux'}).platform, 'Linux');
  const encoded = encodeState({...state, q: 'C++ & “GIS”'});
  assert.equal(parseState('software?' + encoded).q, 'C++ & “GIS”');
});
test('task guide ordering follows explicit recommendations and respects platform constraints', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog);
  for (const recipe of catalog.recipes) {
    const s = {...parseState(), task: recipe.id};
    assert.deepEqual(queryCatalog(index, s, catalog).map(a => a.id), recipe.picks.map(p => p.app_id));
    assert.ok(queryCatalog(index, {...s, platform: 'Windows'}, catalog).every(a => a.platforms.includes('Windows')));
  }
});
test('comparison retains limits, maintenance uncertainty and source-review distinction', async () => {
  const {comparisonRows, safeLink} = await model;
  const apps = catalog.applications.slice(0, 2), rows = comparisonRows(apps);
  assert.ok(rows.some(r => r.label === 'Limitations' && r.values.every(Boolean)));
  assert.ok(rows.some(r => r.label === 'Maintenance'));
  assert.ok(rows.every(r => r.values.length === 2));
  assert.equal(safeLink('javascript:alert(1)'), null);
  assert.equal(safeLink('https://user:pass@example.org'), null);
  assert.equal(safeLink('https://example.org/docs'), 'https://example.org/docs');
});
test('new workspace is connected to main navigation and reviewed public runtime', () => {
  assert.match(fs.readFileSync('dist/index.html', 'utf8'), /href="#software" data-nav="software"/);
  assert.match(fs.readFileSync('dist/app.js', 'utf8'), /import\('\.\/workspaces\/software\/index.mjs'\)/);
  const allow = JSON.parse(fs.readFileSync('config/runtime-public-preview.json'));
  for (const name of ['catalog.json', 'index.mjs', 'model.mjs', 'style.css']) {
    const file = 'workspaces/software/' + name;
    const actual = require('node:crypto').createHash('sha256').update(fs.readFileSync('dist/' + file)).digest('hex');
    assert.equal(allow.files.find(x => x.path === file)?.sha256, actual, file);
  }
});
