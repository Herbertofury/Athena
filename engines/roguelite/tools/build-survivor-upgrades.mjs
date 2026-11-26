// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
const original=new URL('../upstream/gamesync/game-survivors.js',import.meta.url);
const helpers=new URL('../../shared-game-runtime/upstream/gamesync/game-core.js',import.meta.url);
const pin='1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7';
const helperPin='f6c4f182ec271a1aefe2decea72cd9da0d120cfa8e649126c04e55d15a4b038e';
function exact(url,sha){const raw=readFileSync(url);assert.equal(createHash('sha256').update(raw).digest('hex'),sha);return raw.toString('utf8');}
const src=exact(original,pin),core=exact(helpers,helperPin);
const piece=(s,pattern)=>{const m=s.match(pattern);assert.ok(m,'Expected exact former boundary');return m[0];};
const weapon=piece(src,/  const WEAPONS = \{[\s\S]+?\n  \};/);
const upgrades=piece(src,/  const UPGRADES = \[[\s\S]+?\n  \];/);
const draft=piece(src,/      \/\/ Pick 3 random upgrades\n[\s\S]+?(?=\n      levelUpPaused = true)/).replaceAll('Math.random()', 'random()')
 .replace('pool.sort(() => random() - 0.5)','shuffle ? shuffle(pool) : pool.sort(() => random() - 0.5)');
const pick=piece(core,/  const pick  = \(arr\) => arr\[Math\.floor\(Math\.random\(\) \* arr\.length\)\];/).replace('Math.random()','random()');
const apply=piece(src,/                if \(choice\.weapon\) \{[\s\S]+?\n                \}(?=\n                levelUpChoices = null)/);
const result=`// SPDX-License-Identifier: GPL-3.0-or-later
// Extracted exact legacy GameSync upgrade formulas; do not place in a renderer.
// Original commit bce6c1bcb31c63d31c64185fef143a53d9c4d35f / SHA-256 ${pin}.
${weapon}
${upgrades}

export function generateLegacyUpgradeOffers(player,random,shuffle) {
${pick}
    let levelUpChoices;
${draft}
    return levelUpChoices;
}

export function applyLegacyUpgradeChoice(player,choice) {
${apply}
}
`;
const out=new URL('../src/gamesync-upgrade-formulas.mjs',import.meta.url);
if(process.argv.includes('--check'))assert.equal(readFileSync(out,'utf8').replaceAll('\r\n','\n'),result);
else writeFileSync(out,result);
