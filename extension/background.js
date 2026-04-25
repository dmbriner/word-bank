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

  await publishSelection(info.selectionText || "", tab);
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== "save-selection") {
    return;
  }

  const [activeTab] = tab?.id ? [tab] : await chrome.tabs.query({ active: true, currentWindow: true });
  const selectedText = await getSelectedText(activeTab);
  await publishSelection(selectedText, activeTab);
});

async function showBadge(text, color) {
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 2500);
}

async function publishSelection(selectionText, tab) {
  const source = buildSource({
    title: tab?.title || "",
    url: tab?.url || "",
    app: readerAppName(tab?.url || ""),
  });

  try {
    const result = await saveWordToGitHub({
      word: selectionText || "",
      source,
    });
    await showBadge("✓", "#3e6655");
    console.log(`${result.status} ${result.word}`);
  } catch (error) {
    await showBadge("!", "#8b2f2d");
    console.error(error);
    chrome.runtime.openOptionsPage();
  }
}

async function getSelectedText(tab) {
  if (!tab?.id || tab.url?.startsWith("chrome://")) {
    return "";
  }

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => String(globalThis.getSelection?.() || "").trim(),
  });

  return result?.result || "";
}

function readerAppName(url) {
  if (url.includes("read.amazon.com")) {
    return "Kindle Cloud Reader";
  }

  if (url.includes("books.google.") || url.includes("play.google.com/books")) {
    return "Google Books";
  }

  if (url.includes("archive.org")) {
    return "Internet Archive";
  }

  return "Chrome";
}
