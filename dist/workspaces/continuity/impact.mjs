// Exact, local reverse-link review. No dependency or truth inference.
import {validate} from './model.mjs';
const order = (a,b) => a < b ? -1 : a > b ? 1 : 0;
const note = entry => entry ? {id:entry.id, project:entry.project, kind:entry.kind,
  pinned:entry.pinned, ignored:entry.ignored, currentRevision:entry.revisions.length,
  currentEvidence:{...entry.revisions.at(-1)}} : null;
export function impact(value, id) {
  const data = validate(value);
  if (typeof id !== 'string' || !id.trim() || id.length > 100) throw Error('Invalid note ID');
  const entries = new Map(data.entries.map(entry => [entry.id,entry]));
  const reverse = new Map();
  for (const entry of data.entries) for (const ref of entry.dependencies || []) {
    const list = reverse.get(ref.id) || [];
    list.push({from:entry.id, ref}); reverse.set(ref.id,list);
  }
  for (const list of reverse.values()) list.sort((a,b)=>order(a.from,b.from));
  const reached = new Map([[id,{distance:0,via:null}]]), queue=[id];
  for (let i=0;i<queue.length;i++) for (const link of reverse.get(queue[i]) || []) {
    if (reached.has(link.from)) continue;
    reached.set(link.from,{distance:reached.get(queue[i]).distance+1,via:queue[i]});
    queue.push(link.from);
  }
  const dependents=queue.slice(1).map(key=>({...note(entries.get(key)),...reached.get(key)}));
  const links=[];
  for (const to of queue) for (const {from,ref} of reverse.get(to) || []) {
    const target=entries.get(to), evidence=target?.revisions[ref.revision-1];
    links.push({from,to,reviewedRevision:ref.revision,currentRevision:target?.revisions.length ?? null,
      reviewedEvidence:evidence ? {...evidence} : null,
      state:!target?'missing-note':!evidence?'missing-revision':ref.revision===target.revisions.length?'current':'changed'});
  }
  return {schema:'athena-continuity-impact',version:1,id,target:note(entries.get(id)),dependents,links,
    projects:[...new Set(dependents.map(entry=>entry.project))].sort(order),
    coverage:{storedEntries:data.entries.length,downstreamEntries:dependents.length,directDependents:dependents.filter(entry=>entry.distance===1).length,links:links.length},
    limitations:['Explicit local dependency links only, including ignored notes; no inferred relationships or automatic action.',
      'Distance and via encode one deterministic shortest path back to the requested note. All reached links are retained, including cycles; the requested note is not its own dependent.',
      'A missing target may still have dependents. An unknown unreferenced ID has zero coverage, not proof of no real-world impact.',
      'Changed or missing reviewed evidence is advisory, not proof that a dependent is wrong, incompatible or must be updated. No user operation is blocked.']};
}
export function impactMarkdown(report) {
  const literal=JSON.stringify;
  const lines=['# Athena Continuity impact review','',`Requested note: ${literal(report.id)}`,`Target: ${literal(report.target)}`,
    `Downstream notes: ${report.coverage.downstreamEntries}; direct: ${report.coverage.directDependents}.`,
    `Projects: ${literal(report.projects)}`,'','## Downstream notes'];
  for (const entry of report.dependents) lines.push(`- ${literal(entry)}`);
  lines.push('','## Explicit links and reviewed provenance');
  for (const link of report.links) lines.push(`- ${literal(link)}`);
  lines.push('','## Scope',...report.limitations.map(text=>`- ${text}`));
  return lines.join('\n')+'\n';
}
