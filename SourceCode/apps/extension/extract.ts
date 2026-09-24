(() => {
  interface TimedCue { text: string; start: number | null }
  interface EmbeddedCue { transcriptStartAt: number; caption: string }
  const visible = (element: Element) => element.getClientRects().length > 0;
  const cueTime = (element: Element): number | null => {
    const htmlElement = element as HTMLElement;
    const candidates = [
      htmlElement.dataset?.startTime, htmlElement.dataset?.start, htmlElement.dataset?.time,
      element.getAttribute?.('data-start-time'), element.getAttribute?.('data-time'),
      element.querySelector?.('[data-start-time]')?.getAttribute('data-start-time'),
      element.querySelector?.('time')?.getAttribute('datetime')
    ];
    const link = (element.closest?.('a') as HTMLAnchorElement | null)?.href || (element.querySelector?.('a') as HTMLAnchorElement | null)?.href || '';
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
  let cues: TimedCue[] = [];
  for (const selector of selectors) {
    const elements = [...document.querySelectorAll(selector)].filter(visible);
    if (elements.length) {
      cues = elements.map(element => ({ text: (element as HTMLElement).innerText.trim(), start: cueTime(element) })).filter(cue => cue.text);
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
      cues = Array.from(track.cues || []).map(cue => ({ text: (cue as VTTCue).text.replace(/<[^>]+>/g, '').trim(), start: cue.startTime })).filter(cue => cue.text);
      text = cues.map(cue => cue.text).join('\n');
    }
  }
  if (text && !cues.some(cue => cue.start != null)) {
    const candidates: EmbeddedCue[][] = [];
    const visit = (value: unknown): void => {
      if (!value) return;
      if (Array.isArray(value)) {
        if (value.some(item => typeof item === 'object' && item !== null && Number.isFinite((item as Partial<EmbeddedCue>).transcriptStartAt) && typeof (item as Partial<EmbeddedCue>).caption === 'string')) candidates.push(value as EmbeddedCue[]);
        else value.forEach(visit);
        return;
      }
      if (typeof value === 'object') Object.values(value as Record<string, unknown>).forEach(visit);
      else if (typeof value === 'string' && value.includes('transcriptStartAt')) {
        try { visit(JSON.parse(value)); } catch {}
      }
    };
    for (const node of document.querySelectorAll('code')) {
      if (!node.textContent?.includes('transcriptStartAt')) continue;
      try { visit(JSON.parse(node.textContent)); } catch {}
    }
    const visibleCaptions = new Set(cues.map(cue => cue.text));
    const transcript = candidates.sort((left, right) => {
      const score = (lines: EmbeddedCue[]) => lines.filter(line => visibleCaptions.has(line.caption.trim())).length;
      return score(right) - score(left);
    })[0];
    if (transcript) {
      const timed = transcript.filter(line => line.caption.trim()).map(line => ({ text: line.caption.trim(), start: line.transcriptStartAt / 1000 }));
      if (timed.filter(cue => visibleCaptions.has(cue.text)).length) {
        cues = timed;
        text = cues.map(cue => cue.text).join('\n');
      }
    }
  }
  if (!text) {
    const tab = [...document.querySelectorAll('[role="tab"]')].find(element => /transcript|文字起こし|トランスクリプト/i.test(element.textContent));
    const panelId = tab?.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    const paragraphs = panel && visible(panel) ? [...panel.querySelectorAll('p')].filter(visible) : [];
    cues = paragraphs.map(element => ({ text: (element as HTMLElement).innerText.trim(), start: cueTime(element) })).filter(cue => cue.text);
    text = cues.map(cue => cue.text).join('\n');
  }
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  return {
    text,
    cues,
    title: (document.querySelector('.classroom-transcript__title') as HTMLElement | null)?.innerText.trim()
      || (document.querySelector('.classroom-nav__subtitle') as HTMLElement | null)?.innerText.trim()
      || document.title.replace(/\s*\|\s*LinkedIn Learning\s*$/, '').trim(),
    url: url.href
  };
})();
