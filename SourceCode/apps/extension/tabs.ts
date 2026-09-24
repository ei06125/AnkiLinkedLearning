const LINKEDIN_LEARNING_URL = /^https:\/\/([\w-]+\.)?linkedin\.com\/learning\//;

export const isLinkedInLearningUrl = (url?: string) => LINKEDIN_LEARNING_URL.test(url || '');

export function normalizeLinkedInLearningUrl(url?: string): string {
  if (!isLinkedInLearningUrl(url)) return '';
  const normalized = new URL(url!);
  normalized.search = '';
  normalized.hash = '';
  return normalized.href;
}

export function linkedInLearningVideoId(url?: string): string {
  if (!isLinkedInLearningUrl(url)) return '';
  const match = new URL(url!).pathname.match(/^\/learning\/[^/]+\/(\d+)\/?$/);
  return match?.[1] || '';
}

export const linkedInLearningVideoChanged = (currentUrl?: string, nextUrl?: string) => {
  const current = linkedInLearningVideoId(currentUrl);
  const next = linkedInLearningVideoId(nextUrl);
  return Boolean(current && next && current !== next);
};

interface TabsApi {
  query(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]>;
}

export async function findLinkedInLearningTab(tabsApi: TabsApi): Promise<chrome.tabs.Tab | null> {
  const activeTabs = await tabsApi.query({ active: true, lastFocusedWindow: true });
  const activeLesson = activeTabs.find(tab => isLinkedInLearningUrl(tab.url));
  if (activeLesson) return activeLesson;

  const learningTabs = await tabsApi.query({ url: ['https://linkedin.com/learning/*', 'https://*.linkedin.com/learning/*'] });
  return learningTabs.find(tab => tab.active) || learningTabs[0] || null;
}
