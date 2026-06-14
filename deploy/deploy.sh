#!/usr/bin/env bash
#
# deploy.sh — Envoie les jeux de Sophie vers le Raspberry Pi via rsync/SSH.
#
# Usage :
#   ./deploy/deploy.sh                # déploie avec les valeurs par défaut ci-dessous
#   PI_HOST=monpi.local ./deploy/deploy.sh
#   ./deploy/deploy.sh --dry-run      # simule sans rien copier
#
# Prérequis :
#   - rsync installé sur le poste de dev ET sur le Pi
#   - un accès SSH au Pi (idéalement par clé : ssh-copy-id pi@<PI_HOST>)
#   - le dossier cible appartient à l'utilisateur SSH (voir deploy/README.md)

set -euo pipefail

# --- Réglages (surchargeables par variables d'environnement) -----------------
PI_HOST="${PI_HOST:-jeux.local}"           # nom mDNS ou IP du Pi
PI_USER="${PI_USER:-sophie}"               # utilisateur SSH
PI_PATH="${PI_PATH:-/var/www/jeux}"        # docroot servi par lighttpd
SSH_PORT="${SSH_PORT:-22}"

# --- Racine du dépôt (le script vit dans deploy/) ----------------------------
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- Option --dry-run --------------------------------------------------------
RSYNC_EXTRA=()
if [[ "${1:-}" == "--dry-run" ]]; then
    RSYNC_EXTRA+=(--dry-run --verbose)
    echo ">> Mode simulation (--dry-run) : aucun fichier ne sera copié."
fi

echo ">> Déploiement de ${REPO_ROOT}"
echo ">> Vers     ${PI_USER}@${PI_HOST}:${PI_PATH} (port ${SSH_PORT})"

rsync -az --delete \
    "${RSYNC_EXTRA[@]}" \
    -e "ssh -p ${SSH_PORT}" \
    --exclude='.git/' \
    --exclude='.claude/' \
    --exclude='docs/' \
    --exclude='deploy/' \
    --exclude='croquis.pdf' \
    --exclude='CLAUDE.md' \
    --exclude='.gitignore' \
    "${REPO_ROOT}/" \
    "${PI_USER}@${PI_HOST}:${PI_PATH}/"

echo ">> Terminé. Jeux accessibles sur http://${PI_HOST}/"
