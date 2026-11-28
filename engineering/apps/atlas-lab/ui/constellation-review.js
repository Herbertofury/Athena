const $ = id => document.getElementById(id);
const element = (tag, text) => Object.assign(document.createElement(tag), {textContent:text});
const limit = 16 * 1024 * 1024;
let job, result, reviewedFile, comparisonGeneration = 0;
let projectJob, candidateJob, projectSelection, recipeGeneration = 0;
const label = key => key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
const count = n => n === null ? 'Not recorded' : typeof n === 'boolean' ? (n ? 'Yes' : 'No') : n.toLocaleString();
const attention = s => s.retained === null || s.cap_reached || (s.omitted ?? 0) > 0;

const nullableNumber = new Set(['retained','export_cap','source_reported','omitted','source_reported_open','open','closed','unrecognized']);
const optionalHash = new Set(['exact_input_sha256','selected_gzip_sha256']);
const hash = text => typeof text === 'string' && /^[a-f0-9]{64}$/.test(text);
const nonnegative = value => Number.isSafeInteger(value) && value >= 0;
const plain = value => value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;

function compareReports(text, latest) {
  const prior = JSON.parse(text);
  // Accept exact receipts from Athena, not JSON with duplicate keys,
  // extra sensitive fields, or different interpretation/version.
  if (text.trim() !== JSON.stringify(prior, null, 2) || !plain(prior) ||
      prior.schema !== latest.schema || prior.source_schema !== latest.source_schema ||
      prior.writer_reviewed_at !== latest.writer_reviewed_at || prior.scope !== latest.scope ||
      [...optionalHash].some(k => Object.hasOwn(prior,k) && !hash(prior[k])) ||
      (prior.selected_gzip_sha256 && !prior.exact_input_sha256)) throw Error('Unrecognized receipt');
  const {exact_input_sha256: oldJson, selected_gzip_sha256: oldArchive, ...oldCounts} = prior;
  const {exact_input_sha256: newJson, selected_gzip_sha256: newArchive, ...newCounts} = latest;
  const differences = [];
  const visit = (before, after, key, prefix) => {
    if (Array.isArray(after)) {
      if (!Array.isArray(before) || before.length !== after.length) throw Error('Invalid collections');
      after.forEach((row,i) => visit(before[i],row,'',prefix + label(row.kind) + ' / '));
    } else if (plain(after)) {
      const keys = Object.keys(after);
      if (!plain(before) || Object.keys(before).length !== keys.length || !keys.every(k => Object.hasOwn(before,k)))
        throw Error('Invalid receipt fields');
      keys.forEach(k => visit(before[k],after[k],k, prefix + (plain(after[k]) ? label(k)+' / ' : '')));
    } else if (typeof after === 'string') {
      if (before !== after) throw Error('Unsupported receipt schema');
    } else {
      const valid = nullableNumber.has(key) ? before === null || nonnegative(before) :
        key === 'matches_reported_open' ? before === null || typeof before === 'boolean' :
        typeof after === 'boolean' ? typeof before === 'boolean' : nonnegative(before);
      if (!valid) throw Error('Invalid receipt value');
      if (before !== after) differences.push(`${prefix}${label(key)}: ${count(before)} → ${count(after)}`);
    }
  };
  visit(oldCounts,newCounts,'','');
  const fingerprints = [
    oldJson && newJson && `Decoded JSON fingerprints ${oldJson === newJson ? 'match' : 'differ'}.`,
    oldArchive && newArchive && `Selected gzip fingerprints ${oldArchive === newArchive ? 'match' : 'differ'}.`
  ].filter(Boolean);
  return {differences, fingerprints};
}

function clearComparison() {
  comparisonGeneration++;
  $('previous').value = '';
  $('diff').disabled = true;
  $('compare-status').textContent = '';
  $('differences').replaceChildren();
}
$('previous').addEventListener('change', () => {
  comparisonGeneration++;
  $('diff').disabled = !result || !$('previous').files[0];
  $('compare-status').textContent = '';
  $('differences').replaceChildren();
});
$('diff').addEventListener('click', async () => {
  const saved = $('previous').files[0], latest = result, generation = ++comparisonGeneration;
  if (!saved || !latest) return;
  $('diff').disabled = true;
  $('differences').replaceChildren();
  $('compare-status').textContent = 'Comparing counts…';
  try {
    if (!saved.size || saved.size > 32 * 1024) throw Error('Receipt size unsupported');
    const raw = new TextDecoder('utf-8',{fatal:true}).decode(await saved.arrayBuffer());
    const {differences,fingerprints} = compareReports(raw,latest);
    if (generation !== comparisonGeneration) return;
    $('differences').replaceChildren(...differences.map(line=>element('li',line)));
    $('compare-status').textContent = (differences.length ? `${differences.length} reported values changed.` : 'No reported counts or limits changed.') +
      ' ' + (fingerprints.length ? fingerprints.join(' ') : 'No shared fingerprints to compare.');
  } catch {
    if (generation === comparisonGeneration) $('compare-status').textContent = 'Receipt refused. Select an unchanged Athena count-only JSON receipt within 32 KiB.';
  } finally {
    if (generation === comparisonGeneration) $('diff').disabled = false;
  }
});

function renderCollections() {
  const rows = result.slices.filter(row => !$('attention').checked || attention(row));
  $('collections').replaceChildren(...rows.map(s => {
    const card = document.createElement('article');
    card.className = 'record-panel';
    card.append(element('h3', label(s.kind)), element('p', s.retained === null ? 'Absent from this export' : `${count(s.retained)} retained`));
    if (s.source_reported !== null) card.append(element('p', `Source reported: ${count(s.source_reported)}`));
    if (s.omitted !== null && s.omitted > 0) card.append(element('p', `Known omissions: ${count(s.omitted)}`));
    if (s.cap_reached) card.append(element('p', `Reached the writer’s limit (${count(s.export_cap)})`));
    return card;
  }));
  $('summary').textContent = `${rows.length} of ${result.slices.length} collections shown. ${result.slices.filter(attention).length} need review.`;
}

$('attention').addEventListener('change', () => { if (result) renderCollections(); });
$('backup').addEventListener('change', () => {
  job?.abort();
  job = result = reviewedFile = undefined;
  clearProjectSelection();
  $('project-selector').hidden = true;
  clearComparison();
  $('result').hidden = true;
  $('start').disabled = false;
  $('cancel').disabled = true;
  $('status').textContent = 'Selection changed. Review it when ready.';
});
$('cancel').addEventListener('click', () => {
  job?.abort();
  job = undefined;
  $('start').disabled = false;
  $('cancel').disabled = true;
  $('status').textContent = 'Review canceled. The original was not changed.';
});
$('review').addEventListener('submit', async event => {
  event.preventDefault();
  if (job) return;
  result = reviewedFile = undefined;
  clearProjectSelection();
  $('project-selector').hidden = true;
  clearComparison();
  $('result').hidden = true;
  const file = $('backup').files[0];
  if (!file || file.size === 0 || file.size > limit) {
    $('status').textContent = 'Select a nonempty file no larger than 16 MiB.';
    return;
  }
  const current = job = new AbortController();
  const fingerprint = $('fingerprint').checked;
  $('start').disabled = true;
  $('cancel').disabled = false;
  $('status').textContent = 'Checking the backup in your local Athena process…';
  try {
    const response = await fetch('/api/migration/constellation/review' + (fingerprint ? '?fingerprint=1' : ''), {
      method:'POST', headers:{'Content-Type':'application/octet-stream','X-Atlas-Request':'local-ui'},
      body:file, signal:current.signal, redirect:'error', cache:'no-store'
    });
    if (job !== current) return;
    if (!response.ok) {
      const error = response.status === 422 ? (await response.json()).error :
        ({413:'File exceeds the local review budget.',429:'Another review is still finishing. Try again shortly.',408:'Review timed out.'}[response.status] || 'Local review unavailable.');
      if (job === current) $('status').textContent = error;
      return;
    }
    const report = await response.json();
    if (job !== current) return;
    if (report.schema !== 'athena-constellation-v7-review' || report.source_schema !== 7 || !Array.isArray(report.slices)) throw Error('Unsupported review');
    result = report;
    reviewedFile = file;
    $('project-selector').hidden = false;
    renderCollections();
    const details = [];
    function append(prefix, group) {
      for (const [key,value] of Object.entries(group)) {
        const name = prefix + label(key);
        if (value !== null && typeof value === 'object') append(name + ' / ', value);
        else details.push(element('dt', name), element('dd', count(value)));
      }
    }
    append('', report.references);
    append('Artifact / ', report.artifact_references);
    append('Lifecycle / ', report.lifecycle);
    $('details').replaceChildren(...details);
    $('hashes').textContent = fingerprint ? [
      report.exact_input_sha256 && `JSON SHA-256: ${report.exact_input_sha256}`,
      report.selected_gzip_sha256 && `Selected gzip SHA-256: ${report.selected_gzip_sha256}`
    ].filter(Boolean).join(' · ') : 'Fingerprints omitted.';
    $('result').hidden = false;
    $('status').textContent = 'Review complete. No data was imported.';
  } catch {
    if (job === current) $('status').textContent = 'No result. Check that the local Athena process is running.';
  } finally {
    if (job === current) {
      job = undefined;
      $('start').disabled = false;
      $('cancel').disabled = true;
    }
  }
});
$('save').addEventListener('click', () => {
  if (!result) return;
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)+'\n'], {type:'application/json'}));
  link.href = url;
  link.download = 'athena-constellation-counts.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const stages = ['idea','research','building','testing','released','paused'];
const ownershipTypes = ['own','followed'];
function clearProjectSelection() {
  projectJob?.abort();
  projectJob = projectSelection = undefined;
  invalidateCandidate();
  for (const id of ['project-rows','picked-rows']) $(id).replaceChildren();
  $('project-recipe').reset();
  $('project-search').reset();
  $('project-search').hidden = $('project-recipe').hidden = true;
  $('project-picked').open = false;
  $('picked-count').textContent = 'Review selected projects (0)';
  $('project-status').textContent = '';
  $('load-projects').disabled = $('search-projects').disabled = false;
}
function choice(options, hint, accessibleName) {
  const select = document.createElement('select');
  select.setAttribute('aria-label',accessibleName);
  select.append(new Option(hint,''));
  for (const [value,text] of options) select.append(new Option(text,value));
  return select;
}
function updatePicked(view) {
  $('picked-count').textContent = `Review selected projects (${view.selected.size})`;
  const rows = [...view.selected.values()].map(p=>{
    const row=element('li',`${p.name} · ${p.stage || 'Choose a stage'} · ${p.ownership || 'Choose ownership'} `);
    const remove=element('button','Remove');remove.type='button';
    remove.setAttribute('aria-label','Remove selected '+p.name+' · '+p.id);
    remove.addEventListener('click',()=>{
      view.selected.delete(p.id);
      invalidateCandidate();
      renderProjectRows(view);
      $('picked-count').focus();
    });
    row.append(remove);return row;
  });
  $('picked-rows').replaceChildren(...rows);
}
function renderProjectRows(view) {
  $('project-rows').replaceChildren(...view.projects.map((p,i)=>{
    const row = document.createElement('fieldset');
    const date = new Date(p.at);
    row.append(element('legend',`${i+1}. ${p.name}`),element('p',
      `Updated: ${Number.isFinite(date.getTime())?date.toISOString():p.at}`));
    const check = document.createElement('input');check.type = 'checkbox';
    const selection = element('label',' Include this workspace project');selection.prepend(check);
    const stage = choice(stages.map(s=>[s,s]),'Choose a stage',`Stage for project ${i+1}`);
    const ownership = choice([['own','My project'],['followed','Following']],'Choose ownership',`Ownership for project ${i+1}`);
    const picked=view.selected.get(p.id);
    check.checked=Boolean(picked);
    stage.disabled = ownership.disabled = !picked;
    stage.value=picked?.stage||'';ownership.value=picked?.ownership||'';
    function preserveChoice() {
      if (check.checked && !view.selected.has(p.id) && view.selected.size>=24) {
        check.checked=false;
        $('project-status').textContent='24 projects already selected. Remove a selection before adding another.';
        return;
      }
      if (check.checked) view.selected.set(p.id,{id:p.id,name:p.name,stage:stage.value,ownership:ownership.value});
      else view.selected.delete(p.id);
      stage.disabled = ownership.disabled = !check.checked;
      invalidateCandidate();
      updatePicked(view);
    }
    check.addEventListener('change',preserveChoice);
    for (const input of [stage,ownership]) input.addEventListener('change',preserveChoice);
    const controls = document.createElement('p');controls.append(stage,' ',ownership);
    const identity = document.createElement('details');
    const idText = element('code','');
    identity.append(element('summary','Show source identifier'),idText);
    identity.addEventListener('toggle',()=>{idText.textContent=identity.open?p.id:'';});
    row.append(selection,controls,identity);
    return row;
  }));
  updatePicked(view);
}
async function listProjects(query='') {
  if (!reviewedFile || reviewedFile !== $('backup').files[0]) return;
  const term=new TextEncoder().encode(query);
  if (term.length>512 || /[\u0000-\u001f\u007f-\u009f]/.test(query)) {
    $('project-status').textContent='Use a shorter, single-line title search.';return;
  }
  projectJob?.abort();
  const file = reviewedFile, current = projectJob = new AbortController();
  const prev=projectSelection;
  const head=new Uint8Array([term.length>>8,term.length&255]);
  const option=query?'projects-search=1':'projects=1';
  const body=query?new Blob([head,term,file]):file;
  $('load-projects').disabled = $('search-projects').disabled = true;
  $('project-status').textContent = query?'Searching all eligible projects in this backup…':'Looking for live workspace projects in the selected backup…';
  try {
    const response = await fetch('/api/migration/constellation/review?'+option,{
      method:'POST', headers:{'Content-Type':'application/octet-stream','X-Atlas-Request':'local-ui'},
      body, signal:current.signal, redirect:'error', cache:'no-store'
    });
    if (current !== projectJob) return;
    if (!response.ok) throw Error('Unable to list projects for this backup.');
    const list = await response.json();
    if (current !== projectJob || file !== $('backup').files[0]) return;
    if (list.schema !== 'athena-constellation-project-selection-v1' || !hash(list.sourceSha256) ||
        !nonnegative(list.eligible) || !nonnegative(list.notEligible) || !nonnegative(list.matches) ||
        list.matches>list.eligible || !Array.isArray(list.projects) ||
        list.projects.length !== Math.min(list.matches,128) ||
        list.projects.some(p=>typeof p.id!=='string'||typeof p.name!=='string'||!nonnegative(p.at)))
      throw Error('Local project list could not be verified.');
    if(prev && prev.sourceSha256!==list.sourceSha256){
      clearProjectSelection();
      $('project-status').textContent='The backup changed. Review it again before making a new selection.';
      return;
    }
    projectSelection = {file,sourceSha256:list.sourceSha256,projects:list.projects,selected:prev?.selected||new Map()};
    invalidateCandidate();
    renderProjectRows(projectSelection);
    $('project-search').hidden = !list.eligible;
    $('project-recipe').hidden = !list.eligible;
    $('project-status').textContent = query
      ? `${list.projects.length} of ${list.matches} matching projects shown. ${list.eligible} eligible total. ${projectSelection.selected.size} selected.`
      : `${list.projects.length} of ${list.eligible} eligible projects shown. ${list.notEligible} records are not eligible.`+
         (list.projects.length<list.eligible?' Search by title to find projects beyond this first list.':'');
  } catch {
    if (current===projectJob) $('project-status').textContent = 'Project list refused or unavailable. No selection was changed.';
  } finally {
    if (current===projectJob) {projectJob=undefined;$('load-projects').disabled=$('search-projects').disabled=false;}
  }
}
$('load-projects').addEventListener('click', () => {$('project-query').value='';void listProjects();});
$('project-search').addEventListener('submit',event=>{event.preventDefault();void listProjects($('project-query').value.trim());});
$('clear-projects').addEventListener('click',()=>{
  clearProjectSelection();
  $('project-status').textContent='Project selection cleared. Nothing was imported.';
  $('load-projects').focus();
});
for (const id of ['project-destination','project-namespace']) $(id).addEventListener('input',()=>{
  invalidateCandidate();
});
function setCandidateBusy(busy) {
  $('save-recipe').disabled=$('build-candidate').disabled=busy;
}
function invalidateCandidate() {
  recipeGeneration++;candidateJob?.abort();candidateJob=undefined;
  setCandidateBusy(false);
}
function stageFrame(file, recipe, destination) {
  const header=new Uint8Array(16), view=new DataView(header.buffer);
  header.set([65,67,80,49]); // ACP1; lengths below are big endian.
  [file.size,recipe.byteLength,destination.byteLength].forEach((n,i)=>view.setUint32(4*(i+1),n));
  return new Blob([header,file,recipe,destination],{type:'application/octet-stream'});
}
$('project-recipe').addEventListener('submit',async event=>{
  event.preventDefault();
  const input = projectSelection, file = $('project-destination').files[0], namespace = $('project-namespace').value;
  if (!input || input.file!==$('backup').files[0]) return;
  const selected = [...input.selected.values()].map(({id,stage,ownership})=>({id,stage,ownership}));
  if (!selected.length || selected.length>24 || selected.some(p=>!stages.includes(p.stage)||!ownershipTypes.includes(p.ownership))){
    $('project-status').textContent='Select 1–24 rows and explicitly set stage and ownership for each.';
    return;
  }
  if (!file || !file.size || file.size>limit || !/^[a-zA-Z0-9_-]{1,64}$/.test(namespace)) {
    $('project-status').textContent='Choose a current Projects export and a stable workspace label.';
    return;
  }
  const build = event.submitter === $('build-candidate');
  const generation = ++recipeGeneration;
  setCandidateBusy(true);
  $('project-status').textContent = 'Checking the destination export in this browser…';
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const {parseBackup, STAGED_PROJECTS_KEY} = await import('/workspaces/projects/import.mjs');
    const roster = parseBackup(bytes);
    if (Object.hasOwn(roster,STAGED_PROJECTS_KEY) || roster.entries.length+selected.length>100)
      throw Error('Not a current destination export');
    const digest = await crypto.subtle.digest('SHA-256',bytes);
    if (generation!==recipeGeneration || input!==projectSelection || file!==$('project-destination').files[0]) return;
    const destinationSha256 = Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    const payload = new TextEncoder().encode(JSON.stringify({schema:1,sourceSha256:input.sourceSha256,destinationSha256,namespace,selected},null,2)+'\n');
    if (payload.length > 32*1024) throw Error('Recipe size limit');
    let download=payload, filename='athena-constellation-staging-recipe.json';
    if (build) {
      const controller=candidateJob=new AbortController();
      $('project-status').textContent='Checking selected projects in your local Athena process…';
      const response=await fetch('/api/migration/constellation/review?project-candidate=1',{
        method:'POST',headers:{'Content-Type':'application/octet-stream','X-Atlas-Request':'local-ui'},
        body:stageFrame(input.file,payload,bytes),signal:controller.signal,cache:'no-store',redirect:'error'
      });
      if (!response.ok) throw Error('The local engine refused this candidate');
      download = new Uint8Array(await response.arrayBuffer());
      if (download.byteLength>256*1024) throw Error('Unexpected candidate size');
      const parsed=parseBackup(download);
      if (parsed[STAGED_PROJECTS_KEY]?.destinationSha256!==destinationSha256 ||
          parsed.entries.length!==selected.length) throw Error('Unexpected candidate');
      filename = 'athena-constellation-project-candidate.json';
    }
    if (generation!==recipeGeneration || input!==projectSelection) return;
    const link=document.createElement('a');
    const href=URL.createObjectURL(new Blob([download],{type:'application/json'}));
    link.href=href;
    link.download=filename;
    link.click();
    setTimeout(()=>URL.revokeObjectURL(href),1000);
    $('project-status').textContent = build
      ? `Candidate download requested for ${selected.length} project(s). Nothing was imported. Review it using Athena Projects’ Import backup.`
      : `Recipe download requested for ${selected.length} selected project(s). Open it only in your local staging command.`;
  } catch {
    if (generation===recipeGeneration) $('project-status').textContent=build?'Candidate not saved. Verify the selected source and destination before trying again.':'Recipe not saved. Check the destination backup and the selection size.';
  } finally {
    if (generation===recipeGeneration) {candidateJob=undefined;setCandidateBusy(false);}
  }
});
