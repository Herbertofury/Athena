export const PHASES=['problem','attempts','solution','verification','limitations'];
// Export the review input contract, never an admitted curriculum lesson.
export function buildReview(transcript,input){
 if(!transcript)throw Error('Import a transcript first.');
 if(!['documented-incident','illustrative-story','unverified'].includes(input.source_kind))throw Error('Choose the source kind.');
 const result={video_id:transcript.video_id,transcript_sha256:transcript.sha256,source_kind:input.source_kind};
 const ids=new Set(transcript.cues.map(c=>c.id));
 for(const phase of PHASES){const entry=input[phase];
  if(!entry||!['observed','inferred','unknown'].includes(entry.status)||typeof entry.statement!=='string'||!entry.statement.trim()||entry.statement.length>4000)throw Error(`${phase}: add a bounded statement and classification.`);
  if(!Array.isArray(entry.cue_ids)||entry.cue_ids.length>200||entry.cue_ids.some(id=>typeof id!=='string'||!ids.has(id)))throw Error(`${phase}: use existing cue IDs (up to 200).`);
  if(entry.status!=='unknown'&&!entry.cue_ids.length)throw Error(`${phase}: observed/inferred claims need cue IDs.`);
  result[phase]=[{status:entry.status,statement:entry.statement.trim(),cue_ids:[...new Set(entry.cue_ids)]}];
 }
 if(typeof input.objectives!=='string')throw Error('Add learning objectives, one per line.');
 result.objectives=input.objectives.split('\n').map(s=>s.trim()).filter(Boolean);
 if(!result.objectives.length||result.objectives.length>50||result.objectives.some(s=>s.length>4000))throw Error('Add 1–50 bounded learning objectives.');
 result.exercise={};for(const key of ['task','success_criteria','safety']){const value=input.exercise?.[key];if(typeof value!=='string'||!value.trim()||value.length>10000)throw Error(`Exercise ${key}: add bounded text.`);result.exercise[key]=value.trim();}
 return result;
}
