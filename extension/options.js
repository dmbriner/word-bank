import { buildSource, getSettings, parseWordInput, saveManyWordsToGitHub, saveSettings, saveWordToGitHub } from "./word-bank-api.js";

const settingsForm = document.querySelector("#settings-form");
const wordForm = document.querySelector("#word-form");
const importForm = document.querySelector("#import-form");
const importFile = document.querySelector("#import-file");

const fields = {
  token: document.querySelector("#token"),
  owner: document.querySelector("#owner"),
  repo: document.querySelector("#repo"),
  branch: document.querySelector("#branch"),
  dataPath: document.querySelector("#data-path"),
  word: document.querySelector("#word"),
  sourceTitle: document.querySelector("#source-title"),
  sourceAuthor: document.querySelector("#source-author"),
  sourceLocation: document.querySelector("#source-location"),
  sourceApp: document.querySelector("#source-app"),
  sourceUrl: document.querySelector("#source-url"),
  importText: document.querySelector("#import-text"),
};

const status = {
  settings: document.querySelector("#settings-status"),
  word: document.querySelector("#word-status"),
  import: document.querySelector("#import-status"),
};

loadSettings();

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveSettings({
    token: fields.token.value.trim(),
    owner: fields.owner.value.trim(),
    repo: fields.repo.value.trim(),
    branch: fields.branch.value.trim(),
    dataPath: fields.dataPath.value.trim(),
  });
  status.settings.textContent = "Settings saved.";
});

wordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.word.textContent = "Publishing...";

  try {
    const result = await saveWordToGitHub({
      word: fields.word.value,
      source: currentSource(),
    });
    status.word.textContent = `${capitalize(result.status)} ${result.word}.`;
    wordForm.reset();
  } catch (error) {
    status.word.textContent = error.message;
  }
});

importForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.import.textContent = "Preparing import...";

  try {
    const words = parseWordInput(fields.importText.value);
    const result = await saveManyWordsToGitHub({
      words,
      source: currentSource(),
      onProgress: (message) => {
        status.import.textContent = message;
      },
    });
    status.import.textContent = `Imported ${result.total} word${result.total === 1 ? "" : "s"}: ${result.added} added, ${result.updated} updated.`;
    importForm.reset();
  } catch (error) {
    status.import.textContent = error.message;
  }
});

importFile.addEventListener("change", async () => {
  const [file] = importFile.files;
  if (!file) {
    return;
  }

  fields.importText.value = await file.text();
});

async function loadSettings() {
  const settings = await getSettings();
  fields.token.value = settings.token;
  fields.owner.value = settings.owner;
  fields.repo.value = settings.repo;
  fields.branch.value = settings.branch;
  fields.dataPath.value = settings.dataPath;
}

function currentSource() {
  return buildSource({
    kind: fields.sourceAuthor.value ? "book" : "",
    title: fields.sourceTitle.value,
    author: fields.sourceAuthor.value,
    location: fields.sourceLocation.value,
    app: fields.sourceApp.value,
    url: fields.sourceUrl.value,
  });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
