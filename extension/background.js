const DEFAULTS = { enabled: true, volume: 60 };
let creating;

// Browser-level activation also works when the page misses its focus events.
function clearTabIndicator(tabId) {
  chrome.tabs.sendMessage(tabId, { target: 'content', type: 'tab-attended' }).catch(() => {});
}
chrome.tabs.onActivated.addListener(({ tabId }) => clearTabIndicator(tabId));
chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  chrome.tabs.query({ active: true, windowId }).then(tabs => {
    for (const tab of tabs) if (tab.id != null) clearTabIndicator(tab.id);
  }).catch(() => {});
});
async function tabHasAttention(tabId) {
  if (tabId == null) return false;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.active) return false;
    return (await chrome.windows.get(tab.windowId)).focused;
  } catch { return true; }
}

async function ensureAudioDocument() {
  if (creating) return creating;
  creating = (async () => {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL('offscreen.html')]
    });
    if (!contexts.length) await chrome.offscreen.createDocument({
      url: 'offscreen.html', reasons: ['AUDIO_PLAYBACK'],
      justification: 'Play the locally bundled completion chime when a ChatGPT reply finishes.'
    });
  })();
  try { await creating; } finally { creating = undefined; }
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.target !== 'background') return;
  if (!['reply-complete', 'preview'].includes(message.type)) return;
  (async () => {
    const settings = await chrome.storage.local.get(DEFAULTS);
    const volume = Math.max(0, Math.min(100, Number(settings.volume) || 0)) / 100;
    let audioResult = { ok: true, muted: true };
    if (volume && (message.type === 'preview' || settings.enabled)) {
      try {
        await ensureAudioDocument();
        audioResult = await chrome.runtime.sendMessage({ target: 'audio', volume });
      } catch (error) { audioResult = { ok: false, error: error.message }; }
    }
    return { ...audioResult, attended: await tabHasAttention(sender.tab?.id) };
  })().then(respond, error => respond({ ok: false, error: error.message }));
  return true;
});
