/** Synthetic-contract helpers, not a production search engine or browser adapter. */
export function requireText(value) {
  if (typeof value !== 'string' || value.length > 65536) throw new TypeError('Expected a string of at most 65536 UTF-16 code units');
  // Refuse malformed UTF-16 instead of silently replacing identifier/content bytes.
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new TypeError('Unpaired surrogate');
    } else if (unit >= 0xdc00 && unit <= 0xdfff) throw new TypeError('Unpaired surrogate');
  }
  return value;
}

export function compareText(left, right) {
  requireText(left); requireText(right);
  return {
    raw_equal: left === right,
    nfc_equal: left.normalize('NFC') === right.normalize('NFC'),
    nfkc_equal: left.normalize('NFKC') === right.normalize('NFKC'),
    default_lower_equal: left.toLowerCase() === right.toLowerCase(),
    turkish_lower_equal: left.toLocaleLowerCase('tr') === right.toLocaleLowerCase('tr'),
  };
}

export function textUnits(text, { Segmenter = globalThis.Intl?.Segmenter } = {}) {
  requireText(text);
  const common = { utf16_units: text.length, code_points: [...text].length };
  if (typeof Segmenter !== 'function') return { ...common, segmentation: 'unsupported', graphemes: null, resolved_locale: null };
  try {
    const segmenter = new Segmenter('en', { granularity: 'grapheme' });
    return { ...common, segmentation: 'observed', graphemes: [...segmenter.segment(text)].map(row => row.segment), resolved_locale: segmenter.resolvedOptions().locale };
  } catch {
    return { ...common, segmentation: 'error', graphemes: null, resolved_locale: null };
  }
}

export function discoveryProjection(record, form = 'NFC') {
  if (!record || !['NFC', 'NFKC'].includes(form)) throw new TypeError('Expected a record and NFC/NFKC policy');
  const { provider, id, title } = record;
  requireText(provider); requireText(id); requireText(title);
  if (!provider || !id) throw new TypeError('Provider and opaque ID must be nonempty');
  return Object.freeze({ provider, id, title, discovery_key: title.normalize(form), form });
}

/**
 * Pure single-field ownership model. No DOM, events, timers, fetch or state writes.
 * A request token is an in-process object retained by the caller's async closure.
 * It is not a transferable wire token or a security/authentication capability.
 */
export function createQueryOwner() {
  let disposed = false;
  let composing = false;
  let current = null;
  let lastSubmitted = null;
  let value = '';
  let sequence = 0;
  function invalidate() { current = null; lastSubmitted = null; }
  function submit(force = false) {
    if (disposed || composing || (!force && lastSubmitted === value)) return null;
    if (sequence === Number.MAX_SAFE_INTEGER) throw new RangeError('Sequence exhausted');
    current = Object.freeze({ sequence: ++sequence, query: value });
    lastSubmitted = value;
    return current;
  }
  return Object.freeze({
    input(nextValue, { isComposing = false } = {}) {
      requireText(nextValue);
      if (typeof isComposing !== 'boolean') throw new TypeError('Expected Boolean isComposing');
      if (disposed) return null;
      value = nextValue;
      if (isComposing && !composing) { composing = true; invalidate(); }
      return composing ? null : submit();
    },
    compositionStart() {
      if (disposed) return;
      composing = true;
      invalidate();
    },
    compositionEnd(finalValue) {
      requireText(finalValue);
      if (disposed || !composing) return null;
      value = finalValue;
      composing = false;
      return submit();
    },
    retry() { return lastSubmitted === null ? null : submit(true); },
    complete(token) {
      if (disposed || composing || current === null || token !== current) return false;
      current = null;
      return true;
    },
    dispose() { disposed = true; composing = false; invalidate(); },
    state() { return Object.freeze({ disposed, composing, value, submitted: lastSubmitted, pending: current !== null, sequence }); },
  });
}
