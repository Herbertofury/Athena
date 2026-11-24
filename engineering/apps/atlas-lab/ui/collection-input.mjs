// Input interpretation only. The Rust queue independently validates every request.
export function collectionJob(input) {
  if (typeof input !== 'string' || input.length > 512) throw new Error('Enter one slug/ID or up to 20 canonical IDs separated by commas.');
  const value = input.trim();
  if (!value.includes(',')) {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw new Error('Invalid project ID or slug.');
    return {CollectModrinth:{project:value}};
  }
  const projects = value.split(',').map(id=>id.trim());
  if (projects.length > 20 || projects.some(id=>! /^[A-Za-z0-9]{8}$/.test(id)) || new Set(projects).size !== projects.length) {
    throw new Error('Batch entries must be 2–20 unique eight-character canonical IDs.');
  }
  return {CollectModrinthBatch:{projects}};
}

export function versionExperimentJob(input) {
  if(typeof input!=='string'||input.length>32)throw new Error('Enter one saved eight-character version ID.');
  const version=input.trim();
  if(!/^[A-Za-z0-9]{8}$/.test(version))throw new Error('Enter one saved eight-character version ID, not a URL, slug or file path.');
  return {VersionValidationExperiment:{version}};
}

export function versionCollectionJob(input) {
  if(typeof input!=='string'||input.length>512)throw new Error('Enter 1–20 unique eight-character version IDs.');
  const versions=input.split(',').map(id=>id.trim());
  if(versions.length>20||versions.some(id=>! /^[A-Za-z0-9]{8}$/.test(id))||new Set(versions).size!==versions.length)throw new Error('Enter 1–20 unique eight-character version IDs, not URLs or slugs.');
  return {CollectModrinthVersions:{versions}};
}

export function upstreamReviewJob(source){if(!['rustsec','hls','serde-json'].includes(source))throw new Error('Choose one fixed public upstream source.');return {ReviewUpstream:{source}};}

export function projectArchiveJob(input) {
  const job=collectionJob(input);
  if(!job.CollectModrinth)throw new Error('Archive one project ID or slug at a time; no batch truncation.');
  return {CollectModrinthRaw:{project:job.CollectModrinth.project}};
}

export function jobLabel(job) {
  if(job==='DedupExperiment')return 'Identifier deduplication';
  if(!job||typeof job!=='object'||Array.isArray(job)||Object.keys(job).length!==1)return 'Unrecognized recorded operation';
  const text=value=>typeof value==='string'?value:'[invalid identity]';
  const count=value=>Array.isArray(value)?String(value.length):'[invalid list]';
  if(Object.hasOwn(job,'CollectModrinthRaw'))return 'Complete project archive · '+text(job.CollectModrinthRaw?.project);
  if(Object.hasOwn(job,'CollectModrinth'))return 'Modrinth · '+text(job.CollectModrinth?.project);
  if(Object.hasOwn(job,'CollectModrinthBatch'))return 'Modrinth batch · '+count(job.CollectModrinthBatch?.projects)+' projects';
  if(Object.hasOwn(job,'CollectModrinthVersions'))return 'Modrinth versions · '+count(job.CollectModrinthVersions?.versions)+' records';
  if(Object.hasOwn(job,'ReviewUpstream'))return 'Upstream review · '+text(job.ReviewUpstream?.source);
  if(Object.hasOwn(job,'VersionValidationExperiment'))return 'Version validation · '+text(job.VersionValidationExperiment?.version);
  return 'Unrecognized recorded operation';
}

// Exact queue identity is separate from the legacy numeric API field.
export function jobIdentity(job) {
  const invalid=()=>{throw new Error('Invalid job identity; previous results are retained.');};
  if(!job||typeof job!=='object'||Array.isArray(job)||!Number.isInteger(job.id)||job.id<1)invalid();
  if(Object.hasOwn(job,'id_text')){
    const exact=job.id_text;
    if(typeof exact!=='string'||!/^[1-9][0-9]{0,18}$/.test(exact)||BigInt(exact)>9223372036854775807n||Number(exact)!==job.id)invalid();
    return exact;
  }
  if(!Number.isSafeInteger(job.id))invalid();
  return String(job.id);
}
