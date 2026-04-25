# Dana's Word Bank Capture Extension

This is a private unpacked Chrome extension for saving words to Dana's public read-only dictionary.

## Install

1. Open `chrome://extensions`.
2. Turn on Developer Mode.
3. Click **Load unpacked**.
4. Select this `extension/` folder.
5. Open the extension options.
6. Add a fine-grained GitHub token with repository contents read/write access for `dmbriner/word-bank`.

## Use

- Select a word in Chrome, right-click it, and choose **Save to Dana's Word Bank**.
- In browser-based books, select a word and press **Command+Shift+S** on Mac or **Ctrl+Shift+S** on Windows.
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
