const defaults = {
  owner: "dmbriner",
  repo: "word-bank",
  branch: "main",
  wordsPath: "data/words.json",
  prosePath: "data/prose.json",
  token: "",
};

const validParts = new Set(["noun", "verb", "adjective", "adverb"]);
const settingsKey = "dana-word-bank-admin-settings";
const sourceKey = "dana-word-bank-admin-source";

const fields = {
  token: document.querySelector("#token"),
  owner: document.querySelector("#owner"),
  repo: document.querySelector("#repo"),
  branch: document.querySelector("#branch"),
  wordsPath: document.querySelector("#words-path"),
  prosePath: document.querySelector("#prose-path"),
  sourceTitle: document.querySelector("#source-title-input"),
  sourceAuthor: document.querySelector("#source-author"),
  sourceLocation: document.querySelector("#source-location"),
  sourceApp: document.querySelector("#source-app"),
  sourceUrl: document.querySelector("#source-url"),
  word: document.querySelector("#word"),
  proseText: document.querySelector("#prose-text"),
};

const settingsPanel = document.querySelector("#settings-panel");
const settingsToggle = document.querySelector("#settings-toggle");
const closeSettings = document.querySelector("#close-settings");
const settingsForm = document.querySelector("#settings-form");
const wordForm = document.querySelector("#word-form");
const proseForm = document.querySelector("#prose-form");
const wordTab = document.querySelector("#word-tab");
const proseTab = document.querySelector("#prose-tab");
const clearSource = document.querySelector("#clear-source");
const findBook = document.querySelector("#find-book");
const refreshRecent = document.querySelector("#refresh-recent");
const analyzeWord = document.querySelector("#analyze-word");
const testConnection = document.querySelector("#test-connection");
const sourcePreview = document.querySelector("#source-preview");
const publishStatus = document.querySelector("#publish-status");
const settingsStatus = document.querySelector("#settings-status");
const recentList = document.querySelector("#recent-list");
const bookSuggestions = document.querySelector("#book-suggestions");
const wordSmart = document.querySelector("#word-smart");
const wordSmartTitle = document.querySelector("#word-smart-title");
const wordPart = document.querySelector("#word-part");
const wordDefinition = document.querySelector("#word-definition");
const wordContext = document.querySelector("#word-context");

let settings = loadSettings();
let wordTimer = 0;
let bookTimer = 0;
const wordCache = new Map();

fillSettings();
fillSource();
updateSourcePreview();
loadRecent();

settingsToggle.addEventListener("click", () => {
  settingsPanel.hidden = !settingsPanel.hidden;
});

closeSettings.addEventListener("click", () => {
  settingsPanel.hidden = true;
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  settings = readSettings();
  localStorage.setItem(settingsKey, JSON.stringify(settings));
  settingsStatus.textContent = "Connection saved.";
});

testConnection.addEventListener("click", async () => {
  settingsStatus.textContent = "Checking...";

  try {
    const [wordFile, proseFile] = await Promise.all([fetchJsonFile(settings.wordsPath), fetchJsonFile(settings.prosePath)]);
    const wordCount = Array.isArray(wordFile.data.words) ? wordFile.data.words.length : 0;
    const proseCount = Array.isArray(proseFile.data.prose) ? proseFile.data.prose.length : 0;
    settingsStatus.textContent = `Connected: ${wordCount} words, ${proseCount} phrasings.`;
  } catch (error) {
    settingsStatus.textContent = error.message;
  }
});

[fields.sourceTitle, fields.sourceAuthor, fields.sourceLocation, fields.sourceApp, fields.sourceUrl].forEach((field) => {
  field.addEventListener("input", () => {
    localStorage.setItem(sourceKey, JSON.stringify(readSourceFields()));
    updateSourcePreview();
  });
});

fields.sourceTitle.addEventListener("input", () => {
  clearTimeout(bookTimer);
  bookTimer = setTimeout(() => {
    suggestBook(false);
  }, 750);
});

fields.word.addEventListener("input", () => {
  clearTimeout(wordTimer);
  wordTimer = setTimeout(() => {
    previewWord(false);
  }, 550);
});

clearSource.addEventListener("click", () => {
  [fields.sourceTitle, fields.sourceAuthor, fields.sourceLocation, fields.sourceApp, fields.sourceUrl].forEach((field) => {
    field.value = "";
  });
  localStorage.removeItem(sourceKey);
  updateSourcePreview();
  clearBookSuggestions();
});

wordTab.addEventListener("click", () => setActivePane("word"));
proseTab.addEventListener("click", () => setActivePane("prose"));
refreshRecent.addEventListener("click", loadRecent);
findBook.addEventListener("click", () => suggestBook(true));
analyzeWord.addEventListener("click", () => previewWord(true));

wordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  publishStatus.textContent = "Publishing word...";
  setBusy(wordForm, true);

  try {
    const result = await publishWord(fields.word.value);
    publishStatus.textContent = `${capitalize(result.status)} ${result.word}.`;
    fields.word.value = "";
    await loadRecent();
  } catch (error) {
    publishStatus.textContent = error.message;
  } finally {
    setBusy(wordForm, false);
  }
});

proseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  publishStatus.textContent = "Publishing prose...";
  setBusy(proseForm, true);

  try {
    const result = await publishProse(fields.proseText.value);
    publishStatus.textContent = `${capitalize(result.status)} prose.`;
    fields.proseText.value = "";
    await loadRecent();
  } catch (error) {
    publishStatus.textContent = error.message;
  } finally {
    setBusy(proseForm, false);
  }
});

function loadSettings() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(settingsKey) || "{}") };
  } catch (error) {
    return { ...defaults };
  }
}

function fillSettings() {
  fields.token.value = settings.token;
  fields.owner.value = settings.owner;
  fields.repo.value = settings.repo;
  fields.branch.value = settings.branch;
  fields.wordsPath.value = settings.wordsPath;
  fields.prosePath.value = settings.prosePath;
}

function readSettings() {
  return {
    token: fields.token.value.trim(),
    owner: fields.owner.value.trim() || defaults.owner,
    repo: fields.repo.value.trim() || defaults.repo,
    branch: fields.branch.value.trim() || defaults.branch,
    wordsPath: fields.wordsPath.value.trim() || defaults.wordsPath,
    prosePath: fields.prosePath.value.trim() || defaults.prosePath,
  };
}

function fillSource() {
  const saved = JSON.parse(localStorage.getItem(sourceKey) || "{}");
  fields.sourceTitle.value = saved.title || "";
  fields.sourceAuthor.value = saved.author || "";
  fields.sourceLocation.value = saved.location || "";
  fields.sourceApp.value = saved.app || "";
  fields.sourceUrl.value = saved.url || "";
}

function readSourceFields() {
  return {
    title: fields.sourceTitle.value.trim(),
    author: fields.sourceAuthor.value.trim(),
    location: fields.sourceLocation.value.trim(),
    app: fields.sourceApp.value.trim(),
    url: fields.sourceUrl.value.trim(),
  };
}

function buildWordSource() {
  const source = readSourceFields();
  const withMeta = {
    kind: source.author ? "book" : "",
    ...source,
    savedAt: new Date().toISOString(),
  };

  return source.title || source.author || source.location || source.app || source.url ? withMeta : null;
}

function buildProseEntry(text, existing) {
  const source = readSourceFields();
  return {
    id: existing?.id || slugify(text).slice(0, 80),
    text,
    kind: source.author ? "book" : "",
    sourceTitle: source.title,
    sourceAuthor: source.author,
    location: source.location,
    app: source.app,
    url: source.url,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: existing ? new Date().toISOString() : undefined,
  };
}

function updateSourcePreview() {
  const source = readSourceFields();
  if (!source.title && !source.author && !source.location && !source.app && !source.url) {
    sourcePreview.textContent = "Saved by Dana";
    return;
  }

  sourcePreview.replaceChildren(...sourcePreviewNodes(source));
}

function sourcePreviewNodes(source) {
  if (source.author && source.title) {
    const nodes = [document.createTextNode(`${formatChicagoAuthor(source.author)}. `)];
    const title = document.createElement("em");
    title.textContent = source.title;
    nodes.push(title);

    if (source.location) {
      nodes.push(document.createTextNode(`, ${source.location}`));
    }

    if (source.app) {
      nodes.push(document.createTextNode(` (${source.app})`));
    }

    return nodes;
  }

  return [document.createTextNode([source.title, source.location, source.app, source.url].filter(Boolean).join(" · "))];
}

async function previewWord(force) {
  const clean = cleanWord(fields.word.value);

  if (!clean) {
    wordSmart.hidden = true;
    return;
  }

  if (!force && (clean.length < 3 || clean.includes(" "))) {
    return;
  }

  wordSmart.hidden = false;
  wordSmartTitle.textContent = clean;
  wordPart.textContent = "Checking";
  wordDefinition.textContent = "Looking up the definition and grammar type...";
  wordContext.textContent = "";

  try {
    const profile = await getWordProfile(clean);
    wordSmartTitle.textContent = profile.word;
    wordPart.textContent = profile.partOfSpeech;
    wordDefinition.textContent = profile.definition;
    wordContext.textContent = profile.essayContext;
  } catch (error) {
    wordPart.textContent = "Other";
    wordDefinition.textContent = "Definition not found automatically.";
    wordContext.textContent = "You can still publish it and refine it later.";
  }
}

async function getWordProfile(value) {
  const clean = cleanWord(value);
  const key = clean.toLowerCase();

  if (wordCache.has(key)) {
    return wordCache.get(key);
  }

  const lookup = await lookupWord(clean);
  const profile = {
    word: clean,
    ...lookup,
    essayContext: essayContextFor(clean, lookup),
  };

  wordCache.set(key, profile);
  return profile;
}

async function suggestBook(force) {
  const title = fields.sourceTitle.value.trim();

  if (!title || (!force && title.length < 5)) {
    clearBookSuggestions();
    return;
  }

  bookSuggestions.hidden = false;
  bookSuggestions.replaceChildren(suggestionState("Looking for the book..."));

  try {
    const books = await lookupBooks(title);

    if (!books.length) {
      bookSuggestions.replaceChildren(suggestionState("No book match found. You can type the author manually."));
      return;
    }

    const best = books[0];
    const shouldAutoFill = !fields.sourceAuthor.value.trim() && isStrongBookMatch(title, best);
    if (shouldAutoFill) {
      applyBookSuggestion(best);
    }

    bookSuggestions.replaceChildren(...books.map(bookSuggestionButton));
  } catch (error) {
    bookSuggestions.replaceChildren(suggestionState("Book lookup could not connect. You can type the author manually."));
  }
}

async function lookupBooks(title) {
  const params = new URLSearchParams({
    q: `intitle:"${title}"`,
    maxResults: "5",
    printType: "books",
    projection: "lite",
  });
  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Book lookup failed.");
  }

  const data = await response.json();
  return (data.items || [])
    .map((item) => item.volumeInfo || {})
    .filter((book) => book.title && book.authors?.length)
    .map((book) => ({
      title: book.title,
      author: book.authors[0],
      year: book.publishedDate?.slice(0, 4) || "",
      url: book.infoLink || "",
      score: bookMatchScore(title, book.title),
    }))
    .sort((a, b) => b.score - a.score);
}

function isStrongBookMatch(query, book) {
  return book.score >= 90;
}

function bookMatchScore(query, title) {
  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(title);
  let score = 0;

  if (normalizedTitle === normalizedQuery) {
    score = 100;
  } else if (normalizedTitle.includes(normalizedQuery)) {
    score = 70;
  } else if (normalizedQuery.includes(normalizedTitle)) {
    score = 55;
  }

  if (/^(summary|study guide|analysis|workbook)\b/.test(normalizedTitle)) {
    score -= 45;
  }

  return score;
}

function bookSuggestionButton(book) {
  const button = document.createElement("button");
  button.className = "suggestion-button";
  button.type = "button";

  const title = document.createElement("strong");
  title.textContent = book.title;

  const meta = document.createElement("span");
  meta.textContent = [book.author, book.year].filter(Boolean).join(" · ");

  button.append(title, meta);
  button.addEventListener("click", () => {
    applyBookSuggestion(book);
    clearBookSuggestions();
  });

  return button;
}

function applyBookSuggestion(book) {
  fields.sourceTitle.value = book.title;
  fields.sourceAuthor.value = book.author;

  if (book.url && !fields.sourceUrl.value.trim()) {
    fields.sourceUrl.value = book.url;
  }

  localStorage.setItem(sourceKey, JSON.stringify(readSourceFields()));
  updateSourcePreview();
}

function suggestionState(message) {
  const item = document.createElement("p");
  item.className = "empty-state";
  item.textContent = message;
  return item;
}

function clearBookSuggestions() {
  bookSuggestions.hidden = true;
  bookSuggestions.textContent = "";
}

async function publishWord(value) {
  const clean = cleanWord(value);
  if (!clean) {
    throw new Error("Type a word first.");
  }

  const file = await fetchJsonFile(settings.wordsPath);
  const data = { words: Array.isArray(file.data.words) ? file.data.words : [] };
  const lookup = await getWordProfile(clean);
  const source = buildWordSource();
  const existing = data.words.find((entry) => entry.word.toLowerCase() === clean.toLowerCase());
  const savedLookup = {
    partOfSpeech: lookup.partOfSpeech,
    definition: lookup.definition,
    example: lookup.example,
    essayContext: lookup.essayContext,
  };

  if (existing) {
    Object.assign(existing, {
      ...savedLookup,
      sources: addSource(existing.sources || [], source),
      updatedAt: new Date().toISOString(),
    });
  } else {
    data.words.push({
      id: slugify(clean),
      word: clean,
      ...savedLookup,
      sources: addSource([], source),
      createdAt: new Date().toISOString(),
    });
  }

  data.words.sort((a, b) => a.word.localeCompare(b.word));
  await updateJsonFile(settings.wordsPath, file.sha, data, `${existing ? "Update" : "Add"} word: ${clean}`);

  return {
    status: existing ? "updated" : "added",
    word: clean,
  };
}

async function publishProse(value) {
  const text = value.trim().replace(/\s+/g, " ");
  if (!text) {
    throw new Error("Type a phrasing first.");
  }

  const file = await fetchJsonFile(settings.prosePath);
  const data = { prose: Array.isArray(file.data.prose) ? file.data.prose : [] };
  const existing = data.prose.find((entry) => entry.text.toLowerCase() === text.toLowerCase());
  const entry = buildProseEntry(text, existing);

  if (existing) {
    Object.assign(existing, entry);
  } else {
    data.prose.unshift(entry);
  }

  await updateJsonFile(settings.prosePath, file.sha, data, `${existing ? "Update" : "Add"} prose`);

  return {
    status: existing ? "updated" : "added",
    text,
  };
}

async function loadRecent() {
  recentList.textContent = "";

  try {
    const [wordFile, proseFile] = await Promise.all([fetchJsonFile(settings.wordsPath, false), fetchJsonFile(settings.prosePath, false)]);
    const latestWords = [...(wordFile.data.words || [])]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 4);
    const latestProse = [...(proseFile.data.prose || [])].slice(0, 4);

    [...latestWords.map((entry) => ({ type: entry.partOfSpeech || "word", text: entry.word })), ...latestProse.map((entry) => ({ type: "prose", text: entry.text }))]
      .slice(0, 8)
      .forEach((entry) => recentList.append(recentItem(entry)));

    if (!recentList.childElementCount) {
      recentList.append(emptyState("Nothing has been published yet."));
    }
  } catch (error) {
    recentList.append(emptyState(settings.token ? error.message : "Add your GitHub token in Connection."));
  }
}

async function fetchJsonFile(pathValue, requireToken = true) {
  ensureConnection(requireToken);
  const url = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${pathValue}?ref=${settings.branch}`;
  const response = await fetch(url, { headers: githubHeaders(settings.token) });

  if (!response.ok) {
    throw new Error(`Could not load ${pathValue}.`);
  }

  const payload = await response.json();
  return {
    sha: payload.sha,
    data: JSON.parse(base64Decode(payload.content)),
  };
}

async function updateJsonFile(pathValue, sha, data, message) {
  ensureConnection(true);
  const url = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${pathValue}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: githubHeaders(settings.token),
    body: JSON.stringify({
      branch: settings.branch,
      message,
      sha,
      content: base64Encode(`${JSON.stringify(data, null, 2)}\n`),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Could not publish ${pathValue}.`);
  }
}

function ensureConnection(requireToken) {
  settings = readSettings();
  if (requireToken && !settings.token) {
    settingsPanel.hidden = false;
    throw new Error("Paste your GitHub token in Connection.");
  }
}

async function lookupWord(value) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(value)}`);
    if (!response.ok) {
      throw new Error("No definition found");
    }

    const [entry] = await response.json();
    const meaning = entry.meanings?.find((item) => item.definitions?.[0]?.definition) || entry.meanings?.[0];
    const definition = meaning?.definitions?.[0]?.definition || "Definition not found automatically.";
    const example = meaning?.definitions?.[0]?.example || "";
    const partOfSpeech = validParts.has(meaning?.partOfSpeech) ? meaning.partOfSpeech : "other";

    return { partOfSpeech, definition, example };
  } catch (error) {
    return {
      partOfSpeech: "other",
      definition: "Definition not found automatically.",
      example: "",
    };
  }
}

function setActivePane(pane) {
  const wordActive = pane === "word";
  wordTab.classList.toggle("active", wordActive);
  proseTab.classList.toggle("active", !wordActive);
  wordTab.setAttribute("aria-selected", String(wordActive));
  proseTab.setAttribute("aria-selected", String(!wordActive));
  wordForm.hidden = !wordActive;
  proseForm.hidden = wordActive;
}

function setBusy(form, busy) {
  form.querySelectorAll("button, input, textarea").forEach((element) => {
    element.disabled = busy;
  });
}

function recentItem(entry) {
  const item = document.createElement("article");
  item.className = "recent-item";

  const type = document.createElement("p");
  type.textContent = entry.type;

  const text = document.createElement("h3");
  text.textContent = entry.text;

  item.append(type, text);
  return item;
}

function emptyState(message) {
  const item = document.createElement("p");
  item.className = "empty-state";
  item.textContent = message;
  return item;
}

function cleanWord(value) {
  return String(value)
    .trim()
    .replace(/^[^\w'-]+|[^\w'-]+$/g, "")
    .replace(/\s+/g, " ");
}

function normalizeText(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function essayContextFor(word, lookup) {
  const definition = lookup.definition.replace(/\.$/, "").toLowerCase();

  if (lookup.example) {
    return `In context: ${lookup.example}`;
  }

  const templates = {
    adjective: `Useful when describing a person, argument, institution, or tone as ${definition}.`,
    noun: `Useful when naming an abstract force, condition, or idea connected to ${definition}.`,
    verb: `Useful when analyzing how someone acts, changes, limits, or produces an effect: ${definition}.`,
    adverb: `Useful when sharpening how an action happens, especially when the manner matters: ${definition}.`,
    other: `Useful when you need a precise phrase for ${definition}.`,
  };

  return templates[lookup.partOfSpeech] || templates.other;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function addSource(sources, source) {
  if (!source) {
    return sources;
  }

  const alreadySaved = sources.some(
    (item) =>
      item.title === source.title &&
      item.author === source.author &&
      item.url === source.url &&
      item.app === source.app &&
      item.location === source.location,
  );
  return alreadySaved ? sources : [...sources, source];
}

function formatChicagoAuthor(author) {
  if (!author || author.includes(",") || author.includes("&")) {
    return author;
  }

  const parts = author.trim().split(/\s+/);
  if (parts.length < 2) {
    return author;
  }

  const last = parts.pop();
  return `${last}, ${parts.join(" ")}`;
}

function githubHeaders(token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function base64Decode(value) {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function base64Encode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
