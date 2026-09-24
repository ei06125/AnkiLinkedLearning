import { clearTranscriptHighlights } from './highlight.js';

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'anki-panel') return;
  let highlightedTabId: number | undefined;
  port.onMessage.addListener(message => {
    if (message?.type === 'highlight-tab') highlightedTabId = message.tabId;
  });
  port.onDisconnect.addListener(async () => {
    const tabId = highlightedTabId;
    if (tabId === undefined || !Number.isInteger(tabId)) return;
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: clearTranscriptHighlights
      });
    } catch {}
  });
});
