const LINKEDIN_LEARNING_URL = /^https:\/\/([\w-]+\.)?linkedin\.com\/learning\//;

export const isLinkedInLearningUrl = url => LINKEDIN_LEARNING_URL.test(url || '');

export function normalizeLinkedInLearningUrl(url) {
  if (!isLinkedInLearningUrl(url)) return '';
  const normalized = new URL(url);
  normalized.search = '';
  normalized.hash = '';
  return normalized.href;
}

export async function findLinkedInLearningTab(tabsApi) {
  const activeTabs = await tabsApi.query({ active: true, lastFocusedWindow: true });
  const activeLesson = activeTabs.find(tab => isLinkedInLearningUrl(tab.url));
  if (activeLesson) return activeLesson;

  const learningTabs = await tabsApi.query({ url: ['https://linkedin.com/learning/*', 'https://*.linkedin.com/learning/*'] });
  return learningTabs.find(tab => tab.active) || learningTabs[0] || null;
}
