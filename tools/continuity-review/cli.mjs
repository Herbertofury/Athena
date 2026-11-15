#!/usr/bin/env node
import fs from 'node:fs';
import {TextDecoder} from 'node:util';
import {review, markdown} from './review.mjs';
const usage = 'node tools/continuity-review/cli.mjs --input continuity.json [--project NAME] [--format markdown|json] [--output NEW_FILE]';
try {
  const args = process.argv.slice(2), options = {};
  if (args.length === 1 && args[0] === '--help') {console.log(usage); process.exit(0);}
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index], value = args[index + 1];
    if (!['--input', '--project', '--format', '--output'].includes(key) || value === undefined || key in options) throw Error('Invalid arguments');
    options[key] = value;
  }
  if (!options['--input'] || !['markdown', 'json'].includes(options['--format'] || 'markdown')) throw Error('Invalid arguments');
  const path = options['--input'], before = fs.lstatSync(path);
  if (!before.isFile() || before.isSymbolicLink()) throw Error('Select a regular file');
  const fd = fs.openSync(path, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  let data;
  try {
    const stat = fs.fstatSync(fd), limit = 16 * 1024 * 1024;
    if (!stat.isFile() || stat.dev !== before.dev || stat.ino !== before.ino || stat.size > limit) throw Error('Invalid input');
    const buffer = Buffer.alloc(limit + 1); let length = 0;
    while (length < buffer.length) {const count = fs.readSync(fd, buffer, length, buffer.length - length, null); if (!count) break; length += count;}
    if (length > limit) throw Error('Input too large');
    data = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(buffer.subarray(0, length)));
  } finally {fs.closeSync(fd);}
  const report = review(data, options['--project'] || '');
  const text = options['--format'] === 'json' ? JSON.stringify(report, null, 2) + '\n' : markdown(report);
  if (options['--output']) fs.writeFileSync(options['--output'], text, {flag: 'wx', mode: 0o600});
  else process.stdout.write(text);
} catch {
  // Do not echo private paths, parser excerpts, or content to error logs.
  process.stderr.write('Review failed: use a valid regular UTF-8 continuity JSON file (maximum 16 MiB), supported arguments and a new output path. Input was not modified.\n');
  process.exitCode = 2;
}
