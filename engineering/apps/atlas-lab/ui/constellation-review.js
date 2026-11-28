const $ = id => document.getElementById(id);
const element = (tag, text) => Object.assign(document.createElement(tag), {textContent:text});
const limit = 16 * 1024 * 1024;
let job, result;
const label = key => key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
const count = n => n === null ? 'Not recorded' : typeof n === 'boolean' ? (n ? 'Yes' : 'No') : n.toLocaleString();
const attention = s => s.retained === null || s.cap_reached || (s.omitted ?? 0) > 0;

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
  job = result = undefined;
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
  result = undefined;
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
