'use strict';
// Contract tests only. Actual interaction evidence comes from hosted Chromium.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {candidateAssets} = require('../scripts/foundry_runtime_browser_checks.cjs');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const config = JSON.parse(read('config/runtime-integration-candidate.json'));
function manifest() {
  return {profile:'integration-candidate',files:config.files.map(file=>({...file,bytes:fs.statSync(path.join(root,'dist',file.path)).size}))};
}
test('actual runtime helper identifies all four reviewed Foundry assets without mutating the manifest', () => {
  const input = manifest(), before = JSON.stringify(input);
  const assets = candidateAssets(input);
  assert.equal(assets.length,4);
  assert.equal(JSON.stringify(input),before);
  for (const asset of assets) {
    assert.match(asset.sha256,/^[a-f0-9]{64}$/);
    assert.ok(asset.bytes > 0);
  }
});
test('candidate-only coverage cannot silently accept public-preview or missing/extra Foundry assets', () => {
  const wrong = manifest(); wrong.profile='public-preview';
  assert.throws(()=>candidateAssets(wrong));
  const missing=manifest(); missing.files=missing.files.filter(file=>file.path!=='workspaces/foundry/identity.json');
  assert.throws(()=>candidateAssets(missing));
  const extra=manifest(); extra.files=[...extra.files,{path:'workspaces/foundry/unknown.js'}];
  assert.throws(()=>candidateAssets(extra));
});
test('Rust browser lane invokes Foundry checks and restart verification without changing old gates', () => {
  const runner=read('scripts/test_lab_runtime.cjs');
  const call="require('./foundry_runtime_browser_checks.cjs').runFoundryRuntimeChecks";
  assert.equal(runner.split(call).length-1,1);
  assert.ok(runner.includes("if(runtimeManifest.profile==='integration-candidate')"));
  assert.ok(runner.includes("status:'not-in-profile'"));
  assert.ok(runner.includes("build:'living world studio'"));
  assert.ok(runner.indexOf(call)<runner.indexOf("await check('Controlled engine restart preserves"));
  assert.ok(runner.indexOf('await verifyFoundryAfterRestart()')>runner.indexOf("await check('Controlled engine restart preserves"));
  for(const gate of ['Served shell and every allowlisted runtime file match package bytes','Loopback API keeps strict Host, Origin, custom-header and no-CORS protections','Native Collection verifies and downloads original archived bytes','Native bounded experiment writes a durable job and preserves raw evidence','Final SQLite integrity and exact job count'])assert.ok(runner.includes(gate));
  for(const assertion of ['assert.deepEqual(report.cspViolations,[])','assert.deepEqual(report.errors,[])','assert.deepEqual(report.outsideRequests,[])'])assert.ok(runner.includes(assertion));
});
test('new Foundry checks retain native/auth/playback limitations and use browser snapshots, not fabricated native storage', () => {
  const helper=read('scripts/foundry_runtime_browser_checks.cjs');
  assert.ok(helper.includes('not original Foundry native SQLite'));
  assert.ok(helper.includes('Not implemented: retained snapshot bytes are not read on mount; theme restoration uses a separate preference'));
  assert.ok(helper.includes('nativeDesktop: false, accountAuthorization: false, verifiedPlayback: false'));
  assert.ok(helper.includes("'athena.foundry.ff.browser-snapshot.v1'"));
  assert.ok(helper.includes("'athena.foundry.ff.premium-theme.v1'"));
  assert.ok(helper.includes('harnessSHA256: hash(fs.readFileSync(__filename))'));
  assert.ok(helper.includes('snapshotSHA256 = hash(snapshot)'));
  assert.ok(helper.includes('localStorage.getItem(key), THEME_KEY), THEME'));
  assert.ok(helper.includes('snapshotBytes = Buffer.byteLength(snapshot)'));
  assert.ok(helper.includes("page.keyboard.press('Control+s')"));
  assert.ok(helper.includes('await page.reload(); await ready(); await themeReady()'));
  assert.doesNotMatch(helper,/\bfetch\(|\brequest\(|page\.route\(|route\.fulfill\(/);
});
