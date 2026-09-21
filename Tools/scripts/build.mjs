import { cp, mkdir } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const output = new URL('.build/extension/', root);
await mkdir(output, { recursive: true });
await cp(new URL('Configs/manifest.json', root), new URL('manifest.json', output));
await cp(new URL('SourceCode/', root), new URL('SourceCode/', output), { recursive: true });
await cp(new URL('Assets/', root), new URL('Assets/', output), { recursive: true, filter: source => !source.endsWith('.gitkeep') });
console.log('Built .build/extension — load this folder in Chrome.');
