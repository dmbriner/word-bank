const app = Application.currentApplication();
app.includeStandardAdditions = true;

const projectRoot = "/Users/danabriner/Desktop/Projects/word-bank";
const clippingFile = app.chooseFile({
  withPrompt: "Choose your Kindle My Clippings.txt file",
});

const command = [
  "export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH",
  `cd ${shellQuote(projectRoot)}`,
  `node ${shellQuote(`${projectRoot}/tools/import-kindle-clippings.mjs`)} ${shellQuote(clippingFile.toString())} --quiet`,
].join("; ");

const result = app.doShellScript(command);
app.displayDialog(result, {
  buttons: ["Done"],
  defaultButton: "Done",
  withTitle: "Dana's Word Bank",
});

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}
