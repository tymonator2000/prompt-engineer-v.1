# Chrome Web Store listing (draft)

## Name
Prompt Engineer

## Summary (max 132 chars)
Rewrite your prompts using the official guides from Anthropic, OpenAI, Google and Mistral. Bring your own API key.

## Description
Prompt Engineer turns a rough prompt into one that works, following the official prompting guide of the model you actually use.

• BOOST: one click gives you an improved prompt, the techniques applied and why.
• Q&A: answer 3-5 clarifying questions and get a prompt tailored to your goal, audience and format.
• Provider-specific: Claude prompts follow Anthropic's guide, GPT follows OpenAI's, Gemini follows Google's, Mistral follows Mistral AI's.
• Update models: fetch the current model list from each provider with one click.
• Right-click any selected text → "Improve prompt with Prompt Engineer".
• Keeps your prompt's language.

Bring your own API key. Requests go straight from your browser to the provider - no middleman server, no tracking.

## Category
Productivity (Tools / Developer Tools as alternative)

## Single purpose
Improve the user's AI prompts by sending them to the AI provider the user selects, using that provider's prompting guidelines.

## Permission justifications
- sidePanel: the extension's UI lives in Chrome's side panel so the Q&A conversation stays open while the user browses.
- storage: saves settings, cached model lists and (only if the user opts in) API keys on the user's device.
- contextMenus: adds "Improve prompt with Prompt Engineer" for selected text.
- Host permissions (api.anthropic.com, api.openai.com, generativelanguage.googleapis.com, api.mistral.ai): sends the user's prompt with the user's own API key to the provider the user selected, and fetches that provider's model list.

## Remote code
No. All code ships in the package.

## Data usage disclosures
- Collects: Authentication information (API keys, stored locally only), Website content (only text the user explicitly sends via the context menu).
- Not sold, not used for unrelated purposes, not used for creditworthiness.
- Privacy policy URL: https://github.com/tymonator2000/prompt-engineer-v.1/blob/main/PRIVACY.md

## Assets still needed
- [ ] Screenshots 1280x800 (at least 1, up to 5)
- [ ] Small promo tile 440x280
- [ ] Developer account (one-time 5 USD fee)
