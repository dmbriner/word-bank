#!/bin/zsh
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

MODE="${1:-auto}"
if [[ "$#" -gt 0 ]]; then
  shift
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"

if [[ -z "$NODE_BIN" ]]; then
  osascript -e 'display notification "Node.js was not found. Install Node or set NODE_BIN." with title "Dana'\''s Word Bank"'
  exit 1
fi

SOURCE_TITLE=""
AUTHOR=""
LOCATION=""
APP_NAME=""
ASK_SOURCE=false

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --source-title|--title)
      SOURCE_TITLE="${2:-}"
      shift 2
      ;;
    --author)
      AUTHOR="${2:-}"
      shift 2
      ;;
    --location)
      LOCATION="${2:-}"
      shift 2
      ;;
    --app)
      APP_NAME="${2:-}"
      shift 2
      ;;
    --ask-source|--ask-book)
      ASK_SOURCE=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

FRONT_INFO="$(osascript <<'APPLESCRIPT'
tell application "System Events"
  set frontApp to name of first application process whose frontmost is true
  set windowTitle to ""
  try
    set windowTitle to name of front window of application process frontApp
  end try
  return frontApp & linefeed & windowTitle
end tell
APPLESCRIPT
)"

DETECTED_APP="$(printf '%s\n' "$FRONT_INFO" | sed -n '1p')"
DETECTED_TITLE="$(printf '%s\n' "$FRONT_INFO" | sed -n '2p')"

if [[ -z "$APP_NAME" ]]; then
  APP_NAME="$DETECTED_APP"
fi

if [[ -z "$SOURCE_TITLE" ]]; then
  SOURCE_TITLE="$DETECTED_TITLE"
fi

if [[ "$ASK_SOURCE" == true ]]; then
  SOURCE_INFO="$(osascript - "$SOURCE_TITLE" "$AUTHOR" "$LOCATION" <<'APPLESCRIPT'
on run argv
  set defaultTitle to item 1 of argv
  set defaultAuthor to item 2 of argv
  set defaultLocation to item 3 of argv

  set titleDialog to display dialog "Book title or source" default answer defaultTitle buttons {"Cancel", "Continue"} default button "Continue"
  set authorDialog to display dialog "Author (optional)" default answer defaultAuthor buttons {"Continue"} default button "Continue"
  set locationDialog to display dialog "Page, chapter, or location (optional)" default answer defaultLocation buttons {"Continue"} default button "Continue"

  return (text returned of titleDialog) & linefeed & (text returned of authorDialog) & linefeed & (text returned of locationDialog)
end run
APPLESCRIPT
)"
  SOURCE_TITLE="$(printf '%s\n' "$SOURCE_INFO" | sed -n '1p')"
  AUTHOR="$(printf '%s\n' "$SOURCE_INFO" | sed -n '2p')"
  LOCATION="$(printf '%s\n' "$SOURCE_INFO" | sed -n '3p')"
fi

OLD_CLIPBOARD="$(pbpaste 2>/dev/null || true)"

osascript -e 'tell application "System Events" to keystroke "c" using command down'
sleep 0.25

SELECTION="$(pbpaste 2>/dev/null | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
printf '%s' "$OLD_CLIPBOARD" | pbcopy

if [[ -z "$SELECTION" ]]; then
  osascript -e 'display notification "No selected text was copied." with title "Dana'\''s Word Bank"'
  exit 1
fi

WORD_COUNT="$(printf '%s' "$SELECTION" | wc -w | tr -d ' ')"
TARGET="$MODE"

if [[ "$MODE" == "auto" ]]; then
  if [[ "$WORD_COUNT" -le 3 ]]; then
    TARGET="word"
  else
    TARGET="prose"
  fi
fi

COMMON_ARGS=()
if [[ -n "$SOURCE_TITLE" ]]; then
  COMMON_ARGS+=(--source-title "$SOURCE_TITLE")
fi
if [[ -n "$AUTHOR" ]]; then
  COMMON_ARGS+=(--author "$AUTHOR")
fi
if [[ -n "$LOCATION" ]]; then
  COMMON_ARGS+=(--location "$LOCATION")
fi
if [[ -n "$APP_NAME" ]]; then
  COMMON_ARGS+=(--app "$APP_NAME")
fi

case "$TARGET" in
  word)
    "$NODE_BIN" "$ROOT_DIR/tools/add-word.mjs" "$SELECTION" "${COMMON_ARGS[@]}"
    osascript -e 'display notification "Saved selected word." with title "Dana'\''s Word Bank"'
    ;;
  prose|phrase|phrasing)
    "$NODE_BIN" "$ROOT_DIR/tools/add-prose.mjs" "$SELECTION" "${COMMON_ARGS[@]}"
    osascript -e 'display notification "Saved selected prose." with title "Dana'\''s Word Bank"'
    ;;
  *)
    echo "Unknown mode: $TARGET" >&2
    exit 1
    ;;
esac
