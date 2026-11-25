const $ = (id) => document.getElementById(id);
const node = (tag, text = '') => { const e = document.createElement(tag); e.textContent = text; return e; };
const link = (label, url) => { const a = node('a', label); a.href = url; return a; };
const allowedPaths = new Map([
  ['atlas', '/#lab'], ['foundry', '/#build'], ['constellation', '/#continuity'], ['guidance', '/#guidance'],
]);
const shaPattern = /^[a-f0-9]{64}$/;
const commitPattern = /^[a-f0-9]{40}$/;
const stateLabels = {recorded: 'Recorded evidence', open: 'Still open'};

async function read(url) {
  const response = await fetch(url, {cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(8000)});
  if (!response.ok) throw Error(`Local read failed (${response.status}). No source was changed.`);
  return response;
}

function validate(data) {
  if (data.schema !== 1 || data.retirement_certified !== false || !Array.isArray(data.projects)
      || data.projects.length !== allowedPaths.size || !commitPattern.test(data.source_snapshot_commit))
    throw Error('Unsupported readiness snapshot. No retirement decision is available.');
  const ids = new Set();
  for (const p of data.projects) {
    if (!allowedPaths.has(p.id) || ids.has(p.id) || allowedPaths.get(p.id) !== p.workspace
        || (p.native_entry !== null && (p.id !== 'atlas' || p.native_entry !== '/learning'))
        || !Array.isArray(p.gates) || !p.gates.some(g=>g.state === 'open')
        || p.gates.some(g=>!Object.hasOwn(stateLabels, g.state)) || !Array.isArray(p.evidence))
      throw Error('Unrecognized workspace or migration gate. No evidence was displayed.');
    ids.add(p.id);
    for (const s of p.evidence) {
      const commit = s.commit ?? data.source_snapshot_commit;
      const prefix = `https://github.com/Herbertofury/Athena/blob/${commit}/`;
      if (!commitPattern.test(commit) || typeof s.url !== 'string' || !s.url.startsWith(prefix)
          || !/^[A-Za-z0-9_./-]+$/.test(s.url.slice(prefix.length))
          || s.url.slice(prefix.length).split('/').some(part => !part || ['.','..'].includes(part)))
        throw Error('Unrecognized evidence link. No evidence was displayed.');
    }
  }
}

function makeCard(project) {
  const card = node('article'); card.className = 'runner';
  card.id = `source-${project.id}`;
  card.append(node('h2', project.name), node('p', project.summary));
  const nav = node('nav'); nav.setAttribute('aria-label', `${project.name} workspace navigation`);
  nav.append(link('Open native workspace', project.workspace));
  if (project.native_entry) nav.append(link('Open local experiments', project.native_entry));
  if (project.id === 'atlas') nav.append(link('Browse recovered Engineering-Atlas evidence', '/migration/atlas'));
  card.append(nav);
  const gateRows = project.gates.map(gate => {
    const section = node('section');
    section.append(node('h3', `${stateLabels[gate.state]} · ${gate.label}`), node('p', gate.detail));
    card.append(section);
    return {section, state: gate.state, text: section.textContent.toLowerCase()};
  });
  const sources = node('ul');
  for (const source of project.evidence) {
    const li = node('li'); li.append(link(source.label, source.url)); sources.append(li);
  }
  card.append(sources);
  return {card, project, gateRows, text: `${project.name} ${project.summary} ${sources.textContent}`.toLowerCase()};
}

function enableFilters(cards) {
  const source = $('project-filter'), gate = $('gate-filter'), query = $('evidence-search');
  for (const {project} of cards) {
    const option = node('option', project.name); option.value = project.id; source.append(option);
  }
  const params = new URLSearchParams(location.search);
  if (allowedPaths.has(params.get('source'))) source.value = params.get('source');
  if (Object.hasOwn(stateLabels, params.get('view'))) gate.value = params.get('view');
  function update() {
    const tokens = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let sources = 0, gates = 0;
    for (const {card, project, gateRows, text} of cards) {
      let count = 0;
      for (const row of gateRows) {
        const match = (!gate.value || row.state === gate.value) && tokens.every(token => text.includes(token) || row.text.includes(token));
        row.section.hidden = !match; if (match) count++;
      }
      card.hidden = !count || Boolean(source.value && source.value !== project.id);
      if (!card.hidden) { sources++; gates += count; }
    }
    $('status').textContent = sources
      ? `${sources} of ${cards.length} source integrations · ${gates} gates shown. Not a completion checklist.`
      : 'No matching gates. Change the search or filters. No source is certified safe to delete.';
  }
  source.addEventListener('change', update); gate.addEventListener('change', update); query.addEventListener('input', update);
  $('controls').hidden = false;
  update();
}

async function load() {
  try {
    const r = await read('/api/migration/readiness');
    const declared = r.headers.get('x-athena-snapshot-sha256');
    const bytes = await r.arrayBuffer();
    if (bytes.byteLength > 262144 || !shaPattern.test(declared ?? '') || !globalThis.crypto?.subtle)
      throw Error('Evidence bytes could not be verified. No download is available.');
    const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
      .map(b => b.toString(16).padStart(2, '0')).join('');
    if (declared !== digest) throw Error('Evidence checksum mismatch. No evidence was displayed or saved.');
    const data = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
    validate(data);
    $('scope').textContent = data.scope;
    $('snapshot').textContent = `Snapshot ${data.snapshot_date} · source commit ${data.source_snapshot_commit} · verified SHA-256 ${digest}`;
    const cards = data.projects.map(makeCard);
    $('projects').append(...cards.map(({card}) => card));
    enableFilters(cards);
    const download = $('evidence-download');
    const objectUrl = URL.createObjectURL(new Blob([bytes], {type: 'application/json'}));
    download.href = objectUrl; download.hidden = false;
    const revokeOnExit = (event) => {
      if (!event.persisted) { URL.revokeObjectURL(objectUrl); window.removeEventListener('pagehide', revokeOnExit); }
    };
    window.addEventListener('pagehide', revokeOnExit);
  } catch (error) { $('status').textContent = error.message; }
}

async function runtime() {
  try {
    const data = await (await read('/api/runtime')).json();
    $('runtime').textContent = `Local ${data.application} engine responding · instance ${data.engine_instance}. Runtime availability does not verify migration gates.`;
  } catch (error) { $('runtime').textContent = error.message; }
}
load(); runtime();
