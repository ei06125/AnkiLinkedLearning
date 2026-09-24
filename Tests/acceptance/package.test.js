import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
test('build includes executable manifest paths and shared module imports', async () => {
  execFileSync(process.execPath, [fileURLToPath(new URL('Tools/scripts/build.mjs', root))]);
  const output = new URL('OutDir/extension/', root);
  const manifest = JSON.parse(await readFile(new URL('manifest.json', output), 'utf8'));
  const packageMetadata = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  assert.equal(manifest.name, 'AnkiLinkedLearning');
  assert.equal(manifest.version, packageMetadata.version);
  assert.equal(manifest.background.type, 'module');
  assert.ok(manifest.permissions.includes('downloads'));
  for (const path of [manifest.background.service_worker, manifest.side_panel.default_path, 'SourceCode/apps/extension/extract.js', 'SourceCode/apps/extension/highlight.js', 'SourceCode/apps/extension/playback.js', 'SourceCode/apps/extension/tabs.js', 'SourceCode/libs/core.js', 'SourceCode/libs/dictionary.js', 'SourceCode/libs/translation.js']) {
    await access(new URL(path, output));
  }
  const panel = await readFile(new URL(manifest.side_panel.default_path, output), 'utf8');
  assert.ok(panel.includes('src="panel.js"'));
  assert.ok(panel.includes('id="reset"'));
  const script = await readFile(new URL('panel.js', new URL(manifest.side_panel.default_path, output)), 'utf8');
  assert.ok(script.includes("from '../../libs/core.js'"));
  const packagedFiles = await readdir(output, { recursive: true });
  assert.equal(packagedFiles.some(path => /\.(?:ts|map)$/u.test(path)), false);
  assert.equal(packagedFiles.includes('SourceCode/types.js'), false);
});
