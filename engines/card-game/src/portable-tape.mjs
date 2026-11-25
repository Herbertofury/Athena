// SPDX-License-Identifier: GPL-3.0-or-later
import {createHash} from 'node:crypto';
import {newMatch as open, replayTape, MAX_TAPE_BYTES} from './warden-match.mjs';
export {cards,heroes,MAX_ACTIONS,MAX_TAPE_BYTES,RULES,TAPE_VERSION} from './warden-match.mjs';
const sha=str=>createHash('sha256').update(str).digest('hex');
function nodeFacade(match){
 return Object.freeze({apply:match.apply,view:match.view,snapshot(){
  const {header,transcript,final}=match.receipt();
  return {...header,transcript_sha256:sha(transcript),final_sha256:sha(final)};
 }});
}
export const newMatch=seed=>nodeFacade(open(seed));
export function verifyTape(tape){
 const match=nodeFacade(replayTape(tape)),expected=match.snapshot();
 if(expected.transcript_sha256!==tape.transcript_sha256||expected.final_sha256!==tape.final_sha256)throw Error('Replay digests do not match');
 return match;
}
export function encodeTape(match){return JSON.stringify(match.snapshot())+'\n';}
export function decodeTape(raw){
 if(typeof raw!=='string'||Buffer.byteLength(raw,'utf8')>MAX_TAPE_BYTES)throw Error('Replay tape exceeds size limit');
 const tape=JSON.parse(raw),session=verifyTape(tape);
 if(encodeTape(session)!==raw)throw Error('Replay tape is not canonical LF JSON');
 return session;
}
