#!/usr/bin/env bash
# Build a clean Chrome Web Store upload zip.
# Usage: ./scripts/package.sh

set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
OUT="find-preprint-v${VERSION}.zip"

rm -f "$OUT"

# Only ship the files Chrome actually needs to run the extension. Docs,
# scripts, repo metadata, and dotfiles are excluded.
zip -r "$OUT" \
  manifest.json \
  src \
  icons \
  -x '*.DS_Store' '*/.DS_Store' '*.swp' '*~'

echo
echo "Wrote $OUT ($(du -h "$OUT" | cut -f1))"
echo
echo "Contents:"
unzip -l "$OUT"
