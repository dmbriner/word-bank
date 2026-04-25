import { buildSource, saveWordToGitHub } from "./word-bank-api.js";

const form = document.querySelector("#word-form");
const word = document.querySelector("#word");
const sourceTitle = document.querySelector("#source-title");
const status = document.querySelector("#status");
const optionsButton = document.querySelector("#open-options");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "Publishing...";

  try {
    const result = await saveWordToGitHub({
      word: word.value,
      source: buildSource({ title: sourceTitle.value, app: "Chrome extension" }),
    });
    status.textContent = `${capitalize(result.status)} ${result.word}.`;
    form.reset();
  } catch (error) {
    status.textContent = error.message;
  }
});

optionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
