const audio = new Audio(chrome.runtime.getURL('sounds/codex-notification.wav'));
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.target !== 'audio') return;
  audio.pause();
  audio.currentTime = 0;
  audio.volume = Math.max(0, Math.min(1, Number(message.volume) || 0));
  audio.play().then(() => respond({ ok: true }), error => respond({ ok: false, error: error.message }));
  return true;
});
