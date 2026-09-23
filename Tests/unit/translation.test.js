import test from 'node:test';
import assert from 'node:assert/strict';
import { translateSentence } from '../../SourceCode/libs/translation.js';

test('translates Japanese sentences to English', async () => {
  const fetcher = async url => {
    assert.equal(url.searchParams.get('q'), '機能を備えています。');
    assert.equal(url.searchParams.get('langpair'), 'ja|en');
    return {
      ok: true,
      json: async () => ({ responseStatus: 200, responseData: { translatedText: 'It has functionality.' } })
    };
  };
  assert.equal(await translateSentence('機能を備えています。', fetcher), 'It has functionality.');
});

test('reports HTTP, API, and sentence length failures', async () => {
  await assert.rejects(() => translateSentence('文', async () => ({ ok: false, status: 429 })), /429/);
  await assert.rejects(() => translateSentence('文', async () => ({
    ok: true,
    json: async () => ({ responseStatus: 403, responseDetails: 'Quota exceeded' })
  })), /Quota exceeded/);
  await assert.rejects(() => translateSentence('文'.repeat(251), async () => assert.fail()), /too long/);
});
