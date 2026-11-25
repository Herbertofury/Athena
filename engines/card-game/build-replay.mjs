// SPDX-License-Identifier: GPL-3.0-or-later
// Generate an isolated compatibility experiment from only the retained, pinned source.
import { createHash } from 'node:crypto';
import { readFile, mkdir, realpath, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname, basename, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pins = {
  'engine.js': 'c6d6846bdef31be36dcc60e94d3d11fbb91ccb50',
  'state.js': 'ec1981043b30234919b95d5130602b3b906e3c64',
  'cards.js': '0fe026f3bac4b7aa1d8be2cedfd7db9ac1a80fc5'
};
const intro = '// SPDX-License-Identifier: GPL-3.0-or-later\n// Derived from pinned GameSync bce6c1bcb31c63d31c64185fef143a53d9c4d35f.\n';
const changes = (text, pattern, replacement, count) => {
  let observed = 0;
  const updated = text.replace(pattern, (...args) => { observed++; return typeof replacement === 'function' ? replacement(...args) : replacement; });
  if (observed !== count) throw Error('Unexpected pinned-source transformation count');
  return updated;
};
async function upstream(name) {
  const data = await readFile(resolve(here, 'upstream/gamesync', name));
  const oid = createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
  if (oid !== pins[name]) throw Error('Pinned GameSync source did not match');
  return new TextDecoder('utf-8',{fatal:true}).decode(data);
}
function exactSlice(text, first, last) {
  const a=text.indexOf(first), b=text.indexOf(last,a+first.length);
  if(a<0||b<=a)throw Error('Pinned source section not found');
  return text.slice(a,b).trimEnd()+'\n';
}
function extractConst(text, name) {
  return exactSlice(text,'export const '+name+' =','\n};')+'};\n';
}

export async function buildReplay(destination) {
  destination = resolve(destination);
  destination = resolve(await realpath(dirname(destination)),basename(destination));
  const from = relative(await realpath(here),destination);
  if(!isAbsolute(from)&&from!=='..'&&!from.startsWith('..'+sep))throw Error('Use a new directory outside the engine source');
  const [rawEngine,state,cards,entropy,license]=await Promise.all([
    upstream('engine.js'),upstream('state.js'),upstream('cards.js'),
    readFile(resolve(here,'src/replay-entropy.mjs')),readFile(resolve(here,'LICENSE'))
  ]);
  let engine = changes(rawEngine,/"\.\/state\.js"/g,'"./match-state.mjs"',1);
  engine = changes(engine,/"\.\/cards\.js"/g,'"./card-terms.mjs"',1);
  engine = changes(engine,/import \{ getHeroPowerAction \} from "\.\/heroes\.js";\n/g,'',1);
  engine = changes(engine,/createEngine\(cardLookup, heroLookup\) \{/g,
    'createEngine(cardLookup, heroLookup, {entropy, getHeroPowerAction} = {}) {\n  if ([cardLookup, heroLookup, getHeroPowerAction, entropy?.next, entropy?.now].some(value => typeof value !== "function")) throw new TypeError("Explicit lookups, hero power resolver, and replay entropy required");\n  const random = () => entropy.next();\n  const now = () => entropy.now();',1);
  engine = changes(engine,/Math\.random\(\)/g,'random()',17);
  engine = changes(engine,/Date\.now\(\)/g,'now()',3);
  engine = changes(engine,/blankMinionState\(([^\n]*?), s\.turn\)/g,(_,arg)=>'blankMinionState('+arg+', s.turn, random)',5);
  engine = changes(engine,/shuffleArray\((\[\.\.\.\(opts\.(?:deckCards|enemyDeckCards) \|\| \[\]\)\]|s\.deckCards)\)/g,(_,arg)=>'shuffleArray('+arg+', random)',3);
  engine = changes(engine,/\[\.\.\.new Set\(candidates\)\]\.sort\(\(\) => random\(\) - 0\.5\)/g,'shuffleArray([...new Set(candidates)], random)',1);
  engine = changes(engine,/function shuffleArray\(arr\)/g,'function shuffleArray(arr, random)',1);
  let match = exactSlice(state,'export function blankMatchState()','export function blankProfileState()');
  match = changes(match,/blankMinionState\(cardId, turn\)/g,'blankMinionState(cardId, turn, random)',1);
  match = changes(match,/Math\.random\(\)/g,'random()',1);
  // No private data, network access, runtime source rewriting or evaluation.
  const content = new Map([
    ['engine.mjs',intro+engine], ['match-state.mjs',intro+match],
    ['card-terms.mjs',intro+extractConst(cards,'CARD_TYPES')+extractConst(cards,'KEYWORDS')],
    ['replay-entropy.mjs',entropy], ['LICENSE',license]
  ]);
  await mkdir(destination,{mode:0o700});
  for (const [name,data] of content) await writeFile(resolve(destination,name),data,{flag:'wx'});
  return [...content.keys()];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) throw Error('Usage: node build-replay.mjs NEW-DIRECTORY');
  await buildReplay(process.argv[2]);
}
