// Provider config, chat calls and model listing.
// Default model lists are a fallback; "Update models" replaces them with the provider's live list.

export const PROVIDERS = {
  anthropic: {
    name: "Anthropic",
    placeholder: "sk-ant-...",
    keyUrl: "https://platform.claude.com/settings/keys",
    apiHost: "api.anthropic.com",
    models: [
      ["claude-sonnet-5-5", "Claude Sonnet 5.5 (recommended)"],
      ["claude-opus-5-5", "Claude Opus 5.5"],
      ["claude-fable-5-1", "Claude Fable 5.1 (most capable, slower)"],
      ["claude-haiku-5-5", "Claude Haiku 5.5 (fastest)"]
    ]
  },
  openai: {
    name: "OpenAI",
    placeholder: "sk-...",
    keyUrl: "https://platform.openai.com/api-keys",
    apiHost: "api.openai.com",
    models: [
      ["gpt-6.1-sol", "GPT-6.1 Sol (balanced)"],
      ["gpt-6-astra", "GPT-6 Astra (most capable)"],
      ["gpt-6-luna", "GPT-6 Luna (cheapest)"]
    ]
  },
  google: {
    name: "Google",
    placeholder: "AIza...",
    keyUrl: "https://aistudio.google.com/apikey",
    apiHost: "generativelanguage.googleapis.com",
    models: [
      ["gemini-3.8-flash", "Gemini 3.8 Flash (latest)"],
      ["gemini-3.7-flash", "Gemini 3.7 Flash"],
      ["gemini-3.5-flash", "Gemini 3.5 Flash"]
    ]
  },
  mistral: {
    name: "Mistral",
    placeholder: "Mistral API key",
    keyUrl: "https://console.mistral.ai/api-keys",
    apiHost: "api.mistral.ai",
    models: [
      ["mistral-medium-3-5-26-04", "Mistral Medium 3.5 (flagship)"],
      ["mistral-small-4-0-26-03", "Mistral Small 4 (fast, cheap)"],
      ["mistral-large-3-25-12", "Mistral Large 3 (open-weight)"]
    ]
  }
};

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

// OpenAI's /v1/models returns every model type; keep only text chat models.
const OPENAI_EXCLUDE = /(embed|tts|whisper|dall-e|image|audio|realtime|transcribe|moderation|search|instruct|davinci|babbage|codex|computer-use|sora)/i;
const GOOGLE_EXCLUDE = /(embed|tts|image|aqa|live|native-audio|imagen|veo)/i;

// Returns [{ id, label, created }] sorted newest first.
export async function listModels(provider, apiKey) {
  const p = PROVIDERS[provider];
  if (!apiKey) throw new Error(`${p.name}: no API key.`);
  let models = [];

  if (provider === "anthropic") {
    const data = await request(provider, "https://api.anthropic.com/v1/models?limit=1000", {
      headers: anthropicHeaders(apiKey)
    });
    models = (data.data || []).map(m => ({
      id: m.id, label: m.display_name || m.id, created: Date.parse(m.created_at) || 0
    }));
  } else if (provider === "openai") {
    const data = await request(provider, "https://api.openai.com/v1/models", {
      headers: { "authorization": `Bearer ${apiKey}` }
    });
    models = (data.data || [])
      .filter(m => /^(gpt-|o\d|chatgpt-)/i.test(m.id) && !OPENAI_EXCLUDE.test(m.id))
      .map(m => ({ id: m.id, label: m.id, created: (m.created || 0) * 1000 }));
  } else if (provider === "google") {
    let pageToken = "";
    do {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
      const data = await request(provider, url, { headers: { "x-goog-api-key": apiKey } });
      for (const m of data.models || []) {
        const id = (m.name || "").replace(/^models\//, "");
        if (!/^gemini/i.test(id) || GOOGLE_EXCLUDE.test(id)) continue;
        if (!(m.supportedGenerationMethods || []).includes("generateContent")) continue;
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
      .map(m => ({ id: m.id, label: m.name && m.name !== m.id ? `${m.name} (${m.id})` : m.id, created: (m.created || 0) * 1000 }));
  }

  // Dedupe by id. Sort: newest first when the API gives dates, otherwise by id descending
  // (provider ids carry version numbers, so this roughly puts newer versions first).
  const seen = new Set();
  models = models.filter(m => !seen.has(m.id) && seen.add(m.id));
  models.sort((a, b) => (b.created - a.created) || b.id.localeCompare(a.id, undefined, { numeric: true }));
  if (!models.length) throw new Error(`${p.name}: the API returned no chat models.`);
  return models;
}
