const TRANSLATION_ENDPOINT = 'https://api.mymemory.translated.net/get';

import type { TranslationResult } from '../types.js';

interface TranslationPayload {
  responseStatus?: number | string;
  responseDetails?: string;
  responseData?: { translatedText?: string };
}
type Fetcher = (url: URL) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

export async function translateSentence(sentence: string, fetcher: Fetcher = url => fetch(url)): Promise<TranslationResult> {
  if (new TextEncoder().encode(sentence).length > 500) throw new Error('The sentence is too long for automatic translation.');
  const url = new URL(TRANSLATION_ENDPOINT);
  url.searchParams.set('q', sentence);
  url.searchParams.set('langpair', 'ja|en');
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Translation failed (${response.status}).`);
  const payload = await response.json() as TranslationPayload;
  const status = Number(payload.responseStatus ?? 200);
  const translation = payload.responseData?.translatedText?.trim();
  if (status !== 200 || !translation) throw new Error(payload.responseDetails || 'No translation was returned.');
  return translation;
}
