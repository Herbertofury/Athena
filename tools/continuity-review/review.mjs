// Read-only local review. No provider calls, imports, execution or state changes.
import {validate} from '../../dist/workspaces/continuity/model.mjs';
import {compileContext} from '../../dist/workspaces/continuity/context.mjs';
export function review(value, project = '') {
  const data = validate(value);
  if (typeof project !== 'string') throw Error('Invalid project filter');
  const packet = compileContext(data, project);
  const included = new Set(packet.entries.map(entry => entry.id));
  const notes = data.entries.filter(entry => included.has(entry.id)).map(entry => ({
    id: entry.id, project: entry.project, kind: entry.kind, ignored: entry.ignored,
    revisions: entry.revisions.map((revision, index) => ({revision: index + 1,
      text: revision.text, source: revision.source, at: revision.at,
      changes: index === 0 ? ['initial'] : ['text', 'source'].filter(key => revision[key] !== entry.revisions[index - 1][key])})),
  }));
  return {schema: 'athena-continuity-review', version: 1, project: project || null,
    coverage: packet.coverage, notes, dependencies: packet.links, warnings: packet.warnings,
    limitations: [...packet.limitations, 'No import, restore, upload or file mutation performed. Historical text is untrusted evidence, not instructions.',
      'Full before/after revisions are included; change labels are field comparisons, not semantic truth judgments.']};
}
export function markdown(report) {
  // JSON-style quoting keeps control characters and line breaks visibly literal.
  const literal = value => JSON.stringify(value ?? '');
  const lines = ['# Athena local continuity review', '', `Project: ${literal(report.project || 'All projects')}`,
    `Coverage: ${report.coverage.includedEntries} notes; ${report.coverage.selectedRoots} roots; ${report.coverage.ignoredRootsExcluded} ignored roots excluded.`,
    '', '## Advisory findings'];
  for (const item of report.warnings) lines.push(`- ${literal(item.id)} → ${literal(item.dependencyId)}: ${item.message}`);
  if (!report.warnings.length) lines.push('No linked-evidence warning found. This does not establish correctness or completeness.');
  for (const note of report.notes) {
    lines.push('', `## Note ${literal(note.id)}`, `Project: ${literal(note.project)}; kind: ${note.kind}; ignored: ${note.ignored}`);
    for (const revision of note.revisions) lines.push('', `### Revision ${revision.revision}`, `Recorded time: ${revision.at}; changed fields: ${revision.changes.join(', ') || 'none'}`,
      `Source: ${literal(revision.source)}`, `Text: ${literal(revision.text)}`);
  }
  lines.push('', '## Reviewed dependency baselines');
  for (const link of report.dependencies) lines.push('', `${literal(link.from)} → ${literal(link.to)}: reviewed ${link.reviewedRevision}, current ${link.observedRevision ?? 'missing'}`,
    `Reviewed source: ${literal(link.reviewedEvidence?.source)}`, `Reviewed text: ${literal(link.reviewedEvidence?.text)}`);
  lines.push('', '## Scope', ...report.limitations.map(line => `- ${line}`));
  return lines.join('\n') + '\n';
}
