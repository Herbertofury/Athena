import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { requireText, compareText, textUnits, discoveryProjection, createQueryOwner } from '../experiments/text-input-contract-lab/text-contract.mjs';
import { runFixture } from '../experiments/text-input-contract-lab/demo.mjs';

test('canonical equivalence does not change raw equality', () => {
  const result = compareText('Café', 'Cafe\u0301'); assert.equal(result.raw_equal, false); assert.equal(result.nfc_equal, true);
});
test('compatibility normalization broadens distinct title collisions', () => {
  for (const [left, right] of [['ＡＢＣ', 'ABC'], ['ﬁle', 'file'], ['①', '1'], ['x²', 'x2']]) {
    const result = compareText(left, right); assert.equal(result.nfc_equal, false); assert.equal(result.nfkc_equal, true);
  }
});
test('normalization does not erase accent or script distinctions', () => {
  assert.equal(compareText('résumé', 'resume').nfkc_equal, false); assert.equal(compareText('a', 'а').nfkc_equal, false);
});
test('lowercasing is not full case folding', () => assert.equal(compareText('Straße', 'STRASSE').default_lower_equal, false));
test('locale casing affects matching', () => {
  const result = compareText('I', 'ı'); assert.equal(result.default_lower_equal, false); assert.equal(result.turkish_lower_equal, true);
});
test('projection preserves exact ID, provider, title and source object', () => {
  const original = { provider: 'Provider', id: 'OpaqueID', title: 'ＡＢＣ', body: 'retained' }; const before = JSON.stringify(original);
  const result = discoveryProjection(original, 'NFKC'); assert.equal(result.discovery_key, 'ABC');
  for (const field of ['provider', 'id', 'title']) assert.equal(result[field], original[field]);
  assert.equal(JSON.stringify(original), before); assert.equal(Object.isFrozen(result), true);
});
test('equal discovery keys do not collapse distinct opaque IDs', () => {
  const rows = [{ provider: 'p', id: 'A', title: '①' }, { provider: 'p', id: 'a', title: '1' }].map(row => discoveryProjection(row, 'NFKC'));
  assert.equal(rows[0].discovery_key, rows[1].discovery_key); assert.notEqual(rows[0].id, rows[1].id);
});
test('projection policy and mandatory identities are explicit', () => {
  assert.throws(() => discoveryProjection({ provider: '', id: 'a', title: 'x' }));
  assert.throws(() => discoveryProjection({ provider: 'p', id: 'a', title: 'x' }, 'NFD'));
});
test('UTF-16 units and code points are not grapheme count', () => {
  const result = textUnits('👨‍👩‍👧‍👦'); assert.equal(result.utf16_units, 11); assert.equal(result.code_points, 7); assert.equal(result.graphemes.length, 1);
});
test('segmentation preserves combining marks and emoji modifiers', () => {
  assert.deepEqual(textUnits('e\u0301').graphemes, ['e\u0301']); assert.deepEqual(textUnits('👍🏽').graphemes, ['👍🏽']);
});
test('missing Segmenter is unsupported rather than a code-point fallback', () => {
  const result = textUnits('😀', { Segmenter: null }); assert.equal(result.segmentation, 'unsupported'); assert.equal(result.graphemes, null);
});
test('Segmenter failure remains distinct', () => assert.equal(textUnits('x', { Segmenter: class { constructor() { throw new Error('failed'); } } }).segmentation, 'error'));
test('bounded text refuses coercion, oversize and unpaired surrogates', () => {
  for (const value of [null, 12, 'x'.repeat(65537), '\ud800', '\udc00', '\ud800x']) assert.throws(() => requireText(value));
  assert.equal(requireText('😀'), '😀'); assert.equal(requireText(''), '');
});
test('ordinary input requests exact current value', () => {
  const owner = createQueryOwner(); assert.deepEqual(owner.input('Café'), { sequence: 1, query: 'Café' });
});
test('composition start invalidates prior request immediately', () => {
  const owner = createQueryOwner(); const old = owner.input('old'); owner.compositionStart(); assert.equal(owner.complete(old), false);
});
test('draft input creates no request while composing', () => {
  const owner = createQueryOwner(); owner.compositionStart(); assert.equal(owner.input('に', { isComposing: true }), null); assert.equal(owner.state().value, 'に');
});
test('isComposing can establish the modeled composition when start was not observed', () => {
  const owner = createQueryOwner(); const old = owner.input('old'); owner.input('に', { isComposing: true }); assert.equal(owner.complete(old), false); assert.equal(owner.state().composing, true);
});
test('final composing input before end is submitted once', () => {
  const owner = createQueryOwner(); owner.compositionStart(); owner.input('日本', { isComposing: true });
  const request = owner.compositionEnd('日本'); assert.equal(request.query, '日本'); assert.equal(owner.input('日本'), null);
});
test('final input after end coalesces only if exact text matches', () => {
  const owner = createQueryOwner(); owner.compositionStart(); const first = owner.compositionEnd('日'); const second = owner.input('日本');
  assert.notEqual(second, null); assert.equal(owner.complete(first), false); assert.equal(owner.complete(second), true);
});
test('cancelled composition returning original value permits a fresh query', () => {
  const owner = createQueryOwner(); const old = owner.input('same'); owner.compositionStart(); const current = owner.compositionEnd('same');
  assert.notEqual(current, null); assert.equal(owner.complete(old), false); assert.equal(owner.complete(current), true);
});
test('repeated end without an active composition is ignored', () => {
  const owner = createQueryOwner(); assert.equal(owner.compositionEnd('unexpected'), null); owner.compositionStart(); const current = owner.compositionEnd('x');
  assert.equal(owner.compositionEnd('y'), null); assert.equal(owner.complete(current), true);
});
test('old query cannot publish after newer input', () => {
  const owner = createQueryOwner(); const a = owner.input('a'); const b = owner.input('b'); assert.equal(owner.complete(a), false); assert.equal(owner.complete(b), true);
});
test('completion is exactly once and token identity cannot be copied', () => {
  const owner = createQueryOwner(); const request = owner.input('x'); assert.equal(owner.complete({ ...request }), false); assert.equal(owner.complete(request), true); assert.equal(owner.complete(request), false);
});
test('empty query is intentional input, not discarded', () => assert.equal(createQueryOwner().input('').query, ''));
test('duplicate settled input needs explicit retry', () => {
  const owner = createQueryOwner(); const first = owner.input('x'); owner.complete(first); assert.equal(owner.input('x'), null); assert.equal(owner.retry().sequence, 2);
});
test('retry during composition produces no work', () => {
  const owner = createQueryOwner(); owner.input('x'); owner.compositionStart(); assert.equal(owner.retry(), null);
});
test('retry without an observed submission cannot invent empty-query work', () => assert.equal(createQueryOwner().retry(), null));
test('canonically equivalent input remains an explicit new raw query', () => {
  const owner = createQueryOwner(); const first = owner.input('Café'); const second = owner.input('Cafe\u0301');
  assert.notEqual(second, null); assert.equal(second.query, 'Cafe\u0301'); assert.equal(owner.complete(first), false);
});
test('dispose rejects old completions and all subsequent requests', () => {
  const owner = createQueryOwner(); const request = owner.input('x'); owner.dispose(); owner.compositionStart();
  assert.equal(owner.complete(request), false); assert.equal(owner.input('y'), null); assert.equal(owner.compositionEnd('z'), null); assert.equal(owner.retry(), null);
});
test('separate mounted owners do not share tokens', () => {
  const a = createQueryOwner(); const b = createQueryOwner(); const ta = a.input('x'); const tb = b.input('x'); assert.equal(a.complete(tb), false); assert.equal(b.complete(ta), false);
});
test('snapshots and tokens cannot mutate model ownership', () => {
  const owner = createQueryOwner(); const request = owner.input('x'); assert.equal(Object.isFrozen(request), true); assert.equal(Object.isFrozen(owner.state()), true);
});
test('composition boolean and value types are checked', () => {
  const owner = createQueryOwner(); assert.throws(() => owner.input('x', { isComposing: 'false' })); assert.throws(() => owner.input(null)); assert.throws(() => owner.compositionEnd('\ud800'));
});
test('synthetic report reproduces observations with environment kept separate', async () => {
  const root = new URL('../experiments/text-input-contract-lab/', import.meta.url);
  const fixture = JSON.parse(await readFile(new URL('fixture.json', root), 'utf8'));
  const saved = JSON.parse(await readFile(new URL('evidence/synthetic-report.json', root), 'utf8'));
  const { environment, ...observations } = saved; assert.equal(environment.unicode, '17.0'); assert.deepEqual(runFixture(fixture), observations);
});
