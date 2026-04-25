import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data", "prose.json");
const args = process.argv.slice(2);
const text = args[0]?.trim() || "";
const options = parseOptions(args.slice(1));

if (!text) {
  console.error('Usage: node tools/add-prose.mjs "favorite phrase" [--source-title "Book"] [--author "Author"] [--location "page 42"] [--app "Kindle"]');
  process.exit(1);
}

const data = JSON.parse(await readFile(dataPath, "utf8"));
const existing = data.prose.find((entry) => entry.text.toLowerCase() === text.toLowerCase());

const entry = {
  id: existing?.id || slugify(text).slice(0, 80),
  text,
  kind: options.kind || (options.author ? "book" : ""),
  sourceTitle: options["source-title"] || options.title || "",
  sourceAuthor: options.author || "",
  location: options.location || "",
  app: options.app || "",
  url: options.url || options["source-url"] || "",
  createdAt: existing?.createdAt || new Date().toISOString(),
  updatedAt: existing ? new Date().toISOString() : undefined,
};

if (existing) {
  Object.assign(existing, entry);
  console.log(`Updated prose: ${text}`);
} else {
  data.prose.unshift(entry);
  console.log(`Added prose: ${text}`);
}

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

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
