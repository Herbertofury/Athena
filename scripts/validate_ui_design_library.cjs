function validate(catalog) {
 if(catalog.schema_version!==1)throw Error('Unsupported UI catalog version');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(catalog.checked_at||''))throw Error('Missing review date');
 const creators=new Set(),ids=new Set();
 for(const c of catalog.creators){if(creators.has(c.id))throw Error('Duplicate creator');creators.add(c.id);for(const key of ['portfolio','social'])if((key==='portfolio'||c[key])&&new URL(c[key]).protocol!=='https:')throw Error('Invalid source URL');}
 for(const d of catalog.designs){
  if(ids.has(d.id))throw Error('Duplicate design');ids.add(d.id);
  if(!creators.has(d.creator_id)||!d.title)throw Error('Missing design identity');
  if(new URL(d.source_url).protocol!=='https:')throw Error('Invalid source URL');
  if(!['indexed','source-reviewed','visually-reviewed','interaction-tested'].includes(d.evidence_level))throw Error('Invalid evidence level');
  if(!['not-implemented','prototype','target-tested'].includes(d.implementation_status))throw Error('Invalid implementation status');
  if(!['not-compared','compared'].includes(d.comparison_status))throw Error('Invalid comparison status');
  if(!d.license_status)throw Error('Missing rights status');
  if(d.evidence_level!=='indexed'&&!d.study_path)throw Error('Reviewed design needs a study');
  if(d.implementation_status!=='not-implemented'&&!d.implementation_evidence)throw Error('Implementation needs evidence');
  if(d.comparison_status==='compared'&&!d.comparison_evidence)throw Error('Comparison needs evidence');
 }
 return true;
}
module.exports={validate};
if(require.main===module){const fs=require('node:fs');validate(JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../data/ui-design-library.json'),'utf8')));console.log('UI design library valid');}
