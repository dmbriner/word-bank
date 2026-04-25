# Dana's Word Bank Mac Helpers

These local apps are wrappers around the scripts in `tools/`.

Build or rebuild them from the repo root:

```bash
./tools/build-mac-apps.zsh
```

Generated apps appear in this folder:

- `Save Word to Dana's Word Bank.app`
- `Save Word with Source to Dana's Word Bank.app`
- `Save Prose to Dana's Word Bank.app`
- `Import Kindle Clippings to Dana's Word Bank.app`

The save apps copy the selected text from the frontmost app, restore your clipboard, and save to the local word bank data. The importer asks you to choose a Kindle `My Clippings.txt` file.

macOS may ask for Accessibility permission the first time a save app tries to copy selected text.
