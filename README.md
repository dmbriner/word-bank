# Dana's Word Bank

A public, read-only word bank for Dana's essay vocabulary. The site displays a shared dictionary from `data/words.json`; only someone with write access to this repository can publish new words.

Deploy target:

```text
https://dmbriner.github.io/word-bank/
```

The site is plain HTML, CSS, and JavaScript, so GitHub Pages can serve it directly from the repository root.

## Add Words

From this repository, run:

```bash
node tools/add-word.mjs obsequious
```

Optionally include source metadata:

```bash
node tools/add-word.mjs obsequious --source-title "Trillion Dollar Triage" --app Kindle
```

For a book source, include the author and optional location:

```bash
node tools/add-word.mjs sacrosanct --source-title "More Money than God" --author "Sebastian Mallaby" --location "chapter 2" --app Kindle
```

The script fills in the definition and grammar category automatically, then updates `data/words.json`. Commit and deploy the changed data file to publish the word.

## Add Favorite Prose

```bash
node tools/add-prose.mjs "Ambiguity has its uses" --source-title "Trillion Dollar Triage" --author "Nick Timiraos"
```

This updates `data/prose.json`, which feeds the public Favorite Phrasings section.

## Private Chrome Extension

This repo includes an unpacked Chrome extension in `extension/`.

Extension directory to select in Chrome:

```text
/Users/danabriner/Desktop/Projects/word-bank/extension
```

Install it:

1. Open Chrome and go to `chrome://extensions`.
2. Turn on Developer Mode.
3. Click **Load unpacked**.
4. Select `/Users/danabriner/Desktop/Projects/word-bank/extension`.
5. Pin **Dana's Word Bank** from the puzzle-piece extensions menu.
6. Open the extension options.
7. Add a fine-grained GitHub token that can read/write repository contents for `dmbriner/word-bank`.

Extension options:

```text
Owner: dmbriner
Repository: word-bank
Branch: main
Data path: data/words.json
```

Once configured, you can:

- Select a word in Chrome and right-click “Save to Dana's Word Bank.”
- Select a word in a browser-based book and press Command+Shift+S.
- Use the extension popup for quick manual saves.
- Use the extension options page to add book metadata or bulk upload a word list.

This works for web reading, including Kindle Cloud Reader in Chrome. It cannot read selections from native Kindle or Apple Books/iBooks apps, because Chrome extensions only run in Chrome.

## Mac Book Helper

The Mac helper saves selected text from native apps like Apple Books or Kindle by briefly copying the current selection, restoring your clipboard, and then updating the local data files.

Generated helper apps live here:

```text
/Users/danabriner/Desktop/Projects/word-bank/mac-apps
```

The available helper apps are:

- `Save Word to Dana's Word Bank.app`
- `Save Word with Source to Dana's Word Bank.app`
- `Save Prose to Dana's Word Bank.app`
- `Import Kindle Clippings to Dana's Word Bank.app`

You can also run the underlying scripts from Terminal:

```bash
/Users/danabriner/Desktop/Projects/word-bank/tools/capture-word-mac.zsh
/Users/danabriner/Desktop/Projects/word-bank/tools/capture-prose-mac.zsh
/Users/danabriner/Desktop/Projects/word-bank/tools/capture-auto-mac.zsh
```

Add `--ask-source` when you want the helper to prompt for book title, author, and page/location before saving:

```bash
/Users/danabriner/Desktop/Projects/word-bank/tools/capture-word-mac.zsh --ask-source
```

macOS may ask for Accessibility permission so the helper can copy the selected text from the front app. The helper can capture selected text and the front window title, but native book apps do not always expose perfect book metadata.

## Kindle Clippings Importer

For Kindle devices or Kindle apps that export `My Clippings.txt`, import highlights with:

```bash
node tools/import-kindle-clippings.mjs "/Volumes/Kindle/documents/My Clippings.txt"
```

Preview first without changing data:

```bash
node tools/import-kindle-clippings.mjs "/Volumes/Kindle/documents/My Clippings.txt" --dry-run
```

The importer sends short one-to-three-word clippings to the vocabulary dictionary and longer highlights to Favorite Phrasings. It also carries over the book title, author, page/location, and Kindle as the source app when that metadata exists.

## Publishing Changes

After using the local helper/importer, commit and push the changed `data/` files to publish them to the public website.
