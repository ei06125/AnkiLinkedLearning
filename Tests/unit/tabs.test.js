import test from 'node:test';
import assert from 'node:assert/strict';
import { findLinkedInLearningTab, isLinkedInLearningUrl, linkedInLearningVideoChanged, linkedInLearningVideoId, normalizeLinkedInLearningUrl } from '../../.build/SourceCode/apps/extension/tabs.js';

test('recognizes LinkedIn Learning lesson URLs', () => {
  assert.equal(isLinkedInLearningUrl('https://www.linkedin.com/learning/course/lesson'), true);
  assert.equal(isLinkedInLearningUrl('https://linkedin.com/learning/course/lesson'), true);
  assert.equal(isLinkedInLearningUrl('https://www.linkedin.com/feed/'), false);
});

test('normalizes lesson URLs for single-page navigation checks', () => {
  assert.equal(normalizeLinkedInLearningUrl('https://www.linkedin.com/learning/course/lesson?resume=false#transcript'), 'https://www.linkedin.com/learning/course/lesson');
  assert.equal(normalizeLinkedInLearningUrl('https://www.linkedin.com/feed/'), '');
});

test('extracts the video ID independently of URL flags', () => {
  assert.equal(linkedInLearningVideoId('https://www.linkedin.com/learning/learning-azure-openai/5964073?autoSkip=true&resume=false'), '5964073');
  assert.equal(linkedInLearningVideoId('https://www.linkedin.com/learning/learning-azure-openai/5964074'), '5964074');
  assert.equal(linkedInLearningVideoId('https://www.linkedin.com/learning/learning-azure-openai'), '');
});

test('detects video changes but ignores flag changes', () => {
  const current = 'https://www.linkedin.com/learning/learning-azure-openai/5964073?resume=false';
  assert.equal(linkedInLearningVideoChanged(current, 'https://www.linkedin.com/learning/learning-azure-openai/5964073?autoSkip=true'), false);
  assert.equal(linkedInLearningVideoChanged(current, 'https://www.linkedin.com/learning/learning-azure-openai/5964074?autoSkip=true'), true);
});

test('finds the active lesson in the last focused window', async () => {
  const calls = [];
  const tab = await findLinkedInLearningTab({
    query: async query => {
      calls.push(query);
      return [{ id: 7, active: true, url: 'https://www.linkedin.com/learning/course/lesson' }];
    }
  });
  assert.equal(tab.id, 7);
  assert.deepEqual(calls, [{ active: true, lastFocusedWindow: true }]);
});

test('falls back to any open LinkedIn Learning lesson', async () => {
  const tab = await findLinkedInLearningTab({
    query: async query => query.url
      ? [{ id: 9, active: false, url: 'https://www.linkedin.com/learning/course/lesson' }]
      : [{ id: 8, active: true, url: 'chrome://extensions' }]
  });
  assert.equal(tab.id, 9);
});

test('returns null when no lesson tab is open', async () => {
  assert.equal(await findLinkedInLearningTab({ query: async () => [] }), null);
});
