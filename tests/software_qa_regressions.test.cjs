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
