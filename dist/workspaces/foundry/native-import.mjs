// Explicit partial migration from operator-selected paths only. No file picker or arbitrary paths.
export function attachNativeImport({host,nativeStore,signal}){
 const doc=host.ownerDocument;host.innerHTML='<h2>Import prepared legacy backup</h2><p>This is a partial migration, not lossless. Keep the source repository and database. Supply a prepared standalone rollback-journal SQLite backup; a live app WAL database or sidecars are not supported or changed. Artist/provider metadata, custom ecology content and source history are not copied. Counts below disclose exclusions.</p><p>Paths must be selected by the operator at launch. Import creates a NEW destination only, never overwrites it, and never switches this running database. Restart explicitly to use a successfully imported store.</p><button type="button" data-legacy-review>Review source counts (dry run)</button><div data-legacy-counts></div><button type="button" data-legacy-import disabled>Import reviewed source into new destination</button><p role="status" data-legacy-status></p>';
 const review=host.querySelector('[data-legacy-review]'),commit=host.querySelector('[data-legacy-import]'),status=host.querySelector('[data-legacy-status]'),counts=host.querySelector('[data-legacy-counts]');let disposed=false,busy=false,token=null;const controller=new AbortController();const available=typeof nativeStore?.reviewLegacy==='function'&&typeof nativeStore?.importLegacy==='function';
 function enabled(){review.disabled=busy||!available;commit.disabled=busy||!token;}
 status.textContent=available?'No source accessed. Review is required before import.':'Legacy import not connected. Browser authoring remains available.';enabled();
 const text=(tag,value)=>{const element=doc.createElement(tag);element.textContent=value;return element;};
 function count(value){if(!Number.isSafeInteger(value)||value<0)throw Error('Invalid count-only report');return value;}
 function comparison(values){
  const section=doc.createElement('section');section.setAttribute('aria-label','Selected catalog field comparison');
  section.append(text('h3','Selected catalog field comparison'));
  section.append(text('p','Matches compare IDs and selected text only. Raw catalog rows, media, materials and behavior are not verified or copied by this check.'));
  if(values===undefined){section.append(text('p','This older native store does not report a field comparison. No match is inferred.'));return section;}
  if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Invalid catalog comparison');
  for(const [key,label] of [
   ['theme_names','Theme IDs and names'],['room_names','Room IDs and names'],['ecology_name_shape_role','Ecology IDs, names, shapes and roles']
  ]){
   const value=values[key];
   if(key==='ecology_name_shape_role'&&value===null){section.append(text('p','Ecology comparison unavailable in this source. Unknown is not zero.'));continue;}
   if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid catalog comparison');
   const a=count(value.source),b=count(value.athena),ids=count(value.matching_ids),same=count(value.exact_selected_fields),different=count(value.changed_selected_fields),sourceOnly=count(value.only_in_source),athenaOnly=count(value.only_in_athena);
   if(ids+sourceOnly!==a||ids+athenaOnly!==b||same+different!==ids)throw Error('Catalog comparison counts do not reconcile');
   const detail=doc.createElement('details');detail.dataset.legacyComparison=key;
   detail.append(text('summary',`${label}: ${same} exact, ${different} changed`));
   const list=doc.createElement('ul');
   for(const [caption,n] of [['Matching IDs',ids],['Only in source',sourceOnly],['Only in Athena',athenaOnly],['Source total',a],['Athena total',b]])list.append(text('li',`${caption}: ${n}`));
   detail.append(list);section.append(detail);
  }
  return section;
 }
 function show(report){
  if(!report||report.lossless_migration!==false)throw Error('Unverified migration report');
  const next=doc.createDocumentFragment();
  next.append(comparison(report.catalog_comparison));
  const context=doc.createElement('details');context.append(text('summary','Other migration counts and exclusions'));
  const fields={
   reviewed_themes:'Reviewed theme IDs',reviewed_rooms:'Reviewed room IDs',soundtracks:'Soundtrack assignments',
   skipped_unreviewed_themes:'Unreviewed themes skipped',skipped_unreviewed_rooms:'Unreviewed rooms skipped',
   skipped_unreviewed_soundtracks:'Unreviewed soundtracks skipped',skipped_metadata_rows:'Metadata rows not copied',
   skipped_assignment_metadata_rows:'Assignment metadata rows skipped',source_catalog_rows_not_copied:'Raw catalog rows not copied',
   unknown_source_tables:'Unknown source tables'
  };
  for(const [key,label] of Object.entries(fields))context.append(text('p',`${label}: ${count(report[key])}`));
  for(const key of ['metadata','theme_packages','rooms','ecology_objects','artist_worlds','artist_districts','artist_weather','music_routes','room_soundtracks','history']){
   const n=report.source_table_rows?.[key];if(n===undefined)continue;context.append(text('p',`Source ${key} rows: ${count(n)}`));
  }
  next.append(context);counts.replaceChildren(next);
 }
 review.addEventListener('click',async()=>{if(busy||disposed||!available)return;busy=true;token=null;counts.replaceChildren();enabled();try{const result=await nativeStore.reviewLegacy({signal:controller.signal});if(disposed)return;show(result.report);if(typeof result.review_token!=='string'||!/^[a-f0-9]{64}$/.test(result.review_token))throw Error('Missing review token');if(result.destination_exists){status.textContent='Destination already exists. It will not be overwritten; operator must choose a new destination and restart.';}else{token=result.review_token;status.textContent='Dry run complete. Review exclusions above. Import is partial; retain the source. Review expires after five minutes.';}}catch(e){if(!disposed)status.textContent=`Review failed: ${e.message}`;}finally{busy=false;if(!disposed)enabled();}});
 commit.addEventListener('click',async()=>{if(busy||disposed||!token)return;busy=true;const reviewed=token;token=null;enabled();try{const result=await nativeStore.importLegacy(reviewed,{signal:controller.signal});if(disposed)return;if(result.imported!==true||result.restart_required!==true||result.lossless_migration!==false)throw Error('Import outcome not confirmed; preserve source and output, inspect before retrying');show(result.report);status.textContent=result.source_unchanged_at_checks?'Partial import created a new store. Source matched before/after checks, but snapshot identity is not guaranteed. Keep the source. Current live store unchanged; restart explicitly to use the new store.':'Import created a store, but source changed or could not be verified during the operation. Output provenance is uncertain. Preserve source and output for inspection; do not treat migration as complete or switch blindly.';}catch(e){if(!disposed)status.textContent=`Import not confirmed: ${e.message}. Preserve source and any output; never retry blindly.`;}finally{busy=false;if(!disposed)enabled();}});
 function dispose(){if(disposed)return;disposed=true;controller.abort();signal?.removeEventListener('abort',dispose);host.replaceChildren();}signal?.addEventListener('abort',dispose,{once:true});if(signal?.aborted)dispose();return {dispose};
}
