import { rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
await rm(new URL('.build/SourceCode/', root), { recursive: true, force: true });
const compiler = new URL('node_modules/typescript/bin/tsc', root);
const result = spawnSync(process.execPath, [fileURLToPath(compiler), '--project', fileURLToPath(new URL('tsconfig.build.json', root))], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
