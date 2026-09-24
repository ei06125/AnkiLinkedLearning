import test from 'node:test';
import assert from 'node:assert/strict';

test('clears page highlights when the side panel disconnects', async () => {
  let connectListener;
  let messageListener;
  let disconnectListener;
  let injection;
  globalThis.chrome = {
    sidePanel: { setPanelBehavior() {} },
    runtime: { onConnect: { addListener(listener) { connectListener = listener; } } },
    scripting: { async executeScript(options) { injection = options; } }
  };
  await import(`../../.build/SourceCode/apps/extension/background.js?test=${Date.now()}`);
  connectListener({
    name: 'anki-panel',
    onMessage: { addListener(listener) { messageListener = listener; } },
    onDisconnect: { addListener(listener) { disconnectListener = listener; } }
  });
  messageListener({ type: 'highlight-tab', tabId: 42 });
  await disconnectListener();
  assert.equal(injection.target.tabId, 42);
  assert.equal(typeof injection.func, 'function');
  delete globalThis.chrome;
});
