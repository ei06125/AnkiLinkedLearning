export const hasKanji = text => /\p{Script=Han}/u.test(text);

export function sentences(text) {
  return (text.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').match(/[^。！？!?]+[。！？!?]*[」』”"]*/gu) || [])
    .map(value => value.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
}

export function transcriptParagraphs(cues) {
  const paragraphs = [];
  let text = '';
  let start = null;
  for (const cue of cues) {
    for (const part of cue.text.match(/[^。]*。|[^。]+$/gu) || []) {
      if (!text) start = cue.start;
      text += part.trim();
      if (part.endsWith('。')) {
        paragraphs.push({ text, start });
        text = '';
        start = null;
      }
    }
  }
  if (text) paragraphs.push({ text, start });
  return paragraphs;
}

export function kanjiList(text) {
  const counts = new Map();
  for (const character of text) {
    if (hasKanji(character)) counts.set(character, (counts.get(character) || 0) + 1);
  }
  return [...counts].map(([character, count]) => ({ character, count }));
}

export function wordList(text, segmenter = new Intl.Segmenter('ja-JP', { granularity: 'word' })) {
  const segmentedCounts = new Map();
  for (const { segment, isWordLike } of segmenter.segment(text)) {
    if (!isWordLike || !hasKanji(segment) || [...segment].length < 2) continue;
    segmentedCounts.set(segment, (segmentedCounts.get(segment) || 0) + 1);
  }
  const runCounts = new Map();
  for (const match of text.matchAll(/\p{Script=Han}{2,}/gu)) {
    runCounts.set(match[0], (runCounts.get(match[0]) || 0) + 1);
  }
  const counts = new Map(segmentedCounts);
  for (const [word, count] of runCounts) counts.set(word, Math.max(counts.get(word) || 0, count));
  return [...counts].map(([word, count]) => ({ word, count }));
}

export const escapeHtml = text => String(text).replace(/[&<>"']/g, value => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[value]);

export function makeCard(target, sentence, lesson) {
  if (!hasKanji(target) || !sentence.includes(target)) throw new Error('Select kanji within one sentence.');
  return { id: JSON.stringify([lesson.id || lesson.url, target, sentence]), target, sentence, title: lesson.title, url: lesson.url, reading: '', translation: '', definitions: [] };
}

export function cardFields(card, mode = 'reading') {
  const parts = card.sentence.split(card.target).map(escapeHtml);
  const front = mode === 'recall'
    ? parts.join('<b>［ … ］</b>')
    : `<b>${escapeHtml(card.target)}</b><br><br>${escapeHtml(card.sentence)}`;
  const link = /^https:\/\/([\w-]+\.)?linkedin\.com\/learning\//.test(card.url)
    ? `<a href="${escapeHtml(card.url)}">${escapeHtml(card.title || 'Source lesson')}</a>`
    : escapeHtml(card.title || 'Pasted transcript');
  const back = `<b>${escapeHtml(card.target)}</b><br>${escapeHtml(card.reading || '')}<br><br>${parts.join(`<b>${escapeHtml(card.target)}</b>`)}<br><br>${escapeHtml(card.translation || '')}<br><br>${link}`;
  return [front, back];
}

export function exportAnki(cards, deck, mode) {
  if (!cards.length) throw new Error('Add at least one card before exporting.');
  const quote = value => `"${value.replace(/"/g, '""').replace(/\r?\n/g, '<br>')}"`;
  const name = deck.replace(/[\r\n\t]/g, ' ').trim() || 'LinkedIn Japanese';
  return ['#separator:Tab', '#html:true', '#notetype:Basic', '#columns:Front\tBack\tDeck', '#deck column:3', '#tags:linkedin_learning japanese vocabulary',
    ...cards.map(card => [...cardFields(card, mode), name].map(quote).join('\t'))].join('\n');
}
