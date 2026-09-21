import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
test('build includes executable manifest paths and shared module imports', async () => {
  execFileSync(process.execPath, [fileURLToPath(new URL('Tools/scripts/build.mjs', root))]);
  const output = new URL('.build/extension/', root);
  const manifest = JSON.parse(await readFile(new URL('manifest.json', output), 'utf8'));
  assert.equal(manifest.name, 'AnkiLinkedLearning');
  for (const path of [manifest.background.service_worker, manifest.side_panel.default_path, 'SourceCode/apps/extension/extract.js', 'SourceCode/libs/core.js']) {
    await access(new URL(path, output));
  }
  const panel = await readFile(new URL(manifest.side_panel.default_path, output), 'utf8');
  assert.ok(panel.includes('src="panel.js"'));
  const script = await readFile(new URL('panel.js', new URL(manifest.side_panel.default_path, output)), 'utf8');
  assert.ok(script.includes("from '../../libs/core.js'"));
});
