'use strict';
// Outcome regressions from independent catalog integration QA.
// LinkeDOM cases verify DOM updates, events and explicit focus calls only.
// Browser rendering, native focus trapping and accessibility-tree behavior are
// checked separately by the real Chromium acceptance suite.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {parseHTML} = require('linkedom');

const catalog = JSON.parse(fs.readFileSync('dist/workspaces/software/catalog.json', 'utf8'));
const model = import('../src/software/model.mjs');
const workspace = import('../src/software/index.mjs');

test('everyday task phrasing retrieves relevant tools without treating disk as any file', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog), find = q => queryCatalog(index, {...parseState(), q}, catalog);
  assert.ok(find('please help me edit a video').some(a => a.id === 'kdenlive'));
  assert.ok(find('make a disk image').some(a => a.id === 'clonezilla'));
  assert.equal(find('make a disk image').some(a => a.id === 'bruno'), false);
  assert.ok(find('record my screen').some(a => a.id === 'obs-studio'));
  assert.ok(find('I want to program in Python').slice(0, 3).some(a => a.id === 'thonny'));
});

test('alternative requests use explicit relationships and preserve platform constraints', async () => {
  const {indexCatalog, queryCatalog, parseState, alternativeTarget} = await model;
  const index = indexCatalog(catalog), state = {...parseState(), q: 'Find an alternative to Clonezilla?'};
  assert.equal(alternativeTarget(state.q), 'clonezilla');
  const alternatives = queryCatalog(index, state, catalog);
  assert.ok(alternatives.some(a => a.id === 'rescuezilla'));
  assert.equal(alternatives.some(a => a.id === 'clonezilla'), false);
  assert.ok(queryCatalog(index, {...state, platform: 'Bootable'}, catalog).every(a => a.platforms.includes('Bootable')));
  assert.deepEqual(queryCatalog(index, {...state, q: 'alternatives to unlisted-fixture-product'}, catalog), []);
});

test('suffix alternative requests resolve existing Photoshop and MATLAB relationships', async () => {
  const {indexCatalog, queryCatalog, parseState, alternativeTarget} = await model;
  const index = indexCatalog(catalog);
  const find = q => queryCatalog(index, {...parseState(), q}, catalog);
  for (const q of ['Photoshop alternative', 'compare Photoshop alternatives', 'Please find Photoshop alternatives?  ']) {
    assert.equal(alternativeTarget(q), 'photoshop');
    const ids = new Set(find(q).map(a => a.id));
    assert.ok(ids.has('gimp'), q);
    assert.ok(ids.has('krita'), q);
    assert.equal(ids.has('adobe-photoshop'), false, q);
  }
  assert.ok(find('MATLAB alternative').some(a => a.id === 'gnu-octave'));
  assert.ok(find('MATLAB alternative').some(a => a.id === 'scilab'));
  assert.deepEqual(find('unlisted-fixture-product alternatives'), []);
  const filtered = queryCatalog(index, {...parseState(), q: 'Photoshop alternatives', platform: 'Linux'}, catalog);
  assert.ok(filtered.some(a => a.id === 'gimp'));
  assert.ok(filtered.every(a => a.platforms.includes('Linux')));
});

test('task intent retrieves picture deduplication and scanning tools without unrelated editors', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog), find = q => queryCatalog(index, {...parseState(), q}, catalog);
  const duplicates = find('remove duplicate photos');
  assert.ok(duplicates.some(a => a.id === 'czkawka---krokiet'));
  assert.ok(duplicates.some(a => a.id === 'dupeguru'));
  assert.ok(duplicates.every(a => a.category_id === 'files/duplicate-detection'));
  assert.equal(duplicates.some(a => ['jdupes', 'rmlint', 'clonezilla'].includes(a.id)), false);
  for (const q of ['OCR scanned docs', 'scan documents']) {
    const rows = find(q);
    assert.ok(rows.some(a => a.id === 'ocrmypdf'), q);
    assert.ok(rows.some(a => a.id === 'naps2'), q);
    assert.ok(rows.every(a => a.category_id === 'productivity/scanning-ocr'), q);
    assert.equal(rows.some(a => a.id === 'pdf-arranger'), false, q);
  }
});

test('task intent distinguishes game asset extraction from mesh editing and retains engine qualifiers', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog), find = q => queryCatalog(index, {...parseState(), q}, catalog);
  const rows = find('extract game assets');
  assert.ok(rows.some(a => a.id === 'assetripper'));
  assert.ok(rows.some(a => a.id === 'fmodel'));
  assert.equal(rows.some(a => ['bodyslide', 'texconv'].includes(a.id)), false);
  const unity = find('extract Unity game assets');
  assert.ok(unity.some(a => a.id === 'assetripper'));
  assert.equal(unity.some(a => a.id === 'fmodel'), false);
  assert.deepEqual(find('extract game assets unsupported-fixture-format'), []);
});

test('speech direction retrieves transcription rather than speech synthesis', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog), find = q => queryCatalog(index, {...parseState(), q}, catalog);
  for (const q of ['speech to text', 'local speech to text', 'offline speech-to-text']) {
    const rows = find(q);
    assert.ok(rows.some(a => a.id === 'whisper-cpp'), q);
    assert.equal(rows.some(a => a.id === 'espeak-ng'), false, q);
    assert.ok(rows.every(a => a.category_id === 'ai/speech-transcription'), q);
  }
  const synthesis = find('text to speech');
  assert.ok(synthesis.some(a => a.id === 'espeak-ng'));
  assert.equal(synthesis.some(a => a.id === 'whisper-cpp'), false);
});

test('large-file task prioritizes storage analysis and preserves explicit platform filters', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog);
  const rows = queryCatalog(index, {...parseState(), q: 'find large files'}, catalog);
  assert.ok(rows.some(a => a.id === 'wiztree'));
  assert.ok(rows.some(a => a.id === 'windirstat'));
  assert.ok(rows.every(a => a.category_id === 'files/storage-analysis'));
  assert.equal(rows.some(a => ['croc', 'rsync', 'yazi', 'duf'].includes(a.id)), false,
    'Transfers, file browsing and mounted-volume totals do not locate large files');
  const windows = queryCatalog(index, {...parseState(), q: 'find large files', platform: 'Windows'}, catalog);
  assert.ok(windows.some(a => a.id === 'wiztree'));
  assert.ok(windows.every(a => a.platforms.includes('Windows')));
  assert.equal(windows.some(a => a.id === 'grandperspective'), false);
  const transfer = queryCatalog(index, {...parseState(), q: 'send large files'}, catalog);
  assert.ok(transfer.some(a => a.id === 'croc'), 'A transfer request must not be rerouted into disk analysis');
});

test('video conversion retrieves transcoders rather than subtitle-format tools', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog), find = q => queryCatalog(index, {...parseState(), q}, catalog);
  const rows = find('convert video');
  for (const id of ['ffmpeg', 'handbrake', 'shutter-encoder']) assert.ok(rows.some(a => a.id === id), id);
  assert.equal(rows.some(a => a.id === 'subtitle-edit'), false);
  assert.deepEqual(find('convert video unsupported-fixture-codec'), []);
});

test('crop and resize requests retrieve verified image operations and preserve platform constraints', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog);
  for (const q of ['crop images', 'resize photos']) {
    const rows = queryCatalog(index, {...parseState(), q}, catalog);
    for (const id of ['gimp', 'imagemagick', 'irfanview']) assert.ok(rows.some(a => a.id === id), q + ': ' + id);
    assert.equal(rows.some(a => ['clonezilla', 'rescuezilla'].includes(a.id)), false);
    const linux = queryCatalog(index, {...parseState(), q, platform: 'Linux'}, catalog);
    assert.ok(linux.some(a => a.id === 'imagemagick'));
    assert.equal(linux.some(a => a.id === 'irfanview'), false);
    assert.ok(linux.every(a => a.platforms.includes('Linux')));
  }
  assert.deepEqual(queryCatalog(index, {...parseState(), q: 'resize photos unsupported-fixture-format'}, catalog), []);
});

test('music creation leads with production tools and does not turn library management into composition', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog), find = q => queryCatalog(index, {...parseState(), q}, catalog);
  const rows = find('make music');
  for (const id of ['reaper', 'ardour', 'lmms', 'fl-studio']) assert.ok(rows.slice(0, 8).some(a => a.id === id), id);
  assert.ok(rows.slice(0, 8).every(a => a.category_id === 'creative/audio-workstations'));
  assert.equal(rows.some(a => ['musicbee', 'musicbrainz-picard', 'strawberry'].includes(a.id)), false);
  assert.ok(find('manage music').some(a => a.id === 'musicbee'));
  assert.deepEqual(find('make music unsupported-fixture-workflow'), []);
});

test('malware removal requires a documented cleaning workflow while scanning remains discoverable', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog), find = q => queryCatalog(index, {...parseState(), q}, catalog);
  const rows = find('remove malware');
  assert.ok(rows.some(a => a.id === 'malwarebytes'));
  assert.ok(rows.some(a => a.id === 'emsisoft-emergency-kit'));
  assert.equal(rows.some(a => a.id === 'clamav'), false, 'The scanning-engine record does not establish a removal workflow');
  assert.ok(find('scan for malware').some(a => a.id === 'clamav'));
});

test('network traffic requests include packet analysis alongside connection and bandwidth tools', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog);
  for (const q of ['monitor network traffic', 'network traffic']) {
    const rows = queryCatalog(index, {...parseState(), q}, catalog);
    for (const id of ['wireshark', 'sniffnet', 'tcpdump']) assert.ok(rows.some(a => a.id === id), q + ': ' + id);
    assert.equal(rows.some(a => a.id === 'little-snitch'), false, 'Blocking traffic is a separate task');
  }
  const windows = queryCatalog(index, {...parseState(), q: 'monitor network traffic', platform: 'Windows'}, catalog);
  assert.ok(windows.some(a => a.id === 'wireshark'));
  assert.ok(windows.every(a => a.platforms.includes('Windows')));
});

test('3D printing retrieves slicers and retains material-specific qualifications', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog), find = q => queryCatalog(index, {...parseState(), q}, catalog);
  const rows = find('3D print models');
  for (const id of ['prusaslicer', 'cura', 'orcaslicer']) assert.ok(rows.some(a => a.id === id), id);
  assert.equal(rows.some(a => ['freecad', 'blender'].includes(a.id)), false);
  const resin = find('3D print resin models');
  assert.ok(resin.some(a => a.id === 'prusaslicer'));
  assert.equal(resin.some(a => a.id === 'orcaslicer'), false);
  assert.deepEqual(find('3D print models unsupported-fixture-material'), []);
});

test('PDF content editing stays distinct from page organization, readers and source-document editors', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog), find = q => queryCatalog(index, {...parseState(), q}, catalog);
  for (const q of ['edit PDF', 'edit PDF text']) {
    const rows = find(q);
    assert.equal(rows[0]?.category_id, 'productivity/pdf-editors', q);
    assert.ok(rows.some(a => a.id === 'adobe-acrobat-pro'), q);
    assert.ok(rows.some(a => a.id === 'abbyy-finereader-pdf'), q);
    assert.equal(rows.some(a => ['pdf-arranger', 'pdfsam-basic', 'sumatrapdf', 'texstudio', 'typst'].includes(a.id)), false, q);
  }
  const pages = find('edit PDF pages');
  assert.equal(pages[0]?.category_id, 'productivity/pdf-organization');
  assert.ok(pages.some(a => a.id === 'pdf-arranger'));
  assert.ok(pages.some(a => a.id === 'pdfsam-basic'));
  assert.ok(find('merge PDF documents').some(a => a.id === 'pdfsam-basic'));
  const crop = find('crop PDF pages');
  assert.ok(crop.some(a => a.id === 'pdf-arranger'));
  assert.equal(crop.some(a => a.id === 'pdfsam-basic'), false, 'PDFsam Basic does not document page cropping in this record');
  const mac = queryCatalog(index, {...parseState(), q: 'edit PDF', platform: 'macOS'}, catalog);
  assert.ok(mac.some(a => a.id === 'adobe-acrobat-pro'));
  assert.equal(mac.some(a => a.id === 'abbyy-finereader-pdf'), false, 'The record limits full PDF editing to the Windows edition');
  assert.ok(find('read PDF').some(a => a.id === 'sumatrapdf'));
  assert.deepEqual(find('edit PDF unsupported-fixture-feature'), []);
});

async function domFixture(t, route = '#software?q=', saved = {}) {
  const {window} = parseHTML('<html><body><section id="software-fixture"></section></body></html>');
  const document = window.document;
  const selectValues = new WeakMap();
  const selectDescriptor = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {
    configurable: true,
    get() {return selectValues.get(this) || '';},
    set(value) {selectValues.set(this, [...this.options].some(o => o.value === value) ? value : '');},
  });
  const prototype = window.HTMLElement.prototype;
  const prior = Object.fromEntries(['focus', 'showModal', 'close', 'open'].map(k => [k, Object.getOwnPropertyDescriptor(prototype, k)]));
  let focused = document.body;
  prototype.focus = function () {focused = this;};
  Object.defineProperty(prototype, 'open', {
    configurable: true,
    get() {return this.hasAttribute('open');},
    set(value) {value ? this.setAttribute('open', '') : this.removeAttribute('open');},
  });
  prototype.showModal = function () {this.open = true;};
  prototype.close = function () {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new window.Event('close'));
  };
  Object.defineProperty(document, 'activeElement', {get: () => focused});
  const globals = Object.fromEntries(['document', 'fetch', 'location'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  globalThis.document = document;
  globalThis.fetch = async () => ({ok: true, json: async () => catalog});
  globalThis.location = {href: 'https://athena.example/' + route};
  const notices = [], saves = [], routes = [];
  const container = document.getElementById('software-fixture');
  const instance = await (await workspace).mount({
    container, route, state: saved,
    notify: value => notices.push(value),
    setState: value => saves.push(value),
    navigate: (...args) => routes.push(args),
  });
  t.after(() => {
    instance.unmount();
    Object.defineProperty(window.HTMLSelectElement.prototype, 'value', selectDescriptor);
    for (const [key, descriptor] of Object.entries(prior)) {
      descriptor ? Object.defineProperty(prototype, key, descriptor) : delete prototype[key];
    }
    for (const [key, descriptor] of Object.entries(globals)) {
      descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key];
    }
  });
  assert.equal(instance.ready, true);
  return {
    root: container.shadowRoot, instance, notices, saves, routes,
    focus: () => focused,
    click: node => node.dispatchEvent(new window.Event('click', {bubbles: true})),
    change(id, value) {
      const node = container.shadowRoot.getElementById(id);
      node.value = value;
      node.dispatchEvent(new window.Event('change', {bubbles: true}));
    },
    check(node) {
      node.checked = true;
      node.dispatchEvent(new window.Event('change', {bubbles: true}));
    },
  };
}

test('natural task search recovers video editing, PC backup and C++ development', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog);
  const find = q => new Set(queryCatalog(index, {...parseState(), q}, catalog).map(a => a.id));
  assert.ok(find('edit videos').has('kdenlive'));
  assert.ok(find('edit videos').has('shotcut'));
  assert.ok(find('I want to back up my PC').has('restic'));
  assert.ok(find('program in C++').has('jetbrains-clion'));
  const ai = find('local AI');
  assert.ok(ai.has('ollama'));
  assert.equal(ai.has('activitywatch'), false, 'AI must not match maintain');
  assert.equal(ai.has('db-browser-sqlite'), false, 'AI must not match incidental letter sequences');
  const mods = find('mods');
  assert.ok(mods.has('mod-organizer-2'));
  assert.equal(mods.has('ollama'), false, 'mod must not match model');
});

test('exact product names lead their aliases and alternatives in product searches', async () => {
  const {indexCatalog, queryCatalog, parseState} = await model;
  const index = indexCatalog(catalog);
  for (const [q, id] of [['Firefox', 'firefox'], ['Process Explorer', 'process-explorer'], ['Letos', 'letos']]) {
    assert.equal(queryCatalog(index, {...parseState(), q}, catalog)[0]?.id, id, q);
  }
});

test('obsolete deep-link filters are cleared without changing a valid query or platform', async () => {
  const {parseState, normalizeState, queryCatalog, indexCatalog} = await model;
  const input = parseState('software?q=Firefox&platform=Windows&family=vanished-family&task=deleted-guide');
  const {state, removed} = normalizeState(input, catalog);
  assert.equal(state.q, 'Firefox');
  assert.equal(state.platform, 'Windows');
  assert.equal(state.family, '');
  assert.equal(state.task, '');
  assert.equal(removed.length, 2);
  assert.ok(queryCatalog(indexCatalog(catalog), state, catalog).some(a => a.id === 'firefox'));
  assert.equal(input.family, 'vanished-family', 'normalization must not mutate stored input');
  const foreignCategory = catalog.categories.find(c => c.family !== 'gaming').id;
  const conflict = normalizeState({...parseState(), family: 'gaming', category: foreignCategory}, catalog);
  assert.equal(conflict.state.family, 'gaming');
  assert.equal(conflict.state.category, '');
});

test('unranked and excluded cleanup snapshots remain discoverable as research', async () => {
  const {queryResearch} = await model;
  const latent = queryResearch(catalog.research_records, 'Latent').find(x => x.name === 'Latent');
  const excluded = queryResearch(catalog.research_records, 'WinDiskCleanup').find(x => x.name === 'WinDiskCleanup');
  assert.ok(latent);
  assert.match(latent.kind, /unranked/i);
  assert.ok(excluded);
  assert.match(excluded.kind, /excluded/i);
  assert.match(excluded.original.reason, /404/);
  assert.match(excluded.evidence_status, /not a recommended/i);
});

test('category deep links survive a taxonomy move across families', async () => {
  const {parseState, normalizeState, queryCatalog, indexCatalog} = await model;
  const state = parseState('#software?family=creative&category=creative%2Fcad&platform=Windows');
  const result = normalizeState(state, catalog);
  assert.equal(result.state.family, 'science');
  assert.equal(result.state.category, 'science/parametric-cad');
  assert.deepEqual(result.removed, []);
  assert.ok(queryCatalog(indexCatalog(catalog), result.state, catalog).some(a => a.id === 'freecad'));
  const conflict = normalizeState({...state, family: 'gaming'}, catalog);
  assert.equal(conflict.state.family, 'gaming');
  assert.equal(conflict.state.category, '');
});

test('DOM: alternative navigation focuses the new title and close returns to the original card', async t => {
  const f = await domFixture(t, '#software?q=DBeaver');
  const opener = f.root.querySelector('[data-app-id="dbeaver"] .primary');
  opener.focus(); f.click(opener);
  const alternative = [...f.root.querySelectorAll('.detail-section button')].find(b => b.textContent === 'DB Browser for SQLite');
  assert.ok(alternative);
  alternative.focus(); f.click(alternative);
  const title = f.root.getElementById('detail-title');
  assert.equal(title.textContent, 'DB Browser for SQLite');
  assert.equal(f.focus(), title);
  assert.equal(title.isConnected, true);
  f.click(f.root.querySelector('[data-close="detail-dialog"]'));
  assert.equal(f.focus(), opener);
});

test('DOM: an external software route closes stale details and applies the new task search', async t => {
  const f = await domFixture(t, '#software?q=Process%20Explorer');
  f.click(f.root.querySelector('.primary'));
  assert.equal(f.root.getElementById('detail-dialog').open, true);
  f.instance.setRoute('#software?q=Firefox');
  assert.equal(f.root.getElementById('detail-dialog').open, false);
  assert.equal(f.instance.exportState().filters.q, 'Firefox');
  assert.ok(f.root.querySelector('[data-app-id="firefox"]'));
});

test('DOM: invalid filters are reported and the visible All option matches actual results', async t => {
  const f = await domFixture(t, '#software?platform=AS400');
  assert.equal(f.root.getElementById('platform').value, '');
  assert.equal(f.instance.exportState().filters.platform, '');
  assert.match(f.root.getElementById('result-count').textContent, new RegExp(`^${catalog.applications.length.toLocaleString()} of`));
  assert.ok(f.notices.some(n => n.includes('AS400')));
});

test('DOM: a task guide respects its platform filter and explains hidden choices', async t => {
  const f = await domFixture(t, '#software?task=investigate-application-performance&platform=Windows');
  const {queryCatalog, indexCatalog, parseState} = await model;
  const expected = queryCatalog(indexCatalog(catalog), parseState('software?task=investigate-application-performance&platform=Windows'), catalog);
  const names = [...f.root.querySelectorAll('.guide-pick button')].map(n => n.textContent);
  assert.deepEqual(names, expected.map(a => a.name));
  assert.equal(names.includes('Speedscope'), false);
  assert.match(f.root.getElementById('guide').textContent, /hidden by your current filters or search/);
});

test('DOM: comparison capacity survives searching and reset without adding a fifth record', async t => {
  const f = await domFixture(t);
  const controls = [...f.root.querySelectorAll('.compare-check input')].slice(0, 5);
  controls.forEach(node => f.check(node));
  const selected = f.instance.exportState().selected;
  assert.equal(selected.length, 4);
  assert.equal(controls[4].checked, false);
  assert.ok(f.notices.some(n => /four/i.test(n)));
  f.instance.setSearch('Firefox');
  assert.deepEqual(f.instance.exportState().selected, selected);
  f.click(f.root.getElementById('reset'));
  assert.deepEqual(f.instance.exportState().selected, selected);
  f.click(f.root.getElementById('clear-selection'));
  assert.deepEqual(f.instance.exportState().selected, []);
});

test('DOM: exact maintenance evidence is reachable from a record detail', async t => {
  const app = catalog.applications.find(a => a.id === 'activitywatch');
  assert.ok(app.maintenance.source_url);
  const f = await domFixture(t, '#software?q=ActivityWatch');
  f.click(f.root.querySelector('[data-app-id="activitywatch"] .primary'));
  assert.ok([...f.root.querySelectorAll('#detail-body a')].some(a => a.getAttribute('href') === app.maintenance.source_url));
});
