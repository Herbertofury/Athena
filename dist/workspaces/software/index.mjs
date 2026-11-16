import {FILTERS, indexCatalog, parseState, encodeState, normalizeState, queryCatalog, queryResearch, relatedGuides, queryGuides, safeLink, comparisonRows, alternativeTarget} from './model.mjs';

function element(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on')) e.addEventListener(key.slice(2), value);
    else if (value !== undefined && value !== null) e.setAttribute(key, String(value));
  }
  for (const child of children.flat()) if (child !== undefined && child !== null) e.append(child.nodeType ? child : document.createTextNode(String(child)));
  return e;
}
function link(label, url, attrs = {}) {
  const href = safeLink(url);
  return href ? element('a', {href, target: '_blank', rel: 'noopener noreferrer', ...attrs}, label) : element('span', {}, label + ' · unavailable');
}
function list(values) { return element('ul', {}, values.map(v => element('li', {}, v))); }
const LABELS = {family: 'Explore a family', category: 'Task category', platform: 'Operating system', license: 'License type', pricing: 'Pricing model', maintenance: 'Maintenance evidence', task: 'Decision guide'};

export async function mount({container, search = '', state: saved = {}, route = '', signal, theme = 'dark', navigate, setState, notify = () => {}}) {
  const root = container.shadowRoot || container.attachShadow({mode: 'open'});
  let disposed = false, catalog, index, limit = 24, rows = [], lastOpener = null;
  let guideQuery = '', guideLimit = 12;
  let state = parseState(route, saved?.filters);
  state.q = String(search || state.q).slice(0, 300);
  let selected = new Set(Array.isArray(saved?.selected) ? saved.selected.filter(x => typeof x === 'string').slice(0, 4) : []);
  const urls = new Set();
  root.innerHTML = `<div class="software"><section class="intro"><div><span class="eyebrow">YOUR NEXT CAPABILITY</span><h2>What do you want to do?</h2><p>Discover the right software through real tasks, clear tradeoffs and traceable sources.</p></div><div id="metrics" class="metrics" aria-label="Catalog size"></div></section><div class="quick-tasks" id="quick-tasks" aria-label="Popular tasks"></div><section class="filters" aria-label="Filter software" id="filters"></section><section id="related-tasks" class="quick-tasks" hidden aria-label="Related tasks"></section><section id="guide" class="guide" hidden aria-label="Decision guide"></section><div class="results-head"><div><p id="result-count" role="status" aria-live="polite">Loading the software database…</p><p class="muted" id="result-context">Search a task or product in Athena's search box above.</p></div><div class="actions"><label>Order<select id="sort"><option value="relevance">Search relevance</option><option value="name">Name A–Z</option></select></label><button id="reset" type="button">Reset filters</button><button id="share" type="button">Copy view link</button><button id="export" type="button">Export results</button></div></div><div id="selection" class="selection" hidden><span id="selection-count"></span><button type="button" id="compare">Compare selected</button><button type="button" id="clear-selection">Clear selection</button></div><section class="cards" id="results" aria-label="Software results"></section><div class="more"><button type="button" id="more" hidden>Show more software</button></div><details class="method"><summary>How Athena chooses, compares and verifies software</summary><p>Recommendations match documented capabilities to a specific task. They are editorial judgments, not measured performance rankings. A project's popularity is not used as a quality score. An open-source license does not guarantee free prebuilt binaries.</p><p>Each record has dated sources and separates maintenance evidence, licensing and pricing. Unknown means more research is needed. Official download links open vendor installation or release pages; they do not install anything. The preserved Windows research can have fewer verified fields than newly researched entries.</p><p><a href="https://github.com/Herbertofury/Athena/wiki/Software-Methodology" target="_blank" rel="noopener noreferrer">Method and contribution guide ↗</a> · <a href="https://github.com/Herbertofury/Athena/wiki/Software-Coverage" target="_blank" rel="noopener noreferrer">Coverage and refresh priorities ↗</a> · <a href="https://github.com/Herbertofury/Athena/wiki/Engineering-Developer-Cleanup-and-Agent-Hygiene" target="_blank" rel="noopener noreferrer">Original cleanup research ↗</a> · <a href="https://github.com/Herbertofury/Athena/blob/main/data/creative-ai-tools.json" target="_blank" rel="noopener noreferrer">Creative AI research ↗</a></p></details></div><dialog id="detail-dialog" aria-labelledby="detail-title"><div class="dialog-top"><h2 id="detail-title"></h2><button type="button" data-close="detail-dialog">Close details</button></div><div id="detail-body"></div></dialog><dialog id="compare-dialog" aria-labelledby="compare-title"><div class="dialog-top"><h2 id="compare-title">Compare software</h2><button type="button" data-close="compare-dialog">Close comparison</button></div><p>Compare the documented fit and limitations for your task. Source review does not establish a benchmark winner.</p><div class="table-scroll" id="comparison"></div></dialog>`;
  const sheet = element('link', {rel: 'stylesheet', href: new URL('./style.css', import.meta.url).href});
  root.prepend(sheet);
  const research = element('details', {class: 'method research-library', id: 'research-library'},
    element('summary', {id: 'research-count'}, 'Preserved cleanup and creative-AI research'),
    element('p', {class: 'muted'}, 'The same task search also explores these original research snapshots. Application filters above do not relabel their evidence, licensing or platform scope. They are retained research records and are not counted as new applications.'),
    element('div', {id: 'research-records'}));
  root.querySelector('.method').before(research);
  const $ = id => root.getElementById(id);
  const suggestions = element('section', {id: 'suggested-guides', class: 'guide-suggestions', hidden: '', 'aria-label': 'Related decision guides'});
  $('guide').before(suggestions);
  const guideDirectory = element('details', {id: 'guide-directory', class: 'guide-directory'},
    element('summary', {id: 'guide-directory-title'}, 'Explore decision guides'),
    element('p', {class: 'muted'}, 'Find a task and compare the choices, reasons and tradeoffs. Your operating system, license, pricing and maintenance filters apply.'),
    element('label', {for: 'guide-search'}, 'Find a decision guide',
      element('input', {id: 'guide-search', type: 'search', placeholder: 'Try radio, sequence analysis, project planning…', autocomplete: 'off'})),
    element('p', {id: 'guide-directory-count', class: 'muted', role: 'status', 'aria-live': 'polite'}),
    element('div', {id: 'guide-directory-results', class: 'guide-directory-results'}),
    element('button', {id: 'guide-directory-more', type: 'button', hidden: ''}, 'Show more decision guides'));
  $('filters').after(guideDirectory);
  $('guide').tabIndex = -1;
  $('detail-title').tabIndex = -1;
  const byId = new Map(), byCategory = new Map();
  function setTheme(value) { container.dataset.theme = value === 'light' ? 'light' : 'dark'; }
  setTheme(theme);
  function unmount() {
    if (disposed) return;
    disposed = true;
    for (const url of urls) URL.revokeObjectURL(url);
    for (const dialog of root.querySelectorAll('dialog[open]')) dialog.close();
    root.replaceChildren();
    signal?.removeEventListener('abort', unmount);
  }
  signal?.addEventListener('abort', unmount, {once: true});
  if (signal?.aborted) { unmount(); return {ready: false, unmount}; }
  try {
    const response = await fetch(new URL('./catalog.json', import.meta.url), {signal});
    if (!response.ok) throw Error('Software database returned HTTP ' + response.status);
    catalog = await response.json();
    if (catalog.schema_version !== 1 || !Array.isArray(catalog.applications)) throw Error('Unsupported software database');
  } catch (error) {
    if (!disposed) {
      $('result-count').textContent = 'The software database could not load. ' + error.message;
      $('results').append(element('div', {class: 'empty'}, element('h3', {}, 'Your research is still available'),
        link('Read the software Wiki', 'https://github.com/Herbertofury/Athena/wiki/Software-Catalog'),
        element('button', {type: 'button', onclick: () => location.reload()}, 'Reload Athena')));
      for (const b of root.querySelectorAll('.actions button,.actions select')) b.disabled = true;
    }
    return {ready: false, unmount, setTheme};
  }
  if (disposed) return {ready: false, unmount};
  for (const app of catalog.applications) byId.set(app.id, app);
  for (const category of catalog.categories) byCategory.set(category.id, category);
  selected = new Set([...selected].filter(id => byId.has(id)));
  index = indexCatalog(catalog);
  function normalized(value) {
    const result = normalizeState(value, catalog);
    if (result.removed.length) notify('Cleared unavailable software filters: ' + result.removed.join(', '));
    return result.state;
  }
  state = normalized(state);
  function persist() { setState?.({filters: {...state}, selected: [...selected]}); }
  function update(change) {
    if (disposed) return;
    const before = encodeState(state);
    state = {...state, ...change};
    if (Object.hasOwn(change, 'family') && !Object.hasOwn(change, 'category')) state.category = '';
    if (Object.hasOwn(change, 'task') && change.task) {state.family = ''; state.category = ''; state.q = '';}
    if (before === encodeState(state)) return;
    limit = 24;
    persist();
    render();
    navigate?.('#software?' + (encodeState(state) || 'q='), {replace: true});
  }
  function options(select, entries, value, all = 'All') {
    select.replaceChildren(element('option', {value: ''}, all));
    for (const [v, title] of entries) select.append(element('option', {value: v}, title));
    select.value = value;
  }
  for (const key of FILTERS) {
    const select = element('select', {id: key, 'aria-label': LABELS[key], onchange: e => update({[key]: e.target.value})});
    $('filters').append(element('label', {for: key}, LABELS[key], select));
  }
  function renderFilters() {
    options($('family'), catalog.families.map(x => [x.id, x.name + ' (' + (catalog.counts.by_family[x.id] || 0) + ')']), state.family);
    options($('category'), catalog.categories.filter(x => !state.family || x.family === state.family).map(x => [x.id, x.name + ' (' + x.count + ')']), state.category);
    options($('platform'), Object.keys(catalog.counts.by_platform).sort().map(x => [x, x]), state.platform);
    options($('license'), ['open-source', 'source-available', 'proprietary', 'mixed', 'unknown'].map(x => [x, x.replaceAll('-', ' ')]), state.license);
    options($('pricing'), ['free', 'freemium', 'paid', 'subscription', 'mixed', 'unknown'].map(x => [x, x]), state.pricing);
    options($('maintenance'), ['active', 'archived', 'discontinued', 'unverified'].map(x => [x, x]), state.maintenance);
    options($('task'), catalog.recipes.map(x => [x.id, x.title]), state.task, 'Explore every task');
    $('sort').value = state.sort;
  }
  function selectionBar() {
    $('selection').hidden = !selected.size;
    $('selection-count').textContent = [...selected].map(id => byId.get(id).name).join(' · ') + ` (${selected.size}/4)`;
    $('compare').disabled = selected.size < 2;
  }
  function selectApp(app, checked) {
    if (checked && selected.size >= 4) {notify('Compare up to four tools. Remove one to add another.'); return false;}
    checked ? selected.add(app.id) : selected.delete(app.id);
    persist(); selectionBar(); return true;
  }
  function badge(text, extra = '') {return element('span', {class: 'badge ' + extra}, text);}
  function showDialog(id, opener) {lastOpener = opener || root.activeElement; $(id).showModal();}
  function showDetails(app, opener) {
    const body = $('detail-body'); body.replaceChildren(); $('detail-title').textContent = app.name;
    body.append(element('p', {class: 'lead'}, app.summary), element('div', {class: 'badges'},
      badge(app.platforms.join(' · ')), badge(app.license_kind), badge(app.pricing_model === 'unknown' ? 'Pricing not verified' : app.pricing_model)));
    const links = element('div', {class: 'actions'}, link('Official project ↗', app.official_url));
    if (app.download_url) links.append(link('Official downloads / install ↗', app.download_url));
    if (app.repository_url) links.append(link('Source repository ↗', app.repository_url));
    body.append(links);
    const sections = [
      ['Choose it for', [app.recommendation.pick_for]], ['Compare another tool when', [app.recommendation.compare_when]],
      ['Features', app.features], ['Strengths', app.strengths], ['Limitations', app.limitations], ['Tasks', app.use_cases],
      ['Compatibility', [app.platforms.join(', '), ...(app.platform_notes ? [app.platform_notes] : [])]],
      ['License and pricing', [app.license, 'License classification: ' + app.license_kind, 'Pricing model: ' + app.pricing_model, ...(app.pricing_notes ? [app.pricing_notes] : [])]],
      ['Maintenance evidence', [app.maintenance.status + ' · reviewed ' + app.maintenance.checked_at, app.maintenance.note]],
    ];
    for (const [title, values] of sections) body.append(element('section', {class: 'detail-section'}, element('h3', {}, title), list(values)));
    if (app.capabilities?.length) {
      const support = element('section', {class: 'detail-section documented-capabilities'}, element('h3', {}, 'Documented task support'));
      for (const capability of app.capabilities) {
        const definition = catalog.capabilities.find(c => c.id === capability.id);
        support.append(element('h4', {}, definition.label), element('p', {}, definition.description),
          element('strong', {}, 'Required setup'), list(capability.conditions),
          element('strong', {}, 'Task limits'), list(capability.limitations),
          element('p', {}, capability.source_urls.map((url, i) => link('Task evidence ' + (i + 1) + ' ↗ ', url))));
      }
      body.append(support);
    }
    if (app.maintenance.source_url) body.append(element('p', {}, link('Maintenance evidence source ↗', app.maintenance.source_url)));
    for (const evaluation of (catalog.evaluations || []).filter(e => (app.evaluation_ids || []).includes(e.id))) {
      body.append(element('section', {class: 'detail-section scoped-measurements'},
        element('h3', {}, 'Scoped measurement: ' + evaluation.title),
        element('p', {}, evaluation.summary), list(evaluation.limitations),
        element('p', {}, link('Read results and method ↗ ', evaluation.report_url),
          link('Raw measurements ↗ ', evaluation.data_url), link('Reproduce this experiment ↗', evaluation.script_url))));
    }
    if (app.alternative_ids.length || app.alternatives_outside_catalog.length) {
      const alternatives = element('section', {class: 'detail-section'}, element('h3', {}, 'Alternatives to investigate'));
      for (const id of app.alternative_ids) alternatives.append(element('button', {type: 'button', onclick: () => showDetails(byId.get(id))}, byId.get(id).name));
      if (app.alternatives_outside_catalog.length) alternatives.append(element('p', {class: 'muted'}, 'Not yet in this catalog: ' + app.alternatives_outside_catalog.join(', ')));
      body.append(alternatives);
    }
    const sources = element('section', {class: 'detail-section'}, element('h3', {}, 'Sources and provenance'));
    sources.append(element('p', {}, app.evidence_status === 'legacy-research' ? app.legacy_evidence_status : 'Official documentation reviewed. Any separately measured comparison above applies only to its stated versions, workload and environment. Other capabilities have not been installed, audited or benchmarked in this review.'));
    for (const s of app.sources) sources.append(element('p', {}, link(s.label, s.url), element('small', {}, ' · ' + s.checked_at + ' · supports: ' + s.supports.join(', '))));
    sources.append(element('p', {class: 'muted'}, 'Source record: ' + app.origin));
    for (const enrichment of app.metadata_enrichments || []) sources.append(element('p', {class: 'muted'}, 'Metadata refreshed ' + enrichment.reviewed_at + ': ' + enrichment.fields.join(', ') + ' · ' + enrichment.origin));
    if (app.legacy) sources.append(element('details', {}, element('summary', {}, 'Preserved original research fields'), element('pre', {}, JSON.stringify(app.legacy, null, 2))));
    body.append(sources);
    if (!$('detail-dialog').open) showDialog('detail-dialog', opener);
    else { $('detail-dialog').scrollTop = 0; $('detail-title').focus(); }
  }
  function card(app) {
    const label = element('label', {class: 'compare-check'}, element('input', {type: 'checkbox', 'aria-label': 'Compare ' + app.name, onchange: e => {
      if (!selectApp(app, e.target.checked)) e.target.checked = false;
    }}), 'Compare');
    label.querySelector('input').checked = selected.has(app.id);
    const details = element('button', {type: 'button', class: 'primary', onclick: e => showDetails(app, e.currentTarget)}, 'Explore ' + app.name);
    return element('article', {class: 'software-card', 'data-app-id': app.id},
      element('div', {class: 'card-top'}, element('span', {class: 'category'}, byCategory.get(app.category_id)?.name || app.category.replaceAll('-', ' ')), label),
      element('h3', {}, app.name), element('p', {class: 'summary'}, app.summary),
      element('div', {class: 'badges'}, badge(app.platforms.join(' · ')), badge(app.license_kind.replaceAll('-', ' ')), badge(app.pricing_model === 'unknown' ? 'Pricing unverified' : app.pricing_model)),
      element('p', {class: 'fit'}, element('strong', {}, 'Choose for '), app.recommendation.pick_for),
      element('div', {class: 'card-bottom'}, details, element('span', {class: 'source-count'}, app.sources.length + ' source' + (app.sources.length === 1 ? '' : 's'))),
      element('small', {class: 'maintenance'}, 'Maintenance: ' + app.maintenance.status + (app.evidence_status === 'legacy-research' ? ' · original research' : ' · source reviewed')));
  }
  function renderGuide() {
    const recipe = catalog.recipes.find(x => x.id === state.task); const section = $('guide');
    section.hidden = !recipe; section.replaceChildren(); if (!recipe) return;
    section.append(element('h3', {}, recipe.title), element('p', {}, recipe.description));
    const visible = new Set(rows.map(a => a.id));
    const eligible = recipe.picks.filter(p => visible.has(p.app_id));
    if (eligible.length < recipe.picks.length) section.append(element('p', {class: 'muted'}, `${recipe.picks.length - eligible.length} guide choice(s) hidden by your current filters or search.`));
    for (const p of eligible) {
      const app = byId.get(p.app_id);
      section.append(element('div', {class: 'guide-pick'}, badge(p.label), element('button', {type: 'button', onclick: e => showDetails(app, e.currentTarget)}, app.name),
        element('p', {}, p.reason), element('small', {}, 'Tradeoff: ' + p.tradeoff)));
    }
  }
  function renderGuideDirectory() {
    $('guide-directory-title').textContent = `Explore all ${catalog.recipes.length} decision guides`;
    if (!guideDirectory.open) return;
    const eligible = queryCatalog(index, {...state, q: '', family: '', category: '', task: ''}, catalog);
    const matches = queryGuides(catalog, guideQuery, new Set(eligible.map(app => app.id)));
    $('guide-directory-count').textContent = `${matches.length} decision guide${matches.length === 1 ? '' : 's'} with choices matching your filters`;
    $('guide-directory-results').replaceChildren(...matches.slice(0, guideLimit).map(({recipe, available}) =>
      element('article', {class: 'guide-directory-card'},
        element('button', {type: 'button', onclick: () => {
          guideDirectory.open = false; update({task: recipe.id}); $('guide').focus();
        }}, recipe.title),
        element('p', {}, recipe.description),
        element('small', {class: 'muted'}, `${available} of ${recipe.picks.length} choices match your filters`))));
    if (!matches.length) $('guide-directory-results').append(element('p', {class: 'muted'}, 'No guide matches this search and these filters. Try another task or broaden the filters.'));
    $('guide-directory-more').hidden = matches.length <= guideLimit;
    $('guide-directory-more').textContent = `Show ${Math.min(12, matches.length - guideLimit)} more decision guides`;
  }
  function render() {
    if (disposed) return;
    renderFilters(); selectionBar(); renderGuideDirectory();
    const related = (byCategory.get(state.category)?.related_category_ids || []).map(id => byCategory.get(id)).filter(Boolean);
    $('related-tasks').hidden = !related.length;
    $('related-tasks').replaceChildren(...(related.length ? [element('span', {class: 'muted'}, 'Related tasks:'), ...related.map(c => element('button', {type: 'button', onclick: () => update({family: c.family, category: c.id, task: '', q: ''})}, c.name))] : []));
    rows = queryCatalog(index, state, catalog);
    const matchingGuides = state.q && !state.task ? relatedGuides(catalog, rows) : [];
    suggestions.hidden = !matchingGuides.length;
    suggestions.replaceChildren(...(matchingGuides.length ? [element('p', {class: 'muted'}, 'Task guides containing your results'),
      ...matchingGuides.map(({recipe, matched}) => element('button', {type: 'button', onclick: () => update({task: recipe.id})},
        recipe.title + ' · ' + matched + ' matching choice' + (matched === 1 ? '' : 's')))] : []));
    renderGuide();
    $('result-count').textContent = `${rows.length.toLocaleString()} of ${catalog.applications.length.toLocaleString()} tools` + (state.q ? ' matching “' + state.q + '”' : '');
    $('result-context').textContent = state.task ? 'Task-guide order is an editorial fit to these constraints.' : alternativeTarget(state.q) ? 'Explicitly researched alternatives to ' + alternativeTarget(state.q) + '; your filters still apply.' : 'Use filters to narrow the task. Open a tool to inspect evidence and alternatives.';
    $('results').replaceChildren(...rows.slice(0, limit).map(card));
    if (!rows.length) $('results').append(element('div', {class: 'empty'}, element('h3', {}, 'No matching tools yet'), element('p', {}, 'Try a broader task or remove a filter. A missing result is a coverage gap, not proof that no suitable software exists.'), element('button', {type: 'button', onclick: reset}, 'Clear search and filters')));
    $('more').hidden = rows.length <= limit;
    $('more').textContent = `Show ${Math.min(24, Math.max(0, rows.length - limit))} more (${Math.min(limit, rows.length)} shown)`;
    const researchRows = queryResearch(catalog.research_records || [], state.q);
    $('research-count').textContent = `Preserved research library · ${researchRows.length} matching records`;
    $('research-records').replaceChildren(...(research.open ? researchRows : []).map(r => element('article', {class: 'research-record'},
      element('h3', {}, r.name), badge(r.kind), element('p', {}, r.summary),
      element('p', {class: 'muted'}, r.platform_notes), element('p', {class: 'muted'}, r.evidence_status),
      r.availability?.status === 'unavailable' ? element('div', {class: 'research-availability'},
        badge('Source unavailable'), element('p', {}, r.availability.note + ' Checked ' + r.availability.checked_at + '.'),
        link('Availability review ↗', r.availability.evidence_url)) : link('Original project / source ↗', r.official_url),
      element('details', {}, element('summary', {}, 'Inspect preserved source record'), element('pre', {}, JSON.stringify(r.original, null, 2))))));
  }
  function reset() { state = parseState('software?q='); limit = 24; persist(); render(); navigate?.('#software?q=', {replace: true}); }
  function openComparison() {
    const apps = [...selected].map(id => byId.get(id)); if (apps.length < 2) return;
    const table = element('table', {}, element('caption', {class: 'sr-only'}, 'Selected software feature and evidence comparison'));
    table.append(element('thead', {}, element('tr', {}, element('th', {scope: 'col'}, 'Criterion'), apps.map(a => element('th', {scope: 'col'}, a.name)))));
    const tbody = element('tbody');
    for (const row of comparisonRows(apps)) tbody.append(element('tr', {}, element('th', {scope: 'row'}, row.label), row.values.map(v => element('td', {}, v))));
    tbody.append(element('tr', {}, element('th', {scope: 'row'}, 'Primary sources'), apps.map(a => element('td', {}, a.sources.map(s => element('p', {}, link(s.label, s.url))), a.maintenance.source_url ? element('p', {}, link('Maintenance evidence source', a.maintenance.source_url)) : null))));
    table.append(tbody); $('comparison').replaceChildren(table); showDialog('compare-dialog', $('compare'));
  }
  for (const [key, value] of [['applications', 'TOOLS'], ['categories', 'TASK CATEGORIES'], ['source_urls', 'CITED SOURCES']]) $('metrics').append(element('div', {}, element('strong', {}, catalog.counts[key].toLocaleString()), element('small', {}, value)));
  const quickIds = ['protect-personal-files', 'understand-disk-space', 'support-a-remote-pc', 'run-local-language-models', 'manage-modded-game-setups', 'trim-convert-and-inspect-media', 'choose-code-editor'];
  for (const recipe of quickIds.map(id => catalog.recipes.find(r => r.id === id)).filter(Boolean)) $('quick-tasks').append(element('button', {type: 'button', onclick: () => update({task: recipe.id})}, recipe.title));
  $('sort').addEventListener('change', e => update({sort: e.target.value}));
  guideDirectory.addEventListener('toggle', () => {if (!disposed) renderGuideDirectory();});
  $('guide-search').addEventListener('input', e => {guideQuery = e.target.value.slice(0, 300); guideLimit = 12; renderGuideDirectory();});
  $('guide-directory-more').addEventListener('click', () => {guideLimit += 12; renderGuideDirectory();});
  research.addEventListener('toggle', () => {if (!disposed) render();});
  $('reset').addEventListener('click', reset);
  $('more').addEventListener('click', () => {limit += 24; render();});
  $('compare').addEventListener('click', openComparison);
  $('clear-selection').addEventListener('click', () => {selected.clear(); persist(); render();});
  for (const b of root.querySelectorAll('[data-close]')) b.addEventListener('click', () => $(b.dataset.close).close());
  for (const dialog of root.querySelectorAll('dialog')) dialog.addEventListener('close', () => {if (lastOpener?.isConnected) lastOpener.focus();});
  $('share').addEventListener('click', async () => {
    const url = new URL(location.href); url.hash = 'software?' + (encodeState(state) || 'q=');
    try {await navigator.clipboard.writeText(url.href); notify('Software view link copied.');}
    catch {notify('Copy this view from the address bar. Its filters are included.');}
  });
  $('export').addEventListener('click', () => {
    const data = {schema_version: 1, reviewed_at: catalog.reviewed_at, filters: {...state}, count: rows.length, scope: catalog.scope, applications: rows};
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'})); urls.add(url);
    const a = element('a', {href: url, download: 'athena-software-selection.json'}); root.append(a); a.click(); a.remove();
    setTimeout(() => {URL.revokeObjectURL(url); urls.delete(url);}, 1000);
  });
  render();
  return {ready: true, unmount, setTheme,
    setSearch(q) {if (!disposed) update({q: String(q ?? '').slice(0, 300)});},
    setRoute(value) {if (disposed) return; const next = normalized(parseState(value)); if (encodeState(next) !== encodeState(state)) {for (const dialog of root.querySelectorAll('dialog[open]')) dialog.close(); state = next; limit = 24; persist(); render();}},
    exportState() {return {filters: {...state}, selected: [...selected]};},
  };
}
