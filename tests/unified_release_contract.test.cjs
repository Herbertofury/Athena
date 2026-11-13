"use strict";
// Static wiring only: these tests never run CI or launch a browser.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
test('aggregate includes generated standalone Media verification and the complete Media regression set', () => {
  const scripts = JSON.parse(read('package.json')).scripts;
  assert.ok(scripts.test.includes('npm run test:media'));
  assert.ok(scripts['test:media'].startsWith('python3 engineering/scripts/build_media_lab.py --check && node --test '));
  for (const name of ['bilibili-player', 'event-log-view', 'event-log-recovery', 'media-lab', 'preview-loader', 'resource-loader', 'media-event-recorder', 'media-events', 'media-recovery-dom', 'player-ready-timeout', 'hls-recovery', 'youtube-identity', 'youtube-recovery']) {
    assert.ok(scripts['test:media'].includes(`engineering/tests/${name}.test.mjs`), name);
  }
});
test('normal browser entry point retains every generator and browser gate without workflow edits', () => {
  const scripts = JSON.parse(read('package.json')).scripts;
  assert.equal(scripts['test:browser'], 'node scripts/test_unified_browser.cjs');
  const steps = require('../scripts/test_unified_browser.cjs').plan('/fixture/project','/fixture/scratch',{});
  for (const script of ['engineering/scripts/build_media_lab.py','scripts/build_engineering_workspaces.py','scripts/build_lab_workspace.py','scripts/build_card_workspace.py']) assert.ok(steps.some(s => s.args[0]===script && s.args.includes('--check')),script);
  for (const script of ['scripts/test_browser.cjs','scripts/test_workshops_browser.cjs','scripts/test_accessibility_browser.cjs','scripts/test_lab_runtime.cjs']) assert.equal(steps.filter(s => s.args[0]===script).length,1,script);
  for (const [name,folder] of [['workshop-browser','workshops'],['accessibility-browser','accessibility']]) {
    const step=steps.find(s=>s.name===name);
    assert.ok(Object.values(step.env).includes('/fixture/project/browser-results/'+folder));
  }
});
test('static browser lane retains citation checks and invokes Media checks once', () => {
  const runner = read('scripts/test_browser.cjs');
  assert.ok(runner.includes('Research evidence citations use exact Athena copies with original attribution'));
  const invocation = "require('./media_browser_checks.cjs').runMediaBrowserChecks({page,origin,root,report,check})";
  assert.equal(runner.split(invocation).length - 1, 1);
  assert.ok(runner.indexOf(invocation) > runner.indexOf('media-desktop.png'));
  assert.ok(runner.indexOf(invocation) < runner.indexOf('Static public lab explains'));
});
