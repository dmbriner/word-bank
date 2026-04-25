# Dana's Word Bank Capture Extension

This is a private unpacked Chrome extension for saving words to Dana's public read-only dictionary.

## Install

Extension directory to select in Chrome:

```text
/Users/danabriner/Desktop/Projects/word-bank/extension
```

1. Open Chrome and go to `chrome://extensions`.
2. Turn on Developer Mode.
3. Click **Load unpacked**.
4. Select `/Users/danabriner/Desktop/Projects/word-bank/extension`.
5. Pin **Dana's Word Bank** from the puzzle-piece extensions menu.
6. Open the extension options.
7. Add a fine-grained GitHub token with repository contents read/write access for `dmbriner/word-bank`.

Use these option values:

```text
Owner: dmbriner
Repository: word-bank
Branch: main
Data path: data/words.json
```

## Use

- Select a word in Chrome, right-click it, and choose **Save to Dana's Word Bank**.
- In browser-based books, select a word and press **Command+Shift+S** on Mac or **Ctrl+Shift+S** on Windows.
- Open the web capture page from the popup when you want to add prose or fuller source details.
- Use the popup for a quick manual save.
- Use the options page to add book metadata or bulk upload a word list.

## Book Readers

Works best in browser readers:

- Kindle Cloud Reader: `https://read.amazon.com`
- Google Books / Google Play Books in Chrome
- Internet Archive books in Chrome
- Articles, PDFs, and webpages opened in Chrome

If right-click does not show the extension menu inside a reader, use the keyboard shortcut instead.

## Limits

This works inside Chrome. It cannot read selected text from native Kindle or Apple Books/iBooks apps because Chrome extensions cannot run inside other Mac apps. Those need a separate Mac local app, import tool, or Shortcut.

The repo includes that local helper in `tools/`:

- `tools/capture-word-mac.zsh` saves selected native-app text as a vocabulary word.
- `tools/capture-prose-mac.zsh` saves selected native-app text as a favorite phrasing.
- `tools/import-kindle-clippings.mjs` imports Kindle `My Clippings.txt` exports.

Add `--ask-source` to a Mac helper command when you want it to prompt for book title, author, and page/location before saving.
