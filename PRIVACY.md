# Privacy Policy - Prompt Engineer

Last updated: 2026-10-18

Prompt Engineer is a Chrome extension that rewrites prompts using an AI provider chosen by the user.

## What the extension handles

- **API keys** you enter for Anthropic, OpenAI, Google or Mistral.
- **Prompt text** you type, paste or send from a page via the right-click menu.
- **Settings**: selected provider and model, cached model lists.

## Where it goes

- Prompt text and your API key are sent **only** to the API of the provider you selected (api.anthropic.com, api.openai.com, generativelanguage.googleapis.com or api.mistral.ai), at the moment you click BOOST, Q&A or Update. That provider's own privacy policy applies to that request.
- The extension has **no server of its own**. The developer does not receive, collect, store or sell any of your data.
- No analytics, no tracking, no ads.

## Where it is stored

- API keys: in `chrome.storage.session` (cleared when the browser closes), or in `chrome.storage.local` on your device if you check "Remember keys on this device". Keys are never synced to your Google account.
- Settings and model lists: `chrome.storage.local` on your device.
- Prompt text is not stored by the extension.

You can delete all stored data by removing the extension.

## Contact

Open an issue at https://github.com/tymonator2000/prompt-engineer-v.1/issues
