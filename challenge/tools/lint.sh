#!/usr/bin/env bash
# challenge/tools/lint.sh — ESLint 9 via Docker (node:20), même cache npm que chat2.
set -euo pipefail
cd "$(dirname "$0")/../.."
docker run --rm -v "$PWD":/app -w /app -v chat2-npm-cache:/root/.npm node:20 \
  npx -y eslint@9 --no-error-on-unmatched-pattern -c challenge/eslint.config.js challenge/js challenge/tools challenge/test "$@"
