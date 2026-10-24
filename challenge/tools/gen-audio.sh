#!/usr/bin/env bash
# challenge/tools/gen-audio.sh — prononciations anglaises (piper, voix en_GB) en .ogg.
# Usage : challenge/tools/gen-audio.sh [--force]
set -euo pipefail
cd "$(dirname "$0")/../.."
FORCE=${1:-}
mkdir -p challenge/audio/phrases
LISTE=$(mktemp)
trap 'rm -f "$LISTE"' EXIT
node challenge/tools/liste-audio.mjs > "$LISTE"
docker run --rm -i -v "$PWD/challenge/audio":/out -v piper-voices:/voices -v "$LISTE":/liste.tsv:ro \
  -e FORCE="$FORCE" python:3.12-slim bash -euo pipefail -c '
    apt-get update -qq && apt-get install -y -qq ffmpeg curl >/dev/null
    pip install -q piper-tts
    mkdir -p /out/phrases
    V=/voices/en_GB-alba-medium.onnx
    BASE=https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alba/medium
    [ -f "$V" ] || curl -sSL -o "$V" "$BASE/en_GB-alba-medium.onnx"
    [ -f "$V.json" ] || curl -sSL -o "$V.json" "$BASE/en_GB-alba-medium.onnx.json"
    while IFS=$'"'"'\t'"'"' read -r slug mot; do
      [ -f "/out/$slug.ogg" ] && [ "$FORCE" != "--force" ] && continue
      # Débit ralenti (1,35) et 0,3 s de silence avant et après, pour que le début
      # du mot ne soit plus avalé (choix de Sophie, « voix 1 »). Pas d apostrophe ici : script entre quotes.
      echo "$mot" | piper -m "$V" --length_scale 1.35 -f /tmp/w.wav
      ffmpeg -nostdin -loglevel error -y -i /tmp/w.wav -af "adelay=300:all=1,apad=pad_dur=0.3" \
        -ac 1 -c:a libopus -b:a 24k "/out/$slug.ogg"
    done < /liste.tsv
    chown -R '"$(id -u):$(id -g)"' /out'
