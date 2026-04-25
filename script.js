const wordForm = document.querySelector("#word-form");
const wordInput = document.querySelector("#word");
const wordList = document.querySelector("#word-list");
const searchInput = document.querySelector("#search-input");
const filterButtons = document.querySelectorAll(".filter-button");
const clearWordsButton = document.querySelector("#clear-words");
const wordCount = document.querySelector("#word-count");
const sourceCount = document.querySelector("#source-count");
const saveStatus = document.querySelector("#save-status");
const wordTemplate = document.querySelector("#word-card-template");

const storageKey = "word-bank.words";
const legacyProseKey = "word-bank.prose";
let activeFilter = "all";
let pendingSource = readCaptureSource();

const sampleWords = [
  {
    id: crypto.randomUUID(),
    word: "ingratiating",
    partOfSpeech: "adjective",
    definition: "Intended to gain approval or favor; sycophantic.",
    example: "",
    sources: [],
    createdAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    word: "obsequious",
    partOfSpeech: "adjective",
    definition: "Obedient or attentive to an excessive or servile degree.",
    example: "",
    sources: [],
    createdAt: Date.now() - 1,
  },
];

let words = loadWords();

function loadWords() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    return sampleWords;
  }

  return JSON.parse(stored).map((entry) => ({
    ...entry,
    example: entry.example || "",
    sources: normalizeSources(entry),
    partOfSpeech: normalizePartOfSpeech(entry.partOfSpeech),
  }));
}

function normalizeSources(entry) {
  if (Array.isArray(entry.sources)) {
    return entry.sources;
  }

  const legacyTitle = entry.bookTitle || entry.learnedAt || "";
  if (!legacyTitle) {
    return [];
  }

  return [
    {
      title: legacyTitle,
      url: "",
      app: "",
      savedAt: entry.createdAt || Date.now(),
    },
  ];
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify(words));
  localStorage.removeItem(legacyProseKey);
}

function readCaptureSource() {
  const params = new URLSearchParams(window.location.search);
  const source = {
    title: params.get("sourceTitle") || params.get("title") || "",
    url: params.get("sourceUrl") || params.get("url") || "",
    app: params.get("app") || "",
    savedAt: Date.now(),
  };

  return source.title || source.url || source.app ? source : null;
}

function readCapturedWord() {
  const params = new URLSearchParams(window.location.search);
  return cleanWord(params.get("word") || params.get("text") || params.get("selection") || "");
}

function cleanWord(value) {
  return value
    .trim()
    .replace(/^[^\w'-]+|[^\w'-]+$/g, "")
    .replace(/\s+/g, " ");
}

async function lookupWord(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!response.ok) {
      throw new Error("No definition found");
    }

    const [entry] = await response.json();
    const meaning = entry.meanings?.find((item) => item.definitions?.[0]?.definition) || entry.meanings?.[0];
    const definition = meaning?.definitions?.[0]?.definition || "Definition not found automatically.";
    const example = meaning?.definitions?.[0]?.example || "";

    return {
      partOfSpeech: normalizePartOfSpeech(meaning?.partOfSpeech),
      definition,
      example,
    };
  } catch (error) {
    return {
      partOfSpeech: "other",
      definition: "Definition not found automatically.",
      example: "",
    };
  }
}

function normalizePartOfSpeech(partOfSpeech) {
  return ["noun", "verb", "adjective", "adverb"].includes(partOfSpeech) ? partOfSpeech : "other";
}

async function saveWord(rawWord, source = null) {
  const word = cleanWord(rawWord);
  if (!word) {
    return;
  }

  setStatus("Saving...");
  const lookup = await lookupWord(word);
  const existing = words.find((entry) => entry.word.toLowerCase() === word.toLowerCase());

  if (existing) {
    Object.assign(existing, {
      ...lookup,
      sources: addSource(existing.sources, source),
      updatedAt: Date.now(),
    });
    setStatus(`Updated ${word}.`);
  } else {
    words.push({
      id: crypto.randomUUID(),
      word,
      ...lookup,
      sources: addSource([], source),
      createdAt: Date.now(),
    });
    setStatus(`Saved ${word}.`);
  }

  save();
  renderWords();
}

function addSource(sources, source) {
  if (!source || (!source.title && !source.url && !source.app)) {
    return sources;
  }

  const alreadySaved = sources.some((item) => item.title === source.title && item.url === source.url && item.app === source.app);
  return alreadySaved ? sources : [...sources, source];
}

function setStatus(message) {
  saveStatus.textContent = message;
}

function normalize(value) {
  return value.toLowerCase().trim();
}

function getSearchBlob(item) {
  return [
    item.word,
    item.partOfSpeech,
    item.definition,
    item.example,
    ...item.sources.flatMap((source) => [source.title, source.url, source.app]),
  ]
    .join(" ")
    .toLowerCase();
}

function sortedWords() {
  return [...words].sort((a, b) => a.word.localeCompare(b.word));
}

function grammarLabel(partOfSpeech) {
  const labels = {
    noun: "Nouns",
    verb: "Verbs",
    adjective: "Adjectives",
    adverb: "Adverbs",
    other: "Other",
  };
  return labels[partOfSpeech] || "Other";
}

function renderWords() {
  const query = normalize(searchInput.value);
  const visibleWords = sortedWords().filter((entry) => {
    const matchesFilter = activeFilter === "all" || entry.partOfSpeech === activeFilter;
    const matchesSearch = !query || getSearchBlob(entry).includes(query);
    return matchesFilter && matchesSearch;
  });

  wordList.textContent = "";

  if (!visibleWords.length) {
    wordList.append(emptyState("No saved words match this search."));
    updateCounts();
    return;
  }

  ["adjective", "noun", "verb", "adverb", "other"].forEach((partOfSpeech) => {
    const groupWords = visibleWords.filter((entry) => entry.partOfSpeech === partOfSpeech);
    if (!groupWords.length) {
      return;
    }

    const group = document.createElement("section");
    group.className = "grammar-group";

    const heading = document.createElement("h3");
    heading.className = "grammar-heading";
    heading.textContent = grammarLabel(partOfSpeech);

    const items = document.createElement("div");
    items.className = "grammar-items";

    groupWords.forEach((entry) => items.append(wordCard(entry)));
    group.append(heading, items);
    wordList.append(group);
  });

  updateCounts();
}

function wordCard(entry) {
  const card = wordTemplate.content.firstElementChild.cloneNode(true);
  card.querySelector("h3").textContent = entry.word;
  card.querySelector(".part").textContent = entry.partOfSpeech;
  card.querySelector(".definition").textContent = entry.definition;
  card.querySelector(".example").textContent = entry.example ? `Example: ${entry.example}` : "";
  card.querySelector("footer").replaceChildren(...sourceNodes(entry.sources));
  card.querySelector(".delete-word").addEventListener("click", () => deleteWord(entry.id));
  return card;
}

function sourceNodes(sources) {
  if (!sources.length) {
    return [document.createTextNode("Saved manually")];
  }

  return sources.flatMap((source, index) => {
    const separator = index ? [document.createElement("br")] : [];
    const label = source.title || source.app || source.url || "Captured source";
    const node = source.url ? document.createElement("a") : document.createElement("span");
    node.textContent = `Saved from: ${label}`;

    if (source.url) {
      node.href = source.url;
      node.target = "_blank";
      node.rel = "noreferrer";
      node.className = "source-link";
    }

    return [...separator, node];
  });
}

function emptyState(message) {
  const state = document.createElement("p");
  state.className = "empty-state";
  state.textContent = message;
  return state;
}

function updateCounts() {
  wordCount.textContent = words.length;
  sourceCount.textContent = new Set(words.flatMap((entry) => entry.sources.map((source) => source.title || source.url || source.app))).size;
}

function deleteWord(id) {
  words = words.filter((entry) => entry.id !== id);
  save();
  renderWords();
}

wordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveWord(wordInput.value, pendingSource);
  pendingSource = null;
  wordForm.reset();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderWords();
  });
});

searchInput.addEventListener("input", renderWords);

clearWordsButton.addEventListener("click", () => {
  words = [];
  save();
  renderWords();
  setStatus("");
});

async function saveCapturedWord() {
  const capturedWord = readCapturedWord();
  if (!capturedWord) {
    return;
  }

  wordInput.value = capturedWord;
  await saveWord(capturedWord, pendingSource);
  pendingSource = null;
  window.history.replaceState({}, document.title, window.location.pathname);
}

renderWords();
saveCapturedWord();
