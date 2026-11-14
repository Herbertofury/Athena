'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const cwd = path.resolve(__dirname, '..');
function python(args) {
  const result = spawnSync('python3', args, {cwd, encoding:'utf8', timeout:30000,
    env:{...process.env, PYTHONDONTWRITEBYTECODE:'1'}});
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}
test('Research link containment regressions run in normal aggregate checks', () => {
  python(['tests/research_link_test.py']);
});
test('Complete Research structure check accepts only the reviewed local scopes', () => {
  const report = JSON.parse(python(['engineering/scripts/check_research.py']));
  assert.ok(report.sources > 0);
  assert.ok(report.markdown_files > 0);
  assert.match(report.scope, /Offline structure only/);
});
