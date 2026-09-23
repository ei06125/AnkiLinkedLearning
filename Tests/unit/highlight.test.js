import test from 'node:test';
import assert from 'node:assert/strict';
import { highlightTranscriptTarget } from '../../SourceCode/apps/extension/highlight.js';

test('page highlight injection is self-contained', () => {
  assert.doesNotMatch(highlightTranscriptTarget.toString(), /clearTranscriptHighlights/);
});
