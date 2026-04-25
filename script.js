const wordList = document.querySelector("#word-list");
const proseList = document.querySelector("#prose-list");
const searchInput = document.querySelector("#search-input");
const filterButtons = document.querySelectorAll(".filter-button");
const wordCount = document.querySelector("#word-count");
const proseCount = document.querySelector("#prose-count");
const wordTemplate = document.querySelector("#word-card-template");
const proseTemplate = document.querySelector("#prose-card-template");

let words = [];
let prose = [];
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

function getProseSearchBlob(item) {
  return [item.text, item.title, item.author, item.sourceTitle, item.sourceAuthor, item.location, item.app].join(" ").toLowerCase();
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

function renderProse() {
  const query = normalize(searchInput.value);
  const visibleProse = prose.filter((entry) => !query || getProseSearchBlob(entry).includes(query));

  proseList.textContent = "";

  if (!visibleProse.length) {
    proseList.append(emptyState(prose.length ? "No favorite phrasings match this search." : "No favorite phrasings have been published yet."));
    updateCounts();
    return;
  }

  visibleProse.forEach((entry) => proseList.append(proseCard(entry)));
  updateCounts();
}

function proseCard(entry) {
  const card = proseTemplate.content.firstElementChild.cloneNode(true);
  card.querySelector("blockquote").textContent = entry.text;
  const footer = card.querySelector("footer");
  footer.replaceChildren(...proseSourceNodes(entry));
  footer.hidden = !footer.childNodes.length;
  return card;
}

function proseSourceNodes(entry) {
  const source = {
    kind: entry.kind || (entry.sourceAuthor || entry.author ? "book" : ""),
    title: entry.sourceTitle || entry.title || "",
    author: entry.sourceAuthor || entry.author || "",
    location: entry.location || "",
    app: entry.app || "",
    url: entry.url || "",
  };

  if (!source.title && !source.author && !source.location && !source.app && !source.url) {
    return [];
  }

  return sourceLabelNodes(source);
}

function wordCard(entry) {
  const card = wordTemplate.content.firstElementChild.cloneNode(true);
  card.querySelector("h3").textContent = entry.word;
  card.querySelector(".part").textContent = entry.partOfSpeech;
  card.querySelector(".definition").textContent = entry.definition;
  card.querySelector(".example").textContent = entry.example
    ? `Example: ${entry.example}`
    : entry.essayContext
      ? `Essay context: ${entry.essayContext}`
      : "";
  const footer = card.querySelector("footer");
  footer.replaceChildren(...sourceNodes(entry.sources || []));
  footer.hidden = !footer.childNodes.length;
  return card;
}

function sourceNodes(sources) {
  return sources.flatMap((source, index) => {
    if (!hasSourceDetails(source)) {
      return [];
    }

    const separator = index ? [document.createElement("br")] : [];
    const node = source.url && source.kind !== "book" ? document.createElement("a") : document.createElement("span");
    node.append(...sourceLabelNodes(source));

    if (source.url) {
      node.href = source.url;
      node.target = "_blank";
      node.rel = "noreferrer";
      node.className = "source-link";
    }

    return [...separator, node];
  });
}

function sourceLabelNodes(source) {
  const nodes = [document.createTextNode("Saved from ")];

  if (source.kind === "book" && source.title) {
    if (source.author) {
      nodes.push(document.createTextNode(`${formatChicagoAuthor(source.author)}. `));
    }

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

  nodes.push(document.createTextNode(source.title || source.app || source.url || "Captured source"));
  return nodes;
}

function hasSourceDetails(source) {
  return Boolean(source?.title || source?.author || source?.location || source?.app || source?.url);
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

async function loadPublishedProse() {
  try {
    const response = await fetch("data/prose.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Could not load published prose");
    }

    const data = await response.json();
    prose = Array.isArray(data.prose) ? data.prose : [];
  } catch (error) {
    prose = [];
    proseList.append(emptyState("The published prose could not be loaded."));
  }

  renderProse();
}

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

loadPublishedWords();
loadPublishedProse();
