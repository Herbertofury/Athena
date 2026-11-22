#!/usr/bin/env node
// Compare two explicitly selected local Modrinth response files. No provider I/O.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {compareGallery} from '../docs/media-lab/compare.mjs';
import {MAX_LOCAL_BYTES} from '../docs/media-lab/local-compare.mjs';

const usage = 'node engineering/scripts/compare_local_galleries.mjs --project EXACT_ID --before OLD.json --after NEW.json';
class AdmissionError extends Error {}
const projectId = /^[A-Za-z0-9]{8}$/;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function options(args) {
  const out = Object.create(null);
  for (let i=0;i<args.length;i+=2) {
    const key=args[i], value=args[i+1];
    if (!['--project','--before','--after'].includes(key) || !value || value.startsWith('--') || Object.hasOwn(out,key))
      throw new AdmissionError('Supply each option once with a value.');
    out[key]=value;
  }
  if (!projectId.test(out['--project'] || '') || !out['--before'] || !out['--after'])
    throw new AdmissionError('Supply two local files and one exact eight-character project ID.');
  return out;
}

function regularBytes(file) {
  const initial=fs.lstatSync(file);
  if (!initial.isFile() || initial.isSymbolicLink()) throw new AdmissionError('Select ordinary local files, not links.');
  const fd=fs.openSync(file,fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const first=fs.fstatSync(fd);
    if (!first.isFile() || first.ino!==initial.ino || first.dev!==initial.dev ||
        first.size<1 || first.size>MAX_LOCAL_BYTES || first.size!==initial.size)
      throw new AdmissionError('Each input must be an unchanged regular file between 1 byte and 2 MiB.');
    const bytes=Buffer.alloc(first.size);
    let length=0;
    while (length<bytes.length) {
      const n=fs.readSync(fd,bytes,length,bytes.length-length,null);
      if (n===0) throw new AdmissionError('An input changed during read.');
      length+=n;
    }
    const last=fs.fstatSync(fd);
    if (fs.readSync(fd,Buffer.alloc(1),0,1,null)!==0 || last.ino!==first.ino || last.dev!==first.dev ||
        last.size!==first.size || last.mtimeMs!==first.mtimeMs || last.ctimeMs!==first.ctimeMs)
      throw new AdmissionError('An input changed during read.');
    return bytes;
  } finally { fs.closeSync(fd); }
}

function strictProject(bytes,id) {
  let text, project;
  try { text=new TextDecoder('utf-8',{fatal:true}).decode(bytes); project=JSON.parse(text); }
  catch { throw new AdmissionError('Each input must be valid UTF-8 project JSON.'); }
  // JSON.parse checks grammar first. This iterative pass preserves object scopes
  // to reject last-key-wins ambiguity, including aliases created by JSON escapes.
  const stack=[];
  for (const [token] of text.matchAll(/"(?:[^"\\]|\\.)*"|[{}\[\],]/gs)) {
    if (token==='{' || token==='[') {
      if (stack.length>=128) throw new AdmissionError('Input nesting exceeds the comparison limit.');
      stack.push(token==='{'?{keys:new Set(),key:true}:null); continue;
    }
    if (token==='}' || token===']') { stack.pop(); continue; }
    const object=stack.at(-1);
    if (object && token===',') object.key=true;
    else if (object?.key && token.startsWith('"')) {
      const key=JSON.parse(token);
      if (object.keys.has(key)) throw new AdmissionError('Duplicate JSON property.');
      object.keys.add(key); object.key=false;
    }
  }
  if (!project || typeof project!=='object' || Array.isArray(project) || project.id!==id)
    throw new AdmissionError('Both saved project identities must match the exact selected ID.');
  return project;
}

try {
  const args=process.argv.slice(2);
  if (args.length===1 && args[0]==='--help') process.stdout.write(usage+'\n');
  else {
    const opts=options(args), id=opts['--project'];
    const oldBytes=regularBytes(opts['--before']), newBytes=regularBytes(opts['--after']);
    const before=strictProject(oldBytes,id), after=strictProject(newBytes,id);
    const card={id:'modrinth:'+id,gallery:Array.isArray(before.gallery)
      ? before.gallery.map(item=>({preview:item?.url,original:item?.raw_url}))
      : null};
    const result=compareGallery(after,card);
    const report={schema_version:1,project_id:id,
      scope:'Two supplied local responses; ordered gallery URL pairs only, not image bytes, origin verification, chronology or complete project content.',
      before:{bytes:oldBytes.length,sha256:digest(oldBytes)},after:{bytes:newBytes.length,sha256:digest(newBytes)},result};
    process.stdout.write(JSON.stringify(report)+'\n');
    if (result.status==='unknown') process.exitCode=3;
  }
} catch (error) {
  // Do not print local paths, JSON excerpts, raw URLs or unverified identifiers.
  process.stderr.write('Gallery comparison refused: '+(error instanceof AdmissionError?error.message:'Unable to read the two selected local files.')+'\n');
  process.exitCode=2;
}
