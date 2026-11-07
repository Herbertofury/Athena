import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlockedEventLogView as baseline} from '../experiments/event-log-recovery-lab/baseline-event-log-view.mjs';
import {createBlockedEventLogView as repaired,createEventLogView} from '../docs/media-lab/event-log-view.mjs';
import {runEventLogRecoveryChecks} from '../docs/media-lab/event-log-recovery.mjs';
const doc={createTextNode:data=>({data,appendData(text){this.data+=text;}}),createElement(){const children=[];return {ownerDocument:doc,replaceChildren(...nodes){children.splice(0,children.length,...nodes);},insertBefore(node,before){const i=children.indexOf(before);if(i<0)throw Error('NotFoundError');children.splice(i,0,node);},removeChild(node){const i=children.indexOf(node);if(i<0)throw Error('NotFoundError');children.splice(i,1);},append(node){children.push(node);},get lastChild(){return children.at(-1);},get textContent(){return children.map(n=>n.data).join('');}};}};
test('original bounded candidate loses first and size-boundary retries',()=>{const rows=runEventLogRecoveryChecks(doc,baseline);assert.deepEqual(rows.map(x=>x.passed),[false,true,false]);assert.ok(rows.every(x=>x.initial_attempt_rejected&&x.previous_text_and_count_retained));});
test('repaired bounded candidate retains exact retry output at every boundary',()=>{const rows=runEventLogRecoveryChecks(doc,repaired);assert.equal(rows.length,3);assert.ok(rows.every(x=>x.passed));});
test('existing per-event strategy remains a passing recovery control',()=>assert.ok(runEventLogRecoveryChecks(doc,createEventLogView).every(x=>x.passed)));
