# ChatGPT Chime — Privacy Policy

Effective date: October 28, 2026

ChatGPT Chime is an independent browser extension maintained by [jellybebra](https://github.com/jellybebra). It plays a completion sound and marks the browser tab when a ChatGPT reply finishes. It is not affiliated with or endorsed by OpenAI.

## Data processed on your device

The extension runs only on `https://chatgpt.com/*` and `https://chat.openai.com/*`. To detect completion, it reads the latest assistant reply text, message identifiers, the presence and source attributes of media, and the page's generation controls. It observes send, regenerate, stop, keyboard, focus, and navigation events. When Enter is pressed in the message composer, it checks whether the composer contains text; it does not save or transmit that text.

Reply snapshots, the current page path, and completion state are held temporarily in page memory. The extension uses the active-tab and focused-window state to clear the blue dot. It does not maintain a browsing-history log or access pages on other websites. It does not access passwords, authentication cookies, account credentials, or payment details.

## Local settings and retention

Volume, sound enabled/disabled, and tab-indicator enabled/disabled settings are saved using `chrome.storage.local`, not Chrome Sync. They remain in the browser profile until changed or the extension is uninstalled. Temporary reply snapshots are discarded as the page state changes or the page is unloaded. No conversation archive is stored.

You can change the settings in the extension popup. Closing or reloading the ChatGPT tab clears that page's in-memory state. Uninstalling the extension removes its locally stored preferences.

## Network requests and third parties

The extension has no developer-operated backend, telemetry, advertising, analytics, or remote executable code. It does not send prompts, replies, settings, or browsing activity to the developer or other recipients, and does not sell or share them.

To draw the blue dot, the extension may reload the favicon URL already provided by the ChatGPT page. The server hosting that icon can receive an ordinary image request, including normal network metadata such as an IP address and browser-provided request headers. No conversation text is added to this request. The completion audio is bundled with the extension and plays locally.

Opening the project's policy or support links visits GitHub, which handles that visit under [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement). ChatGPT itself is a separate service governed by its own policies.

## Limited use

Information handled by ChatGPT Chime is used only to provide its completion sound, tab indicator, and settings. It is not used for advertising, profiling, creditworthiness, lending, or unrelated purposes. The extension's use of information complies with the Chrome Web Store User Data Policy, including its Limited Use requirements.

## Contact and changes

For privacy questions, contact the maintainer through [the project's support page](https://github.com/jellybebra/chatgpt-chime/issues). GitHub issues are public: do not include private conversations, credentials, or other sensitive information. Information you voluntarily submit there is separate from extension data processing.

Updates to this policy will be published here with a new effective date.
