// Pure catalog queries. No network, browser globals, quality scores or mutation.
export const FILTERS = ['family', 'category', 'platform', 'license', 'pricing', 'maintenance', 'task'];
const STOP = new Set('a an the i my me to for with and of on in want need how can do find show software tool tools application applications app apps best pc computer computers laptop program programs'.split(' '));
const SYNONYMS = {
  files: ['files', 'file', 'folder', 'disk', 'image'],
  backup: ['backup', 'backups', 'snapshot', 'archival'],
  recover: ['recovery', 'recover', 'undelete', 'restore', 'deleted'],
  duplicates: ['duplicate', 'duplicates', 'deduplication', 'deduplicate'],
  encrypt: ['encrypt', 'encryption', 'encrypted', 'cryptographic'],
  password: ['password', 'passwords', 'credentials'],
  screenshot: ['screenshot', 'screen capture', 'screen grab'],
  record: ['record', 'recording', 'capture'],
  remote: ['remote', 'rdp', 'vnc', 'ssh'],
  subtitles: ['subtitle', 'subtitles', 'captions', 'captioning'],
  transcribe: ['transcribe', 'transcription', 'speech recognition'],
  map: ['map', 'maps', 'mapping', 'gis', 'geospatial'],
  photo: ['photo', 'photography', 'photographic', 'image'],
  automate: ['automation', 'automate', 'macro', 'scripting'],
  compress: ['compress', 'compression', 'archive', 'transcode', 'transcoding'],
  clean: ['clean', 'cleanup', 'cleaner', 'uninstall'],
  sync: ['sync', 'synchronize', 'synchronization', 'synchronise'],
  edit: ['edit', 'editor', 'editing'],
  notes: ['notes', 'note', 'notebook', 'knowledge'],
  mods: ['mods', 'mod', 'modding'],
  monitor: ['monitor', 'monitoring', 'sensor', 'diagnostics'],
  video: ['video', 'videos', 'movie', 'movies'],
  read: ['read', 'reader', 'reading', 'readers'],
  manage: ['manage', 'manager', 'management', 'managing'],
};
export function fold(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
export function terms(query) {
  return fold(query).replace(/back\s+up/g, 'backup').split(/[^a-z0-9+#.]+/)
    .filter(t => t && !STOP.has(t)).slice(0, 24).map(t => {
      const group = Object.values(SYNONYMS).find(v => v.includes(t));
      return group || [t];
    });
}
export function indexCatalog(catalog) {
  return catalog.applications.map(app => ({app,
    name: fold(app.name),
    category: fold(app.category.replaceAll('-', ' ')),
    tasks: fold([app.category, ...(app.use_cases || []), ...(app.tags || [])].join(' ')),
    text: fold([app.name, app.id, app.summary, app.family, app.category, app.license_kind, app.pricing_model,
      ...(app.features || []), ...(app.strengths || []), ...(app.use_cases || []),
      ...(app.tags || []), ...(app.aliases || []), ...(app.platforms || [])].join(' ')),
  }));
}
function matches(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Short terms must be whole words: AI is not mail; mod is not model.
  // Longer terms may prefix a word, retaining useful singular/stem searches.
  return new RegExp('(?:^|[^a-z0-9])' + escaped + (term.length <= 3 ? '(?=$|[^a-z0-9])' : ''), 'i').test(text);
}
export function parseState(route = '', saved = {}) {
  const raw = String(route).split('?')[1];
  const p = new URLSearchParams(raw ?? '');
  // Explicit routes are authoritative; a bare route can restore local filters.
  const source = raw === undefined && saved && typeof saved === 'object' ? saved : {};
  const state = {q: String(p.get('q') ?? source.q ?? '').slice(0, 300)};
  for (const key of FILTERS) state[key] = String(p.get(key) ?? source[key] ?? '').slice(0, 100);
  state.sort = ['relevance', 'name'].includes(p.get('sort') ?? source.sort) ? (p.get('sort') ?? source.sort) : 'relevance';
  return state;
}
export function encodeState(state) {
  const p = new URLSearchParams();
  for (const key of ['q', ...FILTERS, 'sort']) if (state[key] && !(key === 'sort' && state[key] === 'relevance')) p.set(key, state[key]);
  return p.toString();
}
export function normalizeState(state, catalog) {
  const next = {...state}, removed = [];
  const originalCategory = next.category;
  const visited = new Set();
  while (catalog.category_aliases?.[next.category] && !visited.has(next.category)) {
    visited.add(next.category); next.category = catalog.category_aliases[next.category];
  }
  // An old category can move to a different family. Keep a matching old
  // family in step, while still rejecting independently conflicting filters.
  if (next.category !== originalCategory && next.family === originalCategory?.split('/')[0]) {
    next.family = next.category.split('/')[0];
  }
  const allowed = {
    family: catalog.families.map(x => x.id), category: catalog.categories.map(x => x.id),
    platform: Object.keys(catalog.counts.by_platform),
    license: ['open-source', 'source-available', 'proprietary', 'mixed', 'unknown'],
    pricing: ['free', 'freemium', 'paid', 'subscription', 'mixed', 'unknown'],
    maintenance: ['active', 'archived', 'discontinued', 'unverified'],
    task: catalog.recipes.map(x => x.id),
  };
  for (const key of FILTERS) if (next[key] && !allowed[key].includes(next[key])) {removed.push(key + '=' + next[key]); next[key] = '';}
  if (next.category && next.family && !catalog.categories.some(c => c.id === next.category && c.family === next.family)) {removed.push('category=' + next.category); next.category = '';}
  return {state: next, removed};
}
export function queryCatalog(index, state, catalog) {
  const tokens = terms(state.q);
  const task = catalog.recipes.find(r => r.id === state.task);
  const picks = new Map((task?.picks || []).map((p, i) => [p.app_id, i]));
  const rows = [];
  for (const row of index) {
    const a = row.app;
    if (state.family && a.family !== state.family || state.category && a.category_id !== state.category ||
        state.platform && !a.platforms.includes(state.platform) || state.license && a.license_kind !== state.license ||
        state.pricing && a.pricing_model !== state.pricing || state.maintenance && a.maintenance.status !== state.maintenance ||
        state.task && (!task || !picks.has(a.id))) continue;
    if (!tokens.every(group => group.some(t => matches(row.text, t)))) continue;
    const score = (row.name === fold(state.q).trim() ? 200 : 0) + tokens.reduce((n, group) => n + (group.some(t => matches(row.name, t)) ? 20 : group.some(t => matches(row.category, t)) ? 12 : group.some(t => matches(row.tasks, t)) ? 6 : 1), 0);
    rows.push({app: a, score});
  }
  rows.sort((a, b) => {
    if (state.sort !== 'name' && task) return picks.get(a.app.id) - picks.get(b.app.id);
    return (state.sort === 'name' ? 0 : b.score - a.score) || a.app.name.localeCompare(b.app.name);
  });
  return rows.map(r => r.app);
}
export function queryResearch(records, query) {
  const tokens = terms(query);
  return records.filter(r => {
    const text = fold([r.name, r.summary, r.category, r.platform_notes, JSON.stringify(r.original)].join(' '));
    return tokens.every(group => group.some(term => matches(text, term)));
  });
}
export function safeLink(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null; }
  catch { return null; }
}
export function comparisonRows(apps) {
  return [
    ['Choose for', a => a.recommendation.pick_for], ['Compare when', a => a.recommendation.compare_when],
    ['Platforms', a => a.platforms.join(', ') + (a.platform_notes ? '\n' + a.platform_notes : '')],
    ['Pricing model', a => a.pricing_model], ['License', a => a.license + ' (' + a.license_kind + ')'],
    ['Features', a => a.features.join('\n')], ['Strengths', a => a.strengths.join('\n')],
    ['Limitations', a => a.limitations.join('\n')],
    ['Maintenance', a => a.maintenance.status + ': ' + a.maintenance.note],
    ['Evidence', a => a.evidence_status === 'legacy-research' ? a.legacy_evidence_status : 'Official documentation reviewed; not installed or benchmarked'],
  ].map(([label, get]) => ({label, values: apps.map(get)}));
}
