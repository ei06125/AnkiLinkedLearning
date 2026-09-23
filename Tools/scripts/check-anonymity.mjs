import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir, hostname } from 'node:os';

const args = process.argv.slice(2);
const files = args[0] === '--tracked'
  ? execFileSync('git', ['ls-files', '-z']).toString().split('\0').filter(Boolean)
  : args;

const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const localValues = [homedir(), hostname()]
  .filter(Boolean)
  .map((value) => new RegExp(escaped(value), 'giu'));
const absoluteHomePaths = [
  /(?:file:\/\/)?\/Users\/[^/\s"'`]+\//gu,
  /(?:file:\/\/)?\/home\/[^/\s"'`]+\//gu,
  /[A-Za-z]:\\Users\\[^\\\s"'`]+\\/gu,
];
let failed = false;

for (const file of files) {
  let contents;
  try {
    contents = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  if (contents.includes('\0')) continue;

  const patterns = [...absoluteHomePaths, ...localValues];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    if (!pattern.test(contents)) continue;
    console.error(`${file}: contains an absolute home path or local machine identity.`);
    failed = true;
    break;
  }
}

if (failed) process.exitCode = 1;
