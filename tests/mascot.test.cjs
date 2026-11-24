const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
test('home mascot preserves original dimensions and accessible identity',()=>{
 const app=fs.readFileSync(path.join(root,'dist/app.js'),'utf8');
 assert.match(app,/class="hero-art athena-mascot"/);
 assert.match(app,/width="1131" height="1391"/);
 assert.match(app,/alt="Athena, a fox–owl hybrid/);
 const png=fs.readFileSync(path.join(root,'dist/assets/athena-fox-owl-original.png'));
 assert.equal(png.readUInt32BE(16),1131);assert.equal(png.readUInt32BE(20),1391);
 const css=fs.readFileSync(path.join(root,'dist/styles.css'),'utf8');
 assert.match(css,/\.hero \.athena-mascot\{display:grid\}/);
 assert.match(css,/object-fit:contain/);
});
