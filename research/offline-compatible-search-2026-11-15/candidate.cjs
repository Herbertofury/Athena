// R&D candidate. Exact current matches win; token discovery only fills zero-result queries.
(function(root){
'use strict';
function text(l){return (l.id+' '+l.title+' '+l.summary+' '+l.category+' '+l.tags.join(' ')+' '+(l.learningGoals||[]).join(' ')).toLowerCase();}
function create(lessons){
 const records=lessons.map(l=>({lesson:l,text:text(l)}));
 return function search(query){
  const q=query.toLowerCase().trim(),exact=records.filter(r=>r.text.includes(q));
  if(exact.length)return exact.map(r=>r.lesson);
  const terms=[...new Set(q.split(/\s+/).filter(Boolean))];
  return terms.length?records.filter(r=>terms.every(t=>r.text.includes(t))).map(r=>r.lesson):[];
 };
}
const api={create,text};if(typeof module!=='undefined')module.exports=api;else root.AthenaOfflineSearchCandidate=api;
})(globalThis);
