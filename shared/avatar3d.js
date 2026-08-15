// Avatar de Sophie en 3D — construit un personnage Three.js à partir du même
// état que le jeu d'habillage (shared/avatar.js). Première version : formes
// simples, mais reprend le genre, la couleur de peau, les cheveux, la tenue,
// les couleurs et quelques accessoires.
//
// Retourne un THREE.Group posé sur le sol (pieds à y = 0), tourné vers +Z.
// group.userData.parts = { leftArm, rightArm, leftLeg, rightLeg } pour animer
// la marche.

import * as THREE from 'three';
import {
    construireHaut, construireBas, construireRobe, construireChaussures,
    construireChapeau, construireLunettes, construireAccessoire,
} from './garderobe3d.js';
import { construireCheveux } from './cheveux3d.js';

function mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: opts.rough ?? 0.85,
        metalness: opts.metal ?? 0.0,
        transparent: !!opts.transparent,
        opacity: opts.opacity ?? 1,
    });
}
function mkMesh(geo, material, x, y, z) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    return m;
}

const DRESS_LIKE = new Set(['robe', 'jupe']);
const PANTS_LIKE = new Set(['pantalon', 'salopette', 'costume']);
const LONG_SLEEVES = new Set(['pull', 'costume']);

export function buildAvatar3D(s) {
    const g = new THREE.Group();

    const skin = mat(s.skin);
    const shoeMat = mat('#5b3a1a');
    const dark = mat('#3a2e2e');

    // Deux garde-robes possibles :
    //   - `s.look` : la grande garde-robe du défilé (haut + bas + robe + …)
    //   - sinon    : la tenue simple du jeu d'habillage (`s.outfit`)
    const look = s.look || null;
    const animes = [];                       // accessoires qui bougent (ailes, auréole…)
    const outfitMat = look ? null : mat(s.outfitColor);

    // --- Jambes ---
    // Avec la grande garde-robe, les jambes restent couleur peau : les
    // pantalons et les robes viennent se poser par-dessus.
    const legMat = look ? skin : (PANTS_LIKE.has(s.outfit) ? outfitMat : skin);
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16);
    const leftLeg = mkMesh(legGeo, legMat, -0.13, 0.25, 0);
    const rightLeg = mkMesh(legGeo, legMat, 0.13, 0.25, 0);
    g.add(leftLeg, rightLeg);
    const jambes = [leftLeg, rightLeg];

    // --- Vêtements et chaussures ---
    let armMat = skin;
    if (look) {
        let habit;
        if (look.robe && look.robe !== 'aucune') {
            habit = construireRobe(g, look.robe, look.robeColor);
            if (habit.manches) armMat = mat(look.robeColor);
        } else {
            construireBas(g, look.bottom, look.bottomColor, jambes);
            habit = construireHaut(g, look.top, look.topColor);
            if (habit.manches) armMat = mat(look.topColor);
        }
        construireChaussures(g, look.shoes, look.shoesColor, jambes);
    } else {
        // chaussures simples
        const shoeGeo = new THREE.SphereGeometry(0.14, 16, 12);
        for (const x of [-0.13, 0.13]) {
            const shoe = mkMesh(shoeGeo, shoeMat, x, 0.05, 0.05);
            shoe.scale.set(1, 0.55, 1.35);
            g.add(shoe);
        }
        // corps / tenue
        if (DRESS_LIKE.has(s.outfit)) {
            g.add(mkMesh(new THREE.CylinderGeometry(0.22, 0.46, 0.62, 24), outfitMat, 0, 0.78, 0));
        } else {
            g.add(mkMesh(new THREE.CylinderGeometry(0.27, 0.3, 0.56, 24), outfitMat, 0, 0.8, 0));
        }
        armMat = LONG_SLEEVES.has(s.outfit) ? outfitMat : skin;
    }

    // --- Cou ---
    g.add(mkMesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 12), skin, 0, 1.12, 0));

    // --- Bras ---
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 14);
    const leftArm = mkMesh(armGeo, armMat, -0.34, 0.84, 0);
    leftArm.rotation.z = 0.2;
    const rightArm = mkMesh(armGeo, armMat, 0.34, 0.84, 0);
    rightArm.rotation.z = -0.2;
    g.add(leftArm, rightArm);

    // --- Tête ---
    g.add(mkMesh(new THREE.SphereGeometry(0.42, 32, 24), skin, 0, 1.5, 0));

    // --- Visage ---
    const eyeGeo = new THREE.SphereGeometry(0.06, 16, 12);
    g.add(mkMesh(eyeGeo, dark, -0.15, 1.55, 0.37));
    g.add(mkMesh(eyeGeo, dark, 0.15, 1.55, 0.37));
    // petits reflets blancs
    const white = mat('#ffffff');
    const glintGeo = new THREE.SphereGeometry(0.02, 8, 8);
    g.add(mkMesh(glintGeo, white, -0.13, 1.57, 0.42));
    g.add(mkMesh(glintGeo, white, 0.17, 1.57, 0.42));
    // joues
    const cheekMat = mat('#ff9aa2', { transparent: true, opacity: 0.6 });
    const cheekGeo = new THREE.SphereGeometry(0.075, 12, 10);
    g.add(mkMesh(cheekGeo, cheekMat, -0.27, 1.44, 0.3));
    g.add(mkMesh(cheekGeo, cheekMat, 0.27, 1.44, 0.3));
    // sourire (demi-tore)
    const mouth = mkMesh(new THREE.TorusGeometry(0.09, 0.02, 8, 16, Math.PI), mat('#c1442e'), 0, 1.42, 0.37);
    mouth.rotation.z = Math.PI;
    g.add(mouth);
    // sourcils (garçon) — la fille garde un visage doux
    if (s.gender === 'garcon') {
        const browGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
        g.add(mkMesh(browGeo, dark, -0.15, 1.63, 0.38));
        g.add(mkMesh(browGeo, dark, 0.15, 1.63, 0.38));
    }

    // --- Cheveux (vraies mèches, voir cheveux3d.js) ---
    construireCheveux(g, s.hairStyle, s.hairColor, s.gender);

    // --- Chapeau / lunettes / accessoires ---
    if (look) {
        construireChapeau(g, look.hat, look.hatColor);
        construireLunettes(g, look.glasses, look.glassesColor);
        construireAccessoire(g, look.accessoire, look.accColor, animes);
    } else {
        addHat(g, s);
        addGlasses(g, s, dark);
        addAccessories(g, s);
    }

    g.userData.parts = { leftArm, rightArm, leftLeg, rightLeg };
    g.userData.animes = animes;
    return g;
}


// ---------------------------------------------------------------------------
function addHat(g, s) {
    const gold = mat('#ffd43b', { metal: 0.3, rough: 0.4 });
    switch (s.hat) {
        case 'couronne': {
            const band = mkMesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 24, 1, true), gold, 0, 1.86, -0.02);
            g.add(band);
            const spikeGeo = new THREE.ConeGeometry(0.06, 0.14, 8);
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                g.add(mkMesh(spikeGeo, gold, Math.cos(a) * 0.34, 1.98, Math.sin(a) * 0.34 - 0.02));
            }
            break;
        }
        case 'casquette': {
            const dome = new THREE.Mesh(
                new THREE.SphereGeometry(0.44, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
                mat('#1d72c4'),
            );
            dome.position.set(0, 1.62, -0.02);
            g.add(dome);
            const visor = mkMesh(new THREE.BoxGeometry(0.5, 0.04, 0.28), mat('#155a9c'), 0, 1.6, 0.34);
            g.add(visor);
            break;
        }
        case 'chapeau': {
            g.add(mkMesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 24), mat('#c0392b'), 0, 1.82, -0.02));
            g.add(mkMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 24), mat('#e74c3c'), 0, 1.96, -0.02));
            break;
        }
        case 'bonnet': {
            const dome = new THREE.Mesh(
                new THREE.SphereGeometry(0.46, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
                mat('#8e44ad'),
            );
            dome.position.set(0, 1.66, -0.02);
            g.add(dome);
            g.add(mkMesh(new THREE.SphereGeometry(0.09, 12, 10), mat('#ffffff'), 0, 2.02, -0.02));
            break;
        }
        case 'noeud':
            g.add(mkMesh(new THREE.SphereGeometry(0.1, 12, 10), mat('#ff5fa2'), 0.34, 1.78, 0));
            break;
        case 'fleur':
            g.add(mkMesh(new THREE.SphereGeometry(0.08, 10, 8), mat('#ffd43b'), 0.34, 1.72, 0.15));
            break;
        default: break;
    }
}

// ---------------------------------------------------------------------------
function addGlasses(g, s, dark) {
    const type = s.glasses;
    if (!type || type === 'aucune') return;

    // couleur de la monture + éventuel verre (selon le modèle)
    let frame = dark, lens = null;
    if (type === 'soleil') { frame = mat('#222222'); lens = mat('#222222'); }
    else if (type === 'coeur') { frame = mat('#ff5fa2'); lens = mat('#ffd0e4', { transparent: true, opacity: 0.55 }); }
    else if (type === 'etoile') { frame = mat('#f59f00'); lens = mat('#ffe08a', { transparent: true, opacity: 0.55 }); }
    // 'rondes' : monture foncée, sans verre teinté

    const grp = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(0.09, 0.018, 10, 24);
    const lensGeo = new THREE.CircleGeometry(0.085, 20);
    for (const x of [-0.15, 0.15]) {
        grp.add(mkMesh(ringGeo, frame, x, 0, 0));
        if (lens) grp.add(mkMesh(lensGeo, lens, x, 0, 0.002));
    }
    // pont entre les deux verres
    const bridge = mkMesh(new THREE.CylinderGeometry(0.013, 0.013, 0.13, 8), frame, 0, 0, 0);
    bridge.rotation.z = Math.PI / 2;
    grp.add(bridge);

    grp.position.set(0, 1.55, 0.44);   // bien droit, devant les yeux (qui dépassent un peu)
    g.add(grp);
}

// ---------------------------------------------------------------------------
function addAccessories(g, s) {
    switch (s.accessoire) {
        case 'cape': {
            const cape = mkMesh(new THREE.BoxGeometry(0.6, 0.8, 0.04), mat('#c0392b'), 0, 0.85, -0.28);
            cape.rotation.x = -0.12;
            g.add(cape);
            break;
        }
        case 'ailes': {
            const wingGeo = new THREE.SphereGeometry(0.28, 16, 12);
            for (const x of [-0.32, 0.32]) {
                const w = mkMesh(wingGeo, mat('#ffffff', { transparent: true, opacity: 0.92 }), x, 0.95, -0.26);
                w.scale.set(0.5, 1, 0.15);
                g.add(w);
            }
            break;
        }
        case 'baguette': {
            const stick = mkMesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), mat('#deb887'), 0.42, 0.95, 0.1);
            stick.rotation.z = -0.4;
            g.add(stick);
            g.add(mkMesh(new THREE.SphereGeometry(0.06, 10, 8), mat('#ffd43b', { metal: 0.3, rough: 0.3 }), 0.52, 1.14, 0.1));
            break;
        }
        case 'collier': {
            const necklace = mkMesh(new THREE.TorusGeometry(0.12, 0.02, 8, 20), mat('#ffd43b', { metal: 0.3, rough: 0.3 }), 0, 1.08, 0.12);
            necklace.rotation.x = Math.PI / 2.2;
            g.add(necklace);
            break;
        }
        default: break;
    }
}
