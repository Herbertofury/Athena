import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';
export const repoRoot=fileURLToPath(new URL('../../../',import.meta.url));
export const runtimeRoot=path.join(repoRoot,'dist');
export const binaryPath=process.env.ATHENA_FOUNDRY_STORE_BINARY||path.join(repoRoot,'crates/athena-foundry-store/target/debug/athena-foundry-store'+(process.platform==='win32'?'.exe':''));
export const testTemp=prefix=>path.join(os.tmpdir(),prefix);
