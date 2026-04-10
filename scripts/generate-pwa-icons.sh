#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT_DIR/public/favicon.svg"

generate_png() {
  local size="$1"
  local output="$2"

  sips -s format png -z "$size" "$size" "$SOURCE" --out "$ROOT_DIR/public/$output" >/dev/null
}

generate_png 16 favicon-16x16.png
generate_png 32 favicon-32x32.png
generate_png 180 apple-touch-icon.png
generate_png 192 pwa-192x192.png
generate_png 512 pwa-512x512.png
generate_png 192 maskable-192x192.png
generate_png 512 maskable-512x512.png
