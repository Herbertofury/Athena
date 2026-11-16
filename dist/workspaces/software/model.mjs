// Pure catalog queries. No network, browser globals, quality scores or mutation.
export const FILTERS = ['family', 'category', 'platform', 'license', 'pricing', 'maintenance', 'task'];
const STOP = new Set('a an the i my me to for with and of on in want need how can do find show software tool tools application applications app apps best pc computer computers laptop programs help please that which what would could should like some something make create'.split(' '));
const SYNONYMS = {
  files: ['files', 'file', 'folder', 'folders'],
  disk: ['disk', 'disks', 'drive', 'drives'],
  image: ['image', 'images', 'imaging', 'clone', 'cloning'],
  code: ['code', 'coding', 'program', 'programming', 'developer', 'development', 'ide', 'ides'],
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
  simulate: ['simulate', 'simulation', 'simulations', 'simulator', 'simulating'],
  robot: ['robot', 'robots', 'robotics'],
  align: ['align', 'alignment', 'alignments', 'aligning'],
  sequence: ['sequence', 'sequences', 'sequencing'],
  validate: ['validate', 'validation', 'validating', 'validator', 'check', 'checker', 'checking'],
  workflow: ['workflow', 'workflows'],
  broadcast: ['broadcast', 'broadcasts', 'broadcasting'],
};
export function fold(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
export function terms(query) {
  return fold(query).replace(/back\s+up/g, 'backup').replace(/\bsoftware[\s-]+defined[\s-]+radio\b/g, 'sdr').split(/[^a-z0-9+#.]+/)
    .filter(t => t && !STOP.has(t)).slice(0, 24).map(t => {
      const group = Object.values(SYNONYMS).find(v => v.includes(t));
      return group || [t];
    });
}
export function indexCatalog(catalog) {
  const taskAliases = {'creative/capture-streaming': 'screen recording screen capture screencast', 'files/disk-imaging': 'disk image cloning bare metal backup'};
  return catalog.applications.map(app => ({app,
    name: fold(app.name),
    aliases: (app.aliases || []).map(fold),
    category: fold(app.category.replaceAll('-', ' ')),
    tasks: fold([app.category, taskAliases[app.category_id] || '', ...(app.use_cases || []), ...(app.tags || [])].join(' ')),
    text: fold([app.name, app.id, app.summary, app.family, app.category, app.license_kind, app.pricing_model,
      ...(app.features || []), ...(app.strengths || []), ...(app.use_cases || []),
      ...(app.tags || []), ...(app.aliases || []), ...(app.platforms || []), taskAliases[app.category_id] || ''].join(' ')),
  }));
}
function pattern(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Short terms must be whole words: AI is not mail; mod is not model.
  // Longer terms may prefix a word, retaining useful singular/stem searches.
  return new RegExp('(?:^|[^a-z0-9])' + escaped + (term.length <= 3 ? '(?=$|[^a-z0-9])' : ''), 'i');
}
export function alternativeTarget(query) {
  const value = fold(query).trim().replace(/[?.!]+$/, '').trim();
  return value.match(/\b(?:alternatives?\s+(?:to|for)|replacement\s+for|instead\s+of)\s+(.+?)$/)?.[1]?.trim() ||
    value.match(/^(?:(?:please|find|show|compare|me|an?|the|best)\s+)*(.+?)\s+alternatives?$/)?.[1]?.trim() || '';
}
function taskIntent(query) {
  const value = fold(query).replace(/[^a-z0-9+#.]+/g, ' ').trim();
  const taskWords = value.split(/\s+/).filter(word => !STOP.has(word)).join(' ');
  const capabilities = row => fold([row.app.summary, ...(row.app.features || []), ...(row.app.use_cases || [])].join(' '));
  let accepts, consumed, score;
  // A few high-confidence task phrases need semantic direction or category
  // context. Keep their expansion scoped: a photo is not a disk image, speech
  // recognition is not speech synthesis, and transfer tools are not analyzers.
  if (/\b(?:program|code|coding|develop|programming)\s+(?:in|using)\s+(?:python|c\+\+|c#|java|javascript|typescript|rust|go|ruby|php|kotlin|swift)(?:\s|$)/.test(value)) {
    // Writing programs calls for an editor or interactive development
    // environment. A linter, language runtime or Python-based application
    // mentioning code must not displace those results as the catalog grows.
    accepts = row => ['development/ides', 'development/code-editors', 'development/notebooks'].includes(row.app.category_id);
    score = row => row.app.category_id === 'development/ides' ? 30 : 0;
    consumed = /\b(?:program|code|coding|develop|programming|in|using)\b/g;
  } else if (/\bpdfs?\b/.test(value) && /\b(?:chat|ask|questions?|answers?)\b/.test(value) && /\b(?:offline|local|locally|disconnected)\b/.test(value)) {
    accepts = row => (row.app.capabilities || []).some(c => c.id === 'offline-pdf-chat');
    consumed = /\b(?:chat|ask|asking|questions?|answers?|about|over|pdfs?|documents?|offline|local|locally|disconnected)\b/g;
  } else if (/\b(?:noise|denoise|denoising)\b/.test(value) && /\b(?:remove|removing|removal|reduce|reducing|reduction|suppress|suppression|denoise|denoising)\b/.test(value) && !/\b(?:images?|photos?|pictures?|radio|signals?)\b/.test(value)) {
    const live = /\b(?:live|real time|microphone|mic|meetings?|calls?)\b/.test(value);
    accepts = row => (row.app.capabilities || []).some(c => c.id === (live ? 'live-audio-noise-suppression' : 'recorded-audio-noise-reduction'));
    consumed = /\b(?:remove|removing|removal|reduce|reducing|reduction|suppress|suppression|denoise|denoising|background|noise|audio|recorded|recordings?|from|live|real time|microphone|mic|meetings?|calls?)\b/g;
  } else if (/\b(?:duplicates?|similar)\b/.test(value) && /\b(?:photos?|images?|pictures?)\b/.test(value)) {
    accepts = row => row.app.category_id === 'files/duplicate-detection' && /\b(?:photo|picture|image)/.test(row.text);
    consumed = /\b(?:remove|removing|delete|deleting|find|detect|review|duplicates?|similar|photos?|images?|pictures?)\b/g;
  } else if (/\bocr\b/.test(value) || /\b(?:scan|scans|scanned|scanning)\b/.test(value) && /\b(?:docs?|documents?|paperwork|pages?)\b/.test(value)) {
    accepts = row => row.app.category_id === 'productivity/scanning-ocr';
    consumed = /\b(?:ocr|scan|scans|scanned|scanning|docs?|documents?|paperwork|pages?|pdfs?)\b/g;
  } else if (/\b(?:extract|extracting|extractor|export|recover)\b/.test(value) && /\b(?:games?|unity|unreal)\b/.test(value) && /\b(?:assets?|models?|textures?)\b/.test(value)) {
    // These entries explicitly cover extraction/reconstruction. Other game
    // asset editors specialize in modifying meshes or converting textures.
    accepts = row => ['fmodel', 'assetripper'].includes(row.app.id);
    consumed = /\b(?:extract|extracting|extractor|export|recover|games?|assets?|models?|textures?)\b/g;
  } else if (/\b(?:speech|audio) to text\b/.test(value)) {
    accepts = row => row.app.category_id === 'ai/speech-transcription';
    consumed = /\b(?:speech|audio|to|text)\b/g;
  } else if (/^(?:(?:locate|identify)\s+)?(?:large|largest|big|biggest)\s+(?:files?|folders?)\b/.test(taskWords)) {
    accepts = row => row.app.category_id === 'files/storage-analysis' &&
      /\b(?:files?|folders?|directories|directory)\b/.test(capabilities(row));
    consumed = /\b(?:find|locate|identify|large|largest|big|biggest|files?|folders?)\b/g;
  } else if (/\b(?:convert|conversion|transcode|transcoding|encode|encoding)\b/.test(value) && /\b(?:videos?|movies?|footage)\b/.test(value)) {
    accepts = row => row.app.category_id === 'creative/media-transcoding';
    consumed = /\b(?:convert|conversion|transcode|transcoding|encode|encoding|videos?|movies?|footage)\b/g;
  } else if (/\b(?:crop|cropping|resize|resizing|scale|scaling)\b/.test(value) && /\b(?:images?|photos?|pictures?)\b/.test(value) && !/\b(?:disk|drive|partition)\b/.test(value)) {
    // Crop/scale capabilities were checked in the official GIMP 3 manual,
    // ImageMagick mogrify documentation and IrfanView FAQ (2026-11-15).
    // https://docs.gimp.org/3.0/en/gimp-tool-crop.html
    // https://docs.gimp.org/3.0/en/gimp-image-scale.html
    // https://imagemagick.org/mogrify/ · https://www.irfanview.com/faq.htm
    accepts = row => ['gimp', 'imagemagick', 'irfanview'].includes(row.app.id);
    consumed = /\b(?:crop|cropping|resize|resizing|scale|scaling|images?|photos?|pictures?)\b/g;
  } else if (/\bmusic\b/.test(value) && /\b(?:make|create|compose|composing|produce|producing|production|write|record)\b/.test(value) && !/\b(?:videos?|movies?|playlists?|libraries|library|collections?)\b/.test(value)) {
    const creation = ['creative/audio-workstations', 'creative/music-notation', 'creative/live-coding-music', 'creative/audio-programming', 'creative/modular-audio', 'creative/software-synthesizers'];
    accepts = row => creation.includes(row.app.category_id);
    score = row => row.app.category_id === 'creative/audio-workstations' ? 30 : 0;
    consumed = /\b(?:make|create|compose|composing|produce|producing|production|write|record|music)\b/g;
  } else if (/\b(?:remove|removal|clean|cleanup|cleaning|disinfect)\b/.test(value) && /\b(?:malware|viruses?|infections?)\b/.test(value)) {
    // A scanning engine alone does not establish a removal workflow.
    accepts = row => row.app.category_id === 'security/malware-scanning' && /\b(?:remov|clean|quarant)/.test(capabilities(row));
    consumed = /\b(?:remove|removal|clean|cleanup|cleaning|disinfect|malware|viruses?|infections?)\b/g;
  } else if (/\bnetwork\b/.test(value) && /\btraffic\b/.test(value) && (/\b(?:monitor|monitoring|watch|watching|inspect|inspecting|analyze|analyse|analysis|capture|capturing|observe)\b/.test(value) || /^(?:network traffic|traffic network)\b/.test(taskWords))) {
    accepts = row => ['networking/traffic-monitoring', 'networking/packet-analysis', 'networking/packet-capture'].includes(row.app.category_id);
    consumed = /\b(?:monitor|monitoring|watch|watching|inspect|inspecting|analyze|analyse|analysis|capture|capturing|observe|network|traffic)\b/g;
  } else if (/\b3d\b/.test(value) && /\b(?:print|printing|slicing|slice|slicer)\b/.test(value)) {
    accepts = row => row.app.category_id === 'science/3d-printing';
    consumed = /\b(?:3d|print|printing|slicing|slice|slicer|models?)\b/g;
  } else if (/\bpdfs?\b/.test(value) && !/\b(?:text|content)\b/.test(value) && (/\b(?:organize|organise|reorder|rearrange|merge|combine|split|rotate|crop|extract)\b/.test(value) || /\bpages?\b/.test(value) && /\b(?:edit|editing)\b/.test(value))) {
    const operations = [
      [/\b(?:merge|combine)\b/, /\b(?:merg|combin)/], [/\bsplit\b/, /\bsplit/],
      [/\b(?:reorder|rearrange)\b/, /\b(?:reorder|rearrang)/], [/\brotate\b/, /\brotat/],
      [/\bcrop\b/, /\bcrop/], [/\bextract\b/, /\bextract/],
    ].filter(([requested]) => requested.test(value));
    accepts = row => ['productivity/pdf-organization', 'productivity/pdf-processing', 'productivity/pdf-editors'].includes(row.app.category_id) &&
      operations.every(([, supported]) => supported.test(capabilities(row)));
    score = row => row.app.category_id === 'productivity/pdf-organization' ? 20 : 0;
    consumed = /\b(?:organize|organise|reorder|rearrange|merge|combine|split|rotate|crop|extract|edit|editing|pdfs?|pages?|documents?)\b/g;
  } else if (/\bpdfs?\b/.test(value) && /\b(?:edit|editing|editors?|modify|modifying)\b/.test(value)) {
    // Default PDF editing means existing page content. Readers, source-document
    // editors and page-only utilities do not satisfy this request. ABBYY's
    // record specifically limits its full PDF-editing workflow to Windows.
    accepts = (row, state) => row.app.category_id === 'productivity/pdf-editors' ||
      row.app.id === 'abbyy-finereader-pdf' && (!state.platform || state.platform === 'Windows') && !/\b(?:mac|macos|linux)\b/.test(value);
    score = row => row.app.category_id === 'productivity/pdf-editors' ? 20 : 0;
    consumed = /\b(?:edit|editing|editors?|modify|modifying|pdfs?|text|content|documents?|pages?)\b/g;
  }
  if (!accepts) return null;
  // Retain unrecognized qualifiers, so "Unity", "Windows", "free", etc.
  // still constrain matches rather than silently broadening the request.
  const remaining = value.replace(consumed, ' ');
  return {accepts, score, query: /\b(?:speech|audio) to text\b/.test(value) ? remaining.replace(/\boffline\b/g, 'local') : remaining};
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
  const target = alternativeTarget(state.q);
  const targetRow = target ? index.find(r => r.name === target || fold(r.app.id) === target || r.aliases.includes(target)) : null;
  const alternativeIds = new Set(targetRow?.app.alternative_ids || []);
  if (target) for (const row of index) {
    if ((targetRow && (row.app.alternative_ids || []).includes(targetRow.app.id)) || (row.app.alternatives || []).some(n => fold(n) === target)) alternativeIds.add(row.app.id);
  }
  if (targetRow) alternativeIds.delete(targetRow.app.id);
  const intent = target ? null : taskIntent(state.q);
  const tokens = (target ? [] : terms(intent?.query ?? state.q)).map(group => group.map(pattern));
  const task = catalog.recipes.find(r => r.id === state.task);
  const picks = new Map((task?.picks || []).map((p, i) => [p.app_id, i]));
  const rows = [];
  for (const row of index) {
    const a = row.app;
    if (target && !alternativeIds.has(a.id)) continue;
    if (intent && !intent.accepts(row, state)) continue;
    if (state.family && a.family !== state.family || state.category && a.category_id !== state.category ||
        state.platform && !a.platforms.includes(state.platform) || state.license && a.license_kind !== state.license ||
        state.pricing && a.pricing_model !== state.pricing || state.maintenance && a.maintenance.status !== state.maintenance ||
        state.task && (!task || !picks.has(a.id))) continue;
    if (!tokens.every(group => group.some(re => re.test(row.text)))) continue;
    const exact = fold(state.q).trim();
    const score = (row.name === exact ? 200 : row.aliases.includes(exact) ? 150 : 0) + (intent?.score?.(row) || 0) + tokens.reduce((n, group) => n + (group.some(re => re.test(row.name)) ? 20 : group.some(re => re.test(row.category)) ? 12 : group.some(re => re.test(row.tasks)) ? 6 : 1), 0);
    rows.push({app: a, score});
  }
  rows.sort((a, b) => {
    if (state.sort !== 'name' && task) return picks.get(a.app.id) - picks.get(b.app.id);
    return (state.sort === 'name' ? 0 : b.score - a.score) || a.app.name.localeCompare(b.app.name);
  });
  return rows.map(r => r.app);
}
export function queryResearch(records, query) {
  const tokens = terms(query).map(group => group.map(pattern));
  return records.filter(r => {
    const text = fold([r.name, r.summary, r.category, r.platform_notes, JSON.stringify(r.original)].join(' '));
    return tokens.every(group => group.some(re => re.test(text)));
  });
}
export function relatedGuides(catalog, applications, limit = 3) {
  const visible = new Set(applications.map(a => a.id));
  return catalog.recipes.map(recipe => ({recipe, matched: recipe.picks.filter(p => visible.has(p.app_id)).length}))
    .filter(item => item.matched > 0)
    .sort((a, b) => b.matched - a.matched || a.recipe.title.localeCompare(b.recipe.title))
    .slice(0, limit);
}
export function queryGuides(catalog, query = '', eligibleIds = null) {
  const tokens = terms(query).map(group => group.map(pattern));
  const names = new Map(catalog.applications.map(app => [app.id, app.name]));
  return catalog.recipes.map(recipe => {
    const title = fold(recipe.title);
    const text = fold([recipe.title, recipe.description,
      ...recipe.picks.flatMap(pick => [names.get(pick.app_id), pick.label, pick.reason])].join(' '));
    const available = recipe.picks.filter(pick => !eligibleIds || eligibleIds.has(pick.app_id)).length;
    const score = tokens.reduce((total, group) => total + (group.some(re => re.test(title)) ? 5 : 1), 0);
    return {recipe, text, available, score};
  }).filter(item => item.available && tokens.every(group => group.some(re => re.test(item.text))))
    .sort((a, b) => b.score - a.score || a.recipe.title.localeCompare(b.recipe.title))
    .map(({recipe, available}) => ({recipe, available}));
}
export function safeLink(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null; }
  catch { return null; }
}
export function comparisonRows(apps) {
  return [
    ['Choose for', a => a.recommendation.pick_for], ['Compare when', a => a.recommendation.compare_when],
    ['Platforms', a => a.platforms.join(', ') + (a.platform_notes ? '\n' + a.platform_notes : '')],
    ['Pricing model', a => [a.pricing_model, a.pricing_notes].filter(Boolean).join('\n')], ['License', a => a.license + ' (' + a.license_kind + ')'],
    ['Features', a => a.features.join('\n')], ['Strengths', a => a.strengths.join('\n')],
    ['Limitations', a => a.limitations.join('\n')],
    ['Maintenance', a => a.maintenance.status + ': ' + a.maintenance.note],
    ['Evidence', a => (a.evidence_status === 'legacy-research' ? a.legacy_evidence_status : 'Official documentation reviewed; not installed or benchmarked unless a separate scoped measurement is linked in details') + (a.evaluation_ids?.length ? '\nScoped measurement available in tool details.' : '')],
  ].map(([label, get]) => ({label, values: apps.map(get)}));
}
