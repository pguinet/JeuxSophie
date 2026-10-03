// Les vêtements en 3D, façon Roblox — chaque habit du catalogue (`garderobe.js`)
// « peint » les blocs du corps (torse, bras, jambes…) et ajoute parfois des
// pièces par-dessus (jupe, col, ceinture, capuche…).
//
// Chaque fonction reçoit `corps` (voir `construireCorps` dans corps3d.js) :
//   corps.peindre('torse', matière)  : colore un bloc (ou une paire de blocs)
//   corps.racine                     : le personnage (pieds à y = 0)
//   corps.bras[i] / corps.jambes[i]  : groupes articulés (ce qu'on y accroche suit la marche)
//   corps.tete                       : repère de l'ancienne tête (rayon 0.42, centre y = 1.5)

import * as THREE from 'three';
import { D, BLOCS, boiteRonde } from './corps3d.js';
import { YEUX } from './visage3d.js';

export function matiere(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: opts.rough ?? 0.8,
        metalness: opts.metal ?? 0,
        transparent: !!opts.transparent,
        opacity: opts.opacity ?? 1,
        emissive: opts.emissive ?? '#000000',
        emissiveIntensity: opts.emissiveIntensity ?? 1,
        side: opts.side ?? THREE.FrontSide,
    });
}

// Tissu qui brille (les paillettes)
function matPaillettes(color) {
    return matiere(color, { metal: 0.8, rough: 0.22, emissive: color, emissiveIntensity: 0.22 });
}

function mesh(geo, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
}

// Couleur légèrement plus sombre (ceintures, semelles, ombres de tissu)
function assombrir(hex, k = 0.72) {
    const c = new THREE.Color(hex);
    c.multiplyScalar(k);
    return '#' + c.getHexString();
}

// Un bâton entre deux points (fils, bretelles, branches de lunettes)
function entre(a, b, r, mat) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 6), mat);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
}

// ---------------------------------------------------------------------------
//  Les briques des habits
// ---------------------------------------------------------------------------
const DEVANT = D.TORSE.d / 2;                    // la face avant du torse (z)
const HAUT_TORSE = D.TORSE.y + D.TORSE.h / 2;
const BAS_TORSE = D.TORSE.y - D.TORSE.h / 2;

// Une bande qui fait le tour du torse (rayures, ceintures, haut du pantalon)
function bande(corps, mat, y, h, marge = 0.006) {
    const b = mesh(boiteRonde(D.TORSE.w + 2 * marge, h, D.TORSE.d + 2 * marge, Math.min(h / 2, 0.03 + marge)), mat, 0, y, 0);
    corps.racine.add(b);
    return b;
}

// Une coque sur une partie d'un bloc (bras ou jambe) : `part` (0 → 1) = la part
// couverte, depuis le haut du bloc (ou depuis le bas si `depuisBas`)
function coque(groupe, nom, mat, part = 1, marge = 0.006, depuisBas = false) {
    const [w, h, d, r] = BLOCS[nom].taille;
    const hh = h * part;
    const m = mesh(boiteRonde(w + 2 * marge, hh + 2 * marge, d + 2 * marge, Math.min(r + marge, hh / 2 + marge)), mat);
    const [cx, cy, cz] = BLOCS[nom].centre;
    m.position.set(cx, depuisBas ? cy - h / 2 + hh / 2 : cy + h / 2 - hh / 2, cz);
    groupe.add(m);
    return m;
}
const surLesBras = (corps, faire) => corps.bras.forEach((b, i) => faire(b, i === 0 ? -1 : 1));
const surLesJambes = (corps, faire) => corps.jambes.forEach((j, i) => faire(j, i === 0 ? -1 : 1));

// Manches courtes : le haut des bras
function manchesCourtes(corps, mat, part = 0.4) { surLesBras(corps, (b) => coque(b.epaule, 'bras', mat, part)); }
// Pantalon : les jambes + le bas du torse
function pantalon(corps, mat) {
    corps.peindre('jambes', mat);
    bande(corps, mat, BAS_TORSE + 0.07, 0.14, 0.004);
}

// Une jupe : de la taille (forme du torse, presque carrée) jusqu'à l'ourlet
// (rond), avec un ourlet qui ondule. `profil(t)` donne l'évasement (0 → 1).
export function geoJupe(largeur, yHaut, yBas, rBas, opts = {}) {
    const { vagues = 0.03, profil = (t) => Math.sqrt(t), nbVagues = 9, nFin = 2 } = opts;
    const A = largeur / 2 + 0.012, B = D.TORSE.d / 2 + 0.012;
    const N = 48, M = 16;
    const pos = [], idx = [], uv = [];
    for (let j = 0; j <= M; j++) {
        const t = j / M;
        const y = yHaut + (yBas - yHaut) * t;
        const n = 8 - (8 - nFin) * Math.min(1, t * 1.6);   // carré → rond (nFin = 2) ou carré arrondi
        const e = profil(t);
        for (let i = 0; i <= N; i++) {
            // la couture est derrière : le milieu de la texture (u = 0,5) est devant
            const a = (i / N) * Math.PI * 2 - Math.PI;
            const c = Math.cos(a), sn = Math.sin(a);
            const sup = Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(sn), n), -1 / n);
            const ondule = 1 + Math.sin(a * nbVagues) * vagues * t * t;
            const rx = (A + (rBas - A) * e) * ondule, rz = (B + (rBas * 0.8 - B) * e) * ondule;
            pos.push(sn * sup * rx, y, c * sup * rz);
            uv.push(i / N, 1 - t);
        }
    }
    for (let j = 0; j < M; j++) {
        for (let i = 0; i < N; i++) {
            const a = j * (N + 1) + i, b = a + N + 1;
            idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
}
function jupe(corps, mat, yBas, rBas, opts) {
    const m = mat.clone();
    m.side = THREE.DoubleSide;
    const j = mesh(geoJupe(D.TORSE.w, BAS_TORSE + 0.1, yBas, rBas, opts), m);
    corps.racine.add(j);
    // pour y poser un motif ou un dessin (créations) ; le tutu en a plusieurs
    corps.blocs.jupe = j;
    (corps.blocs.jupes ||= []).push(j);
    return j;
}

// ===========================================================================
//  LES HAUTS
// ===========================================================================

// `matPerso` (facultatif) : la matière du tissu (motif d'une création) à la
// place de la couleur unie.
export function construireHaut(corps, id, color, matPerso = null) {
    if (!id || id === 'aucun') return;

    const m = matPerso || (id === 'paillettes' ? matPaillettes(color) : matiere(color));
    const R = corps.racine;
    const blanc = matiere('#ffffff');

    switch (id) {
        case 'debardeur':
        case 'paillettes': {
            corps.peindre('torse', m);
            return;
        }

        case 'manches_longues': {
            // t-shirt à manches longues, près du corps : il colore le torse et les bras
            corps.peindre('torse', m);
            corps.peindre('bras', m);
            return;
        }

        case 'pull': {
            corps.peindre('torse', m);
            corps.peindre('bras', m);
            // col roulé + bord-côte en bas et aux poignets
            R.add(mesh(boiteRonde(0.3, 0.06, 0.2, 0.02), m, 0, HAUT_TORSE + 0.02, 0));
            const cote = matiere(assombrir(color, 0.85));
            bande(corps, cote, BAS_TORSE + 0.03, 0.05);
            surLesBras(corps, (b) => coque(b.epaule, 'bras', cote, 0.07, 0.006, true));
            return;
        }

        case 'chemise': {
            corps.peindre('torse', m);
            corps.peindre('bras', m);
            for (const s of [-1, 1]) {
                const col = mesh(new THREE.BoxGeometry(0.13, 0.09, 0.02), blanc, s * 0.08, HAUT_TORSE - 0.05, DEVANT + 0.006);
                col.rotation.z = s * -0.45;
                R.add(col);
            }
            const bt = new THREE.CylinderGeometry(0.018, 0.018, 0.012, 12);
            for (let i = 0; i < 4; i++) {
                const b = mesh(bt, blanc, 0, HAUT_TORSE - 0.17 - i * 0.14, DEVANT + 0.006);
                b.rotation.x = Math.PI / 2;
                R.add(b);
            }
            return;
        }

        case 'sweat': {
            corps.peindre('torse', m);
            corps.peindre('bras', m);
            // capuche derrière la nuque
            R.add(mesh(boiteRonde(0.46, 0.18, 0.16, 0.05), m, 0, HAUT_TORSE + 0.03, -0.17));
            // poche kangourou + cordons
            R.add(mesh(boiteRonde(0.4, 0.16, 0.03, 0.012), matiere(assombrir(color, 0.86)), 0, BAS_TORSE + 0.14, DEVANT + 0.008));
            for (const s of [-1, 1]) R.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 6), blanc, s * 0.07, HAUT_TORSE - 0.1, DEVANT + 0.012));
            return;
        }

        case 'veste': {
            corps.peindre('torse', m);
            corps.peindre('bras', m);
            // tee-shirt blanc dans l'ouverture + revers
            R.add(mesh(new THREE.BoxGeometry(0.18, D.TORSE.h - 0.04, 0.01), blanc, 0, D.TORSE.y, DEVANT + 0.002));
            const rev = matiere(assombrir(color, 0.78));
            for (const s of [-1, 1]) {
                const r = mesh(new THREE.BoxGeometry(0.07, 0.34, 0.012), rev, s * 0.12, HAUT_TORSE - 0.18, DEVANT + 0.008);
                r.rotation.z = s * -0.25;
                R.add(r);
            }
            return;
        }

        case 'marin': {
            corps.peindre('torse', m);
            manchesCourtes(corps, m);
            for (let i = 0; i < 5; i++) bande(corps, blanc, BAS_TORSE + 0.08 + i * 0.13, 0.05);
            return;
        }

        default: {  // t-shirt
            corps.peindre('torse', m);
            manchesCourtes(corps, m);
            return;
        }
    }
}

// ===========================================================================
//  LES BAS (pantalons, jupes…)
// ===========================================================================

export function construireBas(corps, id, color, matPerso = null) {
    if (!id || id === 'aucun') return;

    const m = matPerso || matiere(color);
    const ceinture = (c = assombrir(color)) => bande(corps, matiere(c), BAS_TORSE + 0.1, 0.05, 0.012);

    switch (id) {
        case 'short': {
            surLesJambes(corps, (j) => coque(j.hanche, 'jambe', m, 0.45));
            bande(corps, m, BAS_TORSE + 0.07, 0.14, 0.004);
            return;
        }

        case 'jupe': {
            bande(corps, m, BAS_TORSE + 0.07, 0.14, 0.004);
            jupe(corps, m, 0.4, 0.5);
            ceinture();
            return;
        }

        case 'jupe_longue': {
            bande(corps, m, BAS_TORSE + 0.07, 0.14, 0.004);
            jupe(corps, m, 0.04, 0.58, { vagues: 0.04 });
            ceinture();
            return;
        }

        case 'tutu': {
            // un nuage de tulle bouffant autour de la taille, en trois couches
            bande(corps, m, BAS_TORSE + 0.07, 0.14, 0.004);
            const tulle = matiere(color, { rough: 0.95 });
            for (let i = 0; i < 3; i++) {
                jupe(corps, tulle, 0.58 - i * 0.05, 0.55 + i * 0.07, { vagues: 0.1, nbVagues: 14, profil: (t) => Math.pow(t, 0.4) });
            }
            return;
        }

        case 'jogging': {
            pantalon(corps, m);
            // bandes blanches sur le côté de chaque jambe
            const blanc = matiere('#ffffff');
            const [w, h] = BLOCS.jambe.taille;
            surLesJambes(corps, (j, s) => j.hanche.add(mesh(new THREE.BoxGeometry(0.012, h - 0.04, 0.05), blanc, s * (w / 2 + 0.003), BLOCS.jambe.centre[1], 0)));
            return;
        }

        case 'jean': {
            pantalon(corps, m);
            ceinture('#5b3a1a');
            corps.racine.add(mesh(new THREE.BoxGeometry(0.08, 0.055, 0.012), matiere('#d4af37', { metal: 0.7, rough: 0.3 }), 0, BAS_TORSE + 0.1, DEVANT + 0.02));
            return;
        }

        default: {  // pantalon, legging
            pantalon(corps, m);
            return;
        }
    }
}

// ===========================================================================
//  LES ROBES (elles remplacent le haut ET le bas)
// ===========================================================================

export function construireRobe(corps, id, color, matPerso = null) {
    const brillante = id === 'robe_paillettes';
    const m = matPerso || (brillante ? matPaillettes(color) : matiere(color));
    const ceinture = (c) => bande(corps, typeof c === 'string' ? matiere(c) : c, BAS_TORSE + 0.1, 0.05, 0.016);
    corps.peindre('torse', m);

    switch (id) {
        case 'robe_longue':
            jupe(corps, m, 0.03, 0.6, { vagues: 0.035 });
            return;

        case 'robe_paillettes':
            jupe(corps, m, 0.03, 0.58, { vagues: 0.02 });
            ceinture(matiere('#ffd43b', { metal: 0.7, rough: 0.25 }));
            return;

        case 'robe_princesse':
            jupe(corps, m, 0.02, 0.72, { vagues: 0.05, profil: (t) => Math.sin(Math.min(1, t * 1.25) * Math.PI / 2) });
            // manches bouffantes aux épaules
            surLesBras(corps, (b) => {
                const bouf = mesh(new THREE.SphereGeometry(0.24, 18, 14), m, 0, 0.0, 0);
                bouf.scale.set(1, 0.75, 1);
                b.epaule.add(bouf);
            });
            ceinture('#ffffff');
            return;

        case 'combinaison':
            corps.peindre('bras', m);
            pantalon(corps, m);
            ceinture(assombrir(color, 0.7));
            return;

        case 'kimono':
            corps.peindre('bras', m);
            jupe(corps, m, 0.2, 0.46, { vagues: 0, profil: (t) => t });
            bande(corps, matiere('#e03131'), BAS_TORSE + 0.14, 0.12, 0.014);
            // grandes manches qui pendent sous les bras
            surLesBras(corps, (b) => b.epaule.add(mesh(boiteRonde(0.44, 0.34, 0.46, 0.04), m, 0, -0.42, 0)));
            return;

        case 'costume': {
            corps.peindre('bras', m);
            pantalon(corps, m);
            // chemise blanche + cravate rouge
            const plastron = mesh(new THREE.BoxGeometry(0.16, 0.3, 0.01), matiere('#ffffff'), 0, HAUT_TORSE - 0.15, DEVANT + 0.003);
            const cravate = mesh(new THREE.BoxGeometry(0.06, 0.28, 0.012), matiere('#c0392b'), 0, HAUT_TORSE - 0.16, DEVANT + 0.01);
            corps.racine.add(plastron, cravate);
            return;
        }

        default: {  // robe simple : élégante, fine, qui s'évase doucement jusqu'aux genoux
            jupe(corps, m, 0.3, 0.45, { vagues: 0.012, nFin: 3.5, profil: (t) => Math.pow(t, 1.2) });
            // fine ceinture un peu plus foncée + petit nœud
            const fonce = matiere(assombrir(color, 0.7));
            bande(corps, fonce, BAS_TORSE + 0.1, 0.035, 0.014);
            for (const s of [-1, 1]) {
                const boucle = mesh(new THREE.SphereGeometry(0.035, 12, 10), fonce, s * 0.035, BAS_TORSE + 0.1, DEVANT + 0.03);
                boucle.scale.set(1.3, 0.8, 0.5);
                corps.racine.add(boucle);
            }
            // décolleté arrondi
            const col = mesh(new THREE.CircleGeometry(0.13, 28, Math.PI, Math.PI), corps.peau, 0, HAUT_TORSE - 0.004, DEVANT + 0.003);
            col.scale.y = 0.75;
            corps.racine.add(col);
            return;
        }
    }
}

// ===========================================================================
//  LES CHAUSSURES (en bas des jambes)
// ===========================================================================

export function construirePieds() { /* pieds nus : la jambe reste couleur peau */ }

export function construireChaussures(corps, id, color) {
    if (!id || id === 'aucune') return;
    const m = matiere(color);
    const semelleM = matiere(assombrir(color, 0.55));
    const blanc = matiere('#ffffff');
    const [w, h, d] = BLOCS.jambe.taille;
    const yBas = BLOCS.jambe.centre[1] - h / 2;          // le bas de la jambe (dans la hanche)
    const semelle = (mat, ep = 0.04, avance = 0.04) => surLesJambes(corps, (j) =>
        j.hanche.add(mesh(boiteRonde(w + 0.02, ep, d + avance, ep / 2.2), mat, 0, yBas + ep / 2 - 0.004, avance / 2)));

    switch (id) {
        case 'bottes':
            surLesJambes(corps, (j) => coque(j.hanche, 'jambe', m, 0.42, 0.01, true));
            semelle(semelleM);
            break;

        case 'bottes_pluie':
            surLesJambes(corps, (j) => {
                coque(j.hanche, 'jambe', m, 0.5, 0.016, true);
                const bord = mesh(boiteRonde(w + 0.05, 0.04, d + 0.05, 0.02), semelleM, 0, yBas + h * 0.5, 0);
                j.hanche.add(bord);
            });
            semelle(semelleM, 0.045);
            break;

        case 'talons':
            surLesJambes(corps, (j) => {
                coque(j.hanche, 'jambe', m, 0.12, 0.008, true);
                j.hanche.add(mesh(boiteRonde(0.07, 0.12, 0.06, 0.02), m, 0, yBas + 0.06, -d / 2 - 0.02));   // le talon, derrière
            });
            break;

        case 'ballerines':
            surLesJambes(corps, (j) => {
                coque(j.hanche, 'jambe', m, 0.09, 0.008, true);
                j.hanche.add(mesh(new THREE.SphereGeometry(0.035, 10, 8), blanc, 0, yBas + 0.05, d / 2 + 0.01));
            });
            break;

        case 'sandales':
            semelle(m, 0.03, 0.03);
            surLesJambes(corps, (j) => j.hanche.add(mesh(new THREE.BoxGeometry(w + 0.014, 0.03, 0.05), m, 0, yBas + 0.06, d / 2 - 0.05)));
            break;

        default:  // baskets
            surLesJambes(corps, (j) => {
                coque(j.hanche, 'jambe', m, 0.16, 0.01, true);
                const lacets = mesh(new THREE.BoxGeometry(0.16, 0.014, 0.02), blanc, 0, yBas + 0.09, d / 2 + 0.012);
                j.hanche.add(lacets, mesh(new THREE.BoxGeometry(0.16, 0.014, 0.02), blanc, 0, yBas + 0.06, d / 2 + 0.012));
            });
            semelle(blanc, 0.05, 0.05);
            break;
    }
}

// ===========================================================================
//  LES CHAPEAUX (dans le repère de l'ancienne tête : rayon 0.42, y = 1.5)
// ===========================================================================

export function construireChapeau(corps, id, color, matPerso = null) {
    if (!id || id === 'aucun') return;
    const g = corps.tete;
    const m = matPerso || matiere(color);
    const brillant = matPerso || matiere(color, { metal: 0.6, rough: 0.3 });

    switch (id) {
        case 'couronne': {
            g.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 24, 1, true), brillant, 0, 1.88, -0.02));
            const pointe = new THREE.ConeGeometry(0.06, 0.14, 8);
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                g.add(mesh(pointe, brillant, Math.cos(a) * 0.34, 2.0, Math.sin(a) * 0.34 - 0.02));
            }
            break;
        }
        case 'diademe': {
            const arc = mesh(new THREE.TorusGeometry(0.36, 0.022, 8, 24, Math.PI), brillant, 0, 1.8, -0.02);
            arc.rotation.x = -0.35;
            g.add(arc);
            g.add(mesh(new THREE.OctahedronGeometry(0.07), matiere('#7ee8fa', { metal: 0.4, rough: 0.15 }), 0, 1.96, 0.16));
            break;
        }
        case 'chapeau': {
            g.add(mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.04, 28), m, 0, 1.84, -0.02));
            g.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.32, 24), m, 0, 1.99, -0.02));
            g.add(mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.07, 24), matiere(assombrir(color, 0.6)), 0, 1.88, -0.02));
            break;
        }
        case 'paille': {
            const paille = matPerso || matiere('#e8c07d', { rough: 1 });
            g.add(mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.035, 32), paille, 0, 1.82, -0.02));
            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), paille);
            dome.position.set(0, 1.81, -0.02);
            g.add(dome);
            // le ruban de couleur
            g.add(mesh(new THREE.CylinderGeometry(0.395, 0.395, 0.09, 24), m, 0, 1.86, -0.02));
            break;
        }
        case 'casquette': {
            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.47, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), m);
            dome.position.set(0, 1.64, -0.02);
            g.add(dome);
            g.add(mesh(new THREE.BoxGeometry(0.52, 0.04, 0.3), matiere(assombrir(color)), 0, 1.64, 0.38));
            break;
        }
        case 'bonnet': {
            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), m);
            dome.position.set(0, 1.68, -0.02);
            g.add(dome);
            g.add(mesh(new THREE.CylinderGeometry(0.485, 0.485, 0.1, 24), matiere(assombrir(color, 0.85)), 0, 1.72, -0.02));
            g.add(mesh(new THREE.SphereGeometry(0.09, 12, 10), matiere('#ffffff'), 0, 2.06, -0.02));
            break;
        }
        case 'noeud': {
            const c = mesh(new THREE.SphereGeometry(0.075, 12, 10), m, 0.3, 1.8, 0.12);
            const bg = mesh(new THREE.SphereGeometry(0.15, 14, 12), m, 0.44, 1.83, 0.12);
            bg.scale.set(1, 0.8, 0.45);
            const bd = mesh(new THREE.SphereGeometry(0.15, 14, 12), m, 0.16, 1.83, 0.12);
            bd.scale.set(1, 0.8, 0.45);
            g.add(c, bg, bd);
            break;
        }
        case 'fleur': {
            g.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), matiere('#ffd43b'), 0.32, 1.76, 0.24));
            const petGeo = new THREE.SphereGeometry(0.085, 10, 8);
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2;
                const p = mesh(petGeo, m, 0.32 + Math.cos(a) * 0.11, 1.76 + Math.sin(a) * 0.11, 0.24);
                p.scale.set(1, 1, 0.55);
                g.add(p);
            }
            break;
        }
        case 'bandeau': {
            const b = mesh(new THREE.TorusGeometry(0.45, 0.035, 10, 28), m, 0, 1.7, -0.02);
            b.rotation.x = Math.PI / 2 - 0.25;
            g.add(b);
            break;
        }
        case 'oreilles': {
            for (const x of [-0.26, 0.26]) {
                const o = mesh(new THREE.ConeGeometry(0.13, 0.24, 12), m, x, 1.94, -0.04);
                o.rotation.z = x < 0 ? 0.2 : -0.2;
                g.add(o);
                const i = mesh(new THREE.ConeGeometry(0.07, 0.15, 10), matiere('#ffc9de'), x, 1.93, 0.03);
                i.rotation.z = x < 0 ? 0.2 : -0.2;
                g.add(i);
            }
            break;
        }
        default: break;
    }
}

// ===========================================================================
//  LES LUNETTES (repère de l'ancienne tête, alignées sur les yeux du visage)
// ===========================================================================

export function construireLunettes(corps, id, color) {
    if (!id || id === 'aucune') return;

    const monture = matiere(color, { rough: 0.4, metal: 0.2 });
    let verre = null;
    if (id === 'soleil') verre = matiere(assombrir(color, 0.35), { rough: 0.2 });
    else if (id === 'coeur') verre = matiere(color, { transparent: true, opacity: 0.5, rough: 0.2 });
    else if (id === 'etoile') verre = matiere(color, { transparent: true, opacity: 0.5, rough: 0.2 });

    const grp = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(0.085, 0.016, 10, 24);
    const lensGeo = new THREE.CircleGeometry(0.08, 20);

    for (const x of [-YEUX.x, YEUX.x]) {
        if (id === 'coeur') {
            const hg = mesh(new THREE.SphereGeometry(0.058, 12, 10), monture, x - 0.04, 0.03, 0);
            const hd = mesh(new THREE.SphereGeometry(0.058, 12, 10), monture, x + 0.04, 0.03, 0);
            const b = mesh(new THREE.ConeGeometry(0.082, 0.12, 10), monture, x, -0.06, 0);
            b.rotation.x = Math.PI;
            grp.add(hg, hd, b);
        } else if (id === 'etoile') {
            const e = mesh(new THREE.OctahedronGeometry(0.11), monture, x, 0, 0);
            e.scale.set(1, 1, 0.35);
            grp.add(e);
        } else {
            grp.add(mesh(ringGeo, monture, x, 0, 0));
        }
        if (verre && id !== 'coeur' && id !== 'etoile') grp.add(mesh(lensGeo, verre, x, 0, 0.002));
    }
    const pont = mesh(new THREE.CylinderGeometry(0.012, 0.012, Math.max(0.02, YEUX.x * 2 - 0.17), 8), monture, 0, 0.01, 0);
    pont.rotation.z = Math.PI / 2;
    grp.add(pont);
    // les branches qui vont jusqu'aux oreilles
    for (const s of [-1, 1]) {
        grp.add(entre(new THREE.Vector3(s * (YEUX.x + 0.085), 0.01, -0.01), new THREE.Vector3(s * 0.4, 0.02, -0.4), 0.012, monture));
    }

    grp.position.set(0, YEUX.y, 0.44);
    corps.tete.add(grp);
}

// ===========================================================================
//  LES ACCESSOIRES MAGIQUES
// ===========================================================================
// Certains bougent : on remplit `animes` avec { obj, type }.

export function construireAccessoire(corps, id, color, animes) {
    if (!id || id === 'aucun') return;
    const g = corps.racine;
    const m = matiere(color);
    const or = (c = '#ffd43b') => matiere(c, { metal: 0.6, rough: 0.28 });
    const dos = -D.TORSE.d / 2;

    switch (id) {
        case 'cape': {
            // un pan de tissu qui s'élargit vers le bas, derrière le dos
            const geo = boiteRonde(corps.largeur, 0.9, 0.025, 0.012, 2).clone();
            const p = geo.attributes.position;
            for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (1.25 - (p.getY(i) / 0.9) * 0.5));
            geo.computeVertexNormals();
            const cape = mesh(geo, matiere(color, { side: THREE.DoubleSide }), 0, HAUT_TORSE - 0.45, dos - 0.03);
            cape.rotation.x = 0.1;
            g.add(cape);
            // l'attache dorée au cou
            const cordon = mesh(new THREE.TorusGeometry(0.11, 0.013, 6, 24), or(), 0, HAUT_TORSE + 0.01, 0);
            cordon.rotation.x = Math.PI / 2;
            g.add(cordon, mesh(new THREE.SphereGeometry(0.025, 10, 8), or(), 0, HAUT_TORSE - 0.01, 0.11));
            break;
        }
        case 'ailes': {
            const ailesMat = matiere(color, { transparent: true, opacity: 0.75, rough: 0.3, emissive: color, emissiveIntensity: 0.2, side: THREE.DoubleSide });
            for (const x of [-1, 1]) {
                const grande = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), ailesMat);
                grande.position.set(x * 0.28, 1.36, dos - 0.04);
                grande.scale.set(0.55, 1.05, 0.1);
                grande.rotation.z = x * -0.5;
                const petite = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), ailesMat);
                petite.position.set(x * 0.24, 0.94, dos - 0.04);
                petite.scale.set(0.55, 0.9, 0.1);
                petite.rotation.z = x * -0.3;
                g.add(grande, petite);
                if (animes) animes.push({ obj: grande, type: 'aile', sens: x }, { obj: petite, type: 'aile', sens: x });
            }
            break;
        }
        case 'baguette': {
            // tenue dans la main droite : elle suit le bras
            const main = corps.bras[1].main;
            const dir = new THREE.Vector3(0, 0.45, 0.89).normalize();
            const base = new THREE.Vector3(0, -0.05, 0.02);
            main.add(entre(base.clone().addScaledVector(dir, -0.05), base.clone().addScaledVector(dir, 0.32), 0.013, matiere('#deb887')));
            const etoile = mesh(new THREE.OctahedronGeometry(0.07), matiere(color, { metal: 0.5, rough: 0.2, emissive: color, emissiveIntensity: 0.6 }));
            etoile.position.copy(base).addScaledVector(dir, 0.36);
            main.add(etoile);
            if (animes) animes.push({ obj: etoile, type: 'tourne' });
            break;
        }
        case 'collier': {
            const c = mesh(new THREE.TorusGeometry(0.17, 0.016, 8, 32), or(color), 0, HAUT_TORSE - 0.02, 0.03);
            c.rotation.x = Math.PI / 2 - 0.5;
            g.add(c);
            g.add(mesh(new THREE.OctahedronGeometry(0.045), or(color), 0, HAUT_TORSE - 0.16, DEVANT + 0.03));
            break;
        }
        case 'sac': {
            // en bandoulière : le sac sur la hanche gauche, la sangle jusqu'à l'épaule droite
            g.add(mesh(boiteRonde(0.18, 0.14, 0.07, 0.025), m, -0.16, 0.86, DEVANT + 0.05));
            g.add(mesh(new THREE.SphereGeometry(0.016, 8, 6), or(), -0.16, 0.9, DEVANT + 0.088));
            const sangle = matiere(assombrir(color, 0.7));
            const a = new THREE.Vector3(-0.2, 0.92, DEVANT + 0.03);
            const b = new THREE.Vector3(0.18, HAUT_TORSE + 0.005, 0.07);
            const c = new THREE.Vector3(0.18, HAUT_TORSE - 0.1, dos - 0.012);
            g.add(entre(a, b, 0.012, sangle), entre(b, c, 0.012, sangle));
            break;
        }
        case 'echarpe': {
            const tour = mesh(new THREE.TorusGeometry(0.17, 0.06, 10, 28), m, 0, HAUT_TORSE + 0.02, 0);
            tour.rotation.x = Math.PI / 2;
            g.add(tour);
            const pan = mesh(boiteRonde(0.13, 0.36, 0.04, 0.015), m, 0.12, HAUT_TORSE - 0.2, DEVANT + 0.03);
            pan.rotation.z = 0.08;
            g.add(pan);
            break;
        }
        case 'aureole': {
            const a = mesh(new THREE.TorusGeometry(0.24, 0.032, 10, 24), matiere('#ffe066', { metal: 0.5, rough: 0.2, emissive: '#ffd43b', emissiveIntensity: 0.7 }), 0, 2.15, -0.02);
            a.rotation.x = Math.PI / 2;
            corps.tete.add(a);
            if (animes) animes.push({ obj: a, type: 'flotte' });
            break;
        }
        case 'ballons': {
            const grp = new THREE.Group();
            const couleurs = [color, '#ffd43b', '#4dabf7'];
            const fil = matiere('#ffffff');
            const main = new THREE.Vector3(D.EPAULE_X, 0.8, 0.03);
            couleurs.forEach((c, i) => {
                const a = (i / 3) * Math.PI * 2;
                const bx = 0.75 + Math.cos(a) * 0.14, bz = Math.sin(a) * 0.14;
                const by = 2.2 + i * 0.08;
                const b = mesh(new THREE.SphereGeometry(0.13, 16, 12), matiere(c, { rough: 0.35 }), bx, by, bz);
                b.scale.set(1, 1.2, 1);
                grp.add(b, entre(main, new THREE.Vector3(bx, by - 0.15, bz), 0.004, fil));
            });
            g.add(grp);
            if (animes) animes.push({ obj: grp, type: 'flotte' });
            break;
        }
        default: break;
    }
}

// Fait bouger les accessoires vivants (ailes, auréole, baguette, ballons)
export function animerAccessoires(animes, t) {
    for (const a of animes) {
        if (a.type === 'aile') a.obj.rotation.y = Math.sin(t * 9) * 0.4 * a.sens;
        else if (a.type === 'tourne') a.obj.rotation.y = t * 3;
        else if (a.type === 'flotte') a.obj.position.y = (a.obj.userData.y0 ??= a.obj.position.y) + Math.sin(t * 2) * 0.04;
    }
}
