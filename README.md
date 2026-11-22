# ⚔️ Arkanum (Chrome Extension)

Pikselowa wtyczka do panelu bocznego Chrome (Side Panel) ulepszająca prompty na podstawie **oficjalnych wytycznych inżynierii promptów**: Anthropic (Claude), OpenAI (GPT), Google (Gemini) oraz Mistral. Bring your own API key. Bez backendu.

## Funkcje

- **🔥 RZUĆ ZAKLĘCIE (BOOST)**: jedno kliknięcie przepisuje prompt, wskazując zastosowane techniki i uzasadnienie.
- **💬 DIALOG (Q&A)**: model zadaje kilka pytań uściślających, po czym generuje finalny manuskrypt promptu.
- **Wytyczne dostawców**: reguły bazujące na oficjalnych przewodnikach inżynierii promptów (Claude → Anthropic, GPT → OpenAI, Gemini → Google, Mistral → Mistral AI).
- **Retro Pixel Art GUI**: unikalny interfejs w mrocznej stylistyce czerwieni i czerni z pikselowym czarodziejem i jego pomocnikami.
- **UPDATE modeli**: automatyczna weryfikacja i aktualizacja listy najnowszych modeli dostawców.
- **Prywatność**: zapytania wysyłane są bezpośrednio z przeglądarki do API dostawców.

## Instalacja w Chrome (Deweloperska)

1. Przejdź do `chrome://extensions` w przeglądarce Chrome.
2. Włącz **Tryb dewelopera** (Developer mode) w prawym górnym rogu.
3. Kliknij **Załaduj rozpakowane** (Load unpacked) i wskaż folder `src/`.
4. Kliknij ikonę Arkanum na pasku rozszerzeń, aby otworzyć panel boczny.

## Budowanie paczki do Chrome Web Store

```bash
./scripts/package.sh
```

Tworzy archiwum `dist/arkanum-<version>.zip`.
