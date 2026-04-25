#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT_DIR/mac-apps"
SRC_DIR="$APP_DIR/src"

mkdir -p "$APP_DIR"

osacompile -l JavaScript -o "$APP_DIR/Save Word to Dana's Word Bank.app" "$SRC_DIR/save-word.js"
osacompile -l JavaScript -o "$APP_DIR/Save Word with Source to Dana's Word Bank.app" "$SRC_DIR/save-word-with-source.js"
osacompile -l JavaScript -o "$APP_DIR/Save Prose to Dana's Word Bank.app" "$SRC_DIR/save-prose.js"
osacompile -l JavaScript -o "$APP_DIR/Import Kindle Clippings to Dana's Word Bank.app" "$SRC_DIR/import-kindle-clippings.js"

echo "Built Dana's Word Bank Mac helper apps in $APP_DIR"
