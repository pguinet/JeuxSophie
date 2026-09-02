#!/usr/bin/env bash
# Capture d'écran headless (WebGL via SwiftShader) d'une URL servie en HTTP.
# Usage : chat2/tools/screenshot.sh <url> <sortie.png> [largeur hauteur] [budget_ms]
set -euo pipefail
URL="${1:?url}"; OUT="${2:?sortie.png}"; W="${3:-1280}"; H="${4:-800}"; BUDGET="${5:-8000}"
# CHROME_LOG=<fichier> : enregistre la console JS (erreurs de shaders, exceptions) dans ce fichier.
LOGFLAGS=()
if [[ -n "${CHROME_LOG:-}" ]]; then LOGFLAGS=(--enable-logging=stderr --v=0); fi
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader "${LOGFLAGS[@]}" \
  --window-size="${W},${H}" --virtual-time-budget="${BUDGET}" \
  --screenshot="${OUT}" "${URL}" >/dev/null 2>"${CHROME_LOG:-/dev/null}"
echo "capture : ${OUT}"
