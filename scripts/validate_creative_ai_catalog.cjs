'use strict';
const fs = require('node:fs');
const path = require('node:path');
const CATEGORIES = new Set(['web-design', 'graphics-photo', 'music-audio', 'video']);
const STATES = new Set(['source-reviewed', 'runtime-tested', 'target-compared']);
function validateCatalog(catalog) {
  const errors = [];
  const requireText = (value, label) => { if (typeof value !== 'string' || !value.trim()) errors.push(`${label}: required text`); };
  const url = (value, label) => { try { if (new URL(value).protocol !== 'https:') throw Error(); } catch { errors.push(`${label}: HTTPS URL required`); } };
  if (catalog.schemaVersion !== 1) errors.push('schemaVersion: expected 1');
  if (!Array.isArray(catalog.tools) || !catalog.tools.length) return [...errors, 'tools: nonempty array required'];
  const ids = new Set();
  catalog.tools.forEach((tool, i) => {
    const p = `tools[${i}]`;
    for (const field of ['id', 'name', 'summary', 'setup', 'hardware', 'limitations', 'maintenance']) requireText(tool[field], `${p}.${field}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.id || '')) errors.push(`${p}.id: invalid slug`);
    if (ids.has(tool.id)) errors.push(`${p}.id: duplicate`); ids.add(tool.id);
    if (!Array.isArray(tool.categories) || !tool.categories.length || tool.categories.some(c => !CATEGORIES.has(c))) errors.push(`${p}.categories: invalid`);
    if (!STATES.has(tool.verification)) errors.push(`${p}.verification: invalid`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tool.checkedAt || '') || !Number.isFinite(Date.parse(tool.checkedAt))) errors.push(`${p}.checkedAt: invalid date`);
    url(tool.repository, `${p}.repository`);
    for (const type of ['code', 'weights']) {
      const license = tool.licenses?.[type];
      requireText(license?.name, `${p}.licenses.${type}.name`);
      requireText(license?.scope, `${p}.licenses.${type}.scope`);
      if (!['open-source', 'restricted', 'mixed', 'not-applicable', 'unverified'].includes(license?.classification)) errors.push(`${p}.licenses.${type}.classification: invalid`);
      if (license?.source) url(license.source, `${p}.licenses.${type}.source`);
      else if (license?.classification !== 'not-applicable') errors.push(`${p}.licenses.${type}.source: required`);
    }
    if (!Array.isArray(tool.sources) || !tool.sources.length) errors.push(`${p}.sources: required`);
    else tool.sources.forEach((source, j) => { url(source.url, `${p}.sources[${j}]`); requireText(source.supports, `${p}.sources[${j}].supports`); });
    if (tool.verification !== 'source-reviewed' && !tool.evidence?.length) errors.push(`${p}.evidence: required for runtime/target claims`);
    if (tool.recommendedForTarget && tool.verification !== 'target-compared') errors.push(`${p}: target recommendation requires target comparison`);
    if (tool.benchmarks?.length && !tool.evidence?.length) errors.push(`${p}: benchmarks require retained evidence`);
  });
  return errors;
}
module.exports = { validateCatalog };
if (require.main === module) {
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/creative-ai-tools.json'), 'utf8'));
  const errors = validateCatalog(catalog);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log(`Validated ${catalog.tools.length} creative-AI entries; source review is not runtime acceptance.`);
}
