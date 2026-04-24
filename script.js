const wordForm = document.querySelector("#word-form");
const proseForm = document.querySelector("#prose-form");
const wordList = document.querySelector("#word-list");
const proseList = document.querySelector("#prose-list");
const searchInput = document.querySelector("#search-input");
const filterButtons = document.querySelectorAll(".filter-button");
const clearWordsButton = document.querySelector("#clear-words");
const lookupDefinitionButton = document.querySelector("#lookup-definition");
const wordCount = document.querySelector("#word-count");
const proseCount = document.querySelector("#prose-count");

const wordTemplate = document.querySelector("#word-card-template");
const proseTemplate = document.querySelector("#prose-card-template");

const storageKeys = {
  words: "word-bank.words",
  prose: "word-bank.prose",
};

const sampleWords = [
  {
    id: crypto.randomUUID(),
    word: "ingratiating",
    partOfSpeech: "adjective",
    definition: "Intended to gain approval or favor; sycophantic.",
    context: "Useful for describing calculated charm, flattery, or approval-seeking behavior.",
    bookTitle: "",
    author: "",
    publisher: "",
    year: "",
    learnedAt: "Unchy Words list",
    createdAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    word: "obsequious",
    partOfSpeech: "adjective",
    definition: "Obedient or attentive to an excessive or servile degree.",
    context: "Useful when describing deference that feels strategic, exaggerated, or humiliating.",
    bookTitle: "",
    author: "",
    publisher: "",
    year: "",
    learnedAt: "Unchy Words list",
    createdAt: Date.now() - 1,
  },
];

let words = load(storageKeys.words, sampleWords);
let prose = load(storageKeys.prose, [
  {
    id: crypto.randomUUID(),
    text: "The sentence lands with pressure because every ordinary object suddenly feels charged with private weather.",
    bookTitle: "Notebook",
    author: "Personal observation",
    publisher: "",
    year: "",
    note: "A model for writing about prose without flattening it.",
    createdAt: Date.now(),
  },
]);
let activeFilter = "all";

function load(key, fallback) {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : fallback;
}

function save() {
  localStorage.setItem(storageKeys.words, JSON.stringify(words));
  localStorage.setItem(storageKeys.prose, JSON.stringify(prose));
}

function chicagoBook(title, author, publisher = "", year = "") {
  const cleanTitle = title.trim();
  const cleanAuthor = chicagoAuthor(author.trim());
  const cleanPublisher = publisher.trim();
  const cleanYear = year.trim();

  if (!cleanTitle && !cleanAuthor) {
    return "";
  }

  if (!cleanTitle) {
    return cleanAuthor;
  }

  if (!cleanAuthor) {
    return citationDetails(`<em>${escapeHtml(cleanTitle)}</em>`, cleanPublisher, cleanYear);
  }

  return citationDetails(`${escapeHtml(cleanAuthor)}. <em>${escapeHtml(cleanTitle)}</em>`, cleanPublisher, cleanYear);
}

function chicagoAuthor(author) {
  if (!author || author.includes(",") || author.includes("&")) {
    return author;
  }

  const parts = author.split(/\s+/);
  if (parts.length < 2 || author.toLowerCase().includes("observation")) {
    return author;
  }

  const last = parts.pop();
  return `${last}, ${parts.join(" ")}`;
}

function citationDetails(base, publisher, year) {
  const details = [publisher, year].filter(Boolean).map(escapeHtml).join(", ");
  return details ? `${base}. ${details}.` : `${base}.`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}

function normalize(value) {
  return value.toLowerCase().trim();
}

function getSearchBlob(item) {
  return Object.values(item).join(" ").toLowerCase();
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
    other: "Other Words",
  };
  return labels[partOfSpeech] || "Other Words";
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
    wordList.append(emptyState("No words match this search yet. Add one from the form, then it will alphabetize itself."));
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

    groupWords.forEach((entry) => {
      const card = wordTemplate.content.firstElementChild.cloneNode(true);
      card.querySelector("h3").textContent = entry.word;
      card.querySelector(".part").textContent = entry.partOfSpeech;
      card.querySelector(".definition").textContent = entry.definition;
      card.querySelector(".context").textContent = entry.context ? `Essay use: ${entry.context}` : "";

      const citation = chicagoBook(entry.bookTitle || "", entry.author || "", entry.publisher || "", entry.year || "");
      const learned = entry.learnedAt ? `Learned at: ${escapeHtml(entry.learnedAt)}` : "";
      card.querySelector("footer").innerHTML = [citation, learned].filter(Boolean).join("<br>");
      card.querySelector(".delete-word").addEventListener("click", () => deleteWord(entry.id));
      items.append(card);
    });

    group.append(heading, items);
    wordList.append(group);
  });

  updateCounts();
}

function renderProse() {
  const query = normalize(searchInput.value);
  const visibleProse = prose
    .filter((entry) => !query || getSearchBlob(entry).includes(query))
    .sort((a, b) => b.createdAt - a.createdAt);

  proseList.textContent = "";

  if (!visibleProse.length) {
    proseList.append(emptyState("No prose notes match this search yet."));
    updateCounts();
    return;
  }

  visibleProse.forEach((entry) => {
    const card = proseTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector("blockquote").textContent = entry.text;
    card.querySelector(".prose-note").textContent = entry.note || "";
    card.querySelector("footer").innerHTML = chicagoBook(
      entry.bookTitle || "",
      entry.author || "",
      entry.publisher || "",
      entry.year || "",
    );
    card.querySelector(".delete-prose").addEventListener("click", () => deleteProse(entry.id));
    proseList.append(card);
  });

  updateCounts();
}

function emptyState(message) {
  const state = document.createElement("p");
  state.className = "empty-state";
  state.textContent = message;
  return state;
}

function updateCounts() {
  wordCount.textContent = words.length;
  proseCount.textContent = prose.length;
}

function deleteWord(id) {
  words = words.filter((entry) => entry.id !== id);
  save();
  renderWords();
}

function deleteProse(id) {
  prose = prose.filter((entry) => entry.id !== id);
  save();
  renderProse();
}

async function fillDefinition() {
  const wordInput = document.querySelector("#word");
  const definitionInput = document.querySelector("#definition");
  const partOfSpeechInput = document.querySelector("#part-of-speech");
  const word = wordInput.value.trim();

  if (!word) {
    wordInput.focus();
    return false;
  }

  lookupDefinitionButton.textContent = "Filling...";
  lookupDefinitionButton.disabled = true;

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!response.ok) {
      throw new Error("No definition found");
    }

    const [entry] = await response.json();
    const meaning = entry.meanings?.[0];
    const definition = meaning?.definitions?.[0]?.definition;
    const part = meaning?.partOfSpeech;

    if (definition && !definitionInput.value.trim()) {
      definitionInput.value = definition;
    }

    if (part && ["noun", "verb", "adjective", "adverb"].includes(part)) {
      partOfSpeechInput.value = part;
    }

    return Boolean(definition);
  } catch (error) {
    return false;
  } finally {
    lookupDefinitionButton.textContent = "Fill Definition";
    lookupDefinitionButton.disabled = false;
  }
}

wordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const definitionInput = document.querySelector("#definition");
  if (!definitionInput.value.trim()) {
    await fillDefinition();
  }

  const data = new FormData(wordForm);

  words.push({
    id: crypto.randomUUID(),
    word: data.get("word").trim(),
    partOfSpeech: data.get("partOfSpeech"),
    definition: data.get("definition").trim(),
    context: data.get("context").trim(),
    bookTitle: data.get("bookTitle").trim(),
    author: data.get("author").trim(),
    publisher: data.get("publisher").trim(),
    year: data.get("year").trim(),
    learnedAt: data.get("learnedAt").trim(),
    createdAt: Date.now(),
  });

  wordForm.reset();
  save();
  renderWords();
});

proseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  prose.push({
    id: crypto.randomUUID(),
    text: document.querySelector("#prose-text").value.trim(),
    bookTitle: document.querySelector("#prose-book-title").value.trim(),
    author: document.querySelector("#prose-author").value.trim(),
    publisher: document.querySelector("#prose-publisher").value.trim(),
    year: document.querySelector("#prose-year").value.trim(),
    note: document.querySelector("#prose-note").value.trim(),
    createdAt: Date.now(),
  });

  proseForm.reset();
  save();
  renderProse();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderWords();
  });
});

searchInput.addEventListener("input", () => {
  renderWords();
  renderProse();
});

clearWordsButton.addEventListener("click", () => {
  words = [];
  prose = [];
  save();
  renderWords();
  renderProse();
});

lookupDefinitionButton.addEventListener("click", fillDefinition);

renderWords();
renderProse();
