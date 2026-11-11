import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeEvent, summarizeEvents, summarizeReceipt, startEventTiming } from '../experiments/ui-interaction-evidence/event-timing.mjs';

const event = (overrides = {}) => ({ entryType: 'event', name: 'click', interactionId: 7, startTime: 10, duration: 32, processingStart: 15, processingEnd: 25, ...overrides });
function mockObserver({ error = false } = {}) {
  return class {
    static supportedEntryTypes = ['event'];
    static current;
    constructor(callback) { this.callback = callback; this.queue = []; this.disconnected = 0; this.constructor.current = this; }
    observe(options) { this.options = options; if (error) throw new Error('Unsupported options'); }
    takeRecords() { return this.queue.splice(0); }
    disconnect() { this.disconnected++; }
    emit(rows) { this.callback({ getEntries: () => rows }); }
  };
}

test('same interaction uses maximum, not sum or average', () => {
  const result = summarizeEvents([event(), event({ duration: 48 })]);
  assert.equal(result.observed_interaction_count, 1);
  assert.equal(result.observed_max_ms, 48);
  assert.equal(result.interactions[0].event_count, 2);
});
test('zero IDs retained in count but excluded from interaction sample', () => {
  const result = summarizeEvents([event(), event({ interactionId: 0, duration: 999 })]);
  assert.equal(result.zero_id_event_count, 1);
  assert.equal(result.event_count, 2);
  assert.equal(result.observed_max_ms, 32);
});
test('empty sample is unavailable, never zero latency', () => {
  const result = summarizeEvents([]);
  assert.equal(result.observed_p50_ms, null);
  assert.equal(result.observed_p95_ms, null);
  assert.equal(result.observed_max_ms, null);
});
test('all zero IDs yield null interaction metrics', () => assert.equal(summarizeEvents([event({ interactionId: 0 })]).observed_max_ms, null));
test('nearest-rank percentiles and deterministic ID ordering', () => {
  const result = summarizeEvents([event({ interactionId: 3, duration: 80 }), event({ interactionId: 1, duration: 16 }), event({ interactionId: 2, duration: 32 })]);
  assert.equal(result.observed_p50_ms, 32);
  assert.equal(result.observed_p95_ms, 80);
  assert.deepEqual(result.interactions.map(x => x.interaction_id), [1, 2, 3]);
});
test('first-input entries refused to avoid accidental double counting', () => assert.throws(() => summarizeEvents([event({ entryType: 'first-input' })])));
test('numeric strings refused', () => assert.throws(() => summarizeEvents([event({ duration: '32' })])));
test('nonfinite and negative values refused in every timing field', () => {
  for (const key of ['startTime', 'duration', 'processingStart', 'processingEnd']) {
    for (const value of [NaN, Infinity, -Infinity, -1, null, true]) assert.throws(() => normalizeEvent(event({ [key]: value })));
  }
});
test('invalid interaction IDs refused', () => {
  for (const interactionId of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, '7', null]) assert.throws(() => normalizeEvent(event({ interactionId })));
});
test('timestamp ordering checked', () => {
  assert.throws(() => normalizeEvent(event({ processingStart: 9 })));
  assert.throws(() => normalizeEvent(event({ processingEnd: 14 })));
});
test('quantized duration does not require fabricated nonnegative presentation residual', () => {
  assert.equal(normalizeEvent(event({ duration: 16, processingEnd: 28 })).duration, 16);
});
test('privacy allowlist drops targets, text, selectors, URLs and key values', () => {
  assert.deepEqual(normalizeEvent(event({ target: {}, targetSelector: '#private', text: 'private', url: 'private', key: 'x' })), event());
});
test('normalization returns independent values', () => {
  const original = event(); const normalized = normalizeEvent(original); normalized.duration = 90; assert.equal(original.duration, 32);
});
test('nonarrays refused', () => assert.throws(() => summarizeEvents({})));
test('missing and oversized names refused', () => {
  for (const name of ['', null, 'a'.repeat(65)]) assert.throws(() => normalizeEvent(event({ name })));
});
test('unsupported observer is explicit', () => {
  const result = startEventTiming({ Observer: undefined }).stop();
  assert.equal(result.status, 'unsupported'); assert.equal(result.summary.observed_max_ms, null);
});
test('missing event support is explicit', () => {
  const Observer = mockObserver(); Observer.supportedEntryTypes = ['mark'];
  assert.equal(startEventTiming({ Observer }).snapshot().status, 'unsupported');
});
test('observer setup error distinct from unsupported', () => {
  const Observer = mockObserver({ error: true });
  assert.equal(startEventTiming({ Observer }).stop().status, 'observer_error');
  assert.equal(Observer.current.disconnected, 1);
});
test('observer requests non-buffered 16 ms events only', () => {
  const Observer = mockObserver(); const recorder = startEventTiming({ Observer });
  assert.deepEqual(Observer.current.options, { type: 'event', buffered: false, durationThreshold: 16 });
  recorder.stop();
});
test('callback and pending records retained once', () => {
  const Observer = mockObserver(); const recorder = startEventTiming({ Observer });
  Observer.current.emit([event()]); Observer.current.queue.push(event({ interactionId: 14 }));
  assert.equal(recorder.snapshot().entries.length, 2); assert.equal(recorder.stop().entries.length, 2);
});
test('stop is idempotent, drains pending records and ignores late callbacks', () => {
  const Observer = mockObserver(); const recorder = startEventTiming({ Observer });
  Observer.current.queue.push(event()); const first = recorder.stop();
  Observer.current.emit([event({ interactionId: 14 })]);
  assert.deepEqual(recorder.stop(), first); assert.equal(Observer.current.disconnected, 1);
});
test('capacity overflow remains explicit and bounded', () => {
  const Observer = mockObserver(); const recorder = startEventTiming({ Observer, maxEntries: 1 });
  Observer.current.emit([event(), event(), event()]); const result = recorder.stop();
  assert.equal(result.entries.length, 1); assert.equal(result.dropped_entry_count, 2); assert.equal(result.collector_overflowed, true);
});
test('malformed observation counted without becoming a zero or passing sample', () => {
  const Observer = mockObserver(); const recorder = startEventTiming({ Observer });
  Observer.current.emit([event({ duration: NaN }), event()]); const result = recorder.stop();
  assert.equal(result.invalid_entry_count, 1); assert.equal(result.entries.length, 1);
});
test('snapshot mutation cannot alter retained evidence', () => {
  const Observer = mockObserver(); const recorder = startEventTiming({ Observer }); Observer.current.emit([event()]);
  const result = recorder.snapshot(); result.entries[0].duration = 999; result.summary.interactions[0].duration_ms = 999;
  assert.equal(recorder.stop().summary.observed_max_ms, 32);
});
test('invalid caps refused', () => {
  for (const maxEntries of [0, -1, 1.5, '1', Infinity, 100001]) assert.throws(() => startEventTiming({ maxEntries }));
});
test('retained synthetic summary exactly matches fixture', async () => {
  const root = new URL('../experiments/ui-interaction-evidence/', import.meta.url);
  const input = JSON.parse(await readFile(new URL('fixtures/synthetic-events.json', root), 'utf8'));
  const expected = JSON.parse(await readFile(new URL('evidence/synthetic-summary.json', root), 'utf8'));
  assert.equal(input.evidence, 'synthetic'); assert.equal(expected.evidence, 'synthetic');
  assert.deepEqual(summarizeReceipt(input), expected);
});

test('receipt rejects missing or unknown evidence classification', () => {
  for (const evidence of [undefined, 'accepted', true]) assert.throws(() => summarizeReceipt({ schema_version: 1, evidence, entries: [] }));
});
test('entry-only receipt cannot imply complete collection', () => {
  const report = summarizeReceipt({ schema_version: 1, evidence: 'synthetic', entries: [event()] });
  assert.equal(report.collection_state, 'unknown'); assert.equal(report.collection, null);
});
test('partial collector metadata cannot silently discard loss evidence', () => {
  for (const patch of [{ dropped_entry_count: 10 }, { collector_overflowed: true }, { status: 'stopped' }]) {
    assert.throws(() => summarizeReceipt({ schema_version: 1, evidence: 'observed', entries: [event()], ...patch }), /Incomplete collector metadata/);
  }
});
test('receipt preserves overflow and malformed-entry metadata', () => {
  const Observer = mockObserver(); const recorder = startEventTiming({ Observer, maxEntries: 1 });
  Observer.current.emit([event({ duration: NaN }), event(), event()]);
  const report = summarizeReceipt({ ...recorder.stop(), evidence: 'synthetic' });
  assert.equal(report.collection_state, 'incomplete');
  assert.equal(report.collection.dropped_entry_count, 1); assert.equal(report.collection.invalid_entry_count, 1);
  assert.equal(report.collection.status, 'stopped'); assert.equal(report.collection.collector_overflowed, true);
});
test('zero collector loss is diagnostic-only, never complete', () => {
  const Observer = mockObserver(); const recorder = startEventTiming({ Observer }); Observer.current.emit([event()]);
  assert.equal(summarizeReceipt({ ...recorder.stop(), evidence: 'synthetic' }).collection_state, 'diagnostic_only');
});
test('unsupported collector receipt stays incomplete with null timings', () => {
  const report = summarizeReceipt({ ...startEventTiming({ Observer: null }).stop(), evidence: 'synthetic' });
  assert.equal(report.collection_state, 'incomplete'); assert.equal(report.collection.status, 'unsupported'); assert.equal(report.summary.observed_max_ms, null);
});
test('invalid metadata cannot hide overflow or collection configuration', () => {
  const Observer = mockObserver(); const input = { ...startEventTiming({ Observer }).stop(), evidence: 'synthetic' };
  for (const patch of [{ status: 'passed' }, { buffered: true }, { requested_duration_threshold_ms: 0 }, { max_entries: 0 }, { invalid_entry_count: -1 }, { dropped_entry_count: '0' }, { collector_overflowed: true }]) {
    assert.throws(() => summarizeReceipt({ ...input, ...patch }));
  }
});
test('non-buffered observer does not claim to filter earlier in-flight timestamps', () => {
  const Observer = mockObserver(); const recorder = startEventTiming({ Observer });
  Observer.current.emit([event({ startTime: 0, processingStart: 0, processingEnd: 1 })]);
  const report = summarizeReceipt({ ...recorder.stop(), evidence: 'synthetic' });
  assert.equal(report.summary.event_count, 1); assert.match(report.coverage_note, /scenario isolation/);
});
