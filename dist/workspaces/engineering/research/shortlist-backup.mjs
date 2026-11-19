export const MAX_BACKUP_BYTES = 16384;
const keys = ['format', 'version', 'catalog_snapshot', 'candidate_ids'];
export function validateBackup(value, catalog) {
  if (!value || Array.isArray(value) || typeof value !== 'object' || Object.keys(value).sort().join() !== [...keys].sort().join()
      || value.format !== 'athena-research-shortlist' || value.version !== 1
      || typeof value.catalog_snapshot !== 'string' || !value.catalog_snapshot || value.catalog_snapshot.length > 100
      || !Array.isArray(value.candidate_ids) || value.candidate_ids.length > 4)
    throw new Error('Not a supported Athena shortlist backup. Test plans are not backups.');
  const known = new Set(catalog.entries.map(entry => entry.id));
  if (new Set(value.candidate_ids).size !== value.candidate_ids.length || value.candidate_ids.some(id => typeof id !== 'string' || !known.has(id)))
    throw new Error('Backup contains duplicate or unavailable candidate IDs. Nothing was replaced.');
  return {ids: [...value.candidate_ids], snapshotChanged: value.catalog_snapshot !== catalog.snapshot_date};
}
export function parseBackup(text, catalog) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES)
    throw new Error('Backup exceeds the 16 KiB limit.');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('Backup is not valid JSON.'); }
  return validateBackup(value, catalog);
}
export function createBackup(ids, catalog) {
  const value = {format: 'athena-research-shortlist', version: 1, catalog_snapshot: catalog.snapshot_date, candidate_ids: [...ids]};
  validateBackup(value, catalog);
  return JSON.stringify(value, null, 2) + '\n';
}
export function mountBackup({root, catalog, getIds, getStored, replaceIds, download, signal}) {
  const doc = root.ownerDocument, panel = doc.createElement('section');
  panel.setAttribute('aria-label', 'Research shortlist backup');
  panel.innerHTML = '<h3>Carry your shortlist</h3><p>Back up up to four candidate IDs. Restore replaces only the shortlist, never research evidence or an executable test plan.</p><button type="button" class="button secondary" data-backup-export>Download shortlist backup</button> <label>Choose shortlist backup <input type="file" accept="application/json,.json" data-backup-file></label><p role="status" aria-live="polite" data-backup-status></p><button type="button" class="button secondary" data-backup-restore hidden>Replace shortlist</button> <button type="button" class="button secondary" data-backup-cancel hidden>Cancel restore</button>';
  root.getElementById('catalog').append(panel);
  const input = panel.querySelector('[data-backup-file]'), status = panel.querySelector('[data-backup-status]');
  const restore = panel.querySelector('[data-backup-restore]'), cancel = panel.querySelector('[data-backup-cancel]');
  let generation = 0, pending = null, disposed = false;
  function reset() { generation++; pending = null; restore.hidden = cancel.hidden = true; input.value = ''; }
  function dispose() { disposed = true; reset(); panel.remove(); signal?.removeEventListener('abort', dispose); }
  signal?.addEventListener('abort', dispose, {once: true});
  if (signal?.aborted) { dispose(); return dispose; }
  panel.querySelector('[data-backup-export]').addEventListener('click', () => {
    if (disposed) return;
    try { download('athena-research-shortlist.json', createBackup(getIds(), catalog), 'application/json'); status.textContent = 'Backup download requested. Keep the file somewhere you control.'; }
    catch { status.textContent = 'Backup could not be prepared. Your shortlist is unchanged.'; }
  });
  input.addEventListener('change', async () => {
    const file = input.files?.[0]; reset(); if (!file || disposed) return;
    const ticket = generation; cancel.hidden = false; status.textContent = 'Reading local backup…';
    try {
      if (!Number.isSafeInteger(file.size) || file.size < 0 || file.size > MAX_BACKUP_BYTES) throw new Error('Backup exceeds the 16 KiB limit.');
      const baseline = JSON.stringify(getIds()), stored = getStored();
      const result = parseBackup(await file.text(), catalog);
      if (disposed || generation !== ticket) return;
      pending = {...result, baseline, stored}; restore.hidden = false;
      status.textContent = `Ready to replace ${getIds().length} candidates with ${result.ids.length}.` + (result.snapshotChanged ? ' Catalog snapshot differs; all candidate IDs are still available.' : '') + ' No changes yet.';
    } catch (error) {
      if (disposed || generation !== ticket) return;
      reset(); status.textContent = error.message || 'Backup could not be read. Nothing was replaced.';
    }
  });
  cancel.addEventListener('click', () => { if (disposed) return; reset(); status.textContent = 'Restore cancelled. Your shortlist is unchanged.'; });
  restore.addEventListener('click', () => {
    if (disposed || !pending) return;
    const proposal = pending;
    try {
      if (JSON.stringify(getIds()) !== proposal.baseline || getStored() !== proposal.stored) throw new Error('Shortlist changed while reviewing. Choose the backup again.');
      replaceIds([...proposal.ids]); reset(); status.textContent = 'Shortlist replaced and saved in this browser. No test plan was executed.';
    } catch (error) { reset(); status.textContent = error.message || 'Restore failed. Nothing was replaced.'; }
  });
  return dispose;
}
