#!/bin/sh
# Builds dist/prompt-engineer-<version>.zip for upload to the Chrome Web Store.
set -e
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./src/manifest.json').version")
mkdir -p dist
rm -f "dist/prompt-engineer-$VERSION.zip"
(cd src && zip -qr "../dist/prompt-engineer-$VERSION.zip" . -x ".*")
echo "dist/prompt-engineer-$VERSION.zip"
