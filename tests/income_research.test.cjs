const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
test('income exercise remains in existing native career lesson with evidence boundaries', () => {
 const catalog=JSON.parse(read('src/catalog.json'));
 assert.equal(catalog.lessons.length,98);
 const lesson=catalog.lessons.find(x=>x.id==='portfolio');
 assert.equal(lesson.category,'Career practice');
 assert.match(lesson.explain.join(' '),/not an audited result/);
 assert.match(lesson.lab.join(' '),/Do not connect wallets/);
 assert.match(lesson.lab.join(' '),/observed results/);
 assert.ok(lesson.sources.includes('https://www.cftc.gov/PressRoom/PressReleases/8854-24'));
 const context={}; vm.runInNewContext(read('dist/catalog.js'),context);
 assert.equal(JSON.stringify(context.ATHENA_DATA.lessons.find(x=>x.id==='portfolio')),JSON.stringify(lesson));
 assert.equal(read('docs/shared/portfolio.md'),read('wiki/shared-portfolio.md'));
});
test('reviewed runtime hash matches generated native lesson catalog',()=>{
 const record=JSON.parse(read('config/runtime-public-preview.json')).files.find(x=>x.path==='catalog.js');
 assert.equal(record.sha256,crypto.createHash('sha256').update(read('dist/catalog.js')).digest('hex'));
});
test('study preserves source scope, unresolved proof and unfinished opportunities workspace',()=>{
 const study=read('research/online-income-2026-11-17/README.md');
 for(const text of ['2122412378835091855','2091901718061531571','inline screenshots were not individually audited','No earnings are promised','Not implemented by this study','direct retrieval returned 403']) assert.ok(study.includes(text),text);
});
test('opportunity evidence never upgrades unknown income or access to verified profit',()=>{
 const data=JSON.parse(read('research/online-income-2026-11-17/evidence.json'));
 assert.equal(data.mode,'research-only');
 assert.equal(data.profit_claim.status,'unverified-self-report');
 assert.equal(data.opportunities.length,4);
 assert.ok(data.opportunities.every(x=>x.realized_net_income===null));
 assert.ok(Object.values(data.execution).every(x=>x===0));
 assert.equal(data.access.inline_images,'not-individually-inspected');
});
