#!/usr/bin/env bash
# ESLint 9 via Docker (node:20), sans installer npm en local. Cache npm dans un volume nommé.
set -euo pipefail
cd "$(dirname "$0")/../.."
docker run --rm -v "$PWD":/app -w /app -v chat2-npm-cache:/root/.npm node:20 \
  npx -y eslint@9 -c chat2/eslint.config.js chat2/js chat2/tools chat2/test "$@"
