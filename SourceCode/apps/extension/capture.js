export async function captureFreshTranscript(extract, previousText = '', options = {}) {
  const attempts = options.attempts || 20;
  const delay = options.delay || (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
  const previous = previousText.replace(/\s+/gu, ' ').trim();
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const captured = await extract();
    const current = captured?.text?.replace(/\s+/gu, ' ').trim() || '';
    if (current && (!previous || current !== previous)) return captured;
    if (attempt < attempts - 1) await delay(250);
  }
  throw new Error('LinkedIn transcript is still updating. Wait for the new transcript to appear and try again.');
}
