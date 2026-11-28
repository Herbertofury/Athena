/** Athena shared transfer contract: one backpressure-aware, verified staging path. */
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { portableFilename } from './github-release.js';

export interface TransferRequest {
  url: string;
  filename: string;
  headers?: Record<string, string>;
  expectedSizeBytes?: number;
  expectedSha256?: string;
  expectedSha512?: string;
  redirect?: 'error';
}
export interface TransferOptions { timeoutMs: number; maxBytes?: number; userAgent: string }

export class TransferHttpError extends Error {
  status: number;
  retryAfterMs?: number;
  constructor(status: number, retryAfter: string | null) {
    super(`HTTP ${status}`);
    this.status = status;
    if (retryAfter) {
      const delay = /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - Date.now();
      if (Number.isFinite(delay)) this.retryAfterMs = Math.max(0, delay);
    }
  }
}

export async function verifiedTransfer(request: TransferRequest, outDir: string, options: TransferOptions) {
  const {filename, expectedSizeBytes, expectedSha256, expectedSha512, redirect} = request;
  if (!portableFilename(filename)) throw new Error('Invalid portable download filename');
  if (expectedSizeBytes !== undefined && (!Number.isSafeInteger(expectedSizeBytes) || expectedSizeBytes < 0)) throw new Error('Invalid expected size');
  if (expectedSha256 !== undefined && !/^[a-f0-9]{64}$/i.test(expectedSha256)) throw new Error('Invalid expected SHA-256');
  if (expectedSha512 !== undefined && !/^[a-f0-9]{128}$/i.test(expectedSha512)) throw new Error('Invalid expected SHA-512');
  const maxBytes = options.maxBytes ?? 0;
  if (maxBytes > 0 && expectedSizeBytes !== undefined && expectedSizeBytes > maxBytes) throw new Error('File exceeds configured size limit');
  await mkdir(outDir, {recursive:true});
  const stage = await mkdtemp(join(outDir, '.transfer-'));
  const partial = join(stage, 'body.part');
  const destination = join(outDir, filename);
  try {
    const signal = AbortSignal.timeout(options.timeoutMs);
    const response = await fetch(request.url, {headers:{'User-Agent':options.userAgent, ...request.headers}, signal, redirect});
    if (response.status !== 200 || !response.body) {
      await response.body?.cancel().catch(()=>{});
      throw new TransferHttpError(response.status, response.headers.get('Retry-After'));
    }
    const hash = createHash('sha256');
    const hash512 = expectedSha512 === undefined ? undefined : createHash('sha512');
    let sizeBytes = 0;
    const meter = new Transform({transform(chunk: Buffer, _encoding, done) {
      sizeBytes += chunk.length;
      if ((maxBytes > 0 && sizeBytes > maxBytes) || (expectedSizeBytes !== undefined && sizeBytes > expectedSizeBytes)) return done(new Error('Downloaded file exceeds expected size or configured limit'));
      hash.update(chunk);
      hash512?.update(chunk);
      done(null, chunk);
    }});
    await pipeline(Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]), meter, createWriteStream(partial, {flags:'wx'}), {signal});
    const sha256 = hash.digest('hex');
    const sha512 = hash512?.digest('hex');
    if (expectedSizeBytes !== undefined && expectedSizeBytes !== sizeBytes) throw new Error('Download size mismatch');
    if (expectedSha256 !== undefined && expectedSha256.toLowerCase() !== sha256) throw new Error('Download SHA-256 mismatch');
    if (expectedSha512 !== undefined && expectedSha512.toLowerCase() !== sha512) throw new Error('Download SHA-512 mismatch');
    // Same-filesystem publication only after the writer closes and checks pass.
    await rename(partial, destination);
    return {success:true, localPath:destination, filename, sizeBytes, sha256, ...(sha512 ? {sha512} : {})};
  } finally {
    await rm(stage, {recursive:true, force:true});
  }
}
