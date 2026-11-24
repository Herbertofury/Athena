import {parseState, encodeState, queryCatalog, repositorySignal, communityScore, publishedDate,
  evidenceFor, cohortFor, measurement, exportCSV, safeURL, ratingURL, COMMUNITY_PRIOR, publicationYearMatches,
  testPlanFor, plansForCandidate, buildTestPlanProposal} from './explorer-core.659d5fdf9e79fc53.mjs';

const $ = id => document.getElementById(id);
const REPO = 'https://github.com/Herbertofury/Engineering-Atlas';
let catalog;
let state = parseState(location.search);
let shortlist = [];
let visibleQuery;
let toastTimer;

function element(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (value !== null && value !== undefined) node.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) if (child !== null && child !== undefined) node.append(child);
  return node;
}

function link(text, url, className = '') {
  const href = safeURL(url);
  return href ? element('a', {href, class: className, target: '_blank', rel: 'noopener noreferrer'}, text) : element('span', {}, text);
}

function dateLabel(date) {
  if (!date) return 'Date not reported';
  const d = new Date(date.length === 10 ? date + 'T12:00:00Z' : date);
  return Number.isNaN(d.valueOf()) ? 'Date not reported' : new Intl.DateTimeFormat('en', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'}).format(d);
}

function compact(number) { return new Intl.NumberFormat('en', {notation: 'compact', maximumFractionDigits: 1}).format(number); }
function title(text) { return text.replaceAll('-', ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function trackLabel(id) { return catalog.tracks.find(t => t.id === id)?.label || title(id); }
function categoryLabel(id) { return catalog.categories.find(t => t.id === id)?.label || title(id); }
function layerLabel(id) { return (catalog.layers || []).find(layer => layer.id === id)?.label || title(id); }

function planLink(plan) {
  return element('a', {href: '?' + encodeState({...parseState(''), plan: plan.id}) + '#catalog'}, plan.title);
}

function notify(message) {
  $('toast').textContent = message;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
}

function setState(change, resetPage = true) {
  state = {...state, ...change, ...(resetPage ? {page: 1} : {})};
  render();
}

function saveShortlist() {
  try { localStorage.setItem('engineering-atlas-shortlist-v1', JSON.stringify(shortlist)); }
  catch { notify('Browser storage is unavailable. Your shortlist will last for this page session.'); }
  $('shortlist-count').textContent = shortlist.length;
}

function toggleShortlist(id, checked) {
  if (checked && !shortlist.includes(id)) {
    if (shortlist.length >= 4) { notify('Compare up to four candidates at a time. Remove one from your shortlist first.'); return false; }
    shortlist.push(id);
  } else if (!checked) shortlist = shortlist.filter(item => item !== id);
  saveShortlist();
  return true;
}

function download(name, content, type = 'application/json') {
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = element('a', {href: url, download: name});
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function populateSelect(id, rows) {
  const select = $(id);
  while (select.options.length > 1) select.remove(1);
  for (const row of rows) select.add(new Option(row.label, row.id));
}

function renderNavigation() {
  const counts = new Map(catalog.categories.map(c => [c.id, catalog.entries.filter(e => e.category === c.id).length]));
  $('all-count').textContent = catalog.entries.length;
  $('all-categories').classList.toggle('active', !state.category);
  $('all-categories').setAttribute('aria-pressed', String(!state.category));
  $('category-list').replaceChildren(...catalog.categories.map(category =>
    element('button', {type: 'button', class: 'nav-button' + (state.category === category.id ? ' active' : ''),
      'aria-pressed': String(state.category === category.id), onclick: () => setState({category: category.id})},
      element('span', {}, category.label), element('span', {class: 'nav-count'}, String(counts.get(category.id))))));
}

function renderStats() {
  const measured = catalog.entries.filter(e => evidenceFor(e, catalog) === 'measured').length;
  const recent = catalog.entries.filter(e => publicationYearMatches(e, '2026')).length;
  const sources = new Set(catalog.entries.flatMap(e => e.sources.map(source => source.url)));
  const stats = [[catalog.entries.length, 'Candidates'], [sources.size, 'Primary URLs'], [recent, '2026 publications'], [measured, 'Measured candidates']];
  $('stats').replaceChildren(...stats.map(([value, label]) => element('div', {}, element('dt', {}, label), element('dd', {}, String(value)))));
  $('snapshot').textContent = 'SNAPSHOT / ' + dateLabel(catalog.snapshot_date).toUpperCase();
  $('snapshot').title = catalog.snapshot_timezone + '; source check timestamps are UTC.';
}

function renderLayerGuide() {
  const layer = (catalog.layers || []).find(item => item.id === state.layer);
  const guide = $('layer-guide');
  guide.hidden = !layer;
  if (!layer) { guide.replaceChildren(); return; }
  const choices = [['Reference choices', 'baseline_ids'], ['Compare next', 'challenger_ids'], ['Research watchlist', 'watch_ids']];
  const groups = choices.map(([label, key]) => element('div', {}, element('h4', {}, label),
    layer[key].length ? element('ul', {}, layer[key].map(id => {
      const entry = catalog.entries.find(item => item.id === id);
      const view = encodeState({...parseState(''), layer: layer.id, q: entry.name});
      return element('li', {}, element('a', {href: '?' + view + '#catalog'}, entry.name));
    })) : element('p', {}, 'None selected for this role.')));
  guide.replaceChildren(element('p', {class: 'eyebrow'}, 'A STARTING POINT FOR THIS LAYER'),
    element('h3', {}, layer.label), element('p', {class: 'layer-decision'}, layer.decision),
    element('div', {class: 'layer-choices'}, groups),
    element('p', {class: 'layer-gate'}, element('strong', {}, 'Adoption gate: '), layer.gate),
    element('p', {class: 'layer-scope'}, 'Editorial roles, not measured winners. A layer can contain complementary components. Compare only the same functional role and workload; adding a component is a separate variable from replacing one.'));
  const plans = (catalog.test_plans || []).filter(plan => plan.layer_ids.includes(layer.id));
  if (plans.length) guide.append(element('div', {class: 'related-plans'}, element('h4', {}, 'Planned comparisons'),
    element('ul', {}, plans.map(plan => element('li', {}, planLink(plan))))));
}

function renderPlanGuide() {
  const plan = testPlanFor(catalog, state.plan);
  const guide = $('plan-guide');
  guide.hidden = !plan;
  $('plan-summary').textContent = (catalog.test_plans || []).length + ' planned comparisons. Plans describe work to run; they are not results.';
  if (!plan) { guide.replaceChildren(); return; }
  const groups = [['Reference contract', 'controls'], ['Required gates', 'gates'], ['Measure', 'metrics']];
  guide.replaceChildren(element('div', {class: 'plan-heading'},
      element('div', {}, element('p', {class: 'eyebrow'}, 'PLANNED / P' + plan.priority), element('h3', {}, plan.title)),
      element('button', {type: 'button', class: 'button primary', onclick: () => {
        download(plan.id + '.json', JSON.stringify(buildTestPlanProposal(catalog, plan.id), null, 2));
        notify('Plan download requested. Pin the baseline, workload and execution details before running.');
      }}, 'Export this plan ↓')),
    element('p', {class: 'plan-decision'}, plan.decision),
    element('p', {class: 'plan-scope'}, plan.candidate_ids.length + ' registered candidates · ' + plan.layer_ids.map(layerLabel).join(' · ') +
      '. Other filters can narrow the visible list; the plan export always includes every registered candidate.'),
    element('div', {class: 'plan-contract'}, groups.map(([label, key]) => element('div', {}, element('h4', {}, label), bulletList(plan[key])))),
    element('details', {class: 'plan-protocol'}, element('summary', {}, 'Execution protocol and evidence requirements'),
      bulletList(plan.protocol), element('p', {}, 'Baseline revisions, workload hashes, environment, acceptance thresholds and raw evidence remain unfilled until a real experiment is prepared. A shared plan can contain complementary components; compare only equivalent configurations.')));
}

function signal(entry) {
  if (state.sort === 'measured' || state.sort === 'external') {
    const m = measurement(entry, catalog, state), c = cohortFor(catalog, state);
    return [new Intl.NumberFormat('en', {maximumFractionDigits: c?.unit === 'ms' ? 4 : 2}).format(m.value) + ' ' + c.unit,
      c.direction === 'lower' ? 'Lower is better · this cohort' : 'Higher is better · this cohort'];
  }
  if (state.sort === 'community') {
    const score = communityScore(entry, catalog, state.track);
    if (!score) return ['Unrated', 'No reviewed reports'];
    return [score.eligible ? score.adjusted.toFixed(2) + ' / 5' : score.mean.toFixed(1) + ' / 5',
      score.count + ' reports · ' + (score.eligible ? 'adjusted mean' : 'not enough to rank')];
  }
  if (state.sort === 'recent') return [publishedDate(entry) ? dateLabel(publishedDate(entry)) : 'Undated', 'Latest cited publication'];
  if (state.sort === 'stars') {
    const s = repositorySignal(entry, catalog);
    return s ? ['☆ ' + compact(s.stars), 'GitHub · ' + dateLabel(s.observed_at)] : ['—', entry.repo ? 'Snapshot unavailable' : 'No GitHub repository'];
  }
  const labels = {1: 'Test first', 2: 'Test next', 3: 'Watch / explore'};
  return [labels[entry.priority], 'Editorial priority · P' + entry.priority];
}

function bulletList(items) { return element('ul', {}, items.map(item => element('li', {}, item))); }

function detail(entry) {
  const s = repositorySignal(entry, catalog);
  const sources = element('ul', {class: 'source-list'}, entry.sources.map(source => element('li', {},
    link(source.title, source.url), element('small', {},
      (source.published_at ? 'Published ' + dateLabel(source.published_at) + ' · ' : 'Publication date not recorded · ') +
      'Checked ' + dateLabel(source.checked_at) + ' UTC'), element('span', {}, source.note || ''))));
  const column1 = element('div', {}, element('h4', {}, 'What changed / why investigate'),
    element('p', {}, entry.latest_signal || entry.summary), element('h4', {}, 'Proposed test · ' + trackLabel(entry.evaluation.track)),
    element('p', {}, entry.evaluation.proposal), element('h4', {}, 'Measure'), bulletList(entry.evaluation.metrics),
    element('h4', {}, 'Constraints and possible disqualifiers'), bulletList(entry.evaluation.caveats));
  if (entry.layers?.length) column1.append(element('h4', {}, 'Stack layers'), element('p', {}, entry.layers.map(layerLabel).join(' · ')));
  const plans = plansForCandidate(entry, catalog);
  if (plans.length) column1.append(element('h4', {}, 'Registered test plans'),
    element('ul', {}, plans.map(plan => element('li', {}, planLink(plan)))));
  const column2 = element('div', {}, element('h4', {}, 'Primary sources'), sources,
    element('h4', {}, 'Test priority rationale'), element('p', {}, entry.priority_reason),
    element('h4', {}, 'Repository snapshot'), element('p', {}, s ?
      s.stars.toLocaleString() + ' stars · ' + s.forks.toLocaleString() + ' forks · ' +
      (s.license || 'License not identified by GitHub') + ' · ' + (s.archived ? 'Archived' : 'Not archived') +
      ' · observed ' + dateLabel(s.observed_at) + ' UTC. Popularity does not establish quality or license permission.' :
      'No repository snapshot is available. Missing data is not zero and does not imply poor quality.'));
  const observation = measurement(entry, catalog, state);
  if (observation) column1.append(element('h4', {}, 'Displayed measurement'),
    element('p', {}, observation.subject), link('Inspect the recorded evidence ↗', observation.source_url),
    element('p', {}, observation.note || ''));
  const votes = communityScore(entry, catalog, entry.evaluation.track);
  if (votes) column2.append(element('h4', {}, 'Reviewed community reports'),
    element('p', {}, votes.count + ' reports; unadjusted mean ' + votes.mean.toFixed(2) + '/5. Moderation verifies submission structure, not the claim.'),
    element('ul', {}, votes.votes.map(v => element('li', {}, link('@' + v.author + ' · ' + v.score + '/5', v.issue_url)))));
  const actions = element('div', {class: 'entry-actions'}, link('Open project / paper ↗', entry.url, 'button secondary'),
    link('Submit experience rating ↗', ratingURL(entry), 'button secondary'));
  if (entry.repo) actions.append(link('GitHub repository ↗', 'https://github.com/' + entry.repo, 'button secondary'));
  return element('details', {class: 'card-detail'}, element('summary', {}, 'Sources, test proposal & constraints'),
    element('div', {class: 'detail-content'}, element('div', {class: 'detail-grid'}, column1, column2), actions));
}

function card(entry, index) {
  const isPaper = entry.kind === 'paper';
  const [value, label] = signal(entry);
  const measured = evidenceFor(entry, catalog) === 'measured';
  const publisherReported = catalog.results.observations.some(o => o.candidate_id === entry.id &&
    catalog.results.cohorts.some(c => c.id === o.cohort_id && c.evidence === 'external_reported'));
  const labelText = measured ? 'Atlas measured' : publisherReported ? 'Publisher reported' : 'Candidate';
  const check = element('input', {type: 'checkbox', 'aria-label': 'Shortlist ' + entry.name});
  check.checked = shortlist.includes(entry.id);
  check.addEventListener('change', () => { if (!toggleShortlist(entry.id, check.checked)) check.checked = false; });
  const icon = ['measured', 'external'].includes(state.sort) ? String(index + 1).padStart(2, '0') : isPaper ? 'P' : entry.kind === 'language' ? '{ }' : '↗';
  return element('article', {class: 'research-card', 'data-candidate': entry.id},
    element('div', {class: 'card-main'}, element('span', {class: 'entry-icon' + (isPaper ? ' paper' : ''), 'aria-hidden': 'true'}, icon),
      element('div', {}, element('div', {class: 'card-title'}, element('h3', {}, link(entry.name, entry.url)),
        element('span', {class: 'badge' + (measured ? ' measured' : '')}, labelText),
        entry.maturity === 'experimental' ? element('span', {class: 'badge experimental'}, 'Experimental') : null),
        element('p', {class: 'card-summary'}, entry.summary),
        element('div', {class: 'card-meta'}, element('span', {class: 'type'}, title(entry.kind)),
          element('span', {class: 'divider', 'aria-hidden': 'true'}, '/'), element('span', {}, categoryLabel(entry.category)),
          entry.tags.slice(0, 3).map(tag => element('span', {class: 'badge'}, tag)))),
      element('div', {class: 'card-side'}, element('span', {class: 'signal'}, value, element('small', {}, label)),
        element('label', {class: 'shortlist-label'}, check, 'Compare'))), detail(entry));
}

function renderRankingNote() {
  const c = cohortFor(catalog, state);
  const messages = {
    priority: 'Test priority is an editorial queue based on relevance, tractability and available evidence. It is not a performance ranking. Open each entry for its rationale.',
    name: 'Alphabetical catalog. Candidate status means source-reviewed and proposed for testing; it does not establish an engineering win.',
    recent: 'Sorted by the latest publication date in each entry’s cited sources. An old project can have a new release. Unknown publication dates sort last.',
    stars: 'GitHub stars measure attention, not quality or performance. These are dated snapshots; repositories without a snapshot sort last. A mirror can differ from the canonical project.',
    community: 'Community ranking is scoped to the selected track. At least ' + COMMUNITY_PRIOR.minimum + ' distinct reviewed accounts are needed to rank. Adjusted mean = (sum of ratings + 15) / (reports + 5). No votes are invented.',
    external: c ? c.description + ' ' + c.caveats.join(' ') + ' Positions describe only the candidates in this catalog, not the full source leaderboard.' : 'Select a benchmark version and protocol. Scores from different cohorts are never combined.',
    measured: c ? c.description + ' ' + c.caveats.join(' ') : 'Choose a local experiment cohort. A measured result is specific to its retained workload and environment.'
  };
  const content = element('p', {}, messages[state.sort]);
  if (c) content.append(' ', link('Method and source ↗', c.source_url));
  if (state.sort === 'stars' && catalog.signals.errors.length) content.append(' Refresh history retains ' + catalog.signals.errors.length + ' retrieval errors, including resolved attempts; each successful snapshot keeps its actual observation date.');
  if (state.sort === 'community') {
    content.append(catalog.community.last_completed_at ? ' Last complete collection: ' + dateLabel(catalog.community.last_completed_at) + ' UTC.' : ' No complete community collection has been recorded.');
    if (catalog.community.errors.length) content.append(' Refresh history contains ' + catalog.community.errors.length + ' rejected reports or retrieval errors. A failed refresh retains the previous complete collection.');
    content.append(' ', link('Inspect the community snapshot ↗', REPO + '/blob/main/data/research-community.json'));
  }
  $('ranking-note').replaceChildren(element('span', {class: 'note-icon', 'aria-hidden': 'true'}, 'i'), content);
}

function render() {
  if (state.layer && !(catalog.layers || []).some(layer => layer.id === state.layer)) state.layer = '';
  renderNavigation();
  for (const key of ['layer', 'kind', 'maturity', 'evidence', 'year', 'track', 'plan', 'sort']) $(key).value = state[key];
  if ($('search').value !== state.q) $('search').value = state.q;
  const isBenchmark = ['external', 'measured'].includes(state.sort);
  $('cohort-control').hidden = !isBenchmark;
  populateSelect('cohort', catalog.results.cohorts.filter(c => c.evidence === (state.sort === 'measured' ? 'atlas_measured' : 'external_reported'))
    .map(c => ({id: c.id, label: c.label})));
  $('cohort').value = state.cohort;
  visibleQuery = queryCatalog(catalog, state);
  state.page = visibleQuery.page;
  const query = encodeState(state);
  history.replaceState(null, '', location.pathname + (query ? '?' + query : '') + location.hash);
  $('result-count').textContent = visibleQuery.total + ' of ' + catalog.entries.length + ' candidates' +
    (state.layer ? ' · ' + layerLabel(state.layer) : '') + (state.category ? ' · ' + categoryLabel(state.category) : '') +
    (testPlanFor(catalog, state.plan) ? ' · ' + testPlanFor(catalog, state.plan).title : '');
  if (!visibleQuery.total) $('results').replaceChildren(element('div', {class: 'empty'}, element('h3', {}, visibleQuery.reason ? 'Choose a comparison scope' : 'No matching candidates'),
    element('p', {}, visibleQuery.reason || 'Try fewer filters or a broader search. Missing results are not evidence that a project is unsuitable.')));
  else $('results').replaceChildren(...visibleQuery.visible.map((entry, index) => card(entry, (visibleQuery.page - 1) * 24 + index)));
  $('previous').disabled = state.page <= 1; $('next').disabled = state.page >= visibleQuery.pages;
  $('page-label').textContent = 'Page ' + state.page + ' of ' + visibleQuery.pages;
  renderRankingNote();
  renderLayerGuide();
  renderPlanGuide();
}

function showComparison() {
  const entries = shortlist.map(id => catalog.entries.find(e => e.id === id)).filter(Boolean);
  const tracks = new Set(entries.map(e => e.evaluation.track));
  $('comparison-note').textContent = !entries.length ? 'Select Compare on up to four catalog entries to build a test plan.' :
    tracks.size > 1 ? 'These candidates belong to different tracks. Compare their fit and test proposals; their scores do not form a shared ranking.' :
    'Shared track: ' + trackLabel(entries[0].evaluation.track) + '. Validate workload, versions and output contracts before comparing performance.';
  $('comparison-cards').replaceChildren(...entries.map(entry => element('article', {class: 'comparison-card'},
    element('h3', {}, entry.name), element('p', {}, entry.summary), element('h4', {}, 'Track / stage'),
    element('p', {}, trackLabel(entry.evaluation.track) + ' · ' + title(entry.maturity)), element('h4', {}, 'Proposed experiment'),
    element('p', {}, entry.evaluation.proposal), element('h4', {}, 'Metrics'), bulletList(entry.evaluation.metrics),
    element('h4', {}, 'Disqualifying constraints'), bulletList(entry.evaluation.caveats), link('Primary source ↗', entry.url),
    element('br'), element('button', {type: 'button', class: 'button secondary', onclick: () => {
      toggleShortlist(entry.id, false); render(); showComparison();
    }}, 'Remove from shortlist'))));
  $('shortlist-export').disabled = !entries.length;
  if (!$('compare-dialog').open) $('compare-dialog').showModal();
}

function bindEvents() {
  $('search').addEventListener('input', e => setState({q: e.target.value}));
  for (const key of ['layer', 'kind', 'maturity', 'evidence', 'year', 'track', 'plan', 'cohort']) $(key).addEventListener('change', e => setState({[key]: e.target.value}));
  $('sort').addEventListener('change', e => {
    const sort = e.target.value;
    const type = sort === 'measured' ? 'atlas_measured' : sort === 'external' ? 'external_reported' : null;
    setState({sort, cohort: type ? catalog.results.cohorts.find(c => c.evidence === type)?.id || '' : '',
      ...(type ? {q: '', category: '', layer: '', plan: '', kind: '', maturity: '', evidence: '', year: '', track: ''} : {})});
  });
  $('all-categories').addEventListener('click', () => setState({category: ''}));
  $('reset').addEventListener('click', () => { state = parseState(''); render(); });
  for (const [id, change] of [['previous', -1], ['next', 1]]) $(id).addEventListener('click', () => { setState({page: state.page + change}, false); $('catalog').scrollIntoView({block: 'start'}); });
  $('export').addEventListener('click', () => download('engineering-atlas-filtered-catalog.csv', exportCSV(visibleQuery.entries, catalog, state), 'text/csv;charset=utf-8'));
  $('share').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); notify('Link copied. Search, filters and sort order are included.'); }
    catch { notify('Copy the address bar URL to share this exact view.'); }
  });
  $('compare-open').addEventListener('click', showComparison);
  $('compare-close').addEventListener('click', () => $('compare-dialog').close());
  $('shortlist-clear').addEventListener('click', () => { shortlist = []; saveShortlist(); render(); showComparison(); });
  $('shortlist-export').addEventListener('click', () => {
    const entries = shortlist.map(id => catalog.entries.find(e => e.id === id)).filter(Boolean);
    download('engineering-atlas-test-plan.json', JSON.stringify({schema_version: 1, evidence: 'proposal_not_run',
      exported_at: new Date().toISOString(), catalog_snapshot: catalog.snapshot_date,
      required_before_execution: ['Exact baseline and candidate revisions', 'Workload and expected complete-output hashes',
        'Hardware, OS and toolchain', 'Quality, security and resource gates', 'Trial order and retained raw evidence'],
      selected_layer: state.layer || null,
      selected_plan: state.plan || null,
      registered_plans: [...new Set(entries.flatMap(entry => plansForCandidate(entry, catalog).map(plan => plan.id)))],
      candidates: entries.map(e => ({id: e.id, name: e.name, url: e.url, layers: e.layers || [], evaluation: e.evaluation, source_ids: e.source_ids}))}, null, 2));
  });
  window.addEventListener('popstate', () => { state = parseState(location.search); render(); });
}

async function main() {
  try {
    const response = await fetch($('app').dataset.catalog);
    if (!response.ok) throw new Error('Catalog request returned HTTP ' + response.status);
    catalog = await response.json();
    if (catalog.schema_version !== 1 || !Array.isArray(catalog.entries)) throw new Error('Unsupported catalog format');
    for (const key of ['category', 'track']) if (state[key] && !catalog[key === 'category' ? 'categories' : 'tracks'].some(x => x.id === state[key])) state[key] = '';
    populateSelect('kind', [...new Set(catalog.entries.map(e => e.kind))].sort().map(id => ({id, label: title(id)})));
    populateSelect('track', catalog.tracks);
    populateSelect('layer', catalog.layers || []);
    populateSelect('plan', [...(catalog.test_plans || [])].sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title))
      .map(plan => ({id: plan.id, label: 'P' + plan.priority + ' · ' + plan.title})));
    try { const saved = JSON.parse(localStorage.getItem('engineering-atlas-shortlist-v1') || '[]');
      if (Array.isArray(saved)) shortlist = [...new Set(saved)].filter(id => catalog.entries.some(e => e.id === id)).slice(0, 4);
    } catch { shortlist = []; }
    $('shortlist-count').textContent = shortlist.length;
    renderStats(); bindEvents(); render();
  } catch (error) {
    $('result-count').textContent = 'Catalog could not be loaded.';
    $('results').replaceChildren(element('div', {class: 'empty'}, element('h3', {}, 'The catalog is temporarily unavailable'),
      element('p', {}, error.message + '. Reload the page or browse the Markdown catalog.'),
      link('Open the complete catalog ↗', REPO + '/blob/main/docs/research-catalog.md', 'button secondary')));
  }
}
main();
