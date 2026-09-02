#!/usr/bin/env node
// Copie localement les addons Three.js (examples/jsm) nécessaires à chat2,
// en résolvant récursivement leurs imports relatifs. Idempotent.
// Usage : node chat2/tools/vendor-addons.mjs
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '0.170.0';
const BASE = `https://cdn.jsdelivr.net/npm/three@${VERSION}/examples/jsm/`;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEST = join(ROOT, 'vendor', `three@${VERSION}`, 'examples', 'jsm');

const ENTRIES = [
    'loaders/GLTFLoader.js',
    'loaders/RGBELoader.js',
    'controls/OrbitControls.js',
    'postprocessing/EffectComposer.js',
    'postprocessing/RenderPass.js',
    'postprocessing/UnrealBloomPass.js',
    'postprocessing/OutputPass.js',
    'objects/Sky.js',
    'objects/Water.js',
    'objects/MarchingCubes.js',
    'utils/BufferGeometryUtils.js',
];

const seen = new Set();

function resolveRelative(fromFile, spec) {
    const parts = fromFile.split('/').slice(0, -1);
    for (const p of spec.split('/')) {
        if (p === '..') parts.pop();
        else if (p !== '.') parts.push(p);
    }
    return parts.join('/');
}

async function exists(path) {
    try { await access(path); return true; } catch { return false; }
}

async function vendor(rel) {
    if (seen.has(rel)) return;
    seen.add(rel);
    const target = join(DEST, rel);
    let src;
    if (await exists(target)) {
        src = await (await import('node:fs/promises')).readFile(target, 'utf8');
        console.log('ok      ', rel);
    } else {
        const res = await fetch(BASE + rel);
        if (!res.ok) throw new Error(`HTTP ${res.status} pour ${rel}`);
        src = await res.text();
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, src);
        console.log('téléchargé', rel, `(${src.length} o)`);
    }
    // Uniquement les vrais imports relatifs (./ ou ../), pas 'three' ni les URL d'exemples dans les commentaires.
    const re = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
    let m;
    while ((m = re.exec(src))) await vendor(resolveRelative(rel, m[1]));
}

for (const e of ENTRIES) await vendor(e);
console.log(`\n${seen.size} fichiers dans ${DEST}`);
