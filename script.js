const wordList = document.querySelector("#word-list");
const searchInput = document.querySelector("#search-input");
const filterButtons = document.querySelectorAll(".filter-button");
const wordCount = document.querySelector("#word-count");
const sourceCount = document.querySelector("#source-count");
const wordTemplate = document.querySelector("#word-card-template");

let words = [];
let activeFilter = "all";

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
    wordList.append(emptyState(words.length ? "No saved words match this search." : "No words have been published yet."));
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
  card.querySelector("footer").replaceChildren(...sourceNodes(entry.sources || []));
  return card;
}

function sourceNodes(sources) {
  if (!sources.length) {
    return [document.createTextNode("Saved by Dana")];
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
  sourceCount.textContent = new Set(words.flatMap((entry) => (entry.sources || []).map((source) => source.title || source.url || source.app))).size;
}

async function loadPublishedWords() {
  try {
    const response = await fetch("data/words.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Could not load published words");
    }

    const data = await response.json();
    words = Array.isArray(data.words) ? data.words : [];
  } catch (error) {
    words = [];
    wordList.append(emptyState("The published dictionary could not be loaded."));
  }

  renderWords();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderWords();
  });
});

searchInput.addEventListener("input", renderWords);

loadPublishedWords();
