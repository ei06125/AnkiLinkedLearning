const JISHO_ENDPOINT = 'https://jisho.org/api/v1/search/words';

import type { DictionaryResult } from '../types.js';

interface JishoForm { word?: string; reading?: string }
interface JishoSense { english_definitions?: string[] }
interface JishoEntry { japanese?: JishoForm[]; senses?: JishoSense[] }
interface JishoPayload { data?: JishoEntry[] }
type Fetcher = (url: URL) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

export async function lookupWord(word: string, fetcher: Fetcher = url => fetch(url)): Promise<DictionaryResult | null> {
  const url = new URL(JISHO_ENDPOINT);
  url.searchParams.set('keyword', word);
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Dictionary lookup failed (${response.status}).`);
  const payload = await response.json() as JishoPayload;
  const entries = Array.isArray(payload.data) ? payload.data : [];
  const entry = entries.find(item => item.japanese?.some(form => form.word === word)) || entries[0];
  if (!entry) return null;
  const form = entry.japanese?.find(item => item.word === word) || entry.japanese?.[0];
  const definitions = entry.senses?.flatMap(sense => sense.english_definitions || []) || [];
  return {
    reading: form?.reading || '',
    definitions: [...new Set(definitions)].slice(0, 5)
  };
}
