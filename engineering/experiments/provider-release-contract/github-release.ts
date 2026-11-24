/** Athena provider contract v1: pure GitHub identity and stable-release parsing. */
export interface ReleaseAsset {
  assetId: number;
  releaseId: number;
  tag: string;
  filename: string;
  url: string;
  sizeBytes: number;
  expectedSha256?: string;
}

const reserved = new Set(['about','account','apps','collections','contact','dashboard','enterprise','events','explore','features','issues','login','marketplace','new','notifications','organizations','orgs','pricing','pulls','search','security','settings','site','sponsors','topics','trending','users']);
const segment = (s: string) => /^[a-z0-9_.-]{1,100}$/i.test(s) && s !== '.' && s !== '..';

export function githubRepo(input: string): string {
  const raw = input.trim();
  let parts: string[];
  if (/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(raw)) parts = raw.split('/');
  else {
    if (/[\\\x00-\x20\x7f]/.test(raw)) throw new Error('Invalid GitHub repository URL');
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(url.hostname) || url.username || url.password || url.port) throw new Error('Expected a GitHub repository URL');
    parts = url.pathname.split('/').filter(Boolean);
  }
  const owner = parts[0] || '';
  const repo = (parts[1] || '').replace(/\.git$/i, '');
  if (!segment(owner) || !segment(repo) || reserved.has(owner.toLowerCase())) throw new Error('Invalid GitHub repository identity');
  return `${owner}/${repo}`;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid GitHub object');
  return value as Record<string, unknown>;
}
function positive(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) throw new Error('Invalid GitHub numeric ID/size');
  return value;
}
function exactUrl(raw: unknown, host: string, prefix: string, suffix: string): boolean {
  if (typeof raw !== 'string' || /[\\\x00-\x20\x7f]/.test(raw)) return false;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.hostname !== host || u.username || u.password || u.port || u.search || u.hash) return false;
    const p = decodeURIComponent(u.pathname);
    return p.slice(0, prefix.length).toLowerCase() === prefix.toLowerCase() && p.slice(prefix.length) === suffix;
  } catch { return false; }
}

export function assertGithubRepo(repo: string, value: unknown): void {
  const r = object(value);
  positive(r.id);
  if (typeof r.full_name !== 'string' || r.full_name.toLowerCase() !== repo.toLowerCase() || !exactUrl(r.html_url, 'github.com', `/${repo}`, '')) throw new Error('GitHub repository response does not match requested identity');
}

export function portableFilename(name: unknown): name is string {
  return typeof name === 'string' && name.length > 0 && name.length <= 240 && name !== '.' && name !== '..' && !/[<>:"/\\|?*\x00-\x1f\x7f]/.test(name) && !/[. ]$/.test(name) && !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name);
}

export function githubReleaseAssets(repo: string, value: unknown, now = Date.now()): ReleaseAsset[] {
  const r = object(value);
  const releaseId = positive(r.id);
  const tag = r.tag_name;
  const date = typeof r.published_at === 'string' ? Date.parse(r.published_at) : NaN;
  if (r.draft !== false || r.prerelease !== false || typeof tag !== 'string' || !tag.trim() || !Number.isFinite(date) || date > now + 60_000) throw new Error('GitHub response is not a published stable release');
  if (!exactUrl(r.url, 'api.github.com', `/repos/${repo}/releases/`, String(releaseId)) || !(exactUrl(r.html_url, 'github.com', `/${repo}/releases/`, `tag/${tag}`) || exactUrl(r.html_url, 'github.com', `/${repo}/releases/`, tag))) throw new Error('GitHub release identity mismatch');
  if (!Array.isArray(r.assets)) throw new Error('Missing GitHub release assets');
  const ids = new Set<number>();
  const names = new Set<string>();
  return r.assets.map(raw => {
    const a = object(raw);
    const assetId = positive(a.id);
    if (typeof a.size !== 'number' || !Number.isSafeInteger(a.size) || a.size < 0) throw new Error('Invalid GitHub asset size');
    const sizeBytes = a.size;
    const filename = a.name;
    if (!portableFilename(filename) || a.state !== 'uploaded' || ids.has(assetId) || names.has(filename.toLowerCase())) throw new Error('Invalid or duplicate GitHub release asset');
    if (!exactUrl(a.url, 'api.github.com', `/repos/${repo}/releases/assets/`, String(assetId)) || !exactUrl(a.browser_download_url, 'github.com', `/${repo}/releases/download/`, `${tag}/${filename}`)) throw new Error('GitHub release asset identity mismatch');
    let expectedSha256: string | undefined;
    if (a.digest != null && a.digest !== '') {
      if (typeof a.digest !== 'string' || !/^sha256:[a-f0-9]{64}$/i.test(a.digest)) throw new Error('Invalid GitHub release asset digest');
      expectedSha256 = a.digest.slice(7).toLowerCase();
    }
    ids.add(assetId); names.add(filename.toLowerCase());
    return {assetId, releaseId, tag, filename, url: a.browser_download_url as string, sizeBytes, ...(expectedSha256 ? {expectedSha256} : {})};
  });
}
