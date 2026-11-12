import { readFile } from 'node:fs/promises';
import { summarizeReceipt } from './event-timing.mjs';

try {
  if (process.argv.length !== 3) throw new Error('Usage: node summarize.mjs EVENTS.json');
  const input = JSON.parse(await readFile(process.argv[2], 'utf8'));
  console.log(JSON.stringify(summarizeReceipt(input), null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
