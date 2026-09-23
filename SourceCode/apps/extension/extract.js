(() => {
  const visible = element => element.getClientRects().length > 0;
  const cueTime = element => {
    const candidates = [
      element.dataset?.startTime, element.dataset?.start, element.dataset?.time,
      element.getAttribute?.('data-start-time'), element.getAttribute?.('data-time'),
      element.querySelector?.('[data-start-time]')?.getAttribute('data-start-time'),
      element.querySelector?.('time')?.getAttribute('datetime')
    ];
    const link = element.closest?.('a')?.href || element.querySelector?.('a')?.href || '';
    const match = link.match(/(?:[?#&](?:t|time|start)=)(\d+(?:\.\d+)?)/i);
    if (match) candidates.push(match[1]);
    for (const candidate of candidates) {
      if (candidate == null || candidate === '') continue;
      const clock = String(candidate).match(/(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)/);
      if (clock) return Number(clock[1] || 0) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
      const value = Number(candidate);
      if (Number.isFinite(value)) return value >= 10000 ? value / 1000 : value;
    }
    return null;
  };
  const selectors = [
    '.classroom-transcript__lines .content-transcript-line',
    '.transcripts__paragraph', '.transcript__paragraph',
    '[data-test-transcript-paragraph]', '[data-test-transcript-cue]',
    '.transcripts__cue', '.transcript-line',
    '[class*="transcript"] [class*="paragraph"]',
    '[class*="transcript"] [class*="cue"]'
  ];
  let text = '';
  let cues = [];
  for (const selector of selectors) {
    const elements = [...document.querySelectorAll(selector)].filter(visible);
    if (elements.length) {
      cues = elements.map(element => ({ text: element.innerText.trim(), start: cueTime(element) })).filter(cue => cue.text);
      text = cues.map(cue => cue.text).join('\n');
      if (text) break;
    }
  }
  if (!text) {
    const tracks = [...(document.querySelector('video')?.textTracks || [])];
    const track = tracks.find(item => /^(ja|jpn)(-|$)/i.test(item.language) && item.cues?.length)
      || tracks.find(item => /japanese|日本語/i.test(item.label) && item.cues?.length)
      || tracks.find(item => item.cues?.length);
    if (track) {
      cues = [...track.cues].map(cue => ({ text: cue.text.replace(/<[^>]+>/g, '').trim(), start: cue.startTime })).filter(cue => cue.text);
      text = cues.map(cue => cue.text).join('\n');
    }
  }
  if (text && !cues.some(cue => cue.start != null)) {
    const candidates = [];
    const visit = value => {
      if (!value) return;
      if (Array.isArray(value)) {
        if (value.some(item => Number.isFinite(item?.transcriptStartAt) && typeof item?.caption === 'string')) candidates.push(value);
        else value.forEach(visit);
        return;
      }
      if (typeof value === 'object') Object.values(value).forEach(visit);
      else if (typeof value === 'string' && value.includes('transcriptStartAt')) {
        try { visit(JSON.parse(value)); } catch {}
      }
    };
    for (const node of document.querySelectorAll('code')) {
      if (!node.textContent.includes('transcriptStartAt')) continue;
      try { visit(JSON.parse(node.textContent)); } catch {}
    }
    const visibleCaptions = new Set(cues.map(cue => cue.text));
    const transcript = candidates.sort((left, right) => {
      const score = lines => lines.filter(line => visibleCaptions.has(line.caption?.trim())).length;
      return score(right) - score(left);
    })[0];
    if (transcript) {
      const timed = transcript.filter(line => line.caption?.trim()).map(line => ({ text: line.caption.trim(), start: line.transcriptStartAt / 1000 }));
      if (timed.filter(cue => visibleCaptions.has(cue.text)).length) {
        cues = timed;
        text = cues.map(cue => cue.text).join('\n');
      }
    }
  }
  if (!text) {
    const tab = [...document.querySelectorAll('[role="tab"]')].find(element => /transcript|文字起こし|トランスクリプト/i.test(element.textContent));
    const panel = tab && document.getElementById(tab.getAttribute('aria-controls'));
    const paragraphs = panel && visible(panel) ? [...panel.querySelectorAll('p')].filter(visible) : [];
    cues = paragraphs.map(element => ({ text: element.innerText.trim(), start: cueTime(element) })).filter(cue => cue.text);
    text = cues.map(cue => cue.text).join('\n');
  }
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  return {
    text,
    cues,
    title: document.querySelector('.classroom-transcript__title')?.innerText.trim()
      || document.querySelector('.classroom-nav__subtitle')?.innerText.trim()
      || document.title.replace(/\s*\|\s*LinkedIn Learning\s*$/, '').trim(),
    url: url.href
  };
})();
