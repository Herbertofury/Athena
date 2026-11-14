'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
test('all preserved Explorer selections survive the actual native Research parser', async () => {
  const root = path.join(__dirname, '..');
  const {parseState} = await import(pathToFileURL(path.join(root, 'dist/workspaces/engineering/research/explorer-core.mjs')));
  const rows = JSON.parse(fs.readFileSync(path.join(root, 'migration/engineering-atlas/metadata-2026-11-14/source-link-inventory.json'), 'utf8'));
  let checked = 0;
  for (const row of rows) {
    if (!row.original.startsWith('https://herbertofury.github.io/Engineering-Atlas/explorer/')) continue;
    const source = new URL(row.original), target = new URL(row.preserved_or_native_destination);
    assert.equal(target.hash.split('?')[0], '#research');
    assert.deepEqual(parseState(target.hash.split('?')[1] || ''), parseState(source.search), row.original);
    checked++;
  }
  assert.equal(checked, 41);
});
