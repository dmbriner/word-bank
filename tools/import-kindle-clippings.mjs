import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const { options, positionals } = parseCli(args);
const inputPath = positionals[0];

if (!inputPath) {
  console.error('Usage: node tools/import-kindle-clippings.mjs "/Volumes/Kindle/documents/My Clippings.txt" [--mode auto|word|prose] [--dry-run]');
  process.exit(1);
}

const mode = options.mode || "auto";
const app = options.app || "Kindle";
const dryRun = Boolean(options["dry-run"]);
const includeNotes = Boolean(options["include-notes"]);
const quiet = Boolean(options.quiet);
const limit = Number.parseInt(options.limit || "", 10);
const raw = await readFile(path.resolve(inputPath), "utf8");
const clippings = parseClippings(raw).filter((item) => item.text && (item.type === "highlight" || includeNotes));
const selected = Number.isFinite(limit) && limit > 0 ? clippings.slice(0, limit) : clippings;

let words = 0;
let prose = 0;
let skipped = 0;

for (const clipping of selected) {
  const target = chooseTarget(clipping.text, mode);

  if (!target) {
    skipped += 1;
    continue;
  }

  const commandArgs = [
    path.join(root, "tools", target === "word" ? "add-word.mjs" : "add-prose.mjs"),
    clipping.text,
    "--app",
    app,
  ];

  if (clipping.title) {
    commandArgs.push("--source-title", clipping.title);
  }
  if (clipping.author) {
    commandArgs.push("--author", clipping.author);
  }
  if (clipping.location) {
    commandArgs.push("--location", clipping.location);
  }

  if (dryRun) {
    console.log(`[dry-run] ${target}: ${clipping.text}`);
  } else {
    const result = spawnSync(process.execPath, commandArgs, {
      cwd: root,
      stdio: quiet ? "pipe" : "inherit",
      encoding: "utf8",
    });

    if (result.status !== 0) {
      if (quiet && result.stderr) {
        console.error(result.stderr.trim());
      }
      process.exit(result.status ?? 1);
    }
  }

  if (target === "word") {
    words += 1;
  } else {
    prose += 1;
  }
}

console.log(`${dryRun ? "Would import" : "Imported"} ${words} word${words === 1 ? "" : "s"} and ${prose} prose clipping${prose === 1 ? "" : "s"}.`);
if (skipped) {
  console.log(`Skipped ${skipped} clipping${skipped === 1 ? "" : "s"}.`);
}

function parseCli(values) {
  const parsed = {};
  const positionals = [];

  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const key = arg.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return { options: parsed, positionals };
}

function parseClippings(value) {
  return value
    .split(/\r?\n==========\r?\n?/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(parseBlock)
    .filter(Boolean);
}

function parseBlock(block) {
  const lines = block.split(/\r?\n/);
  const heading = lines.shift()?.trim() || "";
  const metadata = lines.shift()?.trim() || "";
  const text = lines.join("\n").trim();

  if (!heading || !metadata || !text) {
    return null;
  }

  const { title, author } = parseHeading(heading);

  return {
    title,
    author,
    location: parseLocation(metadata),
    type: parseType(metadata),
    text: text.replace(/\s+/g, " ").trim(),
  };
}

function parseHeading(value) {
  const match = value.match(/^(?<title>.+?)\s+\((?<author>[^()]+)\)$/);
  if (!match?.groups) {
    return { title: value, author: "" };
  }

  return {
    title: match.groups.title.trim(),
    author: match.groups.author.trim(),
  };
}

function parseType(metadata) {
  const lowered = metadata.toLowerCase();
  if (lowered.includes("note")) {
    return "note";
  }
  if (lowered.includes("highlight")) {
    return "highlight";
  }
  return "other";
}

function parseLocation(metadata) {
  const page = metadata.match(/\bpage\s+([0-9ivxlcdm-]+)/i)?.[1];
  const location = metadata.match(/\blocation\s+([0-9-]+)/i)?.[1];

  if (page && location) {
    return `page ${page}, location ${location}`;
  }
  if (page) {
    return `page ${page}`;
  }
  if (location) {
    return `location ${location}`;
  }

  return metadata.replace(/^-+\s*/, "").split("|")[0]?.trim() || "";
}

function chooseTarget(text, preferredMode) {
  if (preferredMode === "word" || preferredMode === "prose") {
    return preferredMode;
  }

  if (preferredMode !== "auto") {
    throw new Error(`Unknown mode: ${preferredMode}`);
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return wordCount <= 3 && text.length <= 48 ? "word" : "prose";
}
