import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupWord } from '../../SourceCode/libs/dictionary.js';

test('prefers an exact written form and deduplicates definitions', async () => {
  const fetcher = async url => {
    assert.equal(url.searchParams.get('keyword'), '機械学習');
    return { ok: true, json: async () => ({ data: [{
      japanese: [{ word: '機械学習', reading: 'きかいがくしゅう' }],
      senses: [
        { english_definitions: ['machine learning'] },
        { english_definitions: ['machine learning', 'ML'] }
      ]
    }] }) };
  };
  assert.deepEqual(await lookupWord('機械学習', fetcher), {
    reading: 'きかいがくしゅう', definitions: ['machine learning', 'ML']
  });
});

test('returns null for no dictionary match and reports HTTP failures', async () => {
  assert.equal(await lookupWord('不存在', async () => ({ ok: true, json: async () => ({ data: [] }) })), null);
  await assert.rejects(() => lookupWord('機械学習', async () => ({ ok: false, status: 503 })), /503/);
});
