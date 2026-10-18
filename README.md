# ⚡ Prompt Engineer (Chrome extension)

A Chrome side-panel extension that rewrites your prompts using the **official prompting guide of the provider you pick**: Anthropic (Claude), OpenAI (GPT), Google (Gemini) or Mistral. Bring your own API key. No backend.

Web version (single HTML file): [tymonator2000/prompt-engineer](https://github.com/tymonator2000/prompt-engineer).

## Features

- **🚀 BOOST**: one click gives you an improved prompt, the techniques applied and a short rationale.
- **💬 Q&A**: the model asks 3-5 clarifying questions, then **Generate final prompt** builds a version tailored to your answers.
- **Provider-specific guidance**: the rewrite follows the guide of the selected model's provider (Claude → Anthropic, GPT → OpenAI, Gemini → Google, Mistral → Mistral AI). See `src/guides.js`.
- **Cheap models only**: prompt rewriting doesn't need flagship models, so each provider offers just two tiers (cheapest is the default):

  | Provider | Fast, cheapest | Better quality |
  |---|---|---|
  | Anthropic | Claude Haiku 5.5 | Claude Sonnet 5.5 |
  | OpenAI | GPT-6 Luna | GPT-6.1 Sol |
  | Google | Gemini 3.5 Flash-Lite | Gemini 3.8 Flash |
  | Mistral | Mistral Small 4 | Mistral Medium 3.5 |

  "Other (enter ID)" is still there if you really want a different model.
- **↻ Update models**: checks every provider you have a key for and swaps in the newest version of each tier (e.g. a future Haiku 6). Flagship models are never added.
- **Right-click → Improve prompt with Prompt Engineer**: sends selected text on any page to the side panel.
- The prompt keeps its original language (Polish stays Polish). The interface is in English.

## Install (development)

1. `chrome://extensions` → turn on **Developer mode**.
2. **Load unpacked** → choose the `src/` folder.
3. Click the toolbar icon to open the side panel.

## Package for the Chrome Web Store

```bash
./scripts/package.sh
```

This creates `dist/prompt-engineer-<version>.zip` from `src/`. Store listing copy and permission justifications are in `store/`.

## Guides

| Provider | Source | Retrieved |
|---|---|---|
| Anthropic | [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | 2026-10-18 |
| OpenAI | [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering) | 2026-10-18 |
| Google | [Prompt design strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies) | 2026-10-18 |
| Mistral | [Prompting](https://docs.mistral.ai/inference/prompting) | 2026-10-18 |

Guides change rarely, so they ship with the extension and are refreshed by hand with each release. "Update models" refreshes model lists only.

## Keys and privacy

- Requests go **directly from your browser** to the provider's API. There is no intermediate server.
- By default keys live in `chrome.storage.session` and are cleared when the browser closes.
- **Remember keys on this device** stores them in `chrome.storage.local` (never `sync`, so they don't leave the device).
- Anthropic requests include the `anthropic-dangerous-direct-browser-access` header, because calls are made from the extension page.
- See [PRIVACY.md](PRIVACY.md).

## Project structure

```
src/
  manifest.json     # MV3 manifest
  background.js     # side panel behaviour + context menu
  sidepanel.html/css/js
  providers.js      # provider config, chat calls, model listing
  guides.js         # provider-specific guidance (from official docs)
  prompts.js        # system prompts (BOOST, Q&A, finalize)
  storage.js        # chrome.storage wrapper
  icons/
store/              # Web Store listing copy
scripts/package.sh  # builds the upload zip
```

## Adding a provider

1. Add an entry to `PROVIDERS` in `providers.js` (with its two `tiers`) and branches in `callLLM` and `listModels`.
2. Add its guide to `GUIDES` in `guides.js`.
3. Add an `<option>` to `#providerSelect`, a key slot in `state.keys` / `state.modelByProvider`, and its API host to `host_permissions` in `manifest.json`.
