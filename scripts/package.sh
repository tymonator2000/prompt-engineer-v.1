#!/bin/sh
# Builds dist/arkanum-<version>.zip for upload to the Chrome Web Store.
set -e
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./src/manifest.json').version")
mkdir -p dist
rm -f "dist/arkanum-$VERSION.zip"
(cd src && zip -qr "../dist/arkanum-$VERSION.zip" . -x ".*")
echo "dist/arkanum-$VERSION.zip"
