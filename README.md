# ChatGPT Chime

A Chrome extension that plays the original `codex-notification.wav` when a ChatGPT reply finishes and adds a blue dot to the tab icon.

- Volume slider from 0 to 100%, with a preview button.
- Independent switches for sound and the tab indicator.
- Original blue dot (`#3b82f6`), cleared when you return to the tab.
- No notifications from loading old conversations or navigating inside ChatGPT.
- Local preferences; no analytics or conversation uploads.

## Install

1. Download and extract `chatgpt-chime.zip` from [Releases](https://github.com/jellybebra/chatgpt-chime/releases/latest), or clone this repository.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the folder containing `manifest.json`: the extracted ZIP folder, or this repository's `extension` folder.
4. Refresh your open ChatGPT tabs.
5. Pin **ChatGPT Chime** from Chrome's Extensions menu to access the controls.

Chrome 116 or newer is required. Keep the installed folder in place. To update, replace its files, click **Reload** on the extension card, and refresh ChatGPT tabs.

## Behavior

Sending or regenerating a reply in the current tab arms a notification. The extension waits for streaming to stop and the response to settle before playing the sound. Navigating away or stopping generation cancels the pending notification. Opening a conversation that already has a running reply does not arm a notification.

The blue dot marks a reply that finished while the page was not focused. Returning to the tab or Chrome window clears it through Chrome activation events and restores the original favicon. Returning during the completion delay does not recreate the dot. Sound still plays when a reply finishes in a focused tab. If the site's favicon blocks image access, the fallback is a standalone blue dot.

Detection depends on ChatGPT's page markup. Major interface changes or special tool views may require updates. Closed or suspended tabs cannot reliably report completion.

## Privacy and permissions

`storage` saves volume and switch preferences locally. `offscreen` plays the bundled WAV, including for background tabs. Content scripts run only on `chatgpt.com` and the legacy `chat.openai.com` domain.

The latest assistant text is compared in memory to detect changes; it is never transmitted or saved. The extension loads the site's favicon to draw the dot. There are no account credentials, analytics, or external services.

## Development and checks

Plain JavaScript, HTML, and CSS; no build step or runtime dependencies. Load `extension` as an unpacked extension while developing.

`tests/navigation.js` and `tests/focus.js` are Playwright CLI browser-check snippets. Run each in a fresh isolated Chromium profile with the unpacked extension loaded. They intercept page requests and use local fixtures; they never send ChatGPT messages. The snippets were run with `@playwright/cli` 0.1.22:

```sh
npx --yes --package @playwright/cli@0.1.22 playwright-cli -s=chime run-code --filename tests/navigation.js
npx --yes --package @playwright/cli@0.1.22 playwright-cli -s=chime run-code --filename tests/focus.js
```

Navigation checks cover history loading, navigation during generation, sending, regeneration, and new-conversation URL assignment. Focus checks cover the dot's color, background completion, Chrome activation events, favicon restoration, and returning during the completion delay.

Audio playback uses Chrome's [offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen).

## Attribution

This is an unofficial personal extension, not an OpenAI product. The bundled WAV was copied unchanged from the installed desktop app and remains its original owner's asset.
