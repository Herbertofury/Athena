import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compareText, textUnits, discoveryProjection, createQueryOwner } from './text-contract.mjs';

export function runFixture(fixture) {
  if (fixture.schema_version !== 1 || fixture.evidence !== 'synthetic') throw new TypeError('Only the labeled synthetic fixture is accepted');
  const owner = createQueryOwner();
  const old = owner.input('ca');
  owner.compositionStart();
  const during = owner.input('か', { isComposing: true });
  const oldAccepted = owner.complete(old);
  const committed = owner.compositionEnd('かな');
  const duplicate = owner.input('かな');
  const committedAccepted = owner.complete(committed);
  const duplicateComplete = owner.complete(committed);
  owner.dispose();
  const source = { provider: 'synthetic-provider', id: 'CaseSensitive-ID', title: 'ＡＢＣ', retained_body: 'Original body remains with caller' };
  return {
    schema_version: 1, evidence: 'synthetic',
    scope: 'Runtime primitive and pure ownership-model observations only; no browser, IME, accessibility, security, search-quality or performance acceptance.',
    pairs: fixture.pairs.map(row => ({ id: row.id, left: row.left, right: row.right, ...compareText(row.left, row.right) })),
    units: fixture.units.map(text => ({ text, ...textUnits(text) })),
    projection: { source, nfc: discoveryProjection(source), nfkc: discoveryProjection(source, 'NFKC') },
    ownership: { old, during, old_accepted_during_composition: oldAccepted, committed, duplicate, committed_accepted: committedAccepted, duplicate_complete: duplicateComplete, final_state: owner.state() },
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const fixture = JSON.parse(await readFile(new URL('./fixture.json', import.meta.url), 'utf8'));
  console.log(JSON.stringify({ environment: { node: process.versions.node, v8: process.versions.v8, unicode: process.versions.unicode, icu: process.versions.icu, cldr: process.versions.cldr, platform: process.platform, arch: process.arch }, ...runFixture(fixture) }, null, 2));
}
