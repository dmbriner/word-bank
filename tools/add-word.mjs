import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data", "words.json");
const validParts = new Set(["noun", "verb", "adjective", "adverb"]);

const args = process.argv.slice(2);
const word = cleanWord(args[0] || "");
const options = parseOptions(args.slice(1));

if (!word) {
  console.error("Usage: node tools/add-word.mjs <word> [--source-title \"Book\"] [--source-url \"https://...\"] [--app \"Kindle\"]");
  process.exit(1);
}

const data = JSON.parse(await readFile(dataPath, "utf8"));
const lookup = await lookupWord(word);
const source = buildSource(options);
const existing = data.words.find((entry) => entry.word.toLowerCase() === word.toLowerCase());

if (existing) {
  Object.assign(existing, {
    ...lookup,
    sources: addSource(existing.sources || [], source),
    updatedAt: new Date().toISOString(),
  });
  console.log(`Updated ${word}`);
} else {
  data.words.push({
    id: slugify(word),
    word,
    ...lookup,
    sources: addSource([], source),
    createdAt: new Date().toISOString(),
  });
  console.log(`Added ${word}`);
}

data.words.sort((a, b) => a.word.localeCompare(b.word));
await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`);

function parseOptions(optionArgs) {
  const parsed = {};

  for (let index = 0; index < optionArgs.length; index += 1) {
    const arg = optionArgs[index];
    if (!arg.startsWith("--")) {
      continue;
    }

    const key = arg.slice(2);
    const value = optionArgs[index + 1] && !optionArgs[index + 1].startsWith("--") ? optionArgs[index + 1] : "";
    parsed[key] = value;

    if (value) {
      index += 1;
    }
  }

  return parsed;
}

function cleanWord(value) {
  return value
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

function buildSource(parsed) {
  const title = parsed["source-title"] || parsed.title || "";
  const url = parsed["source-url"] || parsed.url || "";
  const app = parsed.app || "";
  const author = parsed.author || "";
  const location = parsed.location || "";
  const kind = parsed.kind || (author ? "book" : "");

  if (!title && !url && !app && !author && !location) {
    return null;
  }

  return {
    kind,
    title,
    author,
    url,
    app,
    location,
    savedAt: new Date().toISOString(),
  };
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
