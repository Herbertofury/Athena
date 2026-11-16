const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('home acknowledges native authoring without claiming parity or data migration',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8');
 const home=app.slice(app.indexOf('function home()'),app.indexOf('function home()')+6000);
 assert.match(home,/native Foundry authoring into one app/);
 assert.match(home,/Full original-feature parity and private user-data migration remain unfinished/);
 assert.doesNotMatch(home,/Feature-work integration is still pending/);
 assert.match(home,/href="#build"/);
});
