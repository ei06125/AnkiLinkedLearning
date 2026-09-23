import test from 'node:test';
import assert from 'node:assert/strict';
import { findLinkedInLearningTab, isLinkedInLearningUrl } from '../../SourceCode/apps/extension/tabs.js';

test('recognizes LinkedIn Learning lesson URLs', () => {
  assert.equal(isLinkedInLearningUrl('https://www.linkedin.com/learning/course/lesson'), true);
  assert.equal(isLinkedInLearningUrl('https://linkedin.com/learning/course/lesson'), true);
  assert.equal(isLinkedInLearningUrl('https://www.linkedin.com/feed/'), false);
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
