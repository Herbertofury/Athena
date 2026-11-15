import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh, apply} from '../../dist/workspaces/continuity/model.mjs';
import {agenda} from './review-agenda.mjs';
function fixture() {
  let state = fresh();
  for (const [id, project] of [['one', 'Athena'], ['two', 'Modding-Knowledge']]) state = apply(state, {type: 'add', id, project, kind: 'decision', text: 'Compare options, do not auto-execute', source:'https://example.org/evidence'}, 1);
  return state;
}
const receipt = {id:'one',revision:1,outcome:'considered',note:'Tradeoffs accepted for this revision only',at:2};
test('global view retains exact source, project and revision', () => {
  const result = agenda(fixture()); assert.equal(result.rows.length, 2);
  assert.deepEqual(result.rows.map(row=>row.project),['Athena','Modding-Knowledge']);
  assert.equal(result.rows[0].source,'https://example.org/evidence');
  assert.equal(result.rows[0].review,'unreviewed'); assert.equal(result.advisoryOnly,true);
});
test('human consideration never becomes permission or completion', () => {
  const result = agenda(fixture(),[receipt]); assert.equal(result.rows[0].review,'considered');
  assert.equal(result.rows[0].advisoryOnly,true); assert.equal('approved' in result.rows[0], false);
});
test('changed revision surfaces original receipt without overwriting it', () => {
  const state = apply(fixture(),{type:'revise',id:'one',text:'A different option',source:'https://example.org/new'},3);
  const result = agenda(state,[receipt]); assert.equal(result.rows[0].review,'changed-since-review');
  assert.equal(result.rows[0].receipt.revision,1); assert.equal(result.rows[0].revision,2);
});
test('ignore affects visibility, not owner history', () => {
  const state = apply(fixture(),{type:'ignore',id:'one'},3);
  assert.equal(agenda(state,[receipt]).rows.length,1); assert.equal(state.entries.length,2);
});
test('malformed, duplicate and future receipts fail visibly', () => {
  assert.throws(()=>agenda(fixture(),[receipt,receipt]));
  assert.throws(()=>agenda(fixture(),[{...receipt,revision:9}]));
  assert.throws(()=>agenda(fixture(),[{...receipt,outcome:'execute'}]));
});
test('restart replay preserves orphan evidence without mutating input', () => {
  const state = fixture(), before = JSON.stringify(state);
  const reviews = [receipt,{...receipt,id:'missing'}];
  const result = agenda(JSON.parse(before),JSON.parse(JSON.stringify(reviews)));
  assert.equal(result.orphanReceipts.length,1); result.rows[0].receipt.note='changed externally';
  assert.equal(receipt.note,'Tradeoffs accepted for this revision only'); assert.equal(JSON.stringify(state),before);
});
