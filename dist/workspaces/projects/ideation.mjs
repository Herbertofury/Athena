// Local creative scaffolding, not a model call or proof of originality.
import {validate, change} from './model.mjs';
export const lenses = {
 combine: 'Combine two project ideas',
 invert: 'Invert a familiar rule',
 expand: 'Deepen the endgame or long-term payoff',
 transfer: 'Connect rewards across modes',
 simplify: 'Make one ambitious interaction effortless'
};
const questions = {
 combine: 'Which specific mechanic or interaction from the reference could change the core loop here, rather than just its appearance?',
 invert: 'What happens if one familiar cost becomes a reward, a failure becomes a new opportunity, or an enemy becomes a collaborator?',
 expand: 'What new decisions remain after the initial goal is achieved? Explore mastery and meaningful tradeoffs, not only larger numbers.',
 transfer: 'What earned reward could enrich another mode without making either mode mandatory or trivializing its challenge?',
 simplify: 'Which complicated interaction could become one clear, reversible action while retaining expert control?'
};
export function brief(value,id,lens,referenceId='') {
 const data=validate(value),project=data.entries.find(p=>p.id===id);
 if(!project||project.archived||project.revisions.at(-1).ownership!=='own')throw Error('Choose an active project you own');
 if(!Object.hasOwn(lenses,lens))throw Error('Unknown creative lens');
 const r=project.revisions.at(-1),reference=referenceId?data.entries.find(p=>p.id===referenceId):null;
 if(referenceId&&(!reference||reference.archived||reference.id===id))throw Error('Choose a different active reference project');
 if(lens==='combine'&&!reference)throw Error('Choose a reference project for this combination');
 const ref=reference?.revisions.at(-1);
 return [`CREATIVE EXPERIMENT — ${lenses[lens]}`,`Status: proposed; not tested or proven novel.`,
 `Grounding: ${r.name} [${id}], revision ${project.revisions.length}`,`Original goal (preserve): ${r.goal||'Not recorded; define before expanding.'}`,
 `Existing decisions (preserve unless you choose otherwise): ${r.decisions||'Not recorded.'}`,
 ...(ref?[`Reference: ${ref.name} [${referenceId}], revision ${reference.revisions.length}`,`Reference goal: ${ref.goal||'Not recorded.'}`,`Reference source: ${ref.source||'No source recorded; verify before claims or reuse.'}`]:[]),
 `Creative question: ${questions[lens]}`,
 `Hypothesis: [Describe the combination and why it might improve this project.]`,
 `Smallest playable/usable test: [One interaction, limited scope, and a baseline to compare.]`,
 `Success signal: [Observable user outcome and measurement; choose a threshold before testing.]`,
 `Tradeoff / failure signal: [Complexity, performance, fairness, accessibility, or scope risk.]`,
 `Keep unchanged: [Name the original vision and constraints this test must respect.]`,
 `Evidence / result: [Not tested. Record observations separately from interpretation.]`,
 `Decision: [Keep, revise, park, or reject after review. No automatic execution.]`].join('\n\n');
}
export function retainBrief(value,id,text,now=Date.now()) {
 if(typeof text!=='string'||!text.trim())throw Error('Write an experiment before saving');
 const data=validate(value),p=data.entries.find(p=>p.id===id);
 if(!p||p.archived||p.revisions.at(-1).ownership!=='own')throw Error('Choose an active project you own');
 const r=p.revisions.at(-1),resources=[r.resources,text.trim()].filter(Boolean).join('\n\n---\n\n');
 if(resources.length>10000)throw Error('Experiment exceeds project resource capacity. Shorten it or export a separate brief; nothing was saved.');
 return change(data,id,{...r,resources},now);
}
