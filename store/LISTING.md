# Chrome Web Store submission

## Listing

Name: ChatGPT Chime

Language: English

Category: Productivity / Tools (use the corresponding option available in the dashboard)

Summary: A completion chime and blue dot on the ChatGPT tab icon, with adjustable volume.

Description:

Know when a ChatGPT reply is ready. ChatGPT Chime plays a short sound when a reply you start finishes and adds a blue dot to the tab icon when you are away from that tab.

- Adjust the volume from 0 to 100% and preview the sound.
- Turn the completion sound and blue tab indicator on or off independently.
- The blue dot clears when you return to the tab.
- Opening saved conversations does not trigger a completion alert.
- Preferences are stored locally. No developer backend, analytics, or conversation uploads.

To detect completion, the extension compares the latest assistant reply and observes generation and navigation events locally in your browser. Reply text is held temporarily in memory, never saved as a conversation archive or sent to the developer. The extension may reload the page's favicon to draw the blue dot.

Works on chatgpt.com and the legacy chat.openai.com domain. Requires Chrome 116 or newer. After installation, refresh your existing ChatGPT tabs and pin the extension to access its controls.

Detection depends on ChatGPT's interface. Closed or suspended tabs, special response views, or future site changes may prevent notifications.

This is an independent extension, not affiliated with or endorsed by OpenAI.

Homepage: https://github.com/jellybebra/chatgpt-chime

Support: https://github.com/jellybebra/chatgpt-chime/issues

Privacy policy: https://github.com/jellybebra/chatgpt-chime/blob/main/PRIVACY.md

Terms: https://github.com/jellybebra/chatgpt-chime/blob/main/TERMS.md

## Privacy fields

Single purpose: Notify the user when a ChatGPT reply they started finishes, using a local completion sound and a blue tab indicator.

storage justification: Save only the user's volume, sound switch, and tab-indicator switch in chrome.storage.local. These preferences are not synced or transmitted.

offscreen justification: Use a local offscreen document with AUDIO_PLAYBACK to play the bundled completion sound, including when the ChatGPT tab is in the background, and to preview the sound from the popup.

Site access justification: Content scripts run only on chatgpt.com and chat.openai.com to detect send/regenerate/stop actions and reply completion, and to update the tab favicon. The latest assistant reply, message identifiers, media presence/source attributes, navigation path, and interaction state are processed temporarily on the device. No conversation content is transmitted to the developer.

Remote code: No. All JavaScript and audio are bundled. The optional page-favicon image request does not load executable code.

Data disclosure: Disclose local handling of website content (including assistant text), personal communications represented in that content, website navigation paths, and user activity (send/regenerate/stop, keyboard and focus events). Do not claim that the extension never reads website content. The data is used only for the stated completion-notification purpose; no conversation data is persisted or sent to the developer. Match these facts to the current dashboard's data-category labels.

Limited Use declarations: Data is not sold or transferred to third parties; is not used or transferred for purposes unrelated to the extension's single purpose; and is not used or transferred to determine creditworthiness or for lending purposes. The favicon request and voluntarily opened support links are disclosed in the privacy policy.

## Reviewer instructions

1. Install the package in Chrome 116 or newer. Open or refresh ChatGPT and sign in using your own ChatGPT account. The extension has no separate account or paywall.
2. Open the popup, leave volume at 60%, and click Preview sound. Toggle sound and the blue tab indicator independently.
3. Start a normal text reply on ChatGPT. Leave the tab while the reply generates. After generation and a short settling delay, a chime should play and the tab favicon should show a blue dot.
4. Return to the tab; the dot clears. A reply completed while the tab is focused plays sound without leaving an unread dot.
5. Open existing conversations or navigate away while a reply is generating. These actions should not produce a new completion alert. Stopping generation cancels its alert.
6. Set volume to zero and preview: the popup explains that the sound is muted. Restore volume afterward.

## Assets and release

- Store icon: extension/icons/128.png.
- ZIP: run `python3 scripts/package.py /absolute/path/to/chatgpt-chime-1.0.6.zip`.
- At least one actual extension screenshot is required: 1280×800 or 640×400 PNG/JPEG. Capture the popup in a browser with no private conversation visible.
- A 440×280 promotional image is recommended.
- Distribution: free, public. Check the developer account's current regional and account eligibility in the dashboard before submission.
- Uploading a package is not publication. Verify Submit for review succeeds and record the item ID, review status, and eventual public listing URL.
