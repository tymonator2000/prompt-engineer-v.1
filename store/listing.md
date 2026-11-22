# Chrome Web Store listing (draft)

## Name
Arkanum

## Summary (max 132 chars)
Pikselowa Księga Zaklęć Promptowych. Ulepszaj prompty według oficjalnych wytycznych Anthropic, OpenAI, Google i Mistral.

## Description
Arkanum zamienia surowy prompt w precyzyjną formułę, bazując na oficjalnych przewodnikach inżynierii promptów od dostawców modeli (Anthropic, OpenAI, Google, Mistral).

• RZUĆ ZAKLĘCIE (BOOST): natychmiastowa optymalizacja promptu z listą zastosowanych technik.
• DIALOG (Q&A): krótka sesja doprecyzowująca cel, odbiorcę i strukturę wyjściową.
• Przewodniki dostawców: reguły dopasowane do Claude (Anthropic), GPT (OpenAI), Gemini (Google) i Mistral.
• UPDATE modeli: pobieranie najnowszych dostępnych wersji jednym kliknięciem.
• Menu kontekstowe: zaznacz dowolny tekst na stronie i kliknij „Ulepsz prompt w Arkanum”.
• Styl retro: mroczna estetyka pikselowa w barwach czerwieni i czerni z czarodziejem Arkanum.
• Prywatność: zapytania idą bezpośrednio z Twojej przeglądarki do dostawcy – bez zewnętrznych serwerów i telemetrii.

## Category
Productivity (Tools / Developer Tools)

## Single purpose
Improve the user's AI prompts directly from Chrome's side panel using official prompting best practices and user-provided API keys.

## Permission justifications
- sidePanel: the extension's UI lives in Chrome's side panel so the prompt workspace stays open while browsing.
- storage: saves settings, cached model lists and (optionally) encrypted local API keys on the user's device.
- contextMenus: adds "Ulepsz prompt w Arkanum" for selected text on any web page.
- Host permissions (api.anthropic.com, api.openai.com, generativelanguage.googleapis.com, api.mistral.ai): sends the user's prompt directly to the selected provider with the user's own key.

## Remote code
No. All code ships in the package.

## Data usage disclosures
- Collects: Authentication information (API keys, stored locally only), Website content (only text explicitly sent via context menu).
- Not sold, not used for unrelated purposes.
- Privacy policy URL: https://github.com/tymonator2000/prompt-engineer-v.1/blob/main/PRIVACY.md
