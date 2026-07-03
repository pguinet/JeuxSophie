// Avatar de Sophie en 3D — construit un personnage Three.js à partir du même
// état que le jeu d'habillage (shared/avatar.js). Première version : formes
// simples, mais reprend le genre, la couleur de peau, les cheveux, la tenue,
// les couleurs et quelques accessoires.
//
// Retourne un THREE.Group posé sur le sol (pieds à y = 0), tourné vers +Z.
// group.userData.parts = { leftArm, rightArm, leftLeg, rightLeg } pour animer
// la marche.

import * as THREE from 'three';

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
    const hairMat = mat(s.hairColor, { rough: 0.82 });   // léger éclat sans délaver la couleur
    const outfitMat = mat(s.outfitColor);
    const shoeMat = mat('#5b3a1a');
    const dark = mat('#3a2e2e');

    const dressLike = DRESS_LIKE.has(s.outfit);
    const legMat = PANTS_LIKE.has(s.outfit) ? outfitMat : skin;

    // --- Jambes ---
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16);
    const leftLeg = mkMesh(legGeo, legMat, -0.13, 0.25, 0);
    const rightLeg = mkMesh(legGeo, legMat, 0.13, 0.25, 0);
    g.add(leftLeg, rightLeg);

    // --- Chaussures ---
    const shoeGeo = new THREE.SphereGeometry(0.14, 16, 12);
    for (const x of [-0.13, 0.13]) {
        const shoe = mkMesh(shoeGeo, shoeMat, x, 0.05, 0.05);
        shoe.scale.set(1, 0.55, 1.35);
        g.add(shoe);
    }

    // --- Corps / tenue ---
    if (dressLike) {
        const dress = new THREE.CylinderGeometry(0.22, 0.46, 0.62, 24);
        g.add(mkMesh(dress, outfitMat, 0, 0.78, 0));
    } else {
        const torso = new THREE.CylinderGeometry(0.27, 0.3, 0.56, 24);
        g.add(mkMesh(torso, outfitMat, 0, 0.8, 0));
    }

    // --- Cou ---
    g.add(mkMesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 12), skin, 0, 1.12, 0));

    // --- Bras ---
    const armMat = LONG_SLEEVES.has(s.outfit) ? outfitMat : skin;
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

    // --- Cheveux ---
    addHair(g, s, hairMat);

    // --- Chapeau / lunettes / accessoires ---
    addHat(g, s);
    addGlasses(g, s, dark);
    addAccessories(g, s);

    g.userData.parts = { leftArm, rightArm, leftLeg, rightLeg };
    return g;
}

// ---------------------------------------------------------------------------
// Une anglaise / tire-bouchon : un tube qui descend en spirale (cheveux bouclés)
function makeRinglet(ax, ay, az, hairMat, drop = 0.5) {
    const pts = [];
    const turns = 2.3 + Math.random() * 0.9, segs = 28, spiralR = 0.05 + Math.random() * 0.03;
    for (let i = 0; i <= segs; i++) {
        const t = i / segs, ang = t * turns * Math.PI * 2;
        pts.push(new THREE.Vector3(ax + Math.cos(ang) * spiralR, ay - t * drop, az + Math.sin(ang) * spiralR));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.038, 6, false), hairMat);
}

// Des centaines de petites boucles (tailles + nuances variées) en un seul objet
// 3D (InstancedMesh) → beaucoup de détail sans ralentir le jeu.
function makeCurlyMesh(gender, hairColorHex) {
    const base = new THREE.Color(hairColorHex);
    const items = [];
    const center = new THREE.Vector3(0, 1.55, -0.02);
    function scatter(count, radius, sMin, sMax) {
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(1 - Math.random() * 1.6);
            const nv = new THREE.Vector3(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta));
            if (nv.z > 0.32 && nv.y < 0.28) continue;   // pas de boucles sur le visage
            const p = center.clone().addScaledVector(nv, radius + (Math.random() - 0.5) * 0.04);
            const sc = sMin + Math.random() * (sMax - sMin);
            const col = base.clone().offsetHSL(0, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.13);
            items.push({ p, sc, col });
        }
    }
    scatter(gender === 'garcon' ? 80 : 95, 0.44, 0.09, 0.15);   // grosses boucles
    scatter(gender === 'garcon' ? 70 : 85, 0.49, 0.05, 0.09);   // petites boucles de détail

    const geo = new THREE.SphereGeometry(1, 8, 7);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.82 });
    const mesh = new THREE.InstancedMesh(geo, material, items.length);
    const d = new THREE.Object3D();
    items.forEach((it, i) => {
        d.position.copy(it.p);
        d.scale.setScalar(it.sc);
        d.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        d.updateMatrix();
        mesh.setMatrixAt(i, d.matrix);
        mesh.setColorAt(i, it.col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
}

// Ajoute un léger relief de mèches sur une chevelure lisse (petites bosses de
// la même couleur) pour un rendu plus vivant, sans piquants.
function addWisps(g, hairMat, points) {
    const wispGeo = new THREE.SphereGeometry(0.07, 10, 8);
    for (const [x, y, z, sy] of points) {
        const w = new THREE.Mesh(wispGeo, hairMat);
        w.position.set(x, y, z);
        w.scale.set(0.7, sy || 2.4, 0.7);
        g.add(w);
    }
}

function addHair(g, s, hairMat) {
    const style = s.hairStyle;
    const gender = s.gender;

    // Calotte : dôme lisse qui couvre le crâne
    const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62),
        hairMat,
    );
    cap.position.set(0, 1.52, -0.04);
    cap.rotation.x = -0.26;
    g.add(cap);

    // Frange lisse sur le front (sauf crête et boucles)
    if (style !== 'crete' && style !== 'boucles') {
        const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 16), hairMat);
        fringe.position.set(0, 1.63, 0.13);
        fringe.scale.set(1.06, 0.5, 0.72);
        g.add(fringe);
    }

    if (style === 'longs') {
        // grande masse lisse qui enveloppe l'arrière et les côtés, visage dégagé
        const mass = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 22), hairMat);
        mass.position.set(0, 1.28, -0.12);
        mass.scale.set(1.0, 1.18, 0.92);
        g.add(mass);
        // quelques mèches douces qui tombent devant les épaules
        addWisps(g, hairMat, [
            [-0.44, 1.15, 0.16, 3.2], [0.44, 1.15, 0.16, 3.2],
            [-0.5, 1.25, 0.02, 3.0], [0.5, 1.25, 0.02, 3.0],
        ]);
    } else if (style === 'couettes') {
        const mass = new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 20), hairMat);
        mass.position.set(0, 1.44, -0.12);
        mass.scale.set(1.0, 0.92, 0.88);
        g.add(mass);
        // deux couettes lisses qui pendent sur les côtés
        for (const sx of [-1, 1]) {
            const p = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), hairMat);
            p.position.set(sx * 0.5, 1.18, 0);
            p.scale.set(0.85, 1.5, 0.85);
            g.add(p);
        }
    } else if (style === 'chignon') {
        g.add(mkMesh(new THREE.SphereGeometry(0.17, 16, 12), hairMat, 0, 1.94, -0.02));
    } else if (style === 'crete') {
        g.add(mkMesh(new THREE.BoxGeometry(0.12, 0.26, 0.46), hairMat, 0, 1.86, -0.02));
    } else if (style === 'boucles') {
        // Masse volumineuse de base (le volume des boucles)
        const mass = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 20), hairMat);
        mass.position.set(0, 1.55, -0.05);
        mass.scale.set(1.06, 1.02, 1.0);
        g.add(mass);

        // Des centaines de petites boucles détaillées (deux couches, nuances variées)
        g.add(makeCurlyMesh(gender, s.hairColor));

        // Fille : beaucoup de tire-bouchons de longueurs variées sur les côtés et l'arrière
        if (gender !== 'garcon') {
            const anchors = [
                [-0.42, 1.48, 0.08, 0.5], [-0.47, 1.46, -0.08, 0.58], [-0.44, 1.45, -0.24, 0.46],
                [-0.28, 1.45, -0.38, 0.4], [0.42, 1.48, 0.08, 0.5], [0.47, 1.46, -0.08, 0.58],
                [0.44, 1.45, -0.24, 0.46], [0.28, 1.45, -0.38, 0.4], [0.12, 1.45, -0.45, 0.44],
                [-0.12, 1.45, -0.45, 0.44],
            ];
            for (const [ax, ay, az, drop] of anchors) g.add(makeRinglet(ax, ay, az, hairMat, drop));
        }
    }
    // 'courts' : calotte + frange suffisent
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
