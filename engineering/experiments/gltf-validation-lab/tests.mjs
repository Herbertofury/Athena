import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildCases} from './fixtures.mjs';
import {ROOT,canonical,parseCanonical,validateCases,validateReport,projectFixture,derive,validateReceipt,verifyPackage,main} from './run.mjs';
const receipt=parseCanonical(readFileSync(join(ROOT,'observed-2026-11-11.json'),'utf8'));
const clone=x=>structuredClone(x),byId=Object.fromEntries(receipt.observations.map(x=>[x.id,x]));

test('retained receipt matches all ten declared outcomes',()=>{const d=validateReceipt(receipt);assert.equal(d.case_count,10);assert.equal(d.fixture_gates_passed,1);assert.equal(d.all_expected,true);});
test('valid triangle is the only complete tiny-fixture gate',()=>{assert.equal(byId.valid_linear.fixture_gate_passed,true);for(const r of receipt.observations.slice(1))assert.equal(r.fixture_gate_passed,false);});
test('changed motion has zero errors but different intended data',()=>{const r=byId.changed_motion;assert.equal(r.gates.zero_validator_errors,true);assert.equal(r.gates.fixture_contract_matches,false);assert.equal(r.projection.value.animations[0].samplers[0].output[1][0],4);});
test('removed animation has zero issues but fails retention',()=>{const r=byId.animation_removed;assert.deepEqual(r.issue_codes,[]);assert.deepEqual(r.projection.value.animations,[]);assert.equal(r.fixture_gate_passed,false);});
test('unsupported required extension is informational, not coverage',()=>{const r=byId.unknown_required;assert.equal(r.gates.zero_validator_errors,true);assert.deepEqual(r.unsupported_required_extensions,['ATLAS_unrecognized']);assert.equal(r.gates.validator_supports_required_extensions,false);assert.equal(receipt.runs[7].report.issues.messages[0].severity,2);});
test('invalid external index is diagnosed with supplied bytes',()=>{assert.deepEqual(byId.bad_index.issue_codes,['ACCESSOR_INDEX_OOB']);});
test('omitted callback fails with IO instead of validating the index',()=>{const r=byId.bad_index_unchecked;assert.deepEqual(r.issue_codes,['IO_ERROR']);assert.equal(r.gates.external_buffers_supplied,false);assert.deepEqual(receipt.runs[4].requests,[]);});
test('missing resource is retained as a failed map request',()=>{assert.deepEqual(receipt.runs[8].requests,[{uri:'scene.bin',found:false}]);assert.equal(byId.missing_external.projection.value,null);});
test('time and matrix controls retain exact validator issues',()=>{assert.deepEqual(byId.duplicate_time.issue_codes,['ACCESSOR_ANIMATION_INPUT_NON_INCREASING']);assert.deepEqual(byId.matrix_animation.issue_codes,['ANIMATION_CHANNEL_TARGET_NODE_MATRIX']);});
test('truncated report cannot be a complete gate',()=>{assert.equal(receipt.runs[9].report.issues.truncated,true);assert.equal(byId.truncated_report.gates.report_complete,false);});
test('fixture layouts include exact geometry data',()=>{const p=projectFixture(buildCases()[0]);assert.deepEqual(p.value.positions,[[0,0,0],[1,0,0],[0,1,0]]);assert.deepEqual(p.value.indices,[0,1,2]);});
test('unsupported fixture accessor is outside projection scope',()=>{const c=buildCases()[0];c.document.accessors[0].type='MAT4';assert.equal(projectFixture(c).value,null);});
test('accessor cannot read beyond a declared view',()=>{const c=buildCases()[0];c.document.bufferViews[0].byteLength=2;assert.equal(projectFixture(c).value,null);});
test('duplicate JSON keys rejected by canonical form',()=>assert.throws(()=>parseCanonical('{"a":1,"a":2}\n')));
test('alternate integer encoding rejected by canonical form',()=>assert.throws(()=>parseCanonical('{\n  "a": 1.0\n}\n')));
test('canonical JSON roundtrip',()=>assert.deepEqual(parseCanonical(canonical({a:1,b:true})),{a:1,b:true}));
test('nonfinite and malformed JSON rejected',()=>{for(const text of ['NaN','Infinity','{} garbage'])assert.throws(()=>parseCanonical(text));});
test('oversized JSON rejected',()=>assert.throws(()=>parseCanonical('x'.repeat(1048577))));
test('unexpected fixture resource path rejected',()=>{const c=buildCases();c[0].resources={'../scene.bin':'00'};assert.throws(()=>validateCases(c));});
test('duplicate fixture ID rejected',()=>{const c=buildCases();c[1].id=c[0].id;assert.throws(()=>validateCases(c));});
test('promise success is not zero validation errors',()=>{assert.equal(receipt.runs.length,10);assert.equal(receipt.runs[3].report.issues.numErrors,1);});
test('self-consistent mismatch is retained as false',()=>{const c=buildCases(),runs=clone(receipt.runs);runs[0].report.issues.numInfos=1;runs[0].report.issues.messages=[{code:'UNEXPECTED_CONTROL',message:'Synthetic additional issue',severity:2}];const d=derive(runs,c,receipt.supported_extensions);assert.equal(d.all_expected,false);});
test('missing package does not execute unchecked code',()=>{const p=mkdtempSync(join(tmpdir(),'atlas-gltf-dep-'));try{assert.throws(()=>verifyPackage(p));}finally{rmSync(p,{recursive:true});}});
test('existing output is preserved without package load',async()=>{const p=mkdtempSync(join(tmpdir(),'atlas-gltf-output-'));try{const f=join(p,'prior.json');writeFileSync(f,'preserve');assert.equal(await main(['--package','unused','--output',f]),2);assert.equal(readFileSync(f,'utf8'),'preserve');}finally{rmSync(p,{recursive:true});}});

const mutations={
  schema_bool:[['schema_version'],true],scope:[['scope'],'Native game accepted'],native_acceptance:[['native_acceptance'],'accepted'],timestamp:[['recorded_at_utc'],'2026-11-99T00:00:00.000Z'],
  dependency_hash:[['dependency','sha256'],'0'.repeat(64)],input_hash:[['input_sha256','run.mjs'],'0'.repeat(64)],
  support_claim:[['supported_extensions'],['ATLAS_unrecognized']],case_expected:[['cases',0,'expected','fixture_gate'],false],
  missing_runs:[['runs'],[]],run_identity:[['runs',0,'id'],'changed_motion'],request_uri:[['runs',0,'requests',0,'uri'],'https://example.invalid/scene.bin'],request_found:[['runs',0,'requests',0,'found'],false],
  report_version:[['runs',0,'report','validatorVersion'],'other'],report_uri:[['runs',0,'report','uri'],'other.gltf'],error_count_bool:[['runs',0,'report','issues','numErrors'],false],
  unexpected_stats:[['runs',0,'report','info','totalTriangleCount'],999],truncated_integer:[['runs',0,'report','issues','truncated'],0],
  issue_severity_bool:[['runs',3,'report','issues','messages',0,'severity'],false],issue_count:[['runs',3,'report','issues','numErrors'],0],
  projection:[['observations',0,'projection','value','indices'],[0,1,3]],gate_bool:[['observations',0,'gates','zero_validator_errors'],1],
  match_integer:[['observations',0,'matches_expected'],1],count_bool:[['case_count'],true],pass_count:[['fixture_gates_passed'],10],all_expected_integer:[['all_expected'],1]
};
for(const [name,[path,value]]of Object.entries(mutations))test('receipt rejects '+name,()=>{const d=clone(receipt);let t=d;for(const p of path.slice(0,-1))t=t[p];t[path.at(-1)]=value;assert.throws(()=>validateReceipt(d));});

test('coordinated non-gating report edits are not authenticated',()=>{const d=clone(receipt);d.runs[0].report.info.totalTriangleCount=999;Object.assign(d,derive(d.runs,d.cases,d.supported_extensions));assert.equal(validateReceipt(d).all_expected,true);});
