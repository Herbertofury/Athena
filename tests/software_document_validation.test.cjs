const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const catalog=JSON.parse(fs.readFileSync(new URL('../dist/workspaces/software/catalog.json',`file://${__filename}`)));
const ids=['ace-by-daisy-app','pac-pdf-accessibility-checker','verapdf','epubcheck'];
test('four documented validators are indexed with Windows and honest portability boundaries',async()=>{
 const model=await import('../dist/workspaces/software/model.mjs');const index=model.indexCatalog(catalog);
 for(const id of ids){const a=catalog.applications.find(a=>a.id===id);assert.ok(a);assert.ok(a.platforms.includes('Windows'));assert.match(a.platform_notes,/not|no current|unverified|prerequisite|not assured/);assert.ok(a.sources.every(s=>s.url.startsWith('https://')&&s.checked_at==='2026-11-19'));const result=model.queryCatalog(index,{query:a.name,platform:'Windows'},catalog);assert.ok(result.some(r=>r.id===id));}
});
test('rights and unmeasured maintenance are not converted to fabricated certification',()=>{
 const apps=Object.fromEntries(catalog.applications.filter(a=>ids.includes(a.id)).map(a=>[a.id,a]));assert.match(apps.epubcheck.license,/BSD-3-Clause/);assert.ok(apps.epubcheck.sources.some(s=>s.url.endsWith('/v5.4.0/LICENSE.md')&&s.supports.includes('license')));assert.equal(apps['pac-pdf-accessibility-checker'].license_kind,'proprietary');assert.equal(apps['pac-pdf-accessibility-checker'].pricing_model,'free');assert.ok(apps['pac-pdf-accessibility-checker'].limitations.some(x=>x.includes('Do not mirror')));
 for(const id of ids.filter(x=>x!=='pac-pdf-accessibility-checker')){assert.equal(apps[id].maintenance.status,'unverified');assert.equal(apps[id].pricing_model,'unknown');}
});
