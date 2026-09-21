(() => {
  const visible = element => element.getClientRects().length > 0;
  const selectors = [
    '.classroom-transcript__lines .content-transcript-line',
    '.transcripts__paragraph', '.transcript__paragraph',
    '[data-test-transcript-paragraph]', '[data-test-transcript-cue]',
    '.transcripts__cue', '.transcript-line',
    '[class*="transcript"] [class*="paragraph"]',
    '[class*="transcript"] [class*="cue"]'
  ];
  let text = '';
  for (const selector of selectors) {
    const elements = [...document.querySelectorAll(selector)].filter(visible);
    if (elements.length) {
      text = elements.map(element => element.innerText.trim()).filter(Boolean).join('\n');
      if (text) break;
    }
  }
  if (!text) {
    const tab = [...document.querySelectorAll('[role="tab"]')].find(element => /transcript|文字起こし|トランスクリプト/i.test(element.textContent));
    const panel = tab && document.getElementById(tab.getAttribute('aria-controls'));
    const paragraphs = panel && visible(panel) ? [...panel.querySelectorAll('p')].filter(visible) : [];
    text = paragraphs.map(element => element.innerText.trim()).filter(Boolean).join('\n');
  }
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  return {
    text,
    title: document.querySelector('.classroom-transcript__title')?.innerText.trim()
      || document.querySelector('.classroom-nav__subtitle')?.innerText.trim()
      || document.title.replace(/\s*\|\s*LinkedIn Learning\s*$/, '').trim(),
    url: url.href
  };
})();
