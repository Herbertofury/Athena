/** M1 exact public Modrinth version/file contract. No search, API tokens or auto-selection. */
import {portableFilename} from './github-release.js';
import type {TransferRequest} from './verified-transfer.js';

type Row = Record<string, unknown>;
export interface ModrinthFile {
  projectId: string;
  versionId: string;
  filename: string;
  url: string;
  sizeBytes: number;
  expectedSha512: string;
  primary: boolean;
}
const id = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9]{1,64}$/.test(value);
const digest = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{128}$/i.test(value);
function object(value: unknown): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid Modrinth response object');
  return value as Row;
}
function matchesDownload(value: unknown, projectId: string, versionId: string, filename: string): value is string {
  if (typeof value !== 'string' || /[\\\x00-\x20\x7f]/.test(value)) return false;
  try {
    const u = new URL(value);
    if (u.origin !== 'https://cdn.modrinth.com' || u.username || u.password || u.search || u.hash) return false;
    const path = u.pathname.split('/');
    return path.length === 6 && path[1] === 'data' && path[2] === projectId
      && path[3] === 'versions' && path[4] === versionId && decodeURIComponent(path[5]) === filename;
  } catch { return false; }
}
export function modrinthVersionFiles(projectId: string, versionId: string, response: unknown): ModrinthFile[] {
  if (!id(projectId) || !id(versionId)) throw Error('Expected provider-issued Modrinth project and version IDs');
  const row = object(response);
  if (row.project_id !== projectId || row.id !== versionId) throw Error('Modrinth version identity mismatch');
  if (!Array.isArray(row.files) || !row.files.length || row.files.length > 1000) throw Error('Missing or unbounded Modrinth file list');
  const filenames = new Set<string>();
  return row.files.map(raw => {
    const {filename,url,size,hashes,primary} = object(raw);
    const hash = object(hashes).sha512;
    if (!portableFilename(filename) || !matchesDownload(url,projectId,versionId,filename)) throw Error('Modrinth file route or name mismatch');
    if (typeof size !== 'number' || !Number.isSafeInteger(size) || size < 0 || !digest(hash) || typeof primary !== 'boolean') throw Error('Invalid Modrinth file size, SHA-512 or primary hint');
    const folded = filename.normalize('NFC').toLowerCase();
    if (filenames.has(folded)) throw Error('Ambiguous portable Modrinth filename');
    filenames.add(folded);
    return {projectId,versionId,filename,url,sizeBytes:size,expectedSha512:hash.toLowerCase(),primary};
  });
}
export function selectModrinthTransfer(projectId: string, versionId: string, response: unknown, selectedSha512: string, filename?: string): TransferRequest {
  if (!digest(selectedSha512)) throw Error('Choose a valid Modrinth SHA-512');
  const choices = modrinthVersionFiles(projectId,versionId,response).filter(file =>
    file.expectedSha512 === selectedSha512.toLowerCase() && (filename === undefined || file.filename === filename));
  if (choices.length !== 1) throw Error('No unique matching Modrinth file');
  const file = choices[0];
  return {url:file.url,filename:file.filename,expectedSizeBytes:file.sizeBytes,expectedSha512:file.expectedSha512,redirect:'error'};
}
