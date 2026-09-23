const JISHO_ENDPOINT = 'https://jisho.org/api/v1/search/words';

export async function lookupWord(word, fetcher = fetch) {
  const url = new URL(JISHO_ENDPOINT);
  url.searchParams.set('keyword', word);
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Dictionary lookup failed (${response.status}).`);
  const payload = await response.json();
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
