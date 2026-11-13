const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {validate}=require('../scripts/validate_ui_design_library.cjs');
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/ui-design-library.json'),'utf8'));
const copy=()=>structuredClone(original);
test('UI library validates with real source identities',()=>assert.equal(validate(original),true));
test('duplicate design and creator identities reject',()=>{for(const key of ['designs','creators']){const c=copy();c[key].push(c[key][0]);assert.throws(()=>validate(c),/Duplicate/);}});
test('unsupported evidence and unsafe source URLs reject',()=>{let c=copy();c.designs[0].evidence_level='best';assert.throws(()=>validate(c),/evidence/);c=copy();c.designs[0].source_url='javascript:alert(1)';assert.throws(()=>validate(c),/source URL/);});
test('research cannot silently become implemented or compared',()=>{for(const [key,value,rx]of [['evidence_level','source-reviewed',/study/],['implementation_status','target-tested',/Implementation/],['comparison_status','compared',/Comparison/]]){const c=copy();c.designs[0][key]=value;if(key==='evidence_level')delete c.designs[0].study_path;assert.throws(()=>validate(c),rx);}});
test('referenced study paths exist in repository',()=>{for(const d of original.designs)if(d.study_path)assert(fs.existsSync(path.join(__dirname,'..',d.study_path)));});
