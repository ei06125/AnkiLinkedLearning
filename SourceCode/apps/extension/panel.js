import { sentences, transcriptParagraphs, kanjiList, wordList, hasKanji, makeCard, cardFields, exportAnki } from '../../libs/core.js';
import { lookupWord } from '../../libs/dictionary.js';
import { translateSentence } from '../../libs/translation.js';
import { findLinkedInLearningTab, isLinkedInLearningUrl, normalizeLinkedInLearningUrl } from './tabs.js';
import { highlightTranscriptTarget } from './highlight.js';
import { readVideoTime, seekVideo } from './playback.js';

const $ = id => document.getElementById(id);
const storage = globalThis.chrome?.storage?.local;
const panelPort = globalThis.chrome?.runtime ? chrome.runtime.connect({ name: 'anki-panel' }) : null;
let state = { cards: [], deck: 'LinkedIn Japanese', mode: 'reading' };
let lesson = null;
let filter = '';
let selection = null;
let currentCardId = null;
let vocabularyTab = 'words';
let targetTab = 'words';
let saveQueue = Promise.resolve();
let statusTimer;
let activeCue = -1;
let pageActive = false;

async function refreshPageMode() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  pageActive = isLinkedInLearningUrl(tab?.url);
  $('landing').hidden = pageActive;
  $('app').hidden = !pageActive;
  if (pageActive && lesson?.url?.startsWith('https://') && normalizeLinkedInLearningUrl(tab.url) !== lesson.url) {
    resetLesson();
    status('New lesson detected. Capture its transcript to continue.');
  }
  if (!pageActive) $('status').hidden = true;
  else if (vocabularyTab === 'full-transcript') syncTranscriptWithVideo();
}

function status(message, error = false) {
  if (!pageActive) return;
  clearTimeout(statusTimer);
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
  $('status').hidden = false;
  statusTimer = setTimeout(() => { $('status').hidden = true; }, 5000);
}

function save() {
  const snapshot = structuredClone(state);
  saveQueue = saveQueue.catch(() => {}).then(async () => {
    if (storage) await storage.set({ kanjiLearning: snapshot });
    else localStorage.setItem('kanjiLearning', JSON.stringify(snapshot));
  });
  saveQueue.catch(() => status('Could not save locally. Export your cards before closing.', true));
  return saveQueue;
}

const currentLesson = () => lesson;
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

async function addCard(target, sentence) {
  const cachedTranslation = state.cards.find(existing => existing.sentence === sentence && existing.translation)?.translation || '';
  const card = makeCard(target, sentence, currentLesson());
  const existing = state.cards.find(item => item.id === card.id);
  if (existing) {
    currentCardId = existing.id;
    renderCards();
    return status(`Opened the saved ${target} card for editing.`);
  }
  card.translation = cachedTranslation;
  state.cards.push(card);
  currentCardId = card.id;
  save();
  renderCards();
  status(`Enriching ${target}…`);
  const dictionaryRequest = [...target].length > 1 ? lookupWord(target) : Promise.resolve(null);
  const translationRequest = cachedTranslation ? Promise.resolve(cachedTranslation) : translateSentence(sentence);
  const [dictionary, translation] = await Promise.allSettled([dictionaryRequest, translationRequest]);
  const errors = [];
  if (dictionary.status === 'fulfilled' && dictionary.value) {
    card.reading = dictionary.value.reading;
    card.definitions = dictionary.value.definitions;
  } else if (dictionary.status === 'rejected') errors.push(dictionary.reason.message);
  if (translation.status === 'fulfilled') card.translation = translation.value;
  else errors.push(translation.reason.message);
  await save();
  renderCards();
  if (errors.length) {
    status(`Added ${target}. ${errors.join(' ')} You can enter missing fields manually.`, true);
  } else {
    status(`Added ${target}; available reading and translation filled in.`);
  }
}

async function translateCard(card, button) {
  button.disabled = true;
  status('Translating sentence…');
  try {
    card.translation = await translateSentence(card.sentence);
    await save();
    renderCards();
    status('Sentence translation filled in.');
  } catch (error) {
    button.disabled = false;
    status(`${error.message} Enter the translation manually.`, true);
  }
}

async function backfillTranslations() {
  const missing = state.cards.filter(card => !card.translation);
  const uniqueSentences = [...new Set(missing.map(card => card.sentence))];
  if (!uniqueSentences.length) return;
  status(`Translating ${uniqueSentences.length} saved sentence${uniqueSentences.length === 1 ? '' : 's'}…`);
  const results = await Promise.allSettled(uniqueSentences.map(sentence => translateSentence(sentence)));
  let failures = 0;
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      failures += 1;
      return;
    }
    for (const card of missing) {
      if (card.sentence === uniqueSentences[index]) card.translation = result.value;
    }
  });
  await save();
  renderCards();
  status(failures
    ? `Translated ${uniqueSentences.length - failures} saved sentences; ${failures} failed and can be retried manually.`
    : 'Saved card translations filled in.', failures > 0);
}

async function highlightOnPage(target) {
  if (!lesson?.url?.startsWith('https://')) return;
  try {
    const tab = await findLinkedInLearningTab(chrome.tabs);
    if (tab) {
      if (target) panelPort?.postMessage({ type: 'highlight-tab', tabId: tab.id });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: highlightTranscriptTarget, args: [target] });
    }
  } catch {}
}

function chooseTarget(target) {
  filter = filter === target ? '' : target;
  currentCardId = filter ? state.cards.findLast(card => card.target === filter)?.id || null : null;
  highlightOnPage(filter);
  renderTranscript();
  renderFullTranscript();
  renderCards();
}

function setVocabularyTab(tab) {
  if (tab !== 'full-transcript' && tab !== targetTab) {
    targetTab = tab;
    filter = '';
    currentCardId = null;
    highlightOnPage('');
  }
  vocabularyTab = tab;
  for (const name of ['words', 'kanji', 'full-transcript']) {
    const selected = name === vocabularyTab;
    $(`${name}-tab`).setAttribute('aria-selected', String(selected));
    $(`${name}-tab`).tabIndex = selected ? 0 : -1;
    $(`${name}-panel`).hidden = !selected;
  }
  renderTranscript();
  renderFullTranscript();
  renderCards();
  if (tab === 'full-transcript') syncTranscriptWithVideo();
}

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor(value % 3600 / 60);
  const remainder = String(value % 60).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${remainder}` : `${minutes}:${remainder}`;
}

async function seekTo(start) {
  const tab = await findLinkedInLearningTab(chrome.tabs);
  if (!tab) return status('No LinkedIn Learning lesson tab was found.', true);
  const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: seekVideo, args: [start] });
  if (!result.result) return status('No lesson video was found.', true);
  updateActiveCue(start, true);
}

function updateActiveCue(currentTime, forceScroll = false) {
  const cues = lesson?.cues || [];
  let index = -1;
  for (let candidate = 0; candidate < cues.length; candidate += 1) {
    if (cues[candidate].start == null || cues[candidate].start > currentTime) continue;
    if (index < 0 || cues[candidate].start >= cues[index].start) index = candidate;
  }
  if (index === activeCue && !forceScroll) return;
  activeCue = index;
  const rows = [...$('full-transcript').querySelectorAll('[data-cue-index]')];
  rows.forEach((row, rowIndex) => row.classList.toggle('active', rowIndex === index));
  if (vocabularyTab === 'full-transcript' && index >= 0) rows[index]?.scrollIntoView({ block: 'center', behavior: forceScroll ? 'smooth' : 'auto' });
}

async function syncTranscriptWithVideo() {
  if (!pageActive || vocabularyTab !== 'full-transcript' || !lesson?.url?.startsWith('https://') || !lesson.cues?.some(cue => cue.start != null)) return;
  try {
    const tab = await findLinkedInLearningTab(chrome.tabs);
    if (!tab) return;
    const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: readVideoTime });
    if (result.result) updateActiveCue(result.result.currentTime);
  } catch {}
}

function renderFullTranscript() {
  $('full-transcript').replaceChildren();
  const current = currentLesson();
  if (!current) {
    $('full-transcript').append(element('p', 'Capture a lesson or try the sample to get started.', 'empty'));
    return;
  }
  let firstMatch;
  const entries = current.cues?.length ? transcriptParagraphs(current.cues) : sentences(current.text).map(text => ({ text, start: null }));
  entries.forEach((cue, index) => {
    const row = element('div', undefined, 'transcript-cue');
    row.dataset.cueIndex = index;
    const paragraph = element('p');
    paragraph.dataset.sentence = cue.text;
    if (cue.start != null) {
      const timestamp = element('button', formatTime(cue.start), 'timestamp');
      timestamp.title = `Seek video to ${formatTime(cue.start)}`;
      timestamp.onclick = () => seekTo(cue.start);
      row.append(timestamp);
    }
    if (filter && cue.text.includes(filter)) {
      cue.text.split(filter).forEach((part, partIndex) => {
        if (partIndex) paragraph.append(element('mark', filter));
        paragraph.append(document.createTextNode(part));
      });
      firstMatch ||= row;
    } else {
      paragraph.textContent = cue.text;
    }
    row.append(paragraph);
    $('full-transcript').append(row);
  });
  updateActiveCue(activeCue < 0 ? 0 : lesson.cues?.[activeCue]?.start || 0);
  if (vocabularyTab === 'full-transcript') firstMatch?.scrollIntoView({ block: 'center' });
}

function renderTranscript() {
  selection = null;
  $('add-selection').disabled = true;
  const lesson = currentLesson();
  $('kanji').replaceChildren();
  $('words').replaceChildren();
  $('transcript').replaceChildren();
  $('show-all').hidden = !filter;
  $('reset').disabled = !lesson;
  $('transcript-title').textContent = filter ? `Sentences containing ${filter}` : lesson?.title || 'Your transcript appears here';
  if (!lesson) {
    $('transcript').append(element('p', 'Capture a lesson or try the sample to get started.', 'empty'));
    return;
  }
  for (const { character, count } of kanjiList(lesson.text)) {
    const button = element('button', character);
    button.title = `${character} · ${count} occurrences`;
    button.setAttribute('aria-pressed', String(character === filter));
    button.onclick = () => chooseTarget(character);
    $('kanji').append(button);
  }
  for (const { word, count } of wordList(lesson.text)) {
    const button = element('button', word);
    button.title = `${word} · ${count} occurrences`;
    button.setAttribute('aria-pressed', String(word === filter));
    button.onclick = () => chooseTarget(word);
    $('words').append(button);
  }
  for (const sentence of sentences(lesson.text)) {
    if (filter && !sentence.includes(filter)) continue;
    const row = element('div', undefined, 'sentence');
    const paragraph = element('p');
    paragraph.dataset.sentence = sentence;
    if (filter) sentence.split(filter).forEach((part, index) => {
      if (index) paragraph.append(element('mark', filter));
      paragraph.append(document.createTextNode(part));
    });
    else paragraph.textContent = sentence;
    row.append(paragraph);
    if (filter) {
      const candidate = makeCard(filter, sentence, lesson);
      const exists = state.cards.some(card => card.id === candidate.id);
      const button = element('button', `${exists ? 'Edit' : 'Add'} ${filter} with this sentence`);
      button.onclick = () => addCard(filter, sentence);
      row.append(button);
    }
    $('transcript').append(row);
  }
}

function resetLesson() {
  lesson = null;
  filter = '';
  selection = null;
  currentCardId = null;
  activeCue = -1;
  targetTab = 'words';
  $('paste-title').value = '';
  $('paste-text').value = '';
  $('add-selection').textContent = 'Add selection';
  highlightOnPage('');
  setVocabularyTab('words');
}

function renderCards() {
  $('cards').replaceChildren();
  $('card-count').textContent = `${state.cards.length} saved`;
  $('export').disabled = !state.cards.length;
  const card = state.cards.find(item => item.id === currentCardId);
  if (!card) {
    $('cards').append(element('p', 'Choose a sentence to create or update a card.', 'empty'));
    return;
  }
  const row = element('article', undefined, 'card');
  const heading = element('div', undefined, 'section-title');
  heading.append(element('strong', card.target));
  const remove = element('button', 'Remove', 'quiet');
  remove.setAttribute('aria-label', `Remove ${card.target} card`);
  remove.onclick = () => {
    state.cards = state.cards.filter(item => item.id !== card.id);
    currentCardId = null;
    save();
    renderTranscript();
    renderCards();
  };
  heading.append(remove);
  row.append(heading, element('p', card.sentence));
  if (card.definitions?.length) row.append(element('p', `Dictionary: ${card.definitions.join('; ')}`, 'dictionary-result'));
  const fields = element('div', undefined, 'fields');
  const preview = element('details');
  preview.append(element('summary', 'Preview card'));
  const content = element('div', undefined, 'preview');
  function updatePreview() {
    const [front, back] = cardFields(card, state.mode);
    content.innerHTML = `<small>FRONT</small>${front}<hr><small>BACK</small>${back}`;
  }
  for (const [key, name] of [['reading', 'Reading'], ['translation', 'Sentence translation']]) {
    const label = element('label', name);
    const input = element('input');
    input.value = card[key];
    input.placeholder = key === 'reading' ? 'ひらがな' : 'Translate the full sentence';
    input.oninput = () => { card[key] = input.value; save(); updatePreview(); };
    label.append(input);
    if (key === 'translation') {
      const translate = element('button', card.translation ? 'Translate again' : 'Translate automatically', 'translate-button');
      translate.onclick = () => translateCard(card, translate);
      label.append(translate);
    }
    fields.append(label);
  }
  updatePreview();
  preview.append(content);
  row.append(fields, preview);
  $('cards').append(row);
}

async function addLesson(captured) {
  if (!captured.text?.trim()) throw new Error('No transcript found. Open the Transcript tab and try again, or paste its text.');
  if (!hasKanji(captured.text)) throw new Error('No kanji found. Select the Japanese transcript or paste Japanese text.');
  captured.id = captured.url || crypto.randomUUID();
  lesson = captured;
  activeCue = -1;
  filter = '';
  currentCardId = null;
  renderTranscript();
  renderFullTranscript();
  renderCards();
  status(`Captured ${sentences(captured.text).length} sentences from ${captured.title}.`);
}

$('capture').onclick = async () => {
  $('capture').disabled = true;
  try {
    if (!globalThis.chrome?.scripting) throw new Error('Load this folder as a Chrome extension to capture a lesson. You can try the sample here.');
    const tab = await findLinkedInLearningTab(chrome.tabs);
    if (!tab) throw new Error('No LinkedIn Learning lesson tab was found. Open a lesson, then try again.');
    const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['SourceCode/apps/extension/extract.js'] });
    await addLesson(result.result);
  } catch (error) { status(error.message, true); }
  finally { $('capture').disabled = false; }
};

$('paste').onclick = async () => {
  try {
    await addLesson({ title: $('paste-title').value.trim() || 'Pasted transcript', text: $('paste-text').value.trim(), url: '' });
    $('paste-text').value = '';
  } catch (error) { status(error.message, true); }
};
$('reset').onclick = () => {
  resetLesson();
  status('Transcript session reset. Saved cards were kept.');
};
$('demo').onclick = async () => {
  try {
    await addLesson({ title: 'Sample · 機械学習の概要', url: 'sample:machine-learning', text: '機械学習では、現在のデータを用いて将来の出来事を予測します。教師あり学習と教師なし学習を選択できます。Pythonでモデルを柔軟に構築することができます。学習したモデルをテストして管理します。' });
  } catch (error) { status(error.message, true); }
};
$('words-tab').onclick = () => setVocabularyTab('words');
$('kanji-tab').onclick = () => setVocabularyTab('kanji');
$('full-transcript-tab').onclick = () => setVocabularyTab('full-transcript');
$('show-all').onclick = () => { filter = ''; currentCardId = null; highlightOnPage(''); renderTranscript(); renderFullTranscript(); renderCards(); };
document.addEventListener('selectionchange', () => {
  const chosen = window.getSelection();
  const parent = node => (node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement)?.closest('[data-sentence]');
  const start = parent(chosen?.anchorNode);
  const end = parent(chosen?.focusNode);
  const target = chosen?.toString().trim() || '';
  if (start && start === end && hasKanji(target) && start.dataset.sentence.includes(target)) {
    selection = { target, sentence: start.dataset.sentence };
    $('add-selection').disabled = false;
    $('add-selection').textContent = `Add selection: ${target}`;
  } else if (chosen && !chosen.isCollapsed) {
    selection = null;
    $('add-selection').disabled = true;
  }
});
$('add-selection').onclick = () => {
  if (selection) addCard(selection.target, selection.sentence);
};
$('deck').oninput = () => { state.deck = $('deck').value; save(); };
$('mode').onchange = () => { state.mode = $('mode').value; save(); renderCards(); };
$('export').onclick = () => {
  try {
    const text = exportAnki(state.cards, state.deck, state.mode);
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = element('a');
    link.href = url;
    link.download = `${state.deck.replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0,80) || 'kanji-deck'}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    status(`Exported ${state.cards.length} cards. Import the file in Anki Desktop.`);
  } catch (error) { status(error.message, true); }
};
$('open-export-folder').onclick = () => {
  if (!globalThis.chrome?.downloads?.showDefaultFolder) return status('Load this folder as a Chrome extension to open the export folder.', true);
  chrome.downloads.showDefaultFolder();
};

try {
  await refreshPageMode();
  const saved = storage ? (await storage.get('kanjiLearning')).kanjiLearning : JSON.parse(localStorage.getItem('kanjiLearning') || 'null');
  if (saved) state = {
    cards: Array.isArray(saved.cards) ? saved.cards : [],
    deck: saved.deck || state.deck,
    mode: saved.mode || state.mode
  };
  await save();
  $('deck').value = state.deck;
  $('mode').value = state.mode;
  setVocabularyTab('words');
  renderCards();
  await backfillTranslations();
} catch (error) { status(`Could not load saved data: ${error.message}`, true); }

setInterval(syncTranscriptWithVideo, 1000);
chrome.tabs.onActivated.addListener(refreshPageMode);
chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => { if (changeInfo.url || changeInfo.status === 'complete') refreshPageMode(); });
