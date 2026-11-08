'use strict';
// Actual browser interaction with the packaged Foundry module served by Rust.
// No provider/network account tests, native desktop assertions, or API writes.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const hash = bytes => require('node:crypto').createHash('sha256').update(bytes).digest('hex');
const THEME = 'world.frawgy.verdant-conservatory';
const THEME_KEY = 'athena.foundry.ff.premium-theme.v1';
const SNAPSHOT_KEY = 'athena.foundry.ff.browser-snapshot.v1';
function candidateAssets(manifest) {
  assert.equal(manifest.profile, 'integration-candidate');
  const assets = manifest.files.filter(file => file.path.startsWith('workspaces/foundry/'));
  assert.deepEqual(assets.map(file => file.path).sort(), [
    'workspaces/foundry/THIRD-PARTY-NOTICES.txt', 'workspaces/foundry/identity.json',
    'workspaces/foundry/index.js', 'workspaces/foundry/style.css'
  ]);
  return assets.map(({path, sha256, bytes}) => ({path, sha256, bytes}));
}
async function runFoundryRuntimeChecks({page, manifest, out, report, check, workspace}) {
  report.foundry = {
    assets: candidateAssets(manifest),
    harnessSHA256: hash(fs.readFileSync(__filename)),
    themePreferenceKey: THEME_KEY,
    storage: 'Namespaced browser localStorage; not original Foundry native SQLite',
    snapshotRestoration: 'Not implemented: retained snapshot bytes are not read on mount; theme restoration uses a separate preference',
    nativeDesktop: false, accountAuthorization: false, verifiedPlayback: false
  };
  const root = page.locator('.athena-foundry-workspace .ff-root');
  async function ready() {
    await page.waitForFunction(() => ['pass','fail'].includes(document.querySelector('.athena-foundry-workspace')?.shadowRoot?.querySelector('.ff-root')?.dataset.selftest));
    const result = await root.evaluate(el => ({state:el.dataset.selftest,checks:JSON.parse(el.dataset.selftestChecks || '{}')}));
    assert.equal(result.state, 'pass', JSON.stringify(result));
    assert.ok(Object.keys(result.checks).length > 0);
    assert.ok(Object.values(result.checks).every(value => value === true));
  }
  async function themeReady() {
    await page.waitForFunction(theme => document.querySelector('.athena-foundry-workspace')?.shadowRoot?.querySelector('.ff-root')?.dataset.premiumTheme === theme, THEME);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), THEME_KEY), THEME);
  }
  await check('Rust-served Foundry mounts the reviewed workspace with original selftests and capability boundaries', async () => {
    await workspace('build'); await ready();
    assert.equal(await page.locator('.athena-foundry-workspace').count(), 1);
    assert.equal(await page.locator('body > .sidebar').count(), 1);
    assert.equal(await page.locator('iframe').count(), 0);
    assert.equal(await page.locator('.premium-ecology-actor').count(), 5);
    assert.equal(await page.evaluate(() => typeof window.ffPrototype), 'undefined');
    assert.equal(await page.locator('.native-window-controls').count(), 0);
    assert.match(await page.locator('.athena-boundary').textContent(), /Native SQLite.*not connected/);
    assert.match(await page.locator('.athena-boundary').textContent(), /external and local-file media playback are not connected/);
    await page.locator('#editTheme').click();
    await page.locator('#themeAtlasStudio.open').waitFor();
    assert.equal(await page.locator('.theme-atlas-card').count(), 27);
    await page.locator('.theme-atlas-card[data-theme-id="' + THEME + '"]').click();
    await page.locator('[data-theme-atlas-action=activate]').click();
    await themeReady(); await page.locator('#themeAtlasStudio.open').waitFor({state:'hidden'});
    await page.screenshot({path:path.join(out,'foundry-rust-theme.png'),fullPage:true});
  });
  await check('Rust-served Foundry rejects remote media and exposes no account credential form', async () => {
    await page.locator('#musicQuick').click(); await page.locator('#musicHub.open').waitFor();
    await page.locator('[data-music-action=toggle-menu]').click();
    assert.equal(await page.locator('.music-provider-menu [data-music-route]').count(), 8);
    await page.locator('[data-music-route=settings]').click();
    assert.match(await page.locator('[data-music-content]').textContent(), /Provider authorization is not connected here/);
    assert.equal(await page.locator('#appleDeveloperToken').count(), 0);
    assert.equal(await page.locator('#musicHub input[type=password]').count(), 0);
    await page.locator('.music-hub-close').click();
    await page.locator('#environmentTv').click(); await page.locator('#mediaSurfaceStudio.open').waitFor();
    for (const [url, message] of [['http://example.invalid/fixture.mp4',/HTTPS/], ['https://example.invalid/fixture.mp4',/External media playback is not connected/]]) {
      await page.locator('#mediaSurfaceUrl').fill(url);
      await page.locator('[data-media-action=load-url]').click();
      assert.match(await page.locator('[data-media-message]').textContent(), message);
    }
    assert.equal(await root.evaluate(el => [...el.querySelectorAll('audio,video')].some(media => !media.paused || media.autoplay || media.getAttribute('src'))), false);
    await page.locator('#mediaSurfaceStudio header [data-media-action=close]').click();
    await page.locator('#mediaSurfaceStudio.open').waitFor({state:'hidden'});
  });
  let snapshot;
  await check('Rust-served Foundry retains exact snapshot bytes and separately restores its theme preference after navigation and reload', async () => {
    await root.focus(); await page.keyboard.press('Control+s');
    await page.waitForFunction(key => Boolean(localStorage.getItem(key)), SNAPSHOT_KEY);
    snapshot = await page.evaluate(key => localStorage.getItem(key), SNAPSHOT_KEY);
    const state = JSON.parse(snapshot);
    assert.equal(state.theme, THEME); assert.equal(state.nativeProfile, null); assert.equal(state.nativeCatalog, null);
    report.foundry.snapshotBytes = Buffer.byteLength(snapshot);
    report.foundry.snapshotSHA256 = hash(snapshot);
    report.foundry.themePreference = THEME;
    await workspace('research'); assert.equal(await page.locator('.athena-foundry-workspace').count(), 0);
    await workspace('build'); await ready(); await themeReady();
    assert.equal(await page.evaluate(key => localStorage.getItem(key), SNAPSHOT_KEY), snapshot);
    await page.reload(); await ready(); await themeReady();
    assert.equal(await page.evaluate(key => localStorage.getItem(key), SNAPSHOT_KEY), snapshot);
    assert.equal(await page.locator('.athena-foundry-workspace').count(), 1);
    await workspace('lab'); assert.equal(await page.locator('.athena-foundry-workspace').count(), 0);
  });
  return async function verifyAfterEngineRestart() {
    await check('Controlled engine restart retains the separate Foundry browser snapshot without claiming native database parity', async () => {
      await workspace('build'); await ready(); await themeReady();
      assert.equal(await page.evaluate(key => localStorage.getItem(key), SNAPSHOT_KEY), snapshot);
      await workspace('lab'); assert.equal(await page.locator('.athena-foundry-workspace').count(), 0);
    });
  };
}
module.exports = {candidateAssets, runFoundryRuntimeChecks};
