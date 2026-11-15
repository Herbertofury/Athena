import {validate} from './model.mjs';

// Explicit links only: shared words, recency and popularity are not evidence of
// dependency, truth or compatibility. A changed baseline is advisory, not a veto.
export function compileContext(value, project = '') {
  const data = validate(value), byId = new Map(data.entries.map(entry => [entry.id, entry]));
  const roots = data.entries.filter(entry => !entry.ignored && (!project || entry.project === project));
  roots.sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.id.localeCompare(b.id));
  const rootIds = new Set(roots.map(entry => entry.id));
  const ids = new Set(), queue = roots.map(entry => entry.id), links = [], warnings = [];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const id = queue[cursor];
    if (ids.has(id)) continue;
    const entry = byId.get(id);
    if (!entry) continue;
    ids.add(id);
    for (const reference of entry.dependencies || []) {
      const dependency = byId.get(reference.id), baseline = dependency?.revisions[reference.revision - 1];
      const link = {from: id, to: reference.id, reviewedRevision: reference.revision,
        observedRevision: dependency?.revisions.length ?? null, reviewedEvidence: baseline ? {...baseline} : null};
      links.push(link);
      if (!dependency) warnings.push({id, dependencyId: reference.id, kind: 'missing', message: 'Linked evidence is missing from this local collection.'});
      else {
        queue.push(dependency.id);
        if (!baseline) warnings.push({id, dependencyId: reference.id, kind: 'missing-revision', message: 'The linked revision is not available; no replacement was inferred.'});
        else if (reference.revision !== dependency.revisions.length) warnings.push({id, dependencyId: reference.id, kind: 'changed', message: `Evidence changed from reviewed revision ${reference.revision} to observed revision ${dependency.revisions.length}. Review what changed; newer is not automatically better.`});
        if (dependency.ignored) warnings.push({id, dependencyId: reference.id, kind: 'ignored', message: 'Linked evidence is ignored in the working set; it remains visible here for provenance.'});
      }
    }
  }
  // Propagate advisory status once per node; cycles terminate without hiding data.
  const affected = new Set(warnings.map(warning => warning.id)), reverse = new Map();
  for (const link of links) {const list = reverse.get(link.to) || []; list.push(link.from); reverse.set(link.to, list);}
  const propagation = [...affected];
  for (let i = 0; i < propagation.length; i++) for (const dependent of reverse.get(propagation[i]) || []) {
    if (affected.has(dependent)) continue;
    affected.add(dependent); propagation.push(dependent);
    warnings.push({id: dependent, dependencyId: propagation[i], kind: 'upstream-review', message: 'An upstream dependency has evidence to review. This does not prove this note is wrong.'});
  }
  const entries = [...ids].map(id => {
    const entry = byId.get(id), revision = entry.revisions.at(-1);
    return {id, project: entry.project, kind: entry.kind, pinned: entry.pinned, ignored: entry.ignored,
      revision: entry.revisions.length, text: revision.text, source: revision.source, at: revision.at,
      root: rootIds.has(id), needsReview: affected.has(id)};
  });
  return {schema: 'athena-project-context', version: 1, project: project || null,
    coverage: {storedEntries: data.entries.length, selectedRoots: roots.length, includedEntries: entries.length,
      ignoredRootsExcluded: data.entries.filter(entry => entry.ignored && (!project || entry.project === project)).length,
      links: links.length, warnings: warnings.length}, entries, links, warnings,
    limitations: ['Manual local evidence only; not automatic capture or exhaustive project knowledge.', 'No inferred truth, completion, compatibility or authority score.', 'No provider message is sent. Warnings do not block editing or export.']};
}

export function contextMarkdown(packet) {
  // User-authored Markdown stays literal in the exported document; never render
  // this string as HTML and never send it to a provider without explicit action.
  const lines = ['# Athena project context', '', `Project: ${packet.project || 'All projects'}`, '',
    `Coverage: ${packet.coverage.includedEntries} included notes; ${packet.coverage.selectedRoots} selected roots; ${packet.coverage.ignoredRootsExcluded} ignored roots excluded.`, '', '## Advisory review findings'];
  if (!packet.warnings.length) lines.push('No changed or missing linked evidence detected. This is not proof of correctness or completion.');
  for (const warning of packet.warnings) lines.push(`- ${warning.id} → ${warning.dependencyId}: ${warning.message}`);
  lines.push('', '## Current notes and provenance');
  for (const entry of packet.entries) lines.push('', `### ${entry.project} · ${entry.kind} · ${entry.id}`, `Observed revision: ${entry.revision}${entry.ignored ? ' (ignored source retained)' : ''}`, '', entry.text, '', `Source: ${entry.source || 'Not supplied'}`);
  lines.push('', '## Reviewed dependency baselines');
  for (const link of packet.links) lines.push('', `- ${link.from} → ${link.to}: reviewed revision ${link.reviewedRevision}; observed revision ${link.observedRevision ?? 'missing'}`, `  Source: ${link.reviewedEvidence?.source || 'Not supplied / unavailable'}`, '', link.reviewedEvidence?.text || '[Reviewed evidence unavailable]');
  lines.push('', '## Scope', ...packet.limitations.map(item => `- ${item}`));
  return lines.join('\n');
}
