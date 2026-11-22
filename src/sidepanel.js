import { PROVIDERS, callLLM, listModels, defaultModels } from "./providers.js";
import { GUIDES } from "./guides.js";
import { boostSystemPrompt, qaSystemPrompt, FINALIZE_INSTRUCTION } from "./prompts.js";
import { local, session, read, onSessionChange } from "./storage.js";

const $ = (id) => document.getElementById(id);

const promptInput = $("promptInput");
const charCount = $("charCount");
const banner = $("banner");
const providerSelect = $("providerSelect");
const modelSelect = $("modelSelect");
const customModelField = $("customModelField");
const customModel = $("customModel");
const apiKeyInput = $("apiKey");
const rememberKey = $("rememberKey");

// ---------- State ----------
// keys: in chrome.storage.session by default (cleared when the browser closes),
// in chrome.storage.local only when "Remember keys" is checked.
const state = {
  provider: "anthropic",
  keys: { anthropic: "", openai: "", google: "", mistral: "" },
  modelByProvider: { anthropic: "", openai: "", google: "", mistral: "" },
  customModel: "",
  remember: false,
  modelLists: {}   // provider -> { models: [{id, label}], updatedAt }
};
let qaHistory = [];

async function loadState() {
  const settings = await read(local, "settings", {});
  if (PROVIDERS[settings.provider]) state.provider = settings.provider;
  Object.assign(state.modelByProvider, settings.modelByProvider || {});
  state.customModel = settings.customModel || "";
  state.remember = !!settings.remember;
  state.modelLists = await read(local, "modelTiers", {});
  const keys = await read(state.remember ? local : session, "keys", {});
  Object.assign(state.keys, keys);
}

async function saveState() {
  captureCurrent();
  await local.set({
    settings: {
      provider: state.provider,
      modelByProvider: state.modelByProvider,
      customModel: state.customModel,
      remember: state.remember
    }
  });
  await session.set({ keys: state.keys });
  if (state.remember) await local.set({ keys: state.keys });
  else await local.remove("keys");
}

function captureCurrent() {
  state.keys[state.provider] = apiKeyInput.value.trim();
  state.modelByProvider[state.provider] = modelSelect.value;
  state.customModel = customModel.value.trim();
  state.remember = rememberKey.checked;
}

// ---------- Rendering ----------
function modelsFor(provider) {
  const live = state.modelLists[provider];
  return live?.models?.length ? live.models : defaultModels(provider);
}

function timeAgo(ts) {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

function renderProviderUI() {
  const provider = state.provider;
  const p = PROVIDERS[provider];
  const g = GUIDES[provider];

  modelSelect.innerHTML = "";
  for (const { id, label } of modelsFor(provider)) modelSelect.add(new Option(label, id));
  modelSelect.add(new Option("Other (enter ID)", "__custom__"));
  const saved = state.modelByProvider[provider];
  const valid = saved && [...modelSelect.options].some(o => o.value === saved);
  modelSelect.value = valid ? saved : modelSelect.options[0].value;
  customModelField.classList.toggle("hidden", modelSelect.value !== "__custom__");

  const live = state.modelLists[provider];
  $("modelMeta").textContent = live?.updatedAt
    ? `Latest versions from ${p.name}, checked ${timeAgo(live.updatedAt)}.`
    : "Built-in list. Click Update to check for newer versions.";

  apiKeyInput.value = state.keys[provider] || "";
  apiKeyInput.placeholder = p.placeholder;
  $("keyLabel").textContent = `${p.name} API key`;

  const hint = $("keyHint");
  hint.textContent = "";
  hint.append("Get a key at ");
  const a = document.createElement("a");
  a.href = p.keyUrl; a.target = "_blank"; a.rel = "noopener";
  a.textContent = new URL(p.keyUrl).host + new URL(p.keyUrl).pathname;
  hint.append(a, `. It is sent only to ${p.apiHost}. Without "Remember", keys are forgotten when you close the browser.`);

  const note = $("guideNote");
  note.textContent = "";
  note.append(`Prompts are rewritten using ${g.name}'s official guide: `);
  const ga = document.createElement("a");
  ga.href = g.url; ga.target = "_blank"; ga.rel = "noopener";
  ga.textContent = g.title;
  note.append(ga, ".");
}

function showBanner(msg, type = "error") {
  banner.textContent = msg;
  banner.className = `banner ${type}`;
}
function hideBanner() {
  banner.className = "banner";
  banner.textContent = "";
}

function setBusy(btn, busy, label) {
  btn.disabled = busy;
  if (busy) {
    btn.textContent = "";
    const s = document.createElement("span");
    s.className = "spinner";
    btn.append(s, " Working...");
  } else {
    btn.textContent = label;
  }
}

function updateCharCount() {
  charCount.textContent = `${promptInput.value.length} characters`;
}

// ---------- Settings events ----------
providerSelect.addEventListener("change", async () => {
  captureCurrent();
  state.provider = providerSelect.value;
  renderProviderUI();
  await saveState();
});
modelSelect.addEventListener("change", () => {
  customModelField.classList.toggle("hidden", modelSelect.value !== "__custom__");
  saveState();
});
customModel.addEventListener("change", saveState);
apiKeyInput.addEventListener("change", saveState);
rememberKey.addEventListener("change", saveState);
$("toggleKey").addEventListener("click", () => {
  apiKeyInput.type = apiKeyInput.type === "password" ? "text" : "password";
});

promptInput.addEventListener("input", updateCharCount);
$("clearPrompt").addEventListener("click", () => {
  promptInput.value = "";
  updateCharCount();
});

// ---------- Update models ----------
$("updateModels").addEventListener("click", async () => {
  hideBanner();
  captureCurrent();
  const withKeys = Object.keys(PROVIDERS).filter(id => state.keys[id]);
  if (!withKeys.length) {
    showBanner("Add at least one API key first. Models are listed per provider using its key.");
    return;
  }
  const btn = $("updateModels");
  setBusy(btn, true, "UPDATE");
  const results = await Promise.allSettled(withKeys.map(id => listModels(id, state.keys[id])));
  const ok = [], failed = [];
  results.forEach((r, i) => {
    const id = withKeys[i];
    if (r.status === "fulfilled") {
      state.modelLists[id] = { models: r.value, updatedAt: Date.now() };
      ok.push(PROVIDERS[id].name);
    } else {
      failed.push(r.reason?.message || PROVIDERS[id].name);
    }
  });
  await local.set({ modelTiers: state.modelLists });
  setBusy(btn, false, "UPDATE");
  renderProviderUI();
  await saveState();

  const skipped = Object.keys(PROVIDERS).filter(id => !state.keys[id]).map(id => PROVIDERS[id].name);
  const parts = [];
  if (ok.length) parts.push(`Updated: ${ok.join(", ")}.`);
  if (skipped.length) parts.push(`Skipped (no key): ${skipped.join(", ")}.`);
  if (failed.length) parts.push(`Failed: ${failed.join(" | ")}`);
  showBanner(parts.join(" "), failed.length && !ok.length ? "error" : "info");
});

// ---------- LLM helpers ----------
function getModel() {
  return modelSelect.value === "__custom__" ? customModel.value.trim() : modelSelect.value;
}

function ask(messages, systemPrompt) {
  captureCurrent();
  return callLLM({
    provider: state.provider,
    apiKey: state.keys[state.provider],
    model: getModel(),
    messages,
    systemPrompt
  });
}

function parseJsonResult(raw) {
  let cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(cleaned);
  } catch {
    return { improved_prompt: raw, techniques_applied: [], notes: "(Could not parse a structured response - showing the raw text.)" };
  }
}

function renderBoostResult(parsed) {
  const content = $("boostContent");
  content.textContent = "";
  const block = document.createElement("div");
  block.className = "result-block";
  block.textContent = parsed.improved_prompt || "";
  const badges = document.createElement("div");
  badges.style.marginTop = "10px";
  for (const t of parsed.techniques_applied || []) {
    const b = document.createElement("span");
    b.className = "badge";
    b.textContent = t;
    badges.append(b);
  }
  content.append(block, badges);
  if (parsed.notes) {
    const n = document.createElement("div");
    n.className = "notes";
    n.textContent = parsed.notes;
    content.append(n);
  }
  $("boostCard").classList.remove("hidden");
  $("boostCard").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

$("copyBoost").addEventListener("click", () => {
  const block = $("boostContent").querySelector(".result-block");
  if (!block) return;
  navigator.clipboard.writeText(block.textContent).then(() => {
    $("copyBoost").textContent = "Skopiowano ✓";
    setTimeout(() => $("copyBoost").textContent = "KOPIUJ", 1500);
  });
});

// ---------- BOOST ----------
$("boostBtn").addEventListener("click", async () => {
  hideBanner();
  const prompt = promptInput.value.trim();
  if (!prompt) { showBanner("Wpisz najpierw prompt do ulepszenia."); return; }
  $("qaCard").classList.add("hidden");
  const btn = $("boostBtn");
  setBusy(btn, true, "RZUĆ ZAKLĘCIE (BOOST)");
  try {
    const raw = await ask(
      [{ role: "user", content: `Here is my current prompt to improve:\n\n"""\n${prompt}\n"""` }],
      boostSystemPrompt(state.provider)
    );
    renderBoostResult(parseJsonResult(raw));
  } catch (e) {
    showBanner(e.message);
  } finally {
    setBusy(btn, false, "RZUĆ ZAKLĘCIE (BOOST)");
  }
});

// ---------- Q&A ----------
function appendBubble(role, text) {
  const div = document.createElement("div");
  div.className = `bubble ${role}`;
  div.textContent = text;
  $("chatContainer").appendChild(div);
  $("chatContainer").scrollTop = $("chatContainer").scrollHeight;
}

function thinkingBubble() {
  const div = document.createElement("div");
  div.className = "bubble assistant";
  const s = document.createElement("span");
  s.className = "spinner";
  div.append(s);
  $("chatContainer").appendChild(div);
  $("chatContainer").scrollTop = $("chatContainer").scrollHeight;
  return div;
}

$("qaBtn").addEventListener("click", async () => {
  hideBanner();
  const prompt = promptInput.value.trim();
  if (!prompt) { showBanner("Enter a prompt to start a Q&A session."); return; }
  $("boostCard").classList.add("hidden");
  $("qaCard").classList.remove("hidden");
  $("chatContainer").textContent = "";
  qaHistory = [{
    role: "user",
    content: `Here is my draft prompt:\n\n"""\n${prompt}\n"""\n\nAsk me questions so you understand the context and what the output should be.`
  }];
  appendBubble("user", "Starting a Q&A session for the prompt above.");
  const btn = $("qaBtn");
  setBusy(btn, true, "DIALOG (Q&A)");
  const thinking = thinkingBubble();
  try {
    const raw = await ask(qaHistory, qaSystemPrompt(state.provider));
    qaHistory.push({ role: "assistant", content: raw });
    appendBubble("assistant", raw);
  } catch (e) {
    showBanner(e.message);
  } finally {
    thinking.remove();
    setBusy(btn, false, "DIALOG (Q&A)");
  }
  $("qaCard").scrollIntoView({ behavior: "smooth", block: "nearest" });
});

async function sendChatTurn(userMessage, { finalize = false } = {}) {
  hideBanner();
  const history = [...qaHistory, { role: "user", content: userMessage }];
  if (!finalize) appendBubble("user", userMessage);

  const sendBtn = $("sendChat");
  const finBtn = $("finalizeChat");
  sendBtn.disabled = finBtn.disabled = true;
  const thinking = thinkingBubble();

  try {
    const systemPrompt = finalize ? boostSystemPrompt(state.provider) : qaSystemPrompt(state.provider);
    const raw = await ask(history, systemPrompt);
    if (finalize) {
      renderBoostResult(parseJsonResult(raw));
      appendBubble("assistant", "Final prompt generated - see \"Improved prompt\".");
    } else {
      qaHistory = [...history, { role: "assistant", content: raw }];
      appendBubble("assistant", raw);
    }
  } catch (e) {
    showBanner(e.message);
  } finally {
    thinking.remove();
    sendBtn.disabled = finBtn.disabled = false;
  }
}

$("sendChat").addEventListener("click", () => {
  const val = $("chatInput").value.trim();
  if (!val) return;
  $("chatInput").value = "";
  sendChatTurn(val);
});
$("chatInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    $("sendChat").click();
  }
});
$("finalizeChat").addEventListener("click", () => {
  if (!qaHistory.length) { showBanner("Start a Q&A session first."); return; }
  sendChatTurn(FINALIZE_INSTRUCTION, { finalize: true });
});

// ---------- Text selected on a page via the context menu ----------
async function takePendingPrompt(text) {
  if (!text) return;
  promptInput.value = text;
  updateCharCount();
  promptInput.focus();
  await session.remove("pendingPrompt");
}
onSessionChange("pendingPrompt", takePendingPrompt);

// ---------- Init ----------
(async function init() {
  await loadState();
  providerSelect.value = state.provider;
  rememberKey.checked = state.remember;
  customModel.value = state.customModel;
  renderProviderUI();
  updateCharCount();
  await takePendingPrompt(await read(session, "pendingPrompt", ""));
})();
