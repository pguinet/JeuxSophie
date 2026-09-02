#!/usr/bin/env bash
# Capture d'écran headless (WebGL via SwiftShader) d'une URL servie en HTTP.
# Usage : chat2/tools/screenshot.sh <url> <sortie.png> [largeur hauteur] [budget_ms]
set -euo pipefail
URL="${1:?url}"; OUT="${2:?sortie.png}"; W="${3:-1280}"; H="${4:-800}"; BUDGET="${5:-8000}"
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader \
  --window-size="${W},${H}" --virtual-time-budget="${BUDGET}" \
  --screenshot="${OUT}" "${URL}" >/dev/null 2>&1
echo "capture : ${OUT}"
