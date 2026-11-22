import {attachArtifacts} from './artifacts.mjs';
import {fresh, validate, apply, visible} from './model.mjs';
import {parseBackup, mergeBackup, MAX_IMPORT_BYTES} from './import.mjs';
import {compileContext, contextMarkdown} from './context.mjs';

export function mount({container, state, search = '', setState, signal, theme = 'dark'}) {
  const root = container.shadowRoot || container.attachShadow({mode: 'open'});
  let data, error = '', disposed = false, showIgnored = false, editing = null, project = '';
  const urls = new Set();
  let committed;
  try { data = state === undefined ? fresh() : validate(state); committed=JSON.stringify(state)??''; }
  catch (exception) { error = 'Stored continuity data could not be opened. It has not been overwritten: ' + exception.message; data = null; }
  root.innerHTML = `<h2>Project continuity</h2><p>Source-attributed decisions, next actions, resources and blockers shared in Athena. Manual local notes, not an automatic chat capture or a verified completion detector. Do not paste credentials.</p><p id="notice" role="status"></p>
    <form><label>Project<input name="project" required maxlength="200"></label><label>Kind<select name="kind"><option value="decision">Decision</option><option value="next-action">Next action</option><option value="resource">Resource</option><option value="blocker">Blocker</option></select></label><label>Note<textarea name="text" required maxlength="10000"></textarea></label><label>Source URL (optional HTTPS)<input name="source" type="url"></label><button type="submit">Save note</button><button type="button" id="cancel" hidden>Cancel revision</button></form>
    <section class="context-panel" aria-labelledby="context-title"><h3 id="context-title">Reusable project context</h3><p>Explicit links keep the evidence revision you reviewed. Changed sources are advisory, never automatic verdicts. Cross-project dependencies remain included, even when an upstream note is ignored.</p><label>Project context<select id="project-context" aria-label="Project context"><option value="">All projects</option></select></label><p id="context-summary" role="status"></p><ul id="context-warnings"></ul><button id="export-context">Export context Markdown</button><details><summary>Inspect complete context packet</summary><pre id="context-packet"></pre></details></section>
    <label>Import local continuity backup<input id="import-backup" type="file" accept="application/json,.json"></label><p>Import adds missing notes and retains identical notes. Conflicting IDs or metadata refuse the whole import. Export your current notes first. Import is limited to 16 MiB and 100 total notes for this interface; larger backups are refused, never truncated. No provider data is fetched. Use one Athena tab for editing; other tabs are not synchronized.</p><button id="ignored">Show ignored</button><button id="export">Export local continuity JSON</button><p>Notes remain in this browser. Export separately for backup; browser storage is not a remote backup. Sources are claims, not automatically trusted facts.</p><section id="entries" aria-label="Continuity entries"></section><section id="artifact-journal"></section>`;
  const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = new URL('./style.css', import.meta.url).href; root.prepend(style);
  const $ = selector => root.querySelector(selector), form = $('form'), notice = $('#notice');
  const artifacts = attachArtifacts({host:$('#artifact-journal'),signal});
  notice.textContent = error || 'Ready. No notes are sent to a provider.';
  function element(tag, text) { const item = document.createElement(tag); if (text !== undefined) item.textContent = text; return item; }
  function button(action, label, id, dependencyId) {
    const item = element('button', label); item.type = 'button'; item.dataset.action = action; item.dataset.id = id;
    if (dependencyId) item.dataset.dependencyId = dependencyId;
    return item;
  }
  function renderContext() {
    const selector = $('#project-context'); selector.replaceChildren();
    const all = element('option', 'All projects'); all.value = ''; selector.append(all);
    for (const name of [...new Set(data.entries.map(entry => entry.project))].sort()) { const option = element('option', name); option.value = name; selector.append(option); }
    selector.value = project;
    const packet = compileContext(data, project);
    $('#context-summary').textContent = `${packet.coverage.selectedRoots} selected root notes · ${packet.coverage.includedEntries} notes including dependencies · ${packet.coverage.warnings} advisory findings. No content is sent automatically.`;
    const warnings = $('#context-warnings'); warnings.replaceChildren();
    for (const warning of packet.warnings) {
      const entry = data.entries.find(item => item.id === warning.id);
      warnings.append(element('li', `${entry?.project || warning.id}: ${warning.message} (${warning.dependencyId})`));
    }
    if (!packet.warnings.length) warnings.append(element('li', 'No changed or missing linked evidence detected. This is not proof of correctness or completion.'));
    $('#context-packet').textContent = JSON.stringify(packet, null, 2);
  }
  function render() {
    if (disposed || !data) return;
    const focused = root.activeElement?.dataset;
    const restoreFocus = focused?.action ? {action: focused.action, id: focused.id, dependencyId: focused.dependencyId} : null;
    const list = $('#entries'); list.replaceChildren();
    const rows = visible(data, search, showIgnored), byId = new Map(data.entries.map(entry => [entry.id, entry]));
    for (const entry of rows) {
      const article = element('article'); article.dataset.entryId = entry.id;
      article.append(element('h3', entry.project + ' · ' + entry.kind + (entry.pinned ? ' · pinned' : '') + (entry.ignored ? ' · ignored' : '')));
      const revision = entry.revisions.at(-1); article.append(element('pre', revision.text));
      if (revision.source) { const link = element('a', 'Source: ' + revision.source); link.href = revision.source; link.target = '_blank'; link.rel = 'noopener noreferrer'; article.append(link); }
      const history = element('details'); history.append(element('summary', entry.revisions.length + ' immutable revision(s) and policy history'), element('pre', JSON.stringify({revisions: entry.revisions, history: entry.history}, null, 2))); article.append(history);
      for (const [action, label] of [['revise', 'Revise'], ['pin', entry.pinned ? 'Unpin' : 'Pin'], ['ignore', entry.ignored ? 'Restore' : 'Ignore']]) article.append(button(action, label, entry.id));
      const dependencies = element('details'); dependencies.append(element('summary', `Evidence links (${(entry.dependencies || []).length})`));
      for (const reference of entry.dependencies || []) {
        const dependency = byId.get(reference.id), row = element('div'); row.className = 'dependency';
        row.append(element('p', `${dependency?.project || reference.id}: reviewed revision ${reference.revision} → observed revision ${dependency?.revisions.length ?? 'missing'}`));
        const baseline = element('details'); baseline.append(element('summary', 'Reviewed evidence and source'), element('pre', JSON.stringify(dependency?.revisions[reference.revision - 1] || {state: 'unavailable'}, null, 2))); row.append(baseline);
        const review = button('review-dependency', 'Mark latest revision reviewed', entry.id, reference.id); review.disabled = !dependency; row.append(review, button('unlink', 'Unlink evidence', entry.id, reference.id)); dependencies.append(row);
      }
      const label = element('label', 'Link evidence from another note'), selector = element('select'); selector.dataset.linkFor = entry.id;
      const alreadyLinked = new Set((entry.dependencies || []).map(item => item.id));
      for (const candidate of data.entries) {
        if (candidate.id === entry.id || alreadyLinked.has(candidate.id)) continue;
        const option = element('option', `${candidate.project} · ${candidate.kind} · ${candidate.revisions.at(-1).text.slice(0,100)}${candidate.revisions.at(-1).text.length > 100 ? '…' : ''}`);
        option.value = candidate.id; selector.append(option);
      }
      label.append(selector); dependencies.append(label);
      const link = button('link', 'Link current evidence revision', entry.id); link.disabled = !selector.options.length; selector.disabled = link.disabled; dependencies.append(link); article.append(dependencies); list.append(article);
    }
    if (!rows.length) list.textContent = 'No matching entries. Missing evidence does not mean work is complete.';
    renderContext();
    if (restoreFocus) [...list.querySelectorAll('button[data-action]')].find(item => item.dataset.action === restoreFocus.action && item.dataset.id === restoreFocus.id && item.dataset.dependencyId === restoreFocus.dependencyId)?.focus();
  }
  function persistDraft() {
    try {
      const saved = setState?.(data,{reviewedContinuityWrite:committed}) === true;
      if (saved) committed = JSON.stringify(data);
      return {saved, conflict:false};
    } catch (exception) { return {saved:false, conflict:exception?.code==='CONTINUITY_WRITE_CONFLICT'}; }
  }
  function commit(action) {
    try {
      data = apply(data, action);
      const {saved,conflict} = persistDraft();
      notice.textContent = saved ? 'Saved in this browser. Export a backup.' : conflict ? 'Not saved. Saved Continuity changed. Export the local draft before reloading Athena.' : 'Not saved to durable browser storage. Keep this page open and export the local draft.';
      render(); return true;
    } catch (exception) { notice.textContent = exception.message; return false; }
  }
  function cancelRevision() { editing = null; form.reset(); form.elements.project.disabled = false; form.elements.kind.disabled = false; $('#cancel').hidden = true; }
  form.onsubmit = event => {
    event.preventDefault(); if (!data || disposed) return;
    const fields = form.elements;
    if (commit({type: editing ? 'revise' : 'add', id: editing || crypto.randomUUID(), project: fields.project.value, kind: fields.kind.value, text: fields.text.value, source: fields.source.value})) cancelRevision();
  };
  $('#cancel').onclick = cancelRevision;
  $('#entries').onclick = event => {
    const target = event.target.closest('button[data-action]'); if (!target || disposed || !data) return;
    if (target.dataset.action === 'revise') {
      const entry = data.entries.find(item => item.id === target.dataset.id); editing = entry.id;
      form.elements.project.value = entry.project; form.elements.kind.value = entry.kind; form.elements.project.disabled = true; form.elements.kind.disabled = true;
      form.elements.text.value = entry.revisions.at(-1).text; form.elements.source.value = entry.revisions.at(-1).source; $('#cancel').hidden = false; form.elements.text.focus();
    } else {
      const action = {type: target.dataset.action, id: target.dataset.id, dependencyId: target.dataset.dependencyId};
      if (action.type === 'link') action.dependencyId = target.closest('article').querySelector('select[data-link-for]').value;
      commit(action);
    }
  };
  let importGeneration = 0;
  $('#import-backup').onchange = async event => {
    const input = event.target, file = input.files?.[0], generation = ++importGeneration;
    input.value = '';
    if (!file || !data || disposed) return;
    try {
      if (file.size > MAX_IMPORT_BYTES) throw Error('Backup exceeds the 16 MiB local import budget');
      const incoming = parseBackup(new Uint8Array(await file.arrayBuffer()));
      if (disposed || generation !== importGeneration) return;
      // Merge against the current draft after the read, never a stale captured state.
      const result = mergeBackup(data, incoming);
      data = result.data;
      const {saved,conflict} = persistDraft();
      notice.textContent = saved ? `Imported ${result.added} notes; ${result.unchanged} identical notes retained. Saved in this browser. Export a backup.` : conflict ? 'Import not saved. Saved Continuity changed. Export the local draft before reloading Athena.' : 'Import is not saved to durable browser storage. Keep this page open and export the local draft.';
      try { render(); } catch { notice.textContent = saved === true ? 'Import saved, but display failed. Reload to inspect the stored notes.' : 'Import draft retained, but display failed. Keep this page open and export the local draft.'; }
    } catch {
      if (!disposed && generation === importGeneration) notice.textContent = 'Import refused: use a valid UTF-8 Continuity backup up to 16 MiB and 100 total notes, without conflicting IDs, duplicate keys, lossy numbers or metadata. Existing notes were not changed.';
    }
  };
  $('#ignored').onclick = () => { showIgnored = !showIgnored; $('#ignored').textContent = showIgnored ? 'Hide ignored' : 'Show ignored'; render(); };
  $('#project-context').onchange = event => { project = event.target.value; renderContext(); };
  function download(text, filename, type) {
    if (disposed) return;
    const url = URL.createObjectURL(new Blob([text], {type})); urls.add(url);
    const anchor = element('a'); anchor.href = url; anchor.download = filename; anchor.click();
  }
  $('#export').onclick = () => { if (data) download(JSON.stringify(data, null, 2), 'athena-continuity.json', 'application/json'); };
  $('#export-context').onclick = () => { if (data) download(contextMarkdown(compileContext(data, project)), 'athena-project-context.md', 'text/markdown'); };
  if (!data) for (const control of root.querySelectorAll('input,textarea,select,button')) if (!control.closest('#artifact-journal')) control.disabled = true;
  function unmount() { if (disposed) return; disposed = true; artifacts.dispose(); for (const url of urls) URL.revokeObjectURL(url); root.replaceChildren(); signal?.removeEventListener('abort', unmount); }
  function setTheme(value) { container.dataset.theme = value === 'light' ? 'light' : 'dark'; }
  setTheme(theme); render(); signal?.addEventListener('abort', unmount, {once: true}); if (signal?.aborted) unmount();
  return {ready: !!data, unmount, setTheme, setSearch(value) { search = String(value); render(); }};
}

