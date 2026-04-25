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

The script fills in the definition and grammar category automatically, then updates `data/words.json`. Commit and deploy the changed data file to publish the word.

## Future Capture

Kindle and Apple Books native apps do not expose reading context directly to a static website. To automate those securely, the next step is a private capture tool that authenticates as Dana and writes to this repository or to a small backend, while the public website remains read-only.
