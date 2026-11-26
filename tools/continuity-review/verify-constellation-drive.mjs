#!/usr/bin/env node
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';

const MIB = 1024*1024;
const FILE_LIMIT = 16*MIB;
const INDEX_LIMIT = MIB;
const SOURCE = 'https://github.com/Herbertofury/Project-Constellation/blob/f46d7bd7e7fbd8771278e66caa36ff77349e63e6/extension/background.js';
const COLLECTIONS = Object.freeze('providers groups projects smartCollections chats turns turnRevisions outputSnapshots files knowledgeItems knowledgeSources projectContinuity events checkpoints syncReceipts catalogRuns projectBaselines integrityFindings'.split(' '));
const USAGE = 'node tools/continuity-review/verify-constellation-drive.mjs --index DriveIndex.json --snapshot Backup.json.gz [--journal Journal.json.gz] [--preview-journal]';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
const unsigned = n => Number.isSafeInteger(n) && n >= 0;
const timestamp = n => unsigned(n) && n > 0 && n <= 8640000000000000;
const sha256 = x => typeof x === 'string' && /^[0-9a-f]{64}$/.test(x);
class ReviewError extends Error {}
const refuse = reason => { throw new ReviewError(reason); };

function declaredTime(value, label) {
  const epoch = typeof value === 'string' ? Date.parse(value) : NaN;
  if (!timestamp(epoch) || new Date(epoch).toISOString() !== value) refuse(label+' timestamp not recognized.');
  return epoch;
}

function readSelected(path, budget, label) {
  try {
    const before = fs.lstatSync(path);
    if (!before.isFile() || before.isSymbolicLink() || !unsigned(before.size) || before.size > budget) {
      refuse(label+' is not an ordinary file within its input budget.');
    }
    const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0) | (fs.constants.O_NONBLOCK || 0);
    const fd = fs.openSync(path, flags);
    try {
      const same = s => s.isFile() && s.dev === before.dev && s.ino === before.ino &&
                        s.size === before.size && s.mtimeMs === before.mtimeMs;
      if (!same(fs.fstatSync(fd))) refuse(label+' changed before it could be read.');
      const bytes = Buffer.alloc(before.size+1);
      let offset = 0;
      while (offset < bytes.length) {
        const count = fs.readSync(fd, bytes, offset, bytes.length-offset, null);
        if (!count) break;
        offset += count;
      }
      if (offset !== before.size || !same(fs.fstatSync(fd))) refuse(label+' changed during the read.');
      return bytes.subarray(0, offset);
    } finally { fs.closeSync(fd); }
  } catch (error) {
    if (error instanceof ReviewError) throw error;
    refuse(label+' could not be read as a regular selected file.');
  }
}

function json(bytes,label) {
  try {
    const data = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if (object(data)) return data;
  } catch { /* Never echo parser text; it can include private data. */ }
  refuse(label+' is not a UTF-8 JSON object.');
}

function metadata(meta,label) {
  if (!object(meta) || !unsigned(meta.size) || meta.size <= 0 || meta.size > FILE_LIMIT ||
      !sha256(meta.sha256) || !['identity','gzip'].includes(meta.encoding)) {
    refuse(label+' index entry must declare byte size, exact SHA-256 and known encoding.');
  }
}

function verifiedArtifact(path, meta, label) {
  const bytes = readSelected(path, FILE_LIMIT, label);
  if (bytes.length !== meta.size || sha(bytes) !== meta.sha256) refuse(label+' does not match the index bytes.');
  // Hash the as-saved bytes before decoding; the original writer hashes the compressed Blob.
  const gzip = bytes[0] === 31 && bytes[1] === 139;
  if (gzip !== (meta.encoding === 'gzip')) refuse(label+' encoding disagrees with the index.');
  let contents = bytes;
  if (gzip) {
    try { contents = gunzipSync(bytes,{maxOutputLength:FILE_LIMIT}); }
    catch { refuse(label+' gzip is invalid or expands past 16 MiB.'); }
  }
  return {data:json(contents,label),
          proof:{encoding:meta.encoding,bytes:bytes.length,sha256:meta.sha256,decodedBytes:contents.length}};
}

function indexedIds(rows) {
  const positions = new Map();
  for (const row of rows) {
    if (!object(row) || typeof row.id !== 'string' || row.id.length === 0) continue;
    positions.set(row.id, positions.has(row.id) ? null : row);
  }
  return positions;
}

function revisionPreview(before, after, clock) {
  const makeCounts = () => ({onlyInJournal:0,newerStoredTime:0,equalStoredTime:0,
                             olderStoredTime:0,unresolved:0,riskOfLegacySkip:0});
  const total = makeCounts();
  const collections = Object.fromEntries(COLLECTIONS.map(kind=>{
    const current = Array.isArray(before[kind]) ? indexedIds(before[kind]) : null;
    const incoming = indexedIds(after[kind]);
    const counts = makeCounts();
    for (const row of after[kind]) {
      if (!current || !object(row) || typeof row.id !== 'string' || incoming.get(row.id) !== row) {
        counts.unresolved++; continue;
      }
      if (!current.has(row.id)) { counts.onlyInJournal++; continue; }
      const existing = current.get(row.id);
      if (!existing || !unsigned(existing.updatedAt) || !unsigned(row.updatedAt)) {
        counts.unresolved++; continue;
      }
      if (row.updatedAt < existing.updatedAt) { counts.olderStoredTime++; continue; }
      if (row.updatedAt === existing.updatedAt) counts.equalStoredTime++;
      else counts.newerStoredTime++;
      // The original fresh restore writes the full snapshot first. Its
      // mergeRecord advances existing timestamps to at least the restore clock.
      if (row.updatedAt < clock) counts.riskOfLegacySkip++;
    }
    for (const k of Object.keys(total)) total[k] += counts[k];
    return [kind,counts];
  }));
  return {assumedFreshRestoreAt:new Date(clock).toISOString(),total,collections,
          scope:'Compare retained rows in the verified files by stable ID and exact stored integer timestamp; no content comparison or writes.',
          sourceMerge:'https://github.com/Herbertofury/Project-Constellation/blob/f46d7bd7e7fbd8771278e66caa36ff77349e63e6/extension/background.js#L660-L679',
          sourceClock:'https://github.com/Herbertofury/Project-Constellation/blob/f46d7bd7e7fbd8771278e66caa36ff77349e63e6/extension/src/brain-core.js#L14-L18'};
}

export function readVerifiedDriveBundle({index, snapshot, journal, previewJournal=false, clock=Date.now()}) {
  const indexBytes = readSelected(index, INDEX_LIMIT, 'Index');
  const declared = json(indexBytes, 'Index');
  if (declared.schema !== 'project-constellation-drive-index' || declared.schemaVersion !== 2) {
    refuse('Only original Constellation Drive index v2 is supported.');
  }
  const indexTime = declaredTime(declared.updatedAt, 'Index');
  metadata(declared.snapshot,'Snapshot');
  if (!timestamp(declared.snapshot.lastFullSyncAt)) refuse('Index lacks the snapshot checkpoint timestamp.');
  const checkpoint = declared.snapshot.lastFullSyncAt;
  const journalDeclared = declared.journal !== null;
  if (journalDeclared) {
    metadata(declared.journal,'Journal');
    if (!journal) refuse('The index declares a journal; select it as well.');
    if (!unsigned(declared.journal.recordCount) || declared.journal.baseFullSyncAt !== checkpoint) {
      refuse('The index journal does not identify the same full checkpoint.');
    }
  } else if (journal) refuse('This index does not declare the selected journal.');
  if (previewJournal && !journalDeclared) refuse('This index declares no journal to preview.');
  if (previewJournal && !timestamp(clock)) refuse('The local review clock is not recognized.');

  const a = verifiedArtifact(snapshot,declared.snapshot,'Snapshot');
  if (a.data.schema !== 'project-constellation' || a.data.schemaVersion !== 7) {
    refuse('Snapshot is not an original Constellation v7 export.');
  }
  const snapshotTime = declaredTime(a.data.exportedAt,'Snapshot');
  // Legacy v7 exports need not contain the four later optional collections.
  const optional = new Set(['groups','smartCollections','projectBaselines','integrityFindings']);
  const retained = Object.fromEntries(COLLECTIONS.map(key=>{
    const rows = a.data[key];
    if (rows === undefined && optional.has(key)) return [key,null];
    if (!Array.isArray(rows)) refuse('Snapshot is missing a required collection or contains an invalid collection.');
    return [key,rows.length];
  }));
  const warnings = [];
  if (snapshotTime > checkpoint || checkpoint > indexTime) warnings.push('Snapshot/index clock order differs from the normal writer sequence.');
  let journalAssessment = null, changes = null, journalData = null;
  if (journalDeclared) {
    const b = verifiedArtifact(journal,declared.journal,'Journal');
    if (b.data.schema !== 'project-constellation-delta' || b.data.schemaVersion !== 1 ||
        b.data.baseFullSyncAt !== checkpoint) refuse('Journal does not identify the same indexed full checkpoint.');
    const journalTime = declaredTime(b.data.exportedAt,'Journal');
    if (journalTime < checkpoint || journalTime > indexTime) warnings.push('Journal/index clock order differs from the normal writer sequence.');
    const records = Object.fromEntries(COLLECTIONS.map(key=>{
      const rows = b.data[key];
      if (!Array.isArray(rows)) refuse('Journal is missing an expected collection or contains an invalid collection.');
      return [key,rows.length];
    }));
    const total = Object.values(records).reduce((sum,n)=>sum+n,0);
    if (total !== declared.journal.recordCount) refuse('Journal record count differs from the index.');
    journalAssessment = {...b.proof,records,total};
    journalData = b.data;
    if (previewJournal) changes = revisionPreview(a.data,b.data,clock);
  }
  const report = {schema:'athena-constellation-drive-bundle-review-v1',
          index:{sha256:sha(indexBytes),bytes:indexBytes.length},
          snapshot:{...a.proof,retained},journal:journalAssessment,warnings,source:SOURCE,
          ...(previewJournal ? {journalPreview:changes} : {}),
          scope:'Selected files match this local index. No provider authentication, record-level restore or retirement proof.'};
  return {report,snapshotData:a.data,journalData};
}

export function verifyDriveBundle(options) {
  return readVerifiedDriveBundle(options).report;
}

function main(argv) {
  if (argv.length === 1 && argv[0] === '--help') { console.log(USAGE); return; }
  const options = {};
  for (let i=0;i<argv.length;) {
    const key=argv[i++];
    if (key==='--preview-journal' && !options[key]) { options[key]=true; continue; }
    const value=argv[i++];
    if (!['--index','--snapshot','--journal'].includes(key) || !value || Object.hasOwn(options,key)) refuse('Select one index, one snapshot, and an optional journal.');
    options[key]=value;
  }
  if (!options['--index'] || !options['--snapshot']) refuse('Select one index and one snapshot.');
  const result=verifyDriveBundle({index:options['--index'],snapshot:options['--snapshot'],journal:options['--journal'],previewJournal:options['--preview-journal']});
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try { main(process.argv.slice(2)); }
  catch(error) {
    process.stderr.write('Constellation bundle review refused: '+(error instanceof ReviewError ? error.message : 'Unsupported or unreadable local inputs.')+' Nothing was modified.\n');
    process.exitCode=2;
  }
}
