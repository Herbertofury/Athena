const {test} = require('node:test');
const assert = require('node:assert/strict');
const {parseHTML} = require('linkedom');

const note = (id, project, revisions, extra = {}) => ({
  id, project, kind: 'resource', pinned: false, ignored: false, revisions, history: [], ...extra
});
const rev = (text, source, at) => ({text, source, at});
const oldSource = 'https://example.test/releases/v1?file=first#notes';
const newSource = 'https://example.test/releases/v2?file=second#notes';

async function fixture(state) {
  const {document} = parseHTML('<html><body><section></section></body></html>');
  const {mount} = await import('../dist/workspaces/continuity/index.mjs');
  const container = document.querySelector('section');
  const previousDocument = globalThis.document, previousFetch = globalThis.fetch;
  const originalState = structuredClone(state);
  globalThis.document = document;
  globalThis.fetch = () => assert.fail('Rendering reviewed evidence must not request its source');
  let mounted;
  try {
    const prototype = Object.getPrototypeOf(document.createElement('select'));
    // Match browser form selection semantics absent in the DOM test dependency.
    Object.defineProperty(prototype, 'value', {
      configurable: true, get() {return this._value || '';}, set(value) {this._value = value;}
    });
    mounted = mount({container, state, setState: () => assert.fail('Review must not write')});
    return {
      root: container.shadowRoot,
      close() {
        try {mounted.unmount(); assert.deepEqual(state, originalState);}
        finally {globalThis.document = previousDocument; globalThis.fetch = previousFetch;}
      }
    };
  } catch (error) {
    mounted?.unmount();
    globalThis.document = previousDocument; globalThis.fetch = previousFetch;
    throw error;
  }
}

test('linked schema-1 evidence opens the exact reviewed historical HTTPS source, not the latest release', async () => {
  const historical = rev('Original review', oldSource, 2);
  const x = await fixture({schema: 1, entries: [
    note('root', 'Catalog', [rev('Pinned evidence', '', 1)], {dependencies: [{id: 'linked', revision: 1}]}),
    note('linked', 'External project', [historical, rev('Later observation', newSource, 3)], {ignored: true})
  ]});
  try {
    const rootNote = x.root.querySelector('[data-entry-id="root"]');
    const baseline = rootNote.querySelector('.dependency details');
    const a = baseline.querySelector('a');
    assert.ok(a, 'Reviewed historical source is a directly clickable link');
    assert.equal(a.getAttribute('href'), oldSource);
    assert.equal(a.localName, 'a');
    assert.equal(a.getAttribute('tabindex'), null); // Native anchor participates in normal tab order when opened.
    assert.equal(a.getAttribute('target'), '_blank');
    assert.equal(a.getAttribute('rel'), 'noopener noreferrer');
    assert.match(a.textContent, /reviewed revision 1 source/i);
    assert.equal(baseline.querySelector('pre').textContent, JSON.stringify(historical, null, 2));
    assert.equal(rootNote.querySelectorAll(`a[href="${newSource}"]`).length, 0);
    assert.equal(x.root.querySelector('[data-entry-id="linked"]'), null);
    baseline.open = true;
    let focusTarget, clickTarget;
    a.addEventListener('focus', event => {focusTarget = event.target;});
    a.focus();
    assert.equal(focusTarget, a); // Linkedom emits focus; it does not model real Tab traversal.
    a.addEventListener('click', event => {event.preventDefault(); clickTarget = event.target;});
    a.click();
    assert.equal(clickTarget, a); // No navigation opened by the harness.
    assert.equal(a.getAttribute('href'), oldSource);
  } finally {x.close();}
});

test('no source-less, missing-revision or missing-note dependency borrows a current URL', async () => {
  const x = await fixture({schema: 2, entries: [
    note('root', 'Catalog', [rev('Own evidence', newSource, 1)], {dependencies: [
      {id: 'blank', revision: 1}, {id: 'short', revision: 3}, {id: 'not-saved', revision: 1}
    ]}),
    note('blank', 'No historical source', [rev('First observation', '', 2), rev('Later observation', newSource, 3)]),
    note('short', 'No third revision', [rev('Only observation', newSource, 4)])
  ]});
  try {
    const rootNote = x.root.querySelector('[data-entry-id="root"]');
    assert.equal(rootNote.querySelector(':scope > a').getAttribute('href'), newSource);
    const panels = [...rootNote.querySelectorAll('.dependency details')];
    assert.equal(panels.length, 3);
    for (const panel of panels) {
      assert.equal(panel.querySelector('a'), null);
      assert.match(panel.textContent, /no source was saved|reviewed revision is unavailable/i);
    }
    assert.match(panels[0].querySelector('pre').textContent, /First observation/);
    assert.match(panels[1].querySelector('pre').textContent, /unavailable/);
  } finally {x.close();}
});

test('credential-bearing or non-HTTPS reviewed sources are refused by legacy and current admission', async () => {
  for (const [schema, source] of [[1, 'https://user:pass@example.test/'], [2, 'javascript:void(0)'], [2, 'http://example.test/source']]) {
    const x = await fixture({schema, entries: [
      note('root', 'Catalog', [rev('Own evidence', '', 1)], {dependencies: [{id: 'linked', revision: 1}]}),
      note('linked', 'Refused source', [rev('Earlier observation', source, 2), rev('Safe latest', newSource, 3)])
    ]});
    try {
      assert.match(x.root.querySelector('#notice').textContent, /has not been overwritten.*HTTPS without credentials/);
      assert.equal(x.root.querySelector('#entries a'), null);
      assert.equal(x.root.querySelector('#export').disabled, true);
    } finally {x.close();}
  }
});
