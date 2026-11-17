// Read-only comparison of known project fields. Never restores or rewrites state.
export const fields = ['name','ownership','stage','goal','next','blockers','decisions','resources','source','version','release'];
export function compareRevisions(project, before, after) {
 if (!project || !Array.isArray(project.revisions) || !Number.isInteger(before) || !Number.isInteger(after) || before < 0 || after < 0 || before >= project.revisions.length || after >= project.revisions.length) throw Error('Select two retained revisions');
 const a=project.revisions[before],b=project.revisions[after];
 if (!a || !b || !Number.isFinite(a.at) || !Number.isFinite(b.at)) throw Error('Invalid revision metadata');
 for(const field of fields)if(typeof a[field]!=='string'||typeof b[field]!=='string')throw Error('Invalid revision field');
 const changes=fields.filter(k=>a[k]!==b[k]).map(field=>{if(typeof a[field]!=='string'||typeof b[field]!=='string')throw Error('Invalid revision field');return {field,before:a[field],after:b[field]};});
 return {before:before+1,after:after+1,beforeAt:a.at,afterAt:b.at,changes};
}
export function mountComparison(host,project) {
 const doc=host.ownerDocument;const el=(tag,text)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const panel=el('details'),summary=el('summary','Compare saved revisions'),body=el('div');panel.append(summary,body);host.append(panel);let initialized=false;
 panel.addEventListener('toggle',()=>{if(!panel.open||initialized)return;initialized=true;
  body.append(el('p','Read-only comparison of recorded project fields. This does not restore a revision or compare repository files. Unknown extension fields remain stored but are not compared. Revision numbers follow saved order, not timestamps.'));
  if(project.revisions.length<2){body.append(el('p','Save a second revision to compare changes.'));return;}
  const picks=['Before revision','After revision'].map((label,i)=>{const wrap=el('label',label+' '),select=el('select');select.setAttribute('aria-label',label);project.revisions.forEach((r,index)=>{const option=el('option',`Revision ${index+1} · timestamp ${r.at}`);option.value=String(index);option.selected=index===project.revisions.length-2+i;select.append(option);});wrap.append(select);body.append(wrap);return select;});
  const result=el('div');result.setAttribute('aria-live','polite');body.append(result);
  function render(){result.replaceChildren();try{const comparison=compareRevisions(project,Number(picks[0].value),Number(picks[1].value));result.append(el('p',`${comparison.changes.length} changed field(s): revision ${comparison.before} → ${comparison.after}.`));for(const row of comparison.changes){const section=el('section');section.append(el('h4',row.field),el('h5','Before'),el('pre',row.before||'(empty)'),el('h5','After'),el('pre',row.after||'(empty)'));result.append(section);}}catch{result.append(el('p','Comparison unavailable. Saved project history is unchanged.'));}}
  for(const select of picks)select.addEventListener('change',render);render();
 });return panel;
}
