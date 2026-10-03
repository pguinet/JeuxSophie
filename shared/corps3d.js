// Le corps du personnage en 3D, façon Roblox classique : tout en cubes.
// Une tête cubique, un torse cubique, deux bras et deux jambes cubiques
// (proportions du Roblox d'origine, en « studs » : jambes 1×2×1, torse 2×2×1,
// bras 1×2×1, tête 1,2 de côté).
//
// Comme dans Roblox, les vêtements « peignent » les blocs (voir
// `garderobe3d.js` : corps.peindre('torse', matière)), et quelques pièces en
// plus (jupes, ceintures, chaussures…) se posent par-dessus.
//
// Repères (pieds à y = 0, le personnage regarde vers +Z) :
//   jambes de y = 0 à 0.76 (x = ±0.19) ; torse de 0.76 à 1.52 ; bras de 0.76
//   à 1.52 (x = ±0.57) ; tête cubique centrée en y = 1.75, de côté 0.46.
//
// La tête est un groupe « à l'ancienne échelle » : visage, cheveux, chapeaux
// et lunettes sont construits comme pour une tête ronde de rayon 0.42 centrée
// en y = 1.5, puis `projeterSurCube` les plaque sur le cube.

import * as THREE from 'three';

export const STUD = 0.38;
export const D = {
    HANCHE_Y: 2 * STUD,                // haut des jambes
    HANCHE_X: STUD / 2,
    TORSE: { y: 3 * STUD, w: 2 * STUD, h: 2 * STUD, d: STUD },
    EPAULE_Y: 4 * STUD - 0.09,         // pivot des bras, un peu sous le haut
    EPAULE_X: 1.5 * STUD,
    TETE_Y: 4 * STUD + 0.6 * STUD,
    TETE_COTE: 1.2 * STUD,
};
// La tête en repère « ancien » : un cube arrondi de demi-côté CUBE autour de (0, 1.5, 0)
export const TETE_ANCIENNE = { Y: 1.5, R: 0.42, CUBE: 0.36 };
export const ECHELLE_TETE = (D.TETE_COTE / 2) / TETE_ANCIENNE.CUBE;

// Rayon des coins arrondis (petits : ça reste des cubes)
const COIN = 0.03;

// Les blocs des membres : [largeur, hauteur, profondeur, coin] et centre dans
// le groupe de son articulation
export const BLOCS = {
    bras: { taille: [STUD, 2 * STUD, STUD, COIN], centre: [0, -(2 * STUD) / 2 + 0.09, 0] },
    jambe: { taille: [STUD, 2 * STUD, STUD, COIN], centre: [0, -STUD, 0] },
};

// ---------------------------------------------------------------------------
//  Une boîte aux coins arrondis (mise en cache : beaucoup de personnages)
// ---------------------------------------------------------------------------
const cacheBoites = new Map();
export function boiteRonde(w, h, d, rayon, seg = 3) {
    const cle = [w, h, d, rayon, seg].join('|');
    if (cacheBoites.has(cle)) return cacheBoites.get(cle);
    const g = new THREE.BoxGeometry(w, h, d, seg * 2, seg * 2, seg * 2);
    const p = g.attributes.position, v = new THREE.Vector3(), dedans = new THREE.Vector3();
    const hw = w / 2 - rayon, hh = h / 2 - rayon, hd = d / 2 - rayon;
    for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        dedans.set(
            Math.max(-hw, Math.min(hw, v.x)),
            Math.max(-hh, Math.min(hh, v.y)),
            Math.max(-hd, Math.min(hd, v.z)),
        );
        v.sub(dedans);
        if (v.lengthSq() > 0) v.normalize().multiplyScalar(rayon);
        v.add(dedans);
        p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    cacheBoites.set(cle, g);
    return g;
}

export function geoBloc(nom, marge = 0) {
    const [w, h, d, r] = BLOCS[nom].taille;
    return boiteRonde(w + 2 * marge, h + 2 * marge, d + 2 * marge, r + marge);
}

// ---------------------------------------------------------------------------
//  La tête cubique et la projection des cheveux / chapeaux sur le cube
// ---------------------------------------------------------------------------
// La tête est un cylindre aux bords arrondis, comme la tête des personnages
// Roblox : ronde vue de dessus, avec un dessus et un dessous plats aux arêtes
// bien arrondies. C'est une « super-ellipse » entre le rayon horizontal
// (√(x² + z²)) et la hauteur : (rh / a)^n + (|y| / b)^n = 1.
const N_TETE = 5;
const A_TETE = TETE_ANCIENNE.CUBE;          // rayon du cylindre
const B_TETE = TETE_ANCIENNE.CUBE;          // demi-hauteur
function superCylindre(d, a, b, n) {
    const h = Math.hypot(d.x, d.z);
    return 1 / Math.pow((h / a) ** n + (Math.abs(d.y) / b) ** n, 1 / n);
}
// Distance du centre au bord de la tête, dans la direction (unitaire) d
// (le nom date de la tête cubique : c'est désormais un cylindre arrondi)
export function distanceCube(d) {
    return superCylindre(d, A_TETE, B_TETE, N_TETE);
}
// Rayon horizontal de la tête à la hauteur y (relative au centre)
export function rayonTete(y) {
    const t = Math.min(1, Math.abs(y) / B_TETE);
    return A_TETE * Math.pow(1 - t ** N_TETE, 1 / N_TETE);
}
// La « coque » des cheveux et des chapeaux : une forme un peu plus ronde que
// la tête (n = 3,2), agrandie juste assez pour ne jamais rentrer dedans.
// Elle donne du volume et des bords bien arrondis.
const N_COQUE = 3.2;
const K_COQUE = (() => {
    let k = 0;
    for (let i = 0; i <= 90; i++) {
        const e = (i / 90) * (Math.PI / 2);
        const d = { x: Math.cos(e), y: Math.sin(e), z: 0 };
        k = Math.max(k, distanceCube(d) / superCylindre(d, A_TETE, B_TETE, N_COQUE));
    }
    return k * 1.01;
})();
export function distanceCoque(d) {
    return superCylindre(d, A_TETE * K_COQUE, B_TETE * K_COQUE, N_COQUE);
}

// La tête : une sphère déformée en cylindre arrondi (repère ancien)
export function geoTeteCube() {
    const g = new THREE.SphereGeometry(1, 64, 48);
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).normalize();
        v.multiplyScalar(distanceCube(v));
        p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
}

// Plaque sur le cube tout ce qui a été construit pour l'ancienne tête ronde :
// un point à la distance r du centre, dans la direction d, va en
// d × (r + surface(d) − R). Ce qui touchait la sphère touche la nouvelle
// surface, et ce qui en dépassait (cheveux longs, bord d'un chapeau) garde son
// écart. `arrondi` : on vise la coque arrondie (cheveux, chapeaux) plutôt que
// le cube lui-même (lunettes, posées sur le visage).
export function projeterSurCube(tete, objets, { arrondi = false } = {}) {
    const surface = arrondi ? distanceCoque : distanceCube;
    const centre = new THREE.Vector3(0, TETE_ANCIENNE.Y, 0);
    const inv = new THREE.Matrix4();
    tete.updateMatrixWorld(true);
    inv.copy(tete.matrixWorld).invert();
    const vus = new Map();
    const v = new THREE.Vector3(), d = new THREE.Vector3();
    for (const racine of objets) {
        racine.updateMatrixWorld(true);
        racine.traverse((o) => {
            if (!o.isMesh) return;
            // matrice de l'objet dans le repère de la tête
            const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
            const cle = o.geometry.uuid + m.elements.join(',') + arrondi;
            let geo = vus.get(cle);
            if (!geo) {
                geo = o.geometry.clone();
                geo.applyMatrix4(m);
                const p = geo.attributes.position;
                for (let i = 0; i < p.count; i++) {
                    v.fromBufferAttribute(p, i).sub(centre);
                    const r = v.length();
                    if (r < 1e-6) continue;
                    d.copy(v).divideScalar(r);
                    v.copy(d).multiplyScalar(r + surface(d) - TETE_ANCIENNE.R).add(centre);
                    p.setXYZ(i, v.x, v.y, v.z);
                }
                geo.computeVertexNormals();
                vus.set(cle, geo);
            }
            o.geometry = geo;
        });
    }
    // on remet chaque mesh à plat sous la tête (sa géométrie porte désormais sa place)
    for (const racine of objets) {
        const meshes = [];
        racine.traverse((o) => { if (o.isMesh) meshes.push(o); });
        for (const o of meshes) {
            tete.add(o);
            o.position.set(0, 0, 0);
            o.rotation.set(0, 0, 0);
            o.scale.set(1, 1, 1);
        }
        if (!racine.isMesh) racine.removeFromParent();
    }
}

// ---------------------------------------------------------------------------
//  Le corps : squelette articulé + blocs de peau
// ---------------------------------------------------------------------------
// Retourne `corps` :
//   racine, gender, peau, largeur (du torse)
//   tete (repère ancien), teteGroupe (le groupe réduit qui pivote)
//   bras[i]   = { epaule, coude, main }   (coude et main : repères le long du bras)
//   jambes[i] = { hanche, genou, cheville }
//   blocs     = { torse, bras: [g, d], jambes: [g, d] }
//   peindre(nom, matière) : change la matière d'un bloc (ou d'une paire)
export function construireCorps(racine, gender, peau) {
    const bras = [], jambes = [];
    const blocs = { bras: [], jambes: [] };
    const bloc = (nom, parent) => {
        const m = new THREE.Mesh(geoBloc(nom), peau);
        m.position.set(...BLOCS[nom].centre);
        parent.add(m);
        return m;
    };

    for (let i = 0; i < 2; i++) {
        const sens = i === 0 ? -1 : 1;

        const hanche = new THREE.Group();
        hanche.position.set(sens * D.HANCHE_X, D.HANCHE_Y, 0);
        const genou = new THREE.Group();
        genou.position.y = -STUD;
        const cheville = new THREE.Group();
        cheville.position.y = -STUD + 0.06;
        hanche.add(genou);
        genou.add(cheville);
        racine.add(hanche);
        jambes.push({ hanche, genou, cheville });
        blocs.jambes.push(bloc('jambe', hanche));

        const epaule = new THREE.Group();
        epaule.position.set(sens * D.EPAULE_X, D.EPAULE_Y, 0);
        const coude = new THREE.Group();
        coude.position.y = -STUD + 0.09;
        const main = new THREE.Group();
        main.position.y = -STUD + 0.12;
        epaule.add(coude);
        coude.add(main);
        racine.add(epaule);
        bras.push({ epaule, coude, main });
        blocs.bras.push(bloc('bras', epaule));
    }

    blocs.torse = new THREE.Mesh(boiteRonde(D.TORSE.w, D.TORSE.h, D.TORSE.d, COIN), peau);
    blocs.torse.position.y = D.TORSE.y;
    racine.add(blocs.torse);

    // La tête : groupe réduit, dont le repère interne est celui de l'ancienne tête
    const teteGroupe = new THREE.Group();
    teteGroupe.position.y = D.TETE_Y;
    teteGroupe.scale.setScalar(ECHELLE_TETE);
    const tete = new THREE.Group();
    tete.position.y = -TETE_ANCIENNE.Y;
    teteGroupe.add(tete);
    racine.add(teteGroupe);

    function peindre(nom, matiere) {
        const b = blocs[nom];
        if (Array.isArray(b)) b.forEach((m) => { m.material = matiere; });
        else if (b) b.material = matiere;
    }

    return { racine, gender, peau, tete, teteGroupe, bras, jambes, blocs, peindre, largeur: D.TORSE.w };
}
