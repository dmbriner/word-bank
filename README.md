# Dana's Word Bank

A private, static word bank for bookmarking essay vocabulary. Type or capture a word and the site fills in the definition and grammar category automatically.

Deploy target:

```text
https://dmbriner.github.io/word-bank/
```

The site is plain HTML, CSS, and JavaScript, so GitHub Pages can serve it directly from the repository root.

## Capture Hook

The site can auto-save words from a URL with query parameters:

```text
https://dmbriner.github.io/word-bank/?word=obsequious&sourceTitle=Article%20Title&sourceUrl=https%3A%2F%2Fexample.com
```

That is the path a bookmarklet or browser extension should use. A simple web-reading bookmarklet can send the selected word and page title:

```javascript
javascript:(()=>{const word=(getSelection()+"").trim();if(!word){alert("Select a word first.");return;}const url=new URL("https://dmbriner.github.io/word-bank/");url.searchParams.set("word",word);url.searchParams.set("sourceTitle",document.title);url.searchParams.set("sourceUrl",location.href);location.href=url.toString();})();
```

Kindle and Apple Books native apps do not expose reading context directly to a static website. To automate those, the next step is a companion importer for Kindle Vocabulary Builder / highlights exports or an Apple Books local-library importer.
