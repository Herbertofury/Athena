const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {assertPage}=require('../scripts/research_pagination_browser_checks.cjs');
const good=()=>({label:'Page 3 of 12',hash:'#research?page=3',titles:Array.from({length:24},(_,i)=>'Candidate '+i),query:''});
test('pagination browser oracle rejects reset label, route, missing or duplicated cards and lost search',()=>{
 assert.doesNotThrow(()=>assertPage(good(),3));
 for(const change of [{label:'Page 1 of 12'},{hash:'#research?q='},{titles:['only one']},{titles:Array(24).fill('duplicate')},{query:'unexpected'}])assert.throws(()=>assertPage({...good(),...change},3),error=>error.code==='ERR_ASSERTION');
});
test('existing browser lane calls pagination checks without new launcher or weaker gates',()=>{
 const root=path.resolve(__dirname,'..'),entry=fs.readFileSync(path.join(root,'scripts/test_browser.cjs'),'utf8'),helper=fs.readFileSync(path.join(root,'scripts/research_pagination_browser_checks.cjs'),'utf8');
 assert.equal(entry.split("require('./research_pagination_browser_checks.cjs').runResearchPaginationBrowserChecks").length-1,1);
 assert.doesNotMatch(helper,/chromium\.launch|--no-sandbox|require\(['"]playwright/);assert.match(helper,/page.reload/);assert.match(helper,/notDeepEqual/);assert.match(entry,/outsideRequests/);
});
