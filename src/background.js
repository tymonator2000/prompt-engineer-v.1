// Toolbar icon opens the side panel; the context menu sends selected text to it.

const MENU_ID = "improve-prompt";

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Ulepsz prompt w Arkanum",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  // open() must run synchronously inside the user gesture, before any await.
  chrome.sidePanel.open({ windowId: tab.windowId });
  chrome.storage.session.set({ pendingPrompt: info.selectionText || "" });
});
