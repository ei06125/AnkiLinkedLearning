import test from 'node:test';
import assert from 'node:assert/strict';
import { sentences, transcriptParagraphs, kanjiList, wordList, makeCard, cardFields, exportAnki } from '../../SourceCode/libs/core.js';

test('keeps a sentence together across transcript cue boundaries', () => {
  assert.deepEqual(sentences('機械学習では\n現在のデータを使います。次の文です！'), ['機械学習では 現在のデータを使います。', '次の文です！']);
});

test('groups timestamped transcript cues from one full stop to the next', () => {
  assert.deepEqual(transcriptParagraphs([
    { text: 'このレッスンでは', start: 0 },
    { text: '機械学習を説明します。次の', start: 2.7 },
    { text: '文章です。最後', start: 6.8 }
  ]), [
    { text: 'このレッスンでは機械学習を説明します。', start: 0 },
    { text: '次の文章です。', start: 2.7 },
    { text: '最後', start: 6.8 }
  ]);
});
test('counts individual kanji including supplementary Unicode characters', () => {
  assert.deepEqual(kanjiList('学ぶ学習𠮷'), [{ character: '学', count: 2 }, { character: '習', count: 1 }, { character: '𠮷', count: 1 }]);
});
test('lists repeated multi-character Japanese words containing kanji', () => {
  const segmenter = { segment: () => [
    { segment: '機械学習', isWordLike: true }, { segment: 'で', isWordLike: true },
    { segment: '機械学習', isWordLike: true }, { segment: '。', isWordLike: false },
    { segment: '学ぶ', isWordLike: true }
  ] };
  assert.deepEqual(wordList('ignored', segmenter), [
    { word: '機械学習', count: 2 }, { word: '学ぶ', count: 1 }
  ]);
});
test('includes an entire contiguous kanji compound when segmentation splits it', () => {
  const segmenter = { segment: () => [
    { segment: '機械', isWordLike: true }, { segment: '学習', isWordLike: true }
  ] };
  assert.deepEqual(wordList('機械学習', segmenter), [
    { word: '機械', count: 1 }, { word: '学習', count: 1 }, { word: '機械学習', count: 1 }
  ]);
});
test('cards retain context and distinguish lessons and targets', () => {
  const card = makeCard('学習', '機械学習です。', { title: 'Lesson', url: 'https://www.linkedin.com/learning/course/lesson' });
  assert.equal(card.sentence, '機械学習です。');
  assert.notEqual(card.id, makeCard('機械', card.sentence, card).id);
  assert.throws(() => makeCard('教', card.sentence, card));
});
test('escapes transcript markup and rejects unsafe source links', () => {
  const [front, back] = cardFields({ target: '学', sentence: '<script>学&学', reading: '<img>', translation: '"x"', title: '<title>', url: 'javascript:alert(1)' }, 'recall');
  assert.equal(front, '&lt;script&gt;<b>［ … ］</b>&amp;<b>［ … ］</b>');
  assert.ok(back.includes('&lt;img&gt;'));
  assert.ok(!back.includes('href='));
});
test('exports UTF-8 Anki text with automatic deck column and safe quoted fields', () => {
  const card = makeCard('学', '学びます。', { title: 'Test', url: '' });
  const output = exportAnki([card], '日本語\nDeck', 'reading');
  assert.ok(output.includes('#deck column:3'));
  assert.ok(output.endsWith('\t"日本語 Deck"'));
  assert.ok(output.includes('<b>学</b>'));
  assert.throws(() => exportAnki([], 'Deck'));
});

test('default card follows kanji, reading, sentence, translation order', () => {
  const card = { ...makeCard('学習', '機械学習です。', { title: 'Lesson', url: '' }), reading: 'がくしゅう', translation: 'It is machine learning.' };
  const [front, back] = cardFields(card);
  assert.equal(front, '<b>学習</b><br><br>機械学習です。');
  assert.ok(back.indexOf('学習') < back.indexOf('がくしゅう'));
  assert.ok(back.indexOf('がくしゅう') < back.indexOf('機械'));
  assert.ok(back.indexOf('機械') < back.indexOf('It is machine learning.'));
});
