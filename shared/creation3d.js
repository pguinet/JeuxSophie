// Les créations de Sophie en 3D : le tissu (couleur + motif) et son dessin sont
// peints dans des canevas, collés sur les blocs du personnage.
//
//   habillerCreation(corps, creation) → liste de fonctions « recomposer »
//   (à rappeler quand le dessin change, pour le voir en direct dans l'atelier)
//
// Le dessin de Sophie est un carré (canevas de 512) :
//   - zone 'torse'  : la face avant du torse (2 × 2 studs) ;
//   - zone 'jambes' : moitié gauche → jambe gauche (vue de face), moitié droite → jambe droite ;
//   - zone 'jupe'   : le devant de la jupe.
// `creation.dessin` est une image (data URL) ou directement un canevas (atelier).

import * as THREE from 'three';
import { construireHaut, construireBas, construireRobe, construireChapeau, matiere } from './garderobe3d.js';
import { TYPES } from './createur.js';

const PX_PAR_M = 560;          // finesse des textures
const TAILLE_MOTIF = 0.13;     // un motif tous les 13 cm

// --- Les motifs -------------------------------------------------------------
function etoile(x, cx, cy, r) {
    x.beginPath();
    for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
        x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    x.closePath();
    x.fill();
}
function coeur(x, cx, cy, r) {
    x.beginPath();
    x.moveTo(cx, cy + r * 0.85);
    x.bezierCurveTo(cx - r * 1.4, cy - r * 0.1, cx - r * 0.6, cy - r * 1.1, cx, cy - r * 0.35);
    x.bezierCurveTo(cx + r * 0.6, cy - r * 1.1, cx + r * 1.4, cy - r * 0.1, cx, cy + r * 0.85);
    x.fill();
}
function fleur(x, cx, cy, r, centre) {
    for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        x.beginPath(); x.arc(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.45, 0, Math.PI * 2); x.fill();
    }
    const f = x.fillStyle;
    x.fillStyle = centre;
    x.beginPath(); x.arc(cx, cy, r * 0.32, 0, Math.PI * 2); x.fill();
    x.fillStyle = f;
}

// Peint le tissu (couleur + motif) sur un canevas de w × h pixels
export function peindreTissu(x, w, h, c, pxm = PX_PAR_M) {
    x.fillStyle = c.couleur || '#ff5fa2';
    x.fillRect(0, 0, w, h);
    if (!c.motif) return;
    const pas = TAILLE_MOTIF * pxm;
    x.fillStyle = c.couleurMotif || '#ffffff';
    x.strokeStyle = c.couleurMotif || '#ffffff';
    switch (c.motif) {
        case 'rayures':
            for (let y = 0; y < h; y += pas) x.fillRect(0, y, w, pas * 0.4);
            break;
        case 'carreaux':
            x.globalAlpha = 0.5;
            for (let y = 0; y < h; y += pas) x.fillRect(0, y, w, pas * 0.45);
            for (let xx = 0; xx < w; xx += pas) x.fillRect(xx, 0, pas * 0.45, h);
            x.globalAlpha = 1;
            break;
        default: {
            let ligne = 0;
            for (let y = pas / 2; y < h + pas; y += pas * 0.87, ligne++) {
                for (let xx = (ligne % 2) * pas / 2; xx < w + pas; xx += pas) {
                    const r = pas * 0.28;
                    if (c.motif === 'etoiles') etoile(x, xx, y, r * 1.2);
                    else if (c.motif === 'coeurs') coeur(x, xx, y, r);
                    else if (c.motif === 'fleurs') fleur(x, xx, y, r * 1.1, '#ffd43b');
                    else { x.beginPath(); x.arc(xx, y, r * 0.75, 0, Math.PI * 2); x.fill(); }
                }
            }
        }
    }
}

// --- Le dessin (image chargée une fois, gardée en mémoire) -----------------
const images = new Map();
function imageDuDessin(dessin, quandPrete) {
    if (!dessin) return null;
    if (typeof dessin !== 'string') return dessin;          // déjà un canevas
    let img = images.get(dessin);
    if (!img) {
        img = new Image();
        img.src = dessin;
        images.set(dessin, img);
    }
    if (!img.complete) img.addEventListener('load', quandPrete, { once: true });
    return img;
}

// Une texture de tissu de wM × hM mètres, avec (en option) une partie du dessin
//   source : [sx, sy, sw, sh] en fraction du dessin ; cible : [dx, dy, dw, dh] en fraction de la texture
function textureTissu(c, wM, hM, avecDessin = null) {
    // pas plus de 1024 pixels de côté (les grandes jupes) : on garde la même échelle de motif
    const pxm = Math.min(PX_PAR_M, 1024 / Math.max(wM, hM));
    const w = Math.max(16, Math.round(wM * pxm)), h = Math.max(16, Math.round(hM * pxm));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const x = canvas.getContext('2d');
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const recomposer = () => {
        peindreTissu(x, w, h, c, pxm);
        const img = avecDessin && imageDuDessin(c.dessin, recomposer);
        if (img && (img.complete !== false) && (img.width || img.naturalWidth)) {
            const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
            const [sx, sy, sw, sh] = avecDessin.source, [dx, dy, dw, dh] = avecDessin.cible;
            x.drawImage(img, sx * iw, sy * ih, sw * iw, sh * ih, dx * w, dy * h, dw * w, dh * h);
        }
        tex.needsUpdate = true;
    };
    recomposer();
    return { tex, recomposer };
}

// les couronnes et diadèmes brillent toujours comme du métal
const METAL = new Set(['couronne', 'diademe']);
function matTissu(c, tex) {
    const brille = c.brillant || METAL.has(c.type);
    return new THREE.MeshStandardMaterial({
        map: tex,
        roughness: brille ? 0.25 : 0.8,
        metalness: brille ? 0.6 : 0,
        emissive: brille ? new THREE.Color(c.couleur).multiplyScalar(0.18) : new THREE.Color(0),
    });
}

// Un chapeau créé dans l'atelier (couleur + motif, pas de dessin)
export function habillerChapeau(corps, c) {
    if (TYPES[c.type]?.categorie !== 'chapeau') return;
    if (typeof document === 'undefined') { construireChapeau(corps, c.type, c.couleur, matiere(c.couleur)); return; }
    const { tex } = textureTissu(c, 0.5, 0.5);
    const m = matTissu(c, tex);
    m.side = THREE.DoubleSide;
    construireChapeau(corps, c.type, c.couleur, m);
}

// Remplace une matière par une autre sur tous les morceaux d'un groupe
function remplacer(groupe, ancienne, nouvelle) {
    groupe.traverse((o) => { if (o.isMesh && o.material === ancienne) o.material = nouvelle; });
}
// Face avant (+Z) d'un bloc : les 6 faces d'une boîte sont dans l'ordre +X, −X, +Y, −Y, +Z, −Z
const faceAvant = (cote, avant) => [cote, cote, cote, cote, avant, cote];

// ---------------------------------------------------------------------------
//  Habiller le personnage avec une création
// ---------------------------------------------------------------------------
export function habillerCreation(corps, c) {
    const t = TYPES[c.type];
    if (!t) return [];
    const construire = t.categorie === 'robe' ? construireRobe : t.categorie === 'bas' ? construireBas : construireHaut;

    // Sans page web (tests sous Node) : simple couleur unie
    if (typeof document === 'undefined') {
        construire(corps, c.type, c.couleur, matiere(c.couleur));
        return [];
    }

    const recompositions = [];
    const fabriquer = (wM, hM, dessin) => {
        const r = textureTissu(c, wM, hM, dessin);
        if (dessin) recompositions.push(r.recomposer);
        return matTissu(c, r.tex);
    };

    const mTorse = fabriquer(0.76, 0.76);
    construire(corps, c.type, c.couleur, mTorse);
    // bras et jambes : une texture à leur forme (1 × 2 studs) pour ne pas étirer le motif
    const mMembre = fabriquer(0.38, 0.76);
    for (const b of corps.bras) remplacer(b.epaule, mTorse, mMembre);
    for (const j of corps.jambes) remplacer(j.hanche, mTorse, mMembre);

    const tout = { source: [0, 0, 1, 1], cible: [0, 0, 1, 1] };
    if (t.zone === 'torse' && corps.blocs.torse.material === mTorse) {
        corps.blocs.torse.material = faceAvant(mTorse, fabriquer(0.76, 0.76, tout));
    } else if (t.zone === 'jambes') {
        corps.blocs.jambes.forEach((jambe, i) => {
            if (jambe.material !== mMembre) return;
            jambe.material = faceAvant(mMembre, fabriquer(0.38, 0.76, { source: [i * 0.5, 0, 0.5, 1], cible: [0, 0, 1, 1] }));
        });
    }
    // La jupe (d'une jupe ou d'une robe) fait le tour du corps : sa texture
    // prend sa vraie taille pour que le motif ne soit pas écrasé. Pour une
    // jupe, le dessin se pose sur le quart avant.
    for (const jupe of corps.blocs.jupes || []) {
        const geo = jupe.geometry;
        geo.computeBoundingBox();
        const taille = geo.boundingBox.getSize(new THREE.Vector3());
        const tour = Math.PI * (taille.x + taille.z) / 2 * 0.85;
        const dessin = t.zone === 'jupe' && jupe === corps.blocs.jupe ? { source: [0, 0, 1, 1], cible: [0.375, 0, 0.25, 1] } : null;
        const m = fabriquer(tour, taille.y, dessin);
        m.side = THREE.DoubleSide;
        jupe.material = m;
    }
    return recompositions;
}
