// Thin wrapper over chrome.storage. Falls back to memory when the page is opened
// outside the extension (e.g. as a plain file while developing the UI).

function memoryArea() {
  const data = {};
  return {
    async get(key) { return key in data ? { [key]: data[key] } : {}; },
    async set(items) { Object.assign(data, items); },
    async remove(key) { delete data[key]; }
  };
}

const hasChrome = typeof chrome !== "undefined" && chrome.storage;

// local: survives browser restarts. session: in memory, cleared when the browser closes.
export const local = hasChrome ? chrome.storage.local : memoryArea();
export const session = hasChrome ? chrome.storage.session : memoryArea();

export async function read(area, key, fallback) {
  try {
    const res = await area.get(key);
    return res[key] ?? fallback;
  } catch {
    return fallback;
  }
}

export function onSessionChange(key, fn) {
  if (!hasChrome) return;
  chrome.storage.session.onChanged.addListener(changes => {
    if (changes[key]?.newValue !== undefined) fn(changes[key].newValue);
  });
}
