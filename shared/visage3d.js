// La tête cubique et le visage du personnage, façon Roblox : le visage est
// dessiné tout plat sur la face avant du cube (deux yeux noirs, un sourire…).
// Plusieurs visages au choix (`s.face`), et ceux qui ont les yeux ouverts
// clignent de temps en temps.
//
// Tout est construit dans le repère de l'ancienne tête (voir corps3d.js) :
// le cube arrondi a un demi-côté de 0.36 autour de (0, 1.5, 0).

import * as THREE from 'three';
import { TETE_ANCIENNE, geoTeteCube, rayonTete } from './corps3d.js';

// Les visages proposés (l'ordre est celui des boutons)
export { FACES as VISAGES } from './avatar.js';
import { FACES as VISAGES } from './avatar.js';

// La face avant : un carré de côté LARGEUR, centré sur le cube, dessiné dans un
// canevas de 512 (le centre du canevas = le centre de la face)
const LARGEUR = TETE_ANCIENNE.CUBE * 2 * 0.92;
const Y_YEUX = 232, X_YEUX = 82, Y_BOUCHE = 330;
// tout le dessin est agrandi de ZOOM autour du point (256, CY) du canevas
const ZOOM = 1.2, CY = 280;
// position des yeux dans le repère de la tête (pour poser les lunettes)
export const YEUX = {
    y: TETE_ANCIENNE.Y + ((256 - (CY + (Y_YEUX - CY) * ZOOM)) / 512) * LARGEUR,
    x: ((X_YEUX * ZOOM) / 512) * LARGEUR,
};

const NOIR = '#111111';

// --- les pièces du dessin ---
function oeilOvale(x, cx, cy, grand = 1) {
    x.fillStyle = NOIR;
    x.beginPath(); x.ellipse(cx, cy, 21 * grand, 37 * grand, 0, 0, Math.PI * 2); x.fill();
}
function oeilBrillant(x, cx, cy) {
    // grand œil noir avec deux reflets (visage « mignon »)
    x.fillStyle = NOIR;
    x.beginPath(); x.ellipse(cx, cy, 26, 36, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.ellipse(cx - 8, cy - 13, 9, 11, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(cx + 9, cy + 13, 5, 0, Math.PI * 2); x.fill();
}
function oeilFerme(x, cx, cy, heureux = false) {
    x.strokeStyle = NOIR;
    x.lineWidth = 11;
    x.lineCap = 'round';
    x.beginPath();
    if (heureux) x.arc(cx, cy + 12, 24, Math.PI * 1.15, Math.PI * 1.85);   // ^
    else x.arc(cx, cy - 10, 22, Math.PI * 0.2, Math.PI * 0.8);            // paupière baissée
    x.stroke();
}
function sourire(x, rayon = 100, ep = 15) {
    x.strokeStyle = NOIR;
    x.lineWidth = ep;
    x.lineCap = 'round';
    x.beginPath(); x.arc(256, Y_BOUCHE - rayon * 0.75, rayon, Math.PI * 0.22, Math.PI * 0.78); x.stroke();
}
function bouchOuverte(x) {
    // un grand D noir avec les dents en haut
    const y0 = Y_BOUCHE - 22;
    x.fillStyle = NOIR;
    x.beginPath(); x.moveTo(256 - 78, y0); x.quadraticCurveTo(256, y0 + 6, 256 + 78, y0);
    x.quadraticCurveTo(256 + 70, y0 + 82, 256, y0 + 84); x.quadraticCurveTo(256 - 70, y0 + 82, 256 - 78, y0); x.fill();
    x.save();
    x.clip();
    x.fillStyle = '#ffffff';
    x.fillRect(256 - 80, y0, 160, 20);
    x.fillStyle = '#e8577a';
    x.beginPath(); x.ellipse(256, y0 + 80, 44, 26, 0, 0, Math.PI * 2); x.fill();
    x.restore();
}
function joues(x) {
    x.fillStyle = 'rgba(255,110,140,0.45)';
    for (const s of [-1, 1]) { x.beginPath(); x.ellipse(256 + s * 132, Y_BOUCHE - 30, 30, 17, 0, 0, Math.PI * 2); x.fill(); }
}

// Dessine un visage ; `ouverts` = false donne la version yeux fermés (clignement)
function dessiner(face, ouverts) {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    x.translate(256, CY); x.scale(ZOOM, ZOOM); x.translate(-256, -CY);
    const deuxYeux = (f) => { for (const s of [-1, 1]) f(256 + s * X_YEUX, Y_YEUX, s); };
    const yeux = (f) => deuxYeux(ouverts ? f : (cx, cy) => oeilFerme(x, cx, cy));

    switch (face) {
        case 'grand_sourire':
            yeux((cx, cy) => oeilOvale(x, cx, cy));
            bouchOuverte(x);
            break;
        case 'content':
            deuxYeux((cx, cy) => oeilFerme(x, cx, cy, true));
            sourire(x, 96, 14);
            joues(x);
            break;
        case 'clin_oeil':
            oeilFerme(x, 256 + X_YEUX, Y_YEUX, true);
            if (ouverts) oeilOvale(x, 256 - X_YEUX, Y_YEUX); else oeilFerme(x, 256 - X_YEUX, Y_YEUX);
            sourire(x);
            break;
        case 'langue':
            yeux((cx, cy) => oeilOvale(x, cx, cy));
            sourire(x);
            x.fillStyle = '#e8577a';
            x.strokeStyle = NOIR;
            x.lineWidth = 6;
            x.beginPath(); x.ellipse(256 + 26, Y_BOUCHE + 4, 26, 32, 0, 0, Math.PI); x.fill(); x.stroke();
            break;
        case 'etonne':
            yeux((cx, cy) => oeilOvale(x, cx, cy, 1.15));
            x.fillStyle = NOIR;
            x.beginPath(); x.ellipse(256, Y_BOUCHE + 6, 26, 34, 0, 0, Math.PI * 2); x.fill();
            break;
        case 'malin':
            yeux((cx, cy) => oeilOvale(x, cx, cy));
            // sourcils, dont un levé
            x.strokeStyle = NOIR; x.lineWidth = 10; x.lineCap = 'round';
            x.beginPath(); x.moveTo(256 - X_YEUX - 26, Y_YEUX - 52); x.lineTo(256 - X_YEUX + 24, Y_YEUX - 46); x.stroke();
            x.beginPath(); x.moveTo(256 + X_YEUX - 26, Y_YEUX - 52); x.quadraticCurveTo(256 + X_YEUX, Y_YEUX - 72, 256 + X_YEUX + 28, Y_YEUX - 58); x.stroke();
            // sourire en coin
            x.lineWidth = 13;
            x.beginPath(); x.moveTo(256 - 60, Y_BOUCHE + 8); x.quadraticCurveTo(256 + 20, Y_BOUCHE + 26, 256 + 74, Y_BOUCHE - 14); x.stroke();
            break;
        case 'mignon':
            yeux((cx, cy) => oeilBrillant(x, cx, cy));
            x.strokeStyle = NOIR; x.lineWidth = 9; x.lineCap = 'round';
            x.beginPath(); x.arc(256 - 15, Y_BOUCHE - 10, 15, Math.PI * 0.1, Math.PI * 0.9); x.stroke();
            x.beginPath(); x.arc(256 + 15, Y_BOUCHE - 10, 15, Math.PI * 0.1, Math.PI * 0.9); x.stroke();
            joues(x);
            break;
        default:   // le sourire classique de Roblox
            yeux((cx, cy) => oeilOvale(x, cx, cy));
            sourire(x);
            break;
    }

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
}

const cache = new Map();
function textures(face) {
    if (!cache.has(face)) cache.set(face, { ouverts: dessiner(face, true), fermes: dessiner(face, false) });
    return cache.get(face);
}

// ---------------------------------------------------------------------------
//  Point d'entrée : le cube de la tête + le visage
// ---------------------------------------------------------------------------
// Retourne { mat, tex, prochainClin, ferme, cligne } (ou null sous Node, sans canevas)
export function construireTete(tete, s, peau) {
    const crane = new THREE.Mesh(geoTeteCube(), peau);
    crane.position.y = TETE_ANCIENNE.Y;
    tete.add(crane);

    if (typeof document === 'undefined') return null;
    const face = VISAGES.includes(s.face) ? s.face : 'sourire';
    const tex = textures(face);
    const mat = new THREE.MeshBasicMaterial({ map: tex.ouverts, transparent: true, depthWrite: false });
    // le visage est collé sur le devant de la tête (un morceau de cylindre qui
    // suit exactement sa forme, un poil devant)
    const R = TETE_ANCIENNE.CUBE;
    const angle = LARGEUR / R;
    const geo = new THREE.CylinderGeometry(R, R, LARGEUR, 48, 24, true, -angle / 2, angle);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
        const y = p.getY(i), k = (rayonTete(y) + 0.003) / R;
        p.setXYZ(i, p.getX(i) * k, y, p.getZ(i) * k);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, TETE_ANCIENNE.Y, 0);
    m.renderOrder = 1;
    tete.add(m);
    // les visages aux yeux déjà fermés ne clignent pas
    const cligne = face !== 'content';
    return { mat, tex, prochainClin: 1 + Math.random() * 3, ferme: false, cligne };
}
