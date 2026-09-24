import test from 'node:test';
import assert from 'node:assert/strict';
import { captureFreshTranscript } from '../../.build/SourceCode/apps/extension/capture.js';

test('retries while LinkedIn still exposes the previous lesson transcript', async () => {
  const captures = [
    { text: '前のレッスンです。', url: 'https://www.linkedin.com/learning/course/new' },
    { text: '新しいレッスンです。', url: 'https://www.linkedin.com/learning/course/new' }
  ];
  const captured = await captureFreshTranscript(async () => captures.shift(), '前のレッスンです。', { delay: async () => {} });
  assert.equal(captured.text, '新しいレッスンです。');
});

test('rejects a transcript that never changes from the previous lesson', async () => {
  const extract = async () => ({ text: '前のレッスンです。', url: 'https://www.linkedin.com/learning/course/new' });
  await assert.rejects(
    captureFreshTranscript(extract, '前のレッスンです。', { attempts: 2, delay: async () => {} }),
    /still updating/
  );
});
