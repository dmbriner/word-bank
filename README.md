# Dana's Word Bank

A public, read-only word bank for Dana's essay vocabulary. The site displays a shared dictionary from `data/words.json`; only someone with write access to this repository can publish new words.

Deploy target:

```text
https://dmbriner.github.io/word-bank/
```

The site is plain HTML, CSS, and JavaScript, so GitHub Pages can serve it directly from the repository root.

## Web Capture

Use the private capture page from a browser or phone:

```text
https://dmbriner.github.io/word-bank/admin.html
```

Open **Connection** and use:

```text
Owner: dmbriner
Repository: word-bank
Branch: main
Words path: data/words.json
Prose path: data/prose.json
```

Paste a fine-grained GitHub token with repository contents read/write access for `dmbriner/word-bank`. The token is saved only in that browser. The page publishes words, favorite prose, and shared source metadata to the public site.

Smart capture features:

- The word form previews grammar type, definition, and an essay-use context before publishing.
- The source form can look up a book title through Google Books, fill the author, and show a Chicago-style preview.
- The phone web app uses the generated Dana's Word Bank icon from `icons/`.

## Private Chrome Extension

Extension directory to select in Chrome:

```text
/Users/danabriner/Desktop/Projects/word-bank/extension
```

The extension uses the same GitHub data path as the web capture page. Paste the same token in the extension options if you want right-click and keyboard capture inside Chrome.

## Optional Local Tools

The older Mac helper scripts are still in `tools/`, but the web capture page is now the simpler path for everyday use.
