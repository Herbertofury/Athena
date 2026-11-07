'use strict';
const baseline=require('../enderloom-media/src/provider-media.js');
const candidate=require('./streaming-candidate/src/provider-media.js');
const assert=require('node:assert/strict');
const title='Atlas Generated Fixture',source='https://www.nexusmods.com/skyrimspecialedition/mods/123456';
const url='https://staticdelivery.nexusmods.com/mods/1704/images/123456/fixture.png';
const cases=[
 ['apostrophe',`<img class="gallery" src="${url}" alt="Hero's gallery">`,"Hero's gallery",1],
 ['double quote',`<img class="gallery" src="${url}" alt='The "quoted" view'>`,'The "quoted" view',1],
 ['unquoted',`<img class=gallery src=${url} alt=Unquoted>`,'Unquoted',1],
 ['greater than',`<img class="gallery" alt="Angle > threshold" src="${url}">`,'Angle > threshold',1],
 ['comment',`<!-- <img class="gallery" src="${url}" alt="Hidden"> -->`,null,0],
 ['script',`<script>const sample='<img class="gallery" src="${url}" alt="Hidden">';</script>`,null,0],
 ['entity',`<img class="gallery" src="${url}" alt="&amp;lt; literal">`,'&lt; literal',1],
];
const rows=[];
for(const [name,markup,expected,count] of cases){const html=`<html><head><title>${title}</title></head><body><h1>${title}</h1>${markup}</body></html>`;const a=baseline.parseGenericProjectHtml(html,source,{title}),b=candidate.parseGenericProjectHtml(html,source,{title});const row={case:name,expected_count:count,expected_alt:expected,baseline_gallery:a.gallery,candidate_gallery:b.gallery};row.candidate_matches_expected=b.gallery.length===count&&(count===0||b.gallery[0].alt===expected);rows.push(row);assert.ok(row.candidate_matches_expected,name);}
console.log(JSON.stringify(rows,null,2));
