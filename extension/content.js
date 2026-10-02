(() => {
  'use strict';
  // The current ChatGPT interface uses semantic roles rather than the older test IDs.
  const STOP = '[data-testid="stop-button"], button[aria-label="Stop"], button[aria-label="Stop generating"], button[aria-label="Stop streaming"]';
  const STREAM = `${STOP}, .result-streaming, [data-is-streaming="true"], [role="status"][aria-busy="true"]`;
  const SEND = '[data-testid="send-button"], button[aria-label="Send"], button[aria-label="Send prompt"], button[aria-label="Send message"]';
  const RETRY = 'button[aria-label="Regenerate response"], button[aria-label="Regenerate"], button[aria-label="Try again"]';
  const COMPOSER = '#prompt-textarea, textarea, [contenteditable="true"][data-composer-markdown], [contenteditable="true"][role="textbox"]';
  const ASSISTANT = '[data-message-author-role="assistant"], [data-chatgpt-search-unit-key$=":assistant"], [data-markdown-text-style="assistant-message"]';
  document.documentElement.dataset.chatgptChimeVersion = chrome.runtime.getManifest().version;
  const DOT_ICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="23" cy="23" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/></svg>');
  let doneIcon = DOT_ICON;
  const badgeUrls = new Set([DOT_ICON]);
  let path = location.pathname;
  let last = '';
  let active = null;
  let marked = false;
  let tabIndicator = true;
  let timer;
  let icon;
  let attentionRevision = 0;
  const originalIcons = new Map();

  function pageHasAttention() {
    return document.visibilityState === 'visible' && document.hasFocus();
  }
  function clearMark() {
    attentionRevision++;
    if (!marked) return;
    marked = false;
    // Remove our preferred icon BEFORE restoring the originals; otherwise Chrome
    // can retain the removed icon in the tab even though the DOM looks restored.
    icon?.remove();
    icon = null;
    for (const [link, href] of originalIcons) {
      if (badgeUrls.has(link.getAttribute('href'))) {
        if (href === null) link.removeAttribute('href'); else link.setAttribute('href', href);
        // A fresh link also forces Chrome to recompute the displayed favicon.
        if (link.isConnected) link.replaceWith(link.cloneNode(true));
      }
    }
    originalIcons.clear();
  }
  function maintainMark() {
    if (!marked) return;
    // Also cover missed focus events when returning through Chrome's UI.
    if (pageHasAttention()) { clearMark(); return; }
    for (const link of document.querySelectorAll('link[rel~="icon"]')) {
      if (link === icon) continue;
      if (!badgeUrls.has(link.getAttribute('href'))) originalIcons.set(link, link.getAttribute('href'));
      if (link.getAttribute('href') !== doneIcon) link.setAttribute('href', doneIcon);
    }
    if (icon && icon.getAttribute('href') !== doneIcon) icon.href = doneIcon;
  }
  function prepareBadge() {
    const source = document.querySelector('link[rel~="icon"]')?.href;
    if (!source || badgeUrls.has(source)) return;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, 32, 32);
        ctx.beginPath(); ctx.arc(24, 24, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        doneIcon = canvas.toDataURL('image/png');
        badgeUrls.add(doneIcon);
        maintainMark();
      } catch { /* If the favicon disallows canvas access, keep the blue-dot fallback. */ }
    };
    image.src = source;
  }
  function markDone() {
    const revision = attentionRevision;
    document.documentElement.dataset.chatgptChimeCompletedAt = new Date().toISOString();
    chrome.runtime.sendMessage({ target: 'background', type: 'reply-complete' }).then(result => {
      document.documentElement.dataset.chatgptChimeAudio = result?.ok ? (result.muted ? 'muted' : 'played') : 'error';
      // Check actual Chrome tab/window state as well as page focus. Discard a
      // delayed audio reply if the user returned or started another message.
      if (tabIndicator && !result?.attended && revision === attentionRevision && !pageHasAttention()) {
        marked = true;
        maintainMark();
        if (!icon) {
          icon = document.createElement('link');
          icon.rel = 'icon'; icon.href = doneIcon;
          document.head.append(icon);
        }
      }
    }).catch(() => { document.documentElement.dataset.chatgptChimeAudio = 'extension-reload-required'; });
  }
  function visible(element) { return element.getClientRects().length > 0; }
  function snapshot() {
    const messages = document.querySelectorAll(ASSISTANT);
    const message = messages[messages.length - 1];
    const content = message?.querySelector('[data-markdown-text-style="assistant-message"]') || message;
    const text = content?.textContent?.trim() || '';
    // Image-only replies also count, while an empty streaming placeholder does not.
    const media = content?.querySelector('img, video, audio, canvas');
    const identity = message?.closest('[data-chatgpt-selection-message-id], [data-chatgpt-search-message-ids], [data-message-id]');
    const id = identity?.getAttribute('data-chatgpt-selection-message-id') || identity?.getAttribute('data-chatgpt-search-message-ids') || identity?.getAttribute('data-message-id') || messages.length;
    return message && (text || media) ? `${id}|${text}|${media?.getAttribute('src') || (media ? 'media' : '')}` : '';
  }
  function arm({ allowConversationAssignment = true } = {}) {
    clearMark();
    path = location.pathname;
    active = { baseline: snapshot(), changed: false, sawStream: false, started: Date.now(), quietSince: 0, allowConversationAssignment };
  }
  function resetForNavigation() {
    active = null;
    clearMark();
    path = location.pathname;
    last = snapshot();
  }
  function check() {
    const now = Date.now();
    if (location.pathname !== path) {
      // ChatGPT assigns /c/id to a newly submitted conversation during its first reply.
      const assigningNewChat = active?.allowConversationAssignment && !/\/c\//.test(path) && /\/c\//.test(location.pathname);
      path = location.pathname;
      if (!assigningNewChat) resetForNavigation();
      else active.allowConversationAssignment = false;
    }
    const current = snapshot();
    const streaming = [...document.querySelectorAll(STREAM)].some(visible);
    // A loader, hydrated history, or a running chat opened by navigation is not
    // a new request. Only local send/retry actions may arm a notification.
    if (active) {
      if (current && current !== active.baseline) active.changed = true;
      if (streaming) { active.sawStream = true; active.quietSince = 0; }
      else if (active.changed) {
        if (!active.quietSince || current !== last) active.quietSince = now;
        // Avoid chimes between intermediate updates in the same streamed reply.
        if (now - active.quietSince >= 1500) {
          const shouldNotify = current && !active.cancelled;
          active = null;
          if (shouldNotify) markDone();
        }
      } else if (now - active.started > 30000 && !active.sawStream) active = null;
      else if (active.sawStream && !streaming && !active.changed) {
        if (!active.quietSince) active.quietSince = now;
        if (now - active.quietSince >= 5000) active = null;
      }
    }
    last = current;
    maintainMark();
  }
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const link = target?.closest('a[href]');
    if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && link.target !== '_blank' && new URL(link.href, location.href).pathname !== location.pathname) {
      resetForNavigation();
    }
    else if (target?.closest(STOP)) { if (active) active.cancelled = true; clearMark(); }
    else if (target?.closest(SEND) && !target.closest(SEND).matches(':disabled, [aria-disabled="true"]')) arm();
    else if (target?.closest(RETRY)) arm({ allowConversationAssignment: false });
    else clearMark();
  }, true);
  document.addEventListener('submit', event => {
    if (event.target.querySelector(COMPOSER)) arm();
  }, true);
  document.addEventListener('keydown', event => {
    clearMark();
    const composer = event.target.closest?.(COMPOSER);
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && composer && (composer.value || composer.textContent || '').trim()) arm();
  }, true);
  window.addEventListener('popstate', resetForNavigation);
  window.addEventListener('focus', clearMark, true);
  chrome.runtime.onMessage.addListener(message => {
    if (message?.target === 'content' && message.type === 'tab-attended') {
      clearMark();
      document.documentElement.dataset.chatgptChimeClearSource = 'browser-activation';
    }
  });
  document.addEventListener('focusin', clearMark);
  document.addEventListener('pointerdown', clearMark, true);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) clearMark(); });
  last = snapshot();
  chrome.storage.local.get({ tabIndicator: true }).then(settings => {
    tabIndicator = settings.tabIndicator;
    if (!tabIndicator) clearMark();
  }).catch(() => {});
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.tabIndicator) return;
    tabIndicator = changes.tabIndicator.newValue !== false;
    if (!tabIndicator) clearMark();
  });
  prepareBadge();
  new MutationObserver(() => {
    if (!timer) timer = setTimeout(() => { timer = null; check(); }, 80);
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'data-is-streaming', 'data-testid', 'aria-label', 'aria-busy', 'href'] });
  setInterval(check, 750);
  check();
})();
