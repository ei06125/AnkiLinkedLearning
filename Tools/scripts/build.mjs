import { cp, mkdir, rm } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const output = new URL('OutDir/extension/', root);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(new URL('Configs/manifest.json', root), new URL('manifest.json', output));
await cp(new URL('.build/SourceCode/', root), new URL('SourceCode/', output), { recursive: true, filter: source => !source.endsWith('/types.js') });
await cp(new URL('SourceCode/apps/extension/panel.html', root), new URL('SourceCode/apps/extension/panel.html', output));
await cp(new URL('SourceCode/apps/extension/panel.css', root), new URL('SourceCode/apps/extension/panel.css', output));
await cp(new URL('Assets/', root), new URL('Assets/', output), { recursive: true, filter: source => !source.endsWith('.gitkeep') });
console.log('Built OutDir/extension — load this folder in Chrome.');
