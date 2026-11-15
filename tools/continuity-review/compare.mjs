// Compare explicitly supplied snapshots. Never read a browser or apply changes.
import {validate} from '../../dist/workspaces/continuity/model.mjs';
import {review} from './review.mjs';
const fields = ['project', 'kind', 'pinned', 'ignored', 'revisions', 'history', 'dependencies'];
const canonical = value => JSON.stringify(value, function(key, item) {
  return item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(name => [name, item[name]])) : item;
});
const projection = entry => entry ? Object.fromEntries(['id', ...fields].map(key => [key,
  key === 'dependencies' ? [...(entry.dependencies || [])].sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : entry[key]])) : null;
function scope(data, project) {
  const byId = new Map(data.entries.map(entry => [entry.id, entry]));
  const selected = new Set(data.entries.filter(entry => !project || entry.project === project).map(entry => entry.id));
  // Include ignored roots and dependencies: policy changes must not hide records.
  const pending = [...selected];
  while (pending.length) for (const link of byId.get(pending.pop())?.dependencies || []) {
    if (byId.has(link.id) && !selected.has(link.id)) {selected.add(link.id); pending.push(link.id);}
  }
  return selected;
}
export function compare(before, after, project = '') {
  if (typeof project !== 'string') throw Error('Invalid project');
  before = validate(before); after = validate(after);
  const selected = new Set([...scope(before, project), ...scope(after, project)]);
  const old = new Map(before.entries.map(entry => [entry.id, entry]));
  const next = new Map(after.entries.map(entry => [entry.id, entry]));
  const changes = []; let unchanged = 0;
  for (const id of [...selected].sort()) {
    const a = projection(old.get(id)), b = projection(next.get(id));
    const changedFields = fields.filter(key => canonical(a?.[key]) !== canonical(b?.[key]));
    if (a && b && !changedFields.length) {unchanged++; continue;}
    changes.push({id, status: !a ? 'added' : !b ? 'removed' : 'changed', fields: changedFields, before: a, after: b});
  }
  return {schema: 'athena-continuity-comparison', version: 1, project: project || null,
    coverage: {before: scope(before, project).size, after: scope(after, project).size, compared: selected.size, unchanged}, changes,
    warnings: {before: review(before, project).warnings, after: review(after, project).warnings},
    limitations: ['Read-only comparison of two explicitly supplied snapshots; no restore, mutation, provider request or migration is performed.',
      'Includes ignored roots and transitive dependencies in either snapshot. Removed means absent from the supplied after snapshot, not a recommendation to delete.',
      'Known fields, exact revisions, provenance and policy history are compared. Unknown extension fields are not compared; this is not a lossless backup.',
      'No semantic truth, chronology, completeness or source authority is inferred. Snapshot acquisition and concurrent file mutation remain outside this command.']};
}
export function comparisonMarkdown(report) {
  const literal = value => JSON.stringify(value);
  const lines = ['# Athena Continuity snapshot comparison', '', `Project: ${literal(report.project)}`,
    `Compared: ${report.coverage.compared}; unchanged: ${report.coverage.unchanged}; changed records: ${report.changes.length}.`];
  for (const change of report.changes) lines.push('', `## ${change.status}: ${literal(change.id)}`,
    `Fields: ${change.fields.join(', ')}`, `Before: ${literal(change.before)}`, `After: ${literal(change.after)}`);
  lines.push('', '## Advisory warnings', `Before: ${literal(report.warnings.before)}`, `After: ${literal(report.warnings.after)}`,
    '', '## Scope', ...report.limitations.map(value => `- ${value}`));
  return lines.join('\n') + '\n';
}
