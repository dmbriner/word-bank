const defaultSettings = {
  owner: "dmbriner",
  repo: "word-bank",
  branch: "main",
  dataPath: "data/words.json",
  token: "",
};

const validParts = new Set(["noun", "verb", "adjective", "adverb"]);

export async function getSettings() {
  const stored = await chrome.storage.local.get(defaultSettings);
  return { ...defaultSettings, ...stored };
}

export async function saveSettings(settings) {
  await chrome.storage.local.set({ ...settings });
}

export async function saveWordToGitHub({ word, source = null }) {
  const clean = cleanWord(word);
  if (!clean) {
    throw new Error("Select or type a word first.");
  }

  const settings = await getSettings();
  if (!settings.token) {
    throw new Error("Add a GitHub token in the extension options first.");
  }

  const dataFile = await fetchDataFile(settings);
  const data = JSON.parse(dataFile.content);
  const lookup = await lookupWord(clean);
  const existing = data.words.find((entry) => entry.word.toLowerCase() === clean.toLowerCase());

  if (existing) {
    Object.assign(existing, {
      ...lookup,
      sources: addSource(existing.sources || [], source),
      updatedAt: new Date().toISOString(),
    });
  } else {
    data.words.push({
      id: slugify(clean),
      word: clean,
      ...lookup,
      sources: addSource([], source),
      createdAt: new Date().toISOString(),
    });
  }

  data.words.sort((a, b) => a.word.localeCompare(b.word));
  await updateDataFile(settings, dataFile.sha, data, `${existing ? "Update" : "Add"} word: ${clean}`);

  return {
    status: existing ? "updated" : "added",
    word: clean,
    partOfSpeech: lookup.partOfSpeech,
  };
}

export async function saveManyWordsToGitHub({ words, source = null, onProgress = () => {} }) {
  const settings = await getSettings();
  if (!settings.token) {
    throw new Error("Add a GitHub token in the extension options first.");
  }

  const cleanedWords = [...new Set(words.map(cleanWord).filter(Boolean).map((item) => item.toLowerCase()))];
  if (!cleanedWords.length) {
    throw new Error("No words found to import.");
  }

  const dataFile = await fetchDataFile(settings);
  const data = JSON.parse(dataFile.content);
  let added = 0;
  let updated = 0;

  for (const [index, word] of cleanedWords.entries()) {
    onProgress(`Looking up ${word} (${index + 1}/${cleanedWords.length})`);
    const lookup = await lookupWord(word);
    const existing = data.words.find((entry) => entry.word.toLowerCase() === word.toLowerCase());

    if (existing) {
      Object.assign(existing, {
        ...lookup,
        sources: addSource(existing.sources || [], source),
        updatedAt: new Date().toISOString(),
      });
      updated += 1;
    } else {
      data.words.push({
        id: slugify(word),
        word,
        ...lookup,
        sources: addSource([], source),
        createdAt: new Date().toISOString(),
      });
      added += 1;
    }
  }

  data.words.sort((a, b) => a.word.localeCompare(b.word));
  await updateDataFile(settings, dataFile.sha, data, `Import ${cleanedWords.length} word${cleanedWords.length === 1 ? "" : "s"}`);

  return { added, updated, total: cleanedWords.length };
}

export async function lookupWord(value) {
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

    return { partOfSpeech, definition, example, essayContext: essayContextFor({ partOfSpeech, definition, example }) };
  } catch (error) {
    const fallback = {
      partOfSpeech: "other",
      definition: "Definition not found automatically.",
      example: "",
    };

    return {
      ...fallback,
      essayContext: essayContextFor(fallback),
    };
  }
}

function essayContextFor({ partOfSpeech, definition, example }) {
  if (example) {
    return `In context: ${example}`;
  }

  const cleanDefinition = definition.replace(/\.$/, "").toLowerCase();
  const templates = {
    adjective: `Useful when describing a person, argument, institution, or tone as ${cleanDefinition}.`,
    noun: `Useful when naming an abstract force, condition, or idea connected to ${cleanDefinition}.`,
    verb: `Useful when analyzing how someone acts, changes, limits, or produces an effect: ${cleanDefinition}.`,
    adverb: `Useful when sharpening how an action happens, especially when the manner matters: ${cleanDefinition}.`,
    other: `Useful when you need a precise phrase for ${cleanDefinition}.`,
  };

  return templates[partOfSpeech] || templates.other;
}

export function buildSource({ title = "", author = "", url = "", app = "", location = "", kind = "" } = {}) {
  const source = {
    kind: kind || (author ? "book" : ""),
    title: title.trim(),
    author: author.trim(),
    url: url.trim(),
    app: app.trim(),
    location: location.trim(),
    savedAt: new Date().toISOString(),
  };

  return source.title || source.author || source.url || source.app || source.location ? source : null;
}

export function parseWordInput(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => (typeof item === "string" ? item : item.word || ""));
    }

    if (Array.isArray(parsed.words)) {
      return parsed.words.map((item) => (typeof item === "string" ? item : item.word || ""));
    }
  } catch (error) {
    // Plain text import falls through below.
  }

  return trimmed
    .split(/[\n,;]+/)
    .map(cleanWord)
    .filter(Boolean);
}

function cleanWord(value) {
  return String(value)
    .trim()
    .replace(/^[^\w'-]+|[^\w'-]+$/g, "")
    .replace(/\s+/g, " ");
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

async function fetchDataFile(settings) {
  const url = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${settings.dataPath}?ref=${settings.branch}`;
  const response = await fetch(url, { headers: githubHeaders(settings.token) });

  if (!response.ok) {
    throw new Error(`Could not load ${settings.dataPath} from GitHub.`);
  }

  const payload = await response.json();
  return {
    sha: payload.sha,
    content: base64Decode(payload.content),
  };
}

async function updateDataFile(settings, sha, data, message) {
  const url = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${settings.dataPath}`;
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
    throw new Error(error.message || "Could not publish word to GitHub.");
  }
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
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
