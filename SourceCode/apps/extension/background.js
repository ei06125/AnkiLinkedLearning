import { clearTranscriptHighlights } from './highlight.js';

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'anki-panel') return;
  let highlightedTabId;
  port.onMessage.addListener(message => {
    if (message?.type === 'highlight-tab') highlightedTabId = message.tabId;
  });
  port.onDisconnect.addListener(async () => {
    if (!Number.isInteger(highlightedTabId)) return;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: highlightedTabId },
        func: clearTranscriptHighlights
      });
    } catch {}
  });
});
