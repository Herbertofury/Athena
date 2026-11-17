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
 `Independent mode: [Verify the feature works without optional sibling features.]`,
 `Composition: [Define explicit shared inputs/outputs and prove the combined experience adds value without conflicts.]`,
 `Failure isolation: [Disable or fail each optional dependency; confirm unrelated features and user data remain usable.]`,
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

// Descriptive comparison of user-entered observations, never a causal verdict.
export function compareExperiment(input) {
 const required=(key)=>{const value=input?.[key];if(typeof value!=='string'||!value.trim()||value.length>2000)throw Error('Record '+key+' (maximum 2000 characters)');return value.trim();};
 const samples=key=>{const raw=required(key),parts=raw.split(/[\s,]+/);if(parts.length>200)throw Error('Use at most 200 samples per condition');const values=parts.map(part=>{if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(part))throw Error('Samples must be finite numbers separated by commas or spaces');const n=Number(part);if(!Number.isFinite(n))throw Error('Samples must be finite');return n;});return values;};
 const hypothesis=required('hypothesis'),metric=required('metric'),unit=required('unit'),baselineBuild=required('baselineBuild'),variantBuild=required('variantBuild'),conditions=required('conditions'),observations=required('observations');
 if(!['higher','lower'].includes(input.direction))throw Error('Choose the desired metric direction');
 if(typeof input.threshold!=='string'||!input.threshold.trim())throw Error('Set the absolute improvement threshold');
 const threshold=Number(input.threshold);if(!Number.isFinite(threshold)||threshold<0)throw Error('Threshold must be a finite nonnegative number');
 if(!['undecided','keep','revise','park','reject'].includes(input.decision))throw Error('Choose a review decision');
 const baseline=samples('baseline'),variant=samples('variant');
 const mean=values=>{let sum=0,correction=0;for(const n of values){const part=n/values.length-correction,total=sum+part;correction=(total-sum)-part;sum=total;}return sum;};
 const baselineMean=mean(baseline),variantMean=mean(variant),delta=variantMean-baselineMean,improvement=input.direction==='higher'?delta:-delta;
 if(![baselineMean,variantMean,delta,improvement].every(Number.isFinite))throw Error('Metric magnitude exceeds comparison capacity');
 const comparisonTolerance=2*Number.EPSILON*Math.max(Math.abs(baselineMean),Math.abs(variantMean),threshold);
 return {schema:1,kind:'user-recorded-experiment',hypothesis,metric,unit,baselineBuild,variantBuild,conditions,observations,
  baseline,variant,direction:input.direction,threshold,baselineMean,variantMean,delta,improvement,
  comparisonTolerance,criterionMet:improvement>=threshold||(improvement>0&&threshold-improvement<=comparisonTolerance),decision:input.decision,
  limitations:['Criterion comparison allows the reported floating-point tolerance; differences within that tolerance are not distinguishable by this calculation.','User-entered observations, not independently verified telemetry.','Arithmetic mean comparison only; no statistical significance, causal attribution, fairness, enjoyment or general improvement is established.','Threshold timing is not verified. Record whether it was chosen before testing.','Review unmatched conditions, sample counts, regressions and qualitative feedback before adopting; no automatic adoption.']};
}
