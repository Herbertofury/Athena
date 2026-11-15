// Original Athena R&D adapter over the existing native Continuity schema.
// This read-only view never authorizes, executes, delivers or blocks work.
import {validate} from '../../dist/workspaces/continuity/model.mjs';
export function agenda(value, reviews = []) {
  const state = validate(value);
  if (!Array.isArray(reviews)) throw Error('Reviews must be an array');
  const keys = new Set();
  for (const review of reviews) {
    if (!review || typeof review.id !== 'string' || keys.has(review.id) ||
        !Number.isSafeInteger(review.revision) || review.revision < 1 ||
        !['considered', 'revisit'].includes(review.outcome) ||
        typeof review.note !== 'string' || review.note.length > 10000 ||
        !Number.isFinite(review.at)) throw Error('Invalid review receipt');
    keys.add(review.id);
  }
  const rows = state.entries.filter(entry => !entry.ignored).map(entry => {
    const receipt = reviews.find(review => review.id === entry.id);
    const revision = entry.revisions.length;
    if (receipt && receipt.revision > revision) throw Error('Receipt references a future revision');
    return {
      id: entry.id, project: entry.project, kind: entry.kind, revision,
      text: entry.revisions.at(-1).text, source: entry.revisions.at(-1).source,
      review: !receipt ? 'unreviewed' : receipt.revision !== revision ? 'changed-since-review' : receipt.outcome,
      receipt: receipt ? structuredClone(receipt) : null,
      // A single imported decision is not global authority or an execution grant.
      advisoryOnly: true,
    };
  });
  return {schema: 1, advisoryOnly: true, rows,
    orphanReceipts: reviews.filter(review => !state.entries.some(entry => entry.id === review.id)).map(review => structuredClone(review))};
}
