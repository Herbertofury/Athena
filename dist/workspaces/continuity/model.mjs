// Native Athena continuity contract. No provider requests, execution or grants.
export function fresh() { return {schema: 2, entries: []}; }
const kinds = new Set(['decision', 'next-action', 'resource', 'blocker']);
const actions = new Set(['created', 'revised', 'pinned', 'unpinned', 'ignored', 'restored', 'linked', 'unlinked', 'dependency-reviewed']);
function text(value, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw Error('Missing or oversized text');
  return value.trim();
}
function source(value) {
  if (!value) return '';
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw Error('Source must be HTTPS without credentials');
  return url.href;
}
export function validate(value) {
  if (!value || ![1, 2].includes(value.schema) || !Array.isArray(value.entries)) throw Error('Unsupported continuity data');
  const ids = new Set();
  for (const entry of value.entries) {
    text(entry.id, 100);
    if (ids.has(entry.id)) throw Error('Duplicate ID');
    ids.add(entry.id);
    text(entry.project, 200);
    if (!kinds.has(entry.kind) || typeof entry.pinned !== 'boolean' || typeof entry.ignored !== 'boolean' || !Array.isArray(entry.revisions) || !entry.revisions.length || !Array.isArray(entry.history)) throw Error('Invalid entry');
    for (const revision of entry.revisions) {
      text(revision.text, 10000); source(revision.source);
      if (!Number.isFinite(revision.at)) throw Error('Invalid revision time');
    }
    for (const event of entry.history) {
      if (!actions.has(event.action) || !Number.isFinite(event.at)) throw Error('Invalid policy history');
    }
    if (entry.dependencies !== undefined) {
      if (!Array.isArray(entry.dependencies)) throw Error('Invalid dependencies');
      const linked = new Set();
      for (const dependency of entry.dependencies) {
        text(dependency.id, 100);
        if (linked.has(dependency.id) || !Number.isSafeInteger(dependency.revision) || dependency.revision < 1) throw Error('Invalid dependency revision');
        linked.add(dependency.id);
      }
    }
  }
  // Quota is reported by the actual persistence owner. Do not discard an otherwise
  // valid exportable draft merely because it exceeds a guessed record/byte count.
  const result = structuredClone(value);
  result.schema = 2; // Lossless upgrade of legacy notes; original input remains untouched.
  return result;
}
export function apply(value, action, now = Date.now()) {
  const next = validate(value);
  if (!Number.isFinite(now)) throw Error('Invalid time');
  if (action.type === 'add') {
    const id = text(action.id, 100);
    if (next.entries.some(entry => entry.id === id)) throw Error('Duplicate ID');
    if (!kinds.has(action.kind)) throw Error('Unknown kind');
    next.entries.push({id, project: text(action.project, 200), kind: action.kind, pinned: false, ignored: false,
      revisions: [{text: text(action.text, 10000), source: source(action.source), at: now}], history: [{action: 'created', at: now}]});
  } else {
    const entry = next.entries.find(item => item.id === action.id);
    if (!entry) throw Error('Entry not found');
    if (action.type === 'revise') {
      entry.revisions.push({text: text(action.text, 10000), source: source(action.source), at: now});
      entry.history.push({action: 'revised', at: now});
    } else if (action.type === 'pin') {
      entry.pinned = !entry.pinned;
      entry.history.push({action: entry.pinned ? 'pinned' : 'unpinned', at: now});
    } else if (action.type === 'ignore') {
      entry.ignored = !entry.ignored;
      entry.history.push({action: entry.ignored ? 'ignored' : 'restored', at: now});
    } else if (['link', 'unlink', 'review-dependency'].includes(action.type)) {
      const dependencies = entry.dependencies ||= [];
      const index = dependencies.findIndex(item => item.id === action.dependencyId);
      if (action.type === 'unlink') {
        if (index < 0) throw Error('Dependency not found');
        const [previous] = dependencies.splice(index, 1);
        entry.history.push({action: 'unlinked', dependencyId: previous.id, revision: previous.revision, at: now});
      } else {
        const dependency = next.entries.find(item => item.id === action.dependencyId);
        if (!dependency) throw Error('Dependency not found');
        if (action.type === 'review-dependency' && index < 0) throw Error('Link the dependency before reviewing it');
        if (action.type === 'link' && index >= 0) return next; // Repeat click does not silently acknowledge changed evidence.
        const previousRevision = index < 0 ? null : dependencies[index].revision;
        const reference = {id: dependency.id, revision: dependency.revisions.length};
        if (index < 0) dependencies.push(reference); else dependencies[index] = reference;
        entry.history.push({action: index < 0 ? 'linked' : 'dependency-reviewed', dependencyId: dependency.id, previousRevision, revision: reference.revision, at: now});
      }
    } else throw Error('Unknown action');
  }
  return validate(next);
}
// Used with an immutable, already validated snapshot; no subscriptions or persisted cache.
export function prepareVisible(validated) {
  const rows = validated.entries.map(entry => ({entry, haystack:null})).sort(({entry:a}, {entry:b}) => Number(b.pinned) - Number(a.pinned) || b.revisions.at(-1).at - a.revisions.at(-1).at || a.id.localeCompare(b.id));
  return (query = '', includeIgnored = false) => {
    const q = query.toLowerCase();
    return rows.filter(row => {
      const {entry}=row;
      if (!includeIgnored && entry.ignored) return false;
      if (!q) return true;
      row.haystack ??= [entry.project, entry.kind, ...entry.revisions.flatMap(rev => [rev.text, rev.source])].join(' ').toLowerCase();
      return row.haystack.includes(q);
    }).map(row => row.entry);
  };
}
export function visible(value, query = '', includeIgnored = false) {
  return prepareVisible(validate(value))(query, includeIgnored);
}
