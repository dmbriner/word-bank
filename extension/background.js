import { buildSource, saveWordToGitHub } from "./word-bank-api.js";

const menuId = "save-to-danas-word-bank";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: menuId,
      title: "Save “%s” to Dana's Word Bank",
      contexts: ["selection"],
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== menuId) {
    return;
  }

  const source = buildSource({
    title: tab?.title || "",
    url: tab?.url || "",
    app: tab?.url?.includes("read.amazon.com") ? "Kindle Cloud Reader" : "Chrome",
  });

  try {
    const result = await saveWordToGitHub({
      word: info.selectionText || "",
      source,
    });
    await showBadge("✓", "#3e6655");
    console.log(`${result.status} ${result.word}`);
  } catch (error) {
    await showBadge("!", "#8b2f2d");
    console.error(error);
    chrome.runtime.openOptionsPage();
  }
});

async function showBadge(text, color) {
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 2500);
}
