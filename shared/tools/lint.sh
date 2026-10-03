#!/usr/bin/env bash
# ESLint 9 via Docker (node:20) sur le code partagé (personnage, garde-robe) et
# les jeux qui l'utilisent. Même cache npm que chat2/tools/lint.sh.
set -euo pipefail
cd "$(dirname "$0")/../.."
docker run --rm -v "$PWD":/app -w /app -v chat2-npm-cache:/root/.npm node:20 \
  npx -y eslint@9 -c shared/eslint.config.js shared habille/js etoiles3d/js defile/js monde/atelier/js "$@"
