/** Diagnostic event samples, not a field INP implementation or browser acceptance. */
const FIELDS = ['entryType', 'name', 'interactionId', 'startTime', 'duration', 'processingStart', 'processingEnd'];
const finiteNonnegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function normalizeEvent(entry) {
  if (!entry || entry.entryType !== 'event') throw new TypeError('Only event entries are accepted');
  if (typeof entry.name !== 'string' || !entry.name || entry.name.length > 64) throw new TypeError('Invalid event name');
  if (!Number.isSafeInteger(entry.interactionId) || entry.interactionId < 0) throw new TypeError('Invalid interactionId');
  for (const key of ['startTime', 'duration', 'processingStart', 'processingEnd']) {
    if (!finiteNonnegative(entry[key])) throw new TypeError(`Invalid ${key}`);
  }
  if (entry.processingStart < entry.startTime || entry.processingEnd < entry.processingStart) {
    throw new TypeError('Invalid timestamp order');
  }
  // duration is quantized. Do not reject/clamp a small negative residual here.
  return Object.fromEntries(FIELDS.map(key => [key, entry[key]]));
}

export function summarizeEvents(entries) {
  if (!Array.isArray(entries)) throw new TypeError('Expected an array');
  const groups = new Map();
  let zeroIdEntries = 0;
  for (const raw of entries) {
    const event = normalizeEvent(raw);
    if (event.interactionId === 0) { zeroIdEntries++; continue; }
    const old = groups.get(event.interactionId);
    if (!old) groups.set(event.interactionId, { interaction_id: event.interactionId, event_count: 1, duration_ms: event.duration });
    else { old.event_count++; old.duration_ms = Math.max(old.duration_ms, event.duration); }
  }
  const interactions = [...groups.values()].sort((a, b) => a.interaction_id - b.interaction_id);
  const durations = interactions.map(row => row.duration_ms).sort((a, b) => a - b);
  const percentile = p => durations.length ? durations[Math.ceil(p * durations.length) - 1] : null;
  return {
    metric: 'observed_interaction_duration',
    method: 'Maximum event duration per nonzero interactionId; nearest-rank observed-sample percentiles',
    scope: 'One document and one collector run; thresholded, possibly incomplete samples, not INP',
    event_count: entries.length,
    zero_id_event_count: zeroIdEntries,
    observed_interaction_count: interactions.length,
    observed_p50_ms: percentile(0.5),
    observed_p95_ms: percentile(0.95),
    observed_max_ms: durations.length ? durations.at(-1) : null,
    interactions,
  };
}

/** Self-contained report retaining collection failures without certifying coverage. */
export function summarizeReceipt(input) {
  if (!input || input.schema_version !== 1 || !['synthetic', 'observed'].includes(input.evidence)) {
    throw new TypeError('Require schema_version 1 and explicit synthetic/observed evidence label');
  }
  const summary = summarizeEvents(input.entries);
  let collection = null;
  let collectionState = 'unknown';
  const collectionKeys = ['status', 'requested_duration_threshold_ms', 'buffered', 'max_entries', 'dropped_entry_count', 'invalid_entry_count', 'collector_overflowed'];
  if (collectionKeys.some(key => Object.hasOwn(input, key))) {
    if (!collectionKeys.every(key => Object.hasOwn(input, key))) throw new TypeError('Incomplete collector metadata');
    if (!['observing', 'stopped', 'unsupported', 'observer_error'].includes(input.status)) throw new TypeError('Invalid collector status');
    if (input.buffered !== false || input.requested_duration_threshold_ms !== 16) throw new TypeError('Unexpected observer configuration');
    for (const key of ['max_entries', 'dropped_entry_count', 'invalid_entry_count']) {
      if (!Number.isSafeInteger(input[key]) || input[key] < 0) throw new TypeError(`Invalid ${key}`);
    }
    if (input.max_entries < 1 || input.max_entries > 100000 || input.entries.length > input.max_entries) throw new TypeError('Invalid collector capacity');
    if (input.collector_overflowed !== (input.dropped_entry_count > 0)) throw new TypeError('Inconsistent overflow metadata');
    collection = Object.fromEntries(collectionKeys.map(key => [key, input[key]]));
    collectionState = ['unsupported', 'observer_error'].includes(input.status) || input.dropped_entry_count || input.invalid_entry_count ? 'incomplete' : 'diagnostic_only';
  }
  return {
    schema_version: 1,
    evidence: input.evidence,
    collection_state: collectionState,
    collection,
    coverage_note: collection === null
      ? 'Entry-only input has no collector metadata; coverage is unknown. No completeness or INP claim.'
      : 'Collection metadata retained. Even zero drop/error counts do not prove complete browser delivery or scenario isolation. Not INP.',
    summary,
  };
}

/**
 * Bounded local-only diagnostic collector. Never records targets, text, URLs,
 * selectors, DOM nodes or key values; does not upload or persist anything.
 * maxEntries bounds this collector, not the browser's internal event buffer.
 */
export function startEventTiming({ Observer = globalThis.PerformanceObserver, maxEntries = 5000 } = {}) {
  if (!Number.isSafeInteger(maxEntries) || maxEntries < 1 || maxEntries > 100000) {
    throw new TypeError('maxEntries must be an integer from 1 to 100000');
  }
  let observer;
  let status = 'unsupported';
  let stopped = false;
  let dropped = 0;
  let invalid = 0;
  const entries = [];
  const ingest = rows => {
    for (const row of rows) {
      if (entries.length >= maxEntries) { dropped++; continue; }
      try { entries.push(normalizeEvent(row)); }
      catch { invalid++; }
    }
  };
  if (typeof Observer === 'function' && Observer.supportedEntryTypes?.includes('event')) {
    try {
      observer = new Observer(list => { if (!stopped) ingest(list.getEntries()); });
      // Do not request already-buffered entries. Earlier in-flight events can
      // still arrive; callers must check scenario timestamps separately.
      observer.observe({ type: 'event', buffered: false, durationThreshold: 16 });
      status = 'observing';
    } catch {
      observer?.disconnect();
      observer = undefined;
      status = 'observer_error';
    }
  }
  const snapshot = () => {
    if (observer && !stopped) ingest(observer.takeRecords());
    return {
      schema_version: 1,
      status,
      requested_duration_threshold_ms: 16,
      buffered: false,
      max_entries: maxEntries,
      dropped_entry_count: dropped,
      invalid_entry_count: invalid,
      collector_overflowed: dropped > 0,
      scope: 'Diagnostic samples only. No whole-page, all-interaction, field INP, scroll, paint or accessibility acceptance.',
      entries: entries.map(entry => ({ ...entry })),
      summary: summarizeEvents(entries),
    };
  };
  return {
    snapshot,
    stop() {
      if (!stopped) {
        if (observer) { ingest(observer.takeRecords()); observer.disconnect(); }
        stopped = true;
        if (status === 'observing') status = 'stopped';
      }
      return snapshot();
    },
  };
}
