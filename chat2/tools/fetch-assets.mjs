#!/usr/bin/env node
/**
 * Télécharge les assets Poly Haven (licence CC0) listés dans `chat2/assets/manifest.json`
 * vers `chat2/assets/`, puis (re)génère `chat2/assets/CREDITS.md`.
 *
 *   node chat2/tools/fetch-assets.mjs            # télécharge ce qui manque
 *   node chat2/tools/fetch-assets.mjs --dry-run  # affiche le plan et les tailles, sans rien écrire
 *   node chat2/tools/fetch-assets.mjs --force    # re-télécharge même les fichiers déjà présents
 *
 * Idempotent : un fichier déjà présent avec la taille attendue est sauté.
 * Un asset introuvable est signalé clairement et n'interrompt pas les autres.
 *
 * Arborescence produite :
 *   assets/textures/<id>/<id>_<map>_<res>.jpg     (nom de fichier d'origine Poly Haven)
 *   assets/hdri/<id>_<res>.hdr
 *   assets/models/<id>/<id>_<res>.gltf + <id>.bin + textures/…   (chemins relatifs du .gltf conservés)
 *
 * Node >= 18 (fetch natif), aucune dépendance.
 */
import { mkdir, readFile, writeFile, stat, rename } from 'node:fs/promises';
import { dirname, join, resolve, basename, relative, isAbsolute, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.polyhaven.com';
const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = resolve(HERE, '../assets');
const MANIFEST_PATH = join(ASSETS_DIR, 'manifest.json');
const CREDITS_PATH = join(ASSETS_DIR, 'CREDITS.md');

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const FORCE = args.has('--force');

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/** Taille lisible, base 1024 (comme `du -h`). */
function fmt(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${bytes} o`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
  return res.json();
}

/** `GET /files/<id>` — l'API renvoie un objet vide (ou une erreur) pour un id inconnu. */
async function getFiles(id) {
  let data;
  try {
    data = await fetchJson(`${API}/files/${encodeURIComponent(id)}`);
  } catch (err) {
    throw new Error(`asset « ${id} » introuvable sur Poly Haven (${err.message})`);
  }
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    throw new Error(`asset « ${id} » introuvable sur Poly Haven (réponse vide)`);
  }
  return data;
}

/** Refuse tout chemin qui sortirait de `assets/` (clé `include` malveillante ou mal formée). */
function safeDest(...parts) {
  const dest = resolve(ASSETS_DIR, ...parts);
  const rel = relative(ASSETS_DIR, dest);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`chemin de destination hors de assets/ refusé : ${parts.join('/')}`);
  }
  return dest;
}

async function fileSize(path) {
  try {
    return (await stat(path)).size;
  } catch {
    return -1;
  }
}

// ---------------------------------------------------------------------------
// Planification : transforme une entrée du manifeste en liste de fichiers à télécharger
// Chaque item : { url, size, dest }  (size = taille annoncée par l'API, peut être undefined)
// ---------------------------------------------------------------------------

async function planTexture({ id, res = '1k', maps = ['Diffuse', 'nor_gl', 'arm'] }) {
  const data = await getFiles(id);
  const items = [];
  const errors = [];
  for (const map of maps) {
    const file = data?.[map]?.[res]?.jpg;
    if (!file?.url) {
      errors.push(`texture « ${id} » : map « ${map} » indisponible en ${res}/jpg (maps connues : ${Object.keys(data).join(', ')})`);
      continue;
    }
    items.push({ url: file.url, size: file.size, dest: safeDest('textures', id, basename(new URL(file.url).pathname)) });
  }
  return { items, errors };
}

async function planHdri({ id, res = '2k' }) {
  const data = await getFiles(id);
  const file = data?.hdri?.[res]?.hdr;
  if (!file?.url) {
    return { items: [], errors: [`HDRI « ${id} » : indisponible en ${res}/hdr (résolutions connues : ${Object.keys(data.hdri ?? {}).join(', ')})`] };
  }
  return { items: [{ url: file.url, size: file.size, dest: safeDest('hdri', basename(new URL(file.url).pathname)) }], errors: [] };
}

async function planModel({ id, res = '1k' }) {
  const data = await getFiles(id);
  const gltf = data?.gltf?.[res]?.gltf;
  if (!gltf?.url) {
    return { items: [], errors: [`modèle « ${id} » : pas de glTF en ${res} (résolutions connues : ${Object.keys(data.gltf ?? {}).join(', ')})`] };
  }
  const items = [{ url: gltf.url, size: gltf.size, dest: safeDest('models', id, basename(new URL(gltf.url).pathname)) }];
  // Les clés de `include` sont les chemins relatifs référencés par le .gltf : on les conserve tels quels.
  for (const [relPath, file] of Object.entries(gltf.include ?? {})) {
    items.push({ url: file.url, size: file.size, dest: safeDest('models', id, ...posix.normalize(relPath).split('/')) });
  }
  return { items, errors: [] };
}

const PLANNERS = { textures: planTexture, hdris: planHdri, models: planModel };

// ---------------------------------------------------------------------------
// Téléchargement
// ---------------------------------------------------------------------------

/** Télécharge un item. Retourne { status: 'skipped' | 'downloaded', bytes }. */
async function download({ url, size, dest }) {
  const existing = await fileSize(dest);
  const upToDate = existing >= 0 && (size === undefined || existing === size);
  if (upToDate && !FORCE) return { status: 'skipped', bytes: existing };
  if (DRY_RUN) return { status: 'planned', bytes: size ?? 0 };

  await mkdir(dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (size !== undefined && buf.length !== size) {
    throw new Error(`taille inattendue pour ${basename(dest)} : ${buf.length} octets reçus, ${size} annoncés`);
  }
  // Écriture atomique : fichier temporaire puis renommage, pour ne jamais laisser un fichier tronqué.
  const tmp = `${dest}.part`;
  await writeFile(tmp, buf);
  await rename(tmp, dest);
  return { status: 'downloaded', bytes: buf.length };
}

// ---------------------------------------------------------------------------
// Crédits
// ---------------------------------------------------------------------------

const TYPE_LABELS = { textures: 'Textures', hdris: 'HDRI (éclairage / ciel)', models: 'Modèles 3D (glTF)' };

async function getInfo(id) {
  try {
    const info = await fetchJson(`${API}/info/${encodeURIComponent(id)}`);
    return { name: info.name ?? id, authors: Object.keys(info.authors ?? {}) };
  } catch {
    return { name: id, authors: [] };
  }
}

async function writeCredits(manifest, results) {
  const lines = [
    '# Crédits des assets — chat2',
    '',
    'Tous les assets de ce dossier proviennent de [Poly Haven](https://polyhaven.com/) et sont publiés',
    'sous licence **[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)** (domaine public) :',
    'utilisation libre, y compris commerciale, sans obligation d\'attribution. Nous les créditons malgré tout',
    'par reconnaissance envers les artistes et l\'équipe de Poly Haven.',
    '',
    `Liste générée par \`chat2/tools/fetch-assets.mjs\` à partir de \`manifest.json\` (${new Date().toISOString().slice(0, 10)}).`,
    '',
  ];
  for (const type of Object.keys(PLANNERS)) {
    const entries = manifest[type] ?? [];
    if (entries.length === 0) continue;
    lines.push(`## ${TYPE_LABELS[type]}`, '');
    lines.push('| Nom | Identifiant | Résolution | Usage dans le jeu | Auteur(s) | Taille | Licence |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const entry of entries) {
      const info = await getInfo(entry.id);
      const bytes = results.get(entry.id)?.bytes;
      const size = bytes ? fmt(bytes) : (results.get(entry.id)?.failed ? '— (échec)' : '—');
      const authors = info.authors.length ? info.authors.join(', ') : 'Poly Haven';
      lines.push(`| ${info.name} | [\`${entry.id}\`](https://polyhaven.com/a/${entry.id}) | ${entry.res ?? ''} | ${entry.usage ?? ''} | ${authors} | ${size} | CC0 1.0 |`);
    }
    lines.push('');
  }
  lines.push('---', '', 'Merci à Poly Haven et à ses contributeurs de rendre ces ressources 3D de qualité librement accessibles à tous. 💚', '');
  await writeFile(CREDITS_PATH, lines.join('\n'), 'utf8');
}

// ---------------------------------------------------------------------------
// Programme principal
// ---------------------------------------------------------------------------

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  console.log(`Dossier cible : ${ASSETS_DIR}${DRY_RUN ? '   (--dry-run : aucune écriture)' : ''}${FORCE ? '   (--force)' : ''}`);

  const errors = [];
  const results = new Map(); // id -> { bytes, files, failed }
  let downloaded = 0, downloadedBytes = 0, skipped = 0, totalBytes = 0, totalFiles = 0;

  for (const [type, plan] of Object.entries(PLANNERS)) {
    const entries = manifest[type] ?? [];
    if (entries.length === 0) continue;
    console.log(`\n=== ${TYPE_LABELS[type]} (${entries.length}) ===`);

    for (const entry of entries) {
      let items = [];
      try {
        const planned = await plan(entry);
        items = planned.items;
        for (const e of planned.errors) { errors.push(e); console.error(`  ✖ ${e}`); }
      } catch (err) {
        errors.push(err.message);
        console.error(`  ✖ ${err.message}`);
        results.set(entry.id, { bytes: 0, files: 0, failed: true });
        continue;
      }

      if (items.length === 0) {
        results.set(entry.id, { bytes: 0, files: 0, failed: true });
        continue;
      }
      let assetBytes = 0;
      const outcomes = await Promise.allSettled(items.map(download));
      console.log(`  ${entry.id}`);
      outcomes.forEach((outcome, i) => {
        const item = items[i];
        const rel = relative(ASSETS_DIR, item.dest);
        if (outcome.status === 'rejected') {
          const msg = `${rel} : ${outcome.reason.message}`;
          errors.push(msg);
          console.error(`    ✖ ${msg}`);
          return;
        }
        const { status, bytes } = outcome.value;
        assetBytes += bytes; totalBytes += bytes; totalFiles += 1;
        if (status === 'downloaded') { downloaded += 1; downloadedBytes += bytes; }
        if (status === 'skipped') skipped += 1;
        const tag = { downloaded: '↓', skipped: '=', planned: '·' }[status];
        console.log(`    ${tag} ${rel.padEnd(70)} ${fmt(bytes).padStart(10)}`);
      });
      results.set(entry.id, { bytes: assetBytes, files: items.length, failed: false });
    }
  }

  console.log('\n=== Bilan ===');
  if (DRY_RUN) {
    console.log(`  ${totalFiles} fichiers, ${fmt(totalBytes)} au total (déjà présents : ${skipped})`);
  } else {
    console.log(`  Téléchargés : ${downloaded} fichiers, ${fmt(downloadedBytes)}`);
    console.log(`  Déjà présents (sautés) : ${skipped}`);
    console.log(`  Total sur disque : ${totalFiles} fichiers, ${fmt(totalBytes)}`);
    await writeCredits(manifest, results);
    console.log(`  Crédits écrits dans ${CREDITS_PATH}`);
  }
  if (errors.length) {
    console.error(`\n${errors.length} erreur(s) :`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`Erreur fatale : ${err.message}`);
  process.exitCode = 1;
});
