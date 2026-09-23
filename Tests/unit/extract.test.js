import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const script = await readFile(new URL('../../SourceCode/apps/extension/extract.js', import.meta.url), 'utf8');
test('extracts visible timestamped transcript cues and strips tracking parameters', () => {
  const cue = (text, start) => ({ innerText: text, dataset: { startTime: start }, getAttribute: () => null, querySelector: () => null, closest: () => null, getClientRects: () => [1] });
  const document = {
    querySelectorAll: selector => selector === '.transcripts__paragraph' ? [cue('機械学習では', '12.5'), cue('データを使います。', '18000'), { innerText: 'hidden', getClientRects: () => [] }] : [],
    querySelector: selector => selector === '.classroom-transcript__title' ? { innerText: 'Lesson title' } : null
  };
  const result = vm.runInNewContext(script, { document, URL, location: { href: 'https://www.linkedin.com/learning/course/lesson?tracking=123#fragment' } });
  assert.equal(result.text, '機械学習では\nデータを使います。');
  assert.deepEqual(JSON.parse(JSON.stringify(result.cues)), [{ text: '機械学習では', start: 12.5 }, { text: 'データを使います。', start: 18 }]);
  assert.equal(result.url, 'https://www.linkedin.com/learning/course/lesson');
  assert.equal(result.title, 'Lesson title');
});
test('does not capture unrelated page text if transcript is absent', () => {
  const document = { querySelectorAll: () => [], querySelector: () => null, title: 'Course', body: { innerText: 'Unrelated page content' } };
  const result = vm.runInNewContext(script, { document, URL, location: { href: 'https://www.linkedin.com/learning/course/lesson' } });
  assert.equal(result.text, '');
});

test('captures classroom anchor cues and uses the lesson title instead of the site heading', () => {
  const cue = text => ({ innerText: text, getClientRects: () => [1] });
  const document = {
    querySelectorAll: selector => selector === '.classroom-transcript__lines .content-transcript-line'
      ? [cue('このレッスンでは'), cue('Event Hubsの概要ついて解説します。')] : [],
    querySelector: selector => ({
      '.classroom-transcript__title': { innerText: 'Event Hubsの概要を学ぶ' },
      h1: { innerText: 'LinkedIn Learning' }
    })[selector] || null,
    title: 'Event Hubsの概要を学ぶ | LinkedIn Learning'
  };
  const result = vm.runInNewContext(script, { document, URL, location: { href: 'https://www.linkedin.com/learning/learning-microsoft-azure/2201474?autoSkip=true&resume=false#' } });
  assert.equal(result.text, 'このレッスンでは\nEvent Hubsの概要ついて解説します。');
  assert.equal(result.title, 'Event Hubsの概要を学ぶ');
  assert.equal(result.url, 'https://www.linkedin.com/learning/learning-microsoft-azure/2201474');
});

test('falls back to the lesson subtitle or document title', () => {
  for (const subtitle of ['Lesson subtitle', '']) {
    const document = {
      querySelectorAll: () => [],
      querySelector: selector => selector === '.classroom-nav__subtitle' ? { innerText: subtitle } : null,
      title: 'Document lesson | LinkedIn Learning'
    };
    const result = vm.runInNewContext(script, { document, URL, location: { href: 'https://www.linkedin.com/learning/course/lesson' } });
    assert.equal(result.title, subtitle || 'Document lesson');
  }
});

test('uses Japanese video cues for timestamps when available', () => {
  const document = {
    querySelectorAll: () => [],
    querySelector: selector => selector === 'video' ? { textTracks: [{ language: 'ja', label: 'Japanese', cues: [{ text: '字幕です。', startTime: 4.25 }] }] } : null,
    title: 'Video lesson'
  };
  const result = vm.runInNewContext(script, { document, URL, location: { href: 'https://www.linkedin.com/learning/course/lesson' } });
  assert.deepEqual(JSON.parse(JSON.stringify(result.cues)), [{ text: '字幕です。', start: 4.25 }]);
});

test('prefers the visible transcript after navigation over stale video cues', () => {
  const cue = text => ({ innerText: text, dataset: {}, getAttribute: () => null, querySelector: () => null, closest: () => null, getClientRects: () => [1] });
  const document = {
    querySelectorAll: selector => selector === '.classroom-transcript__lines .content-transcript-line'
      ? [cue('新しいレッスンです。')]
      : [],
    querySelector: selector => selector === 'video'
      ? { textTracks: [{ language: 'ja', label: 'Japanese', cues: [{ text: '前のレッスンです。', startTime: 4.25 }] }] }
      : null,
    title: 'New lesson'
  };
  const result = vm.runInNewContext(script, { document, URL, location: { href: 'https://www.linkedin.com/learning/course/new-lesson' } });
  assert.equal(result.text, '新しいレッスンです。');
});

test('uses embedded LinkedIn transcript timing when video cues are unavailable', () => {
  const cue = text => ({ innerText: text, dataset: {}, getAttribute: () => null, querySelector: () => null, closest: () => null, getClientRects: () => [1] });
  const document = {
    querySelectorAll: selector => selector === '.classroom-transcript__lines .content-transcript-line'
      ? [cue('このレッスンでは'), cue('機械学習を説明します。')]
      : selector === 'code' ? [{ textContent: JSON.stringify({ lines: [{ transcriptStartAt: 0, caption: 'このレッスンでは' }, { transcriptStartAt: 2700, caption: '機械学習を説明します。' }] }) }] : [],
    querySelector: () => null,
    title: 'Video lesson'
  };
  const result = vm.runInNewContext(script, { document, URL, location: { href: 'https://www.linkedin.com/learning/course/lesson' } });
  assert.deepEqual(JSON.parse(JSON.stringify(result.cues)), [{ text: 'このレッスンでは', start: 0 }, { text: '機械学習を説明します。', start: 2.7 }]);
});
