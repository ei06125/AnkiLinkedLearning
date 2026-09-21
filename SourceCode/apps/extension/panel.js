import { sentences, kanjiList, hasKanji, makeCard, cardFields, exportAnki } from '../../libs/core.js';

const $ = id => document.getElementById(id);
const storage = globalThis.chrome?.storage?.local;
let state = { lessons: [], cards: [], active: '', deck: 'LinkedIn Kanji', mode: 'reading' };
let filter = '';
let selection = null;
let saveQueue = Promise.resolve();

function status(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
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

const currentLesson = () => state.lessons.find(lesson => lesson.id === state.active);
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function addCard(target, sentence) {
  const card = makeCard(target, sentence, currentLesson());
  if (state.cards.some(existing => existing.id === card.id)) return status('This kanji and sentence are already in your deck.');
  state.cards.push(card);
  save();
  renderCards();
  status(`Added ${target} with its sentence.`);
}

function renderTranscript() {
  selection = null;
  $('add-selection').disabled = true;
  const lesson = currentLesson();
  $('kanji').replaceChildren();
  $('transcript').replaceChildren();
  $('show-all').hidden = !filter;
  $('transcript-title').textContent = filter ? `Sentences containing ${filter}` : lesson?.title || 'Your transcript appears here';
  if (!lesson) {
    $('transcript').append(element('p', 'Capture a lesson or try the sample to get started.', 'empty'));
    return;
  }
  for (const { character, count } of kanjiList(lesson.text)) {
    const button = element('button', character);
    button.title = `${character} · ${count} occurrences`;
    button.setAttribute('aria-pressed', String(character === filter));
    button.onclick = () => { filter = filter === character ? '' : character; renderTranscript(); };
    $('kanji').append(button);
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
      const button = element('button', `Add ${filter} with this sentence`);
      button.onclick = () => addCard(filter, sentence);
      row.append(button);
    }
    $('transcript').append(row);
  }
}

function renderLessons() {
  $('lessons').replaceChildren();
  if (!state.lessons.length) $('lessons').append(new Option('No lessons yet', ''));
  for (const lesson of state.lessons) $('lessons').append(new Option(lesson.title, lesson.id));
  $('lessons').value = state.active;
  $('lesson-count').textContent = `${state.lessons.length} saved`;
  renderTranscript();
}

function renderCards() {
  $('cards').replaceChildren();
  $('card-count').textContent = `${state.cards.length} cards`;
  $('export').disabled = !state.cards.length;
  for (const card of state.cards) {
    const row = element('article', undefined, 'card');
    const heading = element('div', undefined, 'section-title');
    heading.append(element('strong', card.target));
    const remove = element('button', 'Remove', 'quiet');
    remove.setAttribute('aria-label', `Remove ${card.target} card`);
    remove.onclick = () => { state.cards = state.cards.filter(item => item.id !== card.id); save(); renderCards(); };
    heading.append(remove);
    row.append(heading, element('p', card.sentence));
    const fields = element('div', undefined, 'fields');
    const preview = element('details');
    preview.append(element('summary', 'Preview card'));
    const content = element('div', undefined, 'preview');
    function updatePreview() {
      const [front, back] = cardFields(card, state.mode);
      content.innerHTML = `<small>FRONT</small>${front}<hr><small>BACK</small>${back}`;
    }
    for (const [key, name] of [['reading', 'Kanji reading'], ['translation', 'Sentence translation']]) {
      const label = element('label', name);
      const input = element('input');
      input.value = card[key];
      input.placeholder = key === 'reading' ? 'ひらがな' : 'Translate the full sentence';
      input.oninput = () => { card[key] = input.value; save(); updatePreview(); };
      label.append(input);
      fields.append(label);
    }
    updatePreview();
    preview.append(content);
    row.append(fields, preview);
    $('cards').append(row);
  }
}

async function addLesson(lesson) {
  if (!lesson.text?.trim()) throw new Error('No transcript found. Open the Transcript tab and try again, or paste its text.');
  if (!hasKanji(lesson.text)) throw new Error('No kanji found. Select the Japanese transcript or paste Japanese text.');
  lesson.id = lesson.url || crypto.randomUUID();
  const index = state.lessons.findIndex(item => item.id === lesson.id);
  if (index >= 0) state.lessons[index] = lesson;
  else state.lessons.push(lesson);
  state.active = lesson.id;
  filter = '';
  await save();
  renderLessons();
  status(`Saved ${sentences(lesson.text).length} sentences from ${lesson.title}.`);
}

$('capture').onclick = async () => {
  $('capture').disabled = true;
  try {
    if (!globalThis.chrome?.scripting) throw new Error('Load this folder as a Chrome extension to capture a lesson. You can try the sample here.');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!/^https:\/\/([\w-]+\.)?linkedin\.com\/learning\//.test(tab?.url || '')) throw new Error('Open a LinkedIn Learning lesson and click this extension’s toolbar icon first.');
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
$('demo').onclick = async () => {
  try {
    await addLesson({ title: 'Sample · 機械学習の概要', url: 'sample:machine-learning', text: '機械学習では、現在のデータを用いて将来の出来事を予測します。教師あり学習と教師なし学習を選択できます。Pythonでモデルを柔軟に構築することができます。学習したモデルをテストして管理します。' });
  } catch (error) { status(error.message, true); }
};
$('lessons').onchange = () => { state.active = $('lessons').value; filter = ''; save(); renderTranscript(); };
$('show-all').onclick = () => { filter = ''; renderTranscript(); };
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

try {
  const saved = storage ? (await storage.get('kanjiLearning')).kanjiLearning : JSON.parse(localStorage.getItem('kanjiLearning') || 'null');
  if (saved) state = { ...state, ...saved };
  $('deck').value = state.deck;
  $('mode').value = state.mode;
  renderLessons();
  renderCards();
} catch (error) { status(`Could not load saved data: ${error.message}`, true); }
