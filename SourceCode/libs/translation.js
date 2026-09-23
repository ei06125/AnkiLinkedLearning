const TRANSLATION_ENDPOINT = 'https://api.mymemory.translated.net/get';

export async function translateSentence(sentence, fetcher = fetch) {
  if (new TextEncoder().encode(sentence).length > 500) throw new Error('The sentence is too long for automatic translation.');
  const url = new URL(TRANSLATION_ENDPOINT);
  url.searchParams.set('q', sentence);
  url.searchParams.set('langpair', 'ja|en');
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Translation failed (${response.status}).`);
  const payload = await response.json();
  const status = Number(payload.responseStatus ?? 200);
  const translation = payload.responseData?.translatedText?.trim();
  if (status !== 200 || !translation) throw new Error(payload.responseDetails || 'No translation was returned.');
  return translation;
}
