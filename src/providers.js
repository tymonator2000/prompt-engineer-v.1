// Provider config, chat calls and model listing.
// Default model lists are a fallback; "Update models" replaces them with the provider's live list.

// Only the cheaper tiers: prompt rewriting doesn't need flagship models, so we don't burn
// the user's API budget on them. Each provider has two tiers, cheapest first (the default).
// `match` picks the tier's models out of the provider's live list on "Update models".
export const PROVIDERS = {
  anthropic: {
    name: "Anthropic",
    placeholder: "sk-ant-...",
    keyUrl: "https://platform.claude.com/settings/keys",
    apiHost: "api.anthropic.com",
    tiers: [
      { id: "claude-haiku-5-5", label: "Claude Haiku 5.5", note: "fast, cheapest", match: m => (m.line || m.id).includes("haiku") },
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", note: "better quality", match: m => (m.line || m.id).includes("sonnet") }
    ]
  },
  openai: {
    name: "OpenAI",
    placeholder: "sk-...",
    keyUrl: "https://platform.openai.com/api-keys",
    apiHost: "api.openai.com",
    tiers: [
      { id: "gpt-6-luna", label: "GPT-6 Luna", note: "fast, cheapest", match: m => /^gpt-[\d.]+-luna$/.test(m.id) },
      { id: "gpt-6.1-sol", label: "GPT-6.1 Sol", note: "better quality", match: m => /^gpt-[\d.]+-sol$/.test(m.id) }
    ]
  },
  google: {
    name: "Google",
    placeholder: "AIza...",
    keyUrl: "https://aistudio.google.com/apikey",
    apiHost: "generativelanguage.googleapis.com",
    tiers: [
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite", note: "fast, cheapest", match: m => /^gemini-[\d.]+-flash-lite$/.test(m.id) },
      { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", note: "better quality", match: m => /^gemini-[\d.]+-flash$/.test(m.id) }
    ]
  },
  mistral: {
    name: "Mistral",
    placeholder: "Mistral API key",
    keyUrl: "https://console.mistral.ai/api-keys",
    apiHost: "api.mistral.ai",
    tiers: [
      { id: "mistral-small-4-0-26-03", label: "Mistral Small 4", note: "fast, cheapest", match: m => /^mistral-small-[\d-]+$/.test(m.id) },
      { id: "mistral-medium-3-5-26-04", label: "Mistral Medium 3.5", note: "better quality", match: m => /^mistral-medium-[\d-]+$/.test(m.id) }
    ]
  }
};

export function tierOption(tier, model) {
  const id = model?.id || tier.id;
  // Prefer the API's display name; fall back to our label for the known id, else the raw id.
  const name = model && model.label !== model.id ? model.label : (id === tier.id ? tier.label : id);
  return { id, label: `${name} (${tier.note})` };
}

export function defaultModels(provider) {
  return PROVIDERS[provider].tiers.map(t => tierOption(t));
}

const ANTHROPIC_VERSION = "2023-06-01";

function anthropicHeaders(apiKey) {
  return {
    "content-type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": ANTHROPIC_VERSION,
    // Requests come from the extension page, which Anthropic treats as a browser origin.
    "anthropic-dangerous-direct-browser-access": "true"
  };
}

async function request(provider, url, init) {
  const p = PROVIDERS[provider];
  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    throw new Error(`Could not connect to ${p.apiHost}. Check your connection, VPN or ad blocker.`);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || `HTTP ${res.status}`;
    throw new Error(`${p.name} API error: ${msg}`);
  }
  return data;
}

export async function callLLM({ provider, apiKey, model, messages, systemPrompt }) {
  const p = PROVIDERS[provider];
  if (!apiKey) throw new Error(`Enter your ${p.name} API key in Settings first.`);
  if (!model) throw new Error("Choose or enter a model.");

  let url, headers, body;
  if (provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
    headers = anthropicHeaders(apiKey);
    body = { model, max_tokens: 4096, system: systemPrompt, messages };
  } else if (provider === "openai") {
    url = "https://api.openai.com/v1/responses";
    headers = { "content-type": "application/json", "authorization": `Bearer ${apiKey}` };
    body = {
      model,
      instructions: systemPrompt,
      input: messages.map(m => ({ role: m.role, content: m.content })),
      max_output_tokens: 16000
    };
  } else if (provider === "mistral") {
    url = "https://api.mistral.ai/v1/chat/completions";
    headers = { "content-type": "application/json", "authorization": `Bearer ${apiKey}` };
    body = {
      model,
      max_tokens: 16000,
      messages: [{ role: "system", content: systemPrompt }, ...messages.map(m => ({ role: m.role, content: m.content }))]
    };
  } else {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    headers = { "content-type": "application/json", "x-goog-api-key": apiKey };
    body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: 16000 }
    };
  }

  const data = await request(provider, url, { method: "POST", headers, body: JSON.stringify(body) });

  let text = "";
  if (provider === "anthropic") {
    text = (data.content || []).find(b => b.type === "text")?.text || "";
  } else if (provider === "openai") {
    text = (data.output || [])
      .filter(o => o.type === "message")
      .flatMap(o => o.content || [])
      .filter(c => c.type === "output_text")
      .map(c => c.text).join("");
  } else if (provider === "mistral") {
    const c = data.choices?.[0]?.message?.content;
    text = Array.isArray(c) ? c.filter(x => x.type === "text").map(x => x.text).join("") : (c || "");
  } else {
    text = (data.candidates?.[0]?.content?.parts || [])
      .filter(part => !part.thought && typeof part.text === "string")
      .map(part => part.text).join("");
  }
  if (!text) throw new Error("The model returned no text.");
  return text;
}

// ---------- Model listing ("Update models") ----------

// Fetches the provider's live model list and returns the newest model of each tier,
// as [{ id, label }]. A tier with no match keeps its built-in default.
export async function listModels(provider, apiKey) {
  const p = PROVIDERS[provider];
  if (!apiKey) throw new Error(`${p.name}: no API key.`);
  let models = [];   // { id, label, line?, created }

  if (provider === "anthropic") {
    const data = await request(provider, "https://api.anthropic.com/v1/models?limit=1000", {
      headers: anthropicHeaders(apiKey)
    });
    models = (data.data || []).map(m => ({
      id: m.id, label: m.display_name || m.id, line: m.line || "", created: Date.parse(m.created_at) || 0
    }));
  } else if (provider === "openai") {
    const data = await request(provider, "https://api.openai.com/v1/models", {
      headers: { "authorization": `Bearer ${apiKey}` }
    });
    models = (data.data || []).map(m => ({ id: m.id, label: m.id, created: (m.created || 0) * 1000 }));
  } else if (provider === "google") {
    let pageToken = "";
    do {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
      const data = await request(provider, url, { headers: { "x-goog-api-key": apiKey } });
      for (const m of data.models || []) {
        if (!(m.supportedGenerationMethods || []).includes("generateContent")) continue;
        const id = (m.name || "").replace(/^models\//, "");
        models.push({ id, label: m.displayName || id, created: 0 });
      }
      pageToken = data.nextPageToken || "";
    } while (pageToken);
  } else if (provider === "mistral") {
    const data = await request(provider, "https://api.mistral.ai/v1/models", {
      headers: { "authorization": `Bearer ${apiKey}` }
    });
    const now = Date.now();
    models = (data.data || [])
      .filter(m => m.capabilities?.completion_chat !== false)
      .filter(m => !m.deprecation || Date.parse(m.deprecation) > now)
      .filter(m => !m.archived)
      .map(m => ({ id: m.id, label: m.name || m.id, created: (m.created || 0) * 1000 }));
  }

  // Newest first: by API date, then by id (ids carry version numbers, e.g. gemini-3.8 > gemini-3.5).
  models.sort((a, b) => (b.created - a.created) || b.id.localeCompare(a.id, undefined, { numeric: true }));
  if (!models.length) throw new Error(`${p.name}: the API returned no models.`);
  return p.tiers.map(t => tierOption(t, models.find(t.match)));
}
