import test from 'node:test';
import assert from 'node:assert/strict';
import { activeTranscriptIndex } from '../../SourceCode/apps/extension/playback.js';

test('maps playback time to grouped transcript paragraphs', () => {
  const paragraphs = [{ start: 0 }, { start: 10 }, { start: 19 }];
  assert.equal(activeTranscriptIndex(paragraphs, 4), 0);
  assert.equal(activeTranscriptIndex(paragraphs, 10), 1);
  assert.equal(activeTranscriptIndex(paragraphs, 18.9), 1);
  assert.equal(activeTranscriptIndex(paragraphs, 19), 2);
});
