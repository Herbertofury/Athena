// Pure catalog logic. Community, popularity, and benchmark evidence never mix.
export const SORTS = ['priority', 'name', 'stars', 'recent', 'community', 'external', 'measured'];
export const PAGE_SIZE = 24;
export const COMMUNITY_PRIOR = {mean: 3, weight: 5, minimum: 3};

export function safeURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function parseState(search = '') {
  const p = new URLSearchParams(search);
  const page = Number(p.get('page'));
  return {q: (p.get('q') || '').slice(0, 300), category: p.get('category') || '',
    kind: p.get('kind') || '', maturity: p.get('maturity') || '', evidence: p.get('evidence') || '',
    year: p.get('year') || '', track: p.get('track') || '', cohort: p.get('cohort') || '',
    sort: SORTS.includes(p.get('sort')) ? p.get('sort') : 'priority',
    page: Number.isInteger(page) && page > 0 ? Math.min(page, 10000) : 1};
}

export function encodeState(state) {
  const p = new URLSearchParams();
  for (const key of ['q', 'category', 'kind', 'maturity', 'evidence', 'year', 'track', 'cohort', 'sort', 'page']) {
    const value = state[key];
    if (value && !(key === 'sort' && value === 'priority') && !(key === 'page' && value === 1)) p.set(key, String(value));
  }
  return p.toString();
}

export function publishedDate(entry) {
  return (entry.sources || []).map(s => s.published_at || '').filter(Boolean).sort().at(-1) || '';
}

export function publicationYearMatches(entry, year) {
  const target = String(year);
  if (!/^\d{4}$/.test(target)) return false;
  return (entry.kind === 'paper' && Number.isInteger(entry.publication_year) &&
    String(entry.publication_year) === target) ||
    (entry.sources || []).some(s => typeof s.published_at === 'string' && s.published_at.slice(0, 4) === target);
}

export function repositorySignal(entry, catalog) {
  return entry.repo ? catalog.signals.repositories[entry.repo.toLowerCase()] || null : null;
}

export function communityScore(entry, catalog, track) {
  if (!track || entry.evaluation.track !== track) return null;
  // The ingestion step enforces one latest reviewed report per public account/candidate/track.
  const votes = catalog.community.ratings.filter(r => r.candidate_id === entry.id && r.track === track);
  if (!votes.length) return null;
  const total = votes.reduce((sum, r) => sum + r.score, 0);
  return {count: votes.length, mean: total / votes.length,
    adjusted: (total + COMMUNITY_PRIOR.mean * COMMUNITY_PRIOR.weight) / (votes.length + COMMUNITY_PRIOR.weight),
    eligible: votes.length >= COMMUNITY_PRIOR.minimum, votes};
}

export function cohortFor(catalog, state) {
  const type = state.sort === 'measured' ? 'atlas_measured' : state.sort === 'external' ? 'external_reported' : null;
  return type ? catalog.results.cohorts.find(c => c.id === state.cohort && c.evidence === type) || null : null;
}

export function measurement(entry, catalog, state) {
  const cohort = cohortFor(catalog, state);
  if (!cohort) return null;
  return catalog.results.observations.find(o => o.candidate_id === entry.id && o.cohort_id === cohort.id) || null;
}

export function evidenceFor(entry, catalog) {
  return catalog.results.observations.some(o => o.candidate_id === entry.id &&
    catalog.results.cohorts.some(c => c.id === o.cohort_id && c.evidence === 'atlas_measured')) ? 'measured' : 'candidate';
}

export function queryCatalog(catalog, state) {
  const terms = state.q.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const cohort = cohortFor(catalog, state);
  const needsCohort = ['external', 'measured'].includes(state.sort);
  if (needsCohort && !cohort) return {entries: [], total: 0, pages: 1, page: 1, reason: 'Choose one benchmark cohort to compare matching results.'};
  if (state.sort === 'community' && !state.track) return {entries: [], total: 0, pages: 1, page: 1, reason: 'Choose an evaluation track to compare community experience in a shared scope.'};
  let entries = catalog.entries.filter(e => {
    if (state.category && state.category !== e.category) return false;
    if (state.kind && state.kind !== e.kind) return false;
    if (state.maturity && state.maturity !== e.maturity) return false;
    if (state.track && state.track !== e.evaluation.track) return false;
    if (state.evidence && state.evidence !== evidenceFor(e, catalog)) return false;
    if (state.year && !publicationYearMatches(e, state.year)) return false;
    if (needsCohort && !measurement(e, catalog, state)) return false;
    const text = [e.name, e.summary, e.category, e.kind, e.repo || '', e.latest_signal || '', ...e.tags,
      e.evaluation.track, ...e.sources.map(s => s.title)].join(' ').toLocaleLowerCase();
    return terms.every(t => text.includes(t));
  });
  const value = e => {
    if (state.sort === 'stars') return repositorySignal(e, catalog)?.stars ?? null;
    if (state.sort === 'recent') return publishedDate(e) || null;
    if (state.sort === 'community') { const c = communityScore(e, catalog, state.track); return c?.eligible ? c.adjusted : null; }
    if (needsCohort) return measurement(e, catalog, state)?.value ?? null;
    if (state.sort === 'priority') return e.priority;
    return e.name.toLocaleLowerCase();
  };
  const ascending = ['priority', 'name'].includes(state.sort) || (cohort && cohort.direction === 'lower');
  entries.sort((a, b) => {
    const av = value(a), bv = value(b);
    if (av === null && bv !== null) return 1;
    if (bv === null && av !== null) return -1;
    if (av !== bv) return (av < bv ? -1 : 1) * (ascending ? 1 : -1);
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
  const total = entries.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(state.page, 1), pages);
  return {entries, total, pages, page, visible: entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), reason: null};
}

export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

export function exportCSV(entries, catalog, state = null) {
  const fields = ['id', 'name', 'kind', 'category', 'maturity', 'evidence', 'priority', 'track', 'github_stars', 'stars_observed_at', 'url'];
  if (state) fields.push('ranking_view', 'benchmark_cohort_id', 'benchmark_metric', 'benchmark_unit',
    'benchmark_direction', 'benchmark_value', 'benchmark_source_url', 'benchmark_observed_at',
    'community_track', 'community_report_count', 'community_raw_mean', 'community_adjusted_score', 'community_rank_eligible');
  const cohort = state ? cohortFor(catalog, state) : null;
  return [fields, ...entries.map(e => {
    const signal = repositorySignal(e, catalog);
    const values = [e.id, e.name, e.kind, e.category, e.maturity, evidenceFor(e, catalog), e.priority,
      e.evaluation.track, signal?.stars, signal?.observed_at, e.url];
    if (!state) return values;
    const result = cohort ? measurement(e, catalog, state) : null;
    const track = state.sort === 'community' && state.track === e.evaluation.track ? state.track : null;
    const community = track ? communityScore(e, catalog, track) : null;
    return [...values, state.sort, cohort?.id, cohort?.metric, cohort?.unit, cohort?.direction,
      result?.value, result?.source_url, result?.observed_at, track, community?.count, community?.mean,
      community?.eligible ? community.adjusted : null, community?.eligible];
  })].map(row => row.map(csvCell).join(',')).join('\r\n');
}

export function ratingURL(entry) {
  const url = new URL('https://github.com/Herbertofury/Engineering-Atlas/issues/new');
  url.searchParams.set('template', 'research-rating.yml');
  url.searchParams.set('title', '[Research rating] ' + entry.name);
  url.searchParams.set('candidate_id', entry.id);
  url.searchParams.set('track', entry.evaluation.track);
  return url.href;
}
