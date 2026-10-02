const enabled = document.getElementById('enabled');
const tabIndicator = document.getElementById('tabIndicator');
const volume = document.getElementById('volume');
const level = document.getElementById('level');
const statusMessage = document.getElementById('status');
const preview = document.getElementById('preview');
let saving = Promise.resolve();
function showStatus(message = '') {
  statusMessage.textContent = message;
  statusMessage.hidden = !message;
}
function showVolume() {
  level.value = `${volume.value}%`;
  volume.setAttribute('aria-valuetext', `${volume.value} percent`);
}
function save() {
  const settings = { enabled: enabled.checked, volume: Number(volume.value), tabIndicator: tabIndicator.checked };
  saving = saving.catch(() => {}).then(() => chrome.storage.local.set(settings));
  saving.then(() => showStatus(), () => showStatus('Could not save. Please reopen the popup.'));
}
enabled.addEventListener('change', save);
tabIndicator.addEventListener('change', save);
volume.addEventListener('input', () => { showVolume(); save(); });
preview.addEventListener('click', async () => {
  preview.disabled = true;
  try {
    await saving;
    const result = await chrome.runtime.sendMessage({ target: 'background', type: 'preview' });
    if (!result?.ok) throw new Error(result?.error || 'Audio unavailable');
    showStatus(result.muted ? 'Volume is at 0%. Turn it up to hear the chime.' : '');
  } catch { showStatus('Could not play the sound. Reload the extension and try again.'); }
  finally { preview.disabled = false; }
});
chrome.storage.local.get({ enabled: true, volume: 60, tabIndicator: true }).then(settings => {
  enabled.checked = settings.enabled;
  tabIndicator.checked = settings.tabIndicator;
  volume.value = settings.volume;
  showVolume();
}).catch(() => showStatus('Could not load settings. Please reopen the popup.'));
