import { randomInt } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const directories = ['Tests/unit/', 'Tests/acceptance/'];
const files = (await Promise.all(directories.map(async directory => {
  const names = await readdir(new URL(directory, root));
  return names.filter(name => name.endsWith('.test.js'))
    .map(name => fileURLToPath(new URL(`${directory}${name}`, root)));
}))).flat();

const configuredSeed = Number.parseInt(process.env.TEST_SEED || '', 10);
const seed = Number.isInteger(configuredSeed) ? configuredSeed >>> 0 : randomInt(0x100000000);
let state = seed;
const random = () => {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 0x100000000;
};
for (let index = files.length - 1; index > 0; index -= 1) {
  const selected = Math.floor(random() * (index + 1));
  [files[index], files[selected]] = [files[selected], files[index]];
}

const concurrency = Math.max(2, availableParallelism());
console.log(`Test seed: ${seed}; concurrency: ${concurrency}`);
const result = spawnSync(process.execPath, ['--test', `--test-concurrency=${concurrency}`, ...files], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
