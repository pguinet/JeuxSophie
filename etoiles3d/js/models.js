// Dessins 3D (procéduraux) des animaux et des décorations du magasin.
// Tout est construit avec des formes simples de Three.js.
//
//  buildAnimal(id) -> THREE.Group   (pieds à y=0, regarde vers +Z)
//     userData.parts.wings : ailes à battre (animaux qui volent)
//     userData.parts.ears  : oreilles (petit rebond)
//     userData.hop         : hauteur du petit saut quand il marche
//  buildDeco(id)   -> THREE.Group
//  DECO_POS[id]    -> { x, z }   position de la déco dans le monde

import * as THREE from 'three';

// --- petits raccourcis ---
const mat = (c, extra) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, ...(extra || {}) });
const useMat = (c) => (c instanceof THREE.Material ? c : mat(c));
const box = (w, h, d, c) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), useMat(c));
const sph = (r, c) => new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), useMat(c));
const cyl = (rt, rb, h, c, seg = 12) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), useMat(c));
const cone = (r, h, c, seg = 12) => new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), useMat(c));

function eyes(head, s, fwd) {
    const eMat = mat('#2b2b2b');
    for (const sx of [-1, 1]) {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.045 * s, 8, 8), eMat);
        e.position.set(sx * 0.09 * s, 0.03 * s, fwd);
        head.add(e);
    }
}

// ============================ ANIMAUX ============================

// Base commune à un petit animal à quatre pattes.
// Renvoie { g, head, legs } pour pouvoir ajouter oreilles/queue et animer.
function quadru(s, corps, opts = {}) {
    const g = new THREE.Group();
    const cMat = mat(corps);

    const body = box(0.42 * s, 0.36 * s, 0.72 * s, cMat);
    body.position.y = 0.42 * s;
    g.add(body);

    const head = new THREE.Group();
    head.position.set(0, 0.58 * s, 0.42 * s);
    const skull = sph(0.24 * s, cMat);
    head.add(skull);
    eyes(head, s, 0.22 * s);
    // museau
    const nose = sph(0.09 * s, mat(opts.museau || '#3a3a3a'));
    nose.position.set(0, -0.03 * s, 0.24 * s);
    head.add(nose);
    g.add(head);

    // 4 pattes
    const legs = [];
    const legGeo = new THREE.CylinderGeometry(0.06 * s, 0.06 * s, 0.3 * s, 6);
    for (const [x, z] of [[-0.14, 0.24], [0.14, 0.24], [-0.14, -0.24], [0.14, -0.24]]) {
        const l = new THREE.Mesh(legGeo, cMat);
        l.position.set(x * s, 0.15 * s, z * s);
        g.add(l);
        legs.push(l);
    }

    g.userData = { parts: { legs, ears: [] }, hop: 0.06 };
    g.userData.head = head;
    g.userData.cMat = cMat;
    return { g, head, cMat };
}

function triEar(w, h, c) {
    // petite oreille pointue (cône aplati)
    const e = cone(w, h, c, 4);
    return e;
}

function buildChien() {
    const s = 1;
    const { g, head, cMat } = quadru(s, '#b06a2c', { museau: '#5a3212' });
    // oreilles tombantes
    for (const sx of [-1, 1]) {
        const ear = new THREE.Group();
        const e = box(0.1, 0.22, 0.06, cMat);
        e.position.y = -0.11;
        ear.add(e);
        ear.position.set(sx * 0.16, 0.16, 0.02);
        head.add(ear);
        g.userData.parts.ears.push(ear);
    }
    // queue
    const tail = cyl(0.04, 0.06, 0.34, cMat, 6);
    tail.position.set(0, 0.52, -0.4);
    tail.rotation.x = -0.9;
    g.add(tail);
    return g;
}

function buildChat() {
    const s = 0.92;
    const { g, head, cMat } = quadru(s, '#8d8d94', { museau: '#f2a5c0' });
    // oreilles pointues
    for (const sx of [-1, 1]) {
        const ear = triEar(0.1, 0.2, cMat);
        ear.position.set(sx * 0.13 * s, 0.24 * s, 0.02 * s);
        head.add(ear);
        g.userData.parts.ears.push(ear);
    }
    // longue queue dressée
    const tail = cyl(0.035, 0.05, 0.5, cMat, 6);
    tail.position.set(0, 0.6 * s, -0.38 * s);
    tail.rotation.x = 0.5;
    g.add(tail);
    return g;
}

function buildLapin() {
    const s = 0.8;
    const { g, head, cMat } = quadru(s, '#f2f0ef', { museau: '#f2a5c0' });
    // grandes oreilles dressées
    for (const sx of [-1, 1]) {
        const ear = box(0.09, 0.42, 0.06, cMat);
        ear.position.set(sx * 0.1 * s, 0.34 * s, 0);
        ear.rotation.z = sx * 0.12;
        head.add(ear);
        g.userData.parts.ears.push(ear);
    }
    // petite queue pompon
    const tail = sph(0.1 * s, mat('#ffffff'));
    tail.position.set(0, 0.42 * s, -0.4 * s);
    g.add(tail);
    g.userData.hop = 0.22;   // le lapin saute plus haut
    return g;
}

function buildLicorne() {
    const s = 1.25;
    const { g, head, cMat } = quadru(s, '#fbf6ff', { museau: '#f4c9e4' });
    // corne dorée
    const corne = cone(0.06 * s, 0.34 * s, mat('#ffd43b', { metalness: 0.4, roughness: 0.3 }), 8);
    corne.position.set(0, 0.34 * s, 0.16 * s);
    corne.rotation.x = 0.25;
    head.add(corne);
    // crinière rose
    const mMat = mat('#ff7ec4');
    for (let i = 0; i < 5; i++) {
        const m = sph((0.1 - i * 0.008) * s, mMat);
        m.position.set(0, (0.6 - i * 0.11) * s, (0.28 - i * 0.14) * s);
        g.add(m);
    }
    // oreilles
    for (const sx of [-1, 1]) {
        const ear = triEar(0.07 * s, 0.14 * s, cMat);
        ear.position.set(sx * 0.13 * s, 0.24 * s, 0.02 * s);
        head.add(ear);
        g.userData.parts.ears.push(ear);
    }
    // queue rose
    const tail = cyl(0.05 * s, 0.02 * s, 0.4 * s, mMat, 6);
    tail.position.set(0, 0.5 * s, -0.42 * s);
    tail.rotation.x = 0.7;
    g.add(tail);
    return g;
}

function buildOiseau() {
    const g = new THREE.Group();
    const cMat = mat('#4dabf7');
    const body = sph(0.2, cMat);
    body.scale.set(1, 0.9, 1.2);
    body.position.y = 0;
    g.add(body);
    // tête
    const head = new THREE.Group();
    head.position.set(0, 0.14, 0.2);
    head.add(sph(0.14, cMat));
    eyes(head, 0.9, 0.12);
    const bec = cone(0.05, 0.14, mat('#ff922b'), 6);
    bec.rotation.x = Math.PI / 2;
    bec.position.set(0, 0, 0.16);
    head.add(bec);
    g.add(head);
    // ailes (battent)
    const wings = [];
    const wMat = mat('#1c7ed6');
    for (const sx of [-1, 1]) {
        const pivot = new THREE.Group();
        const w = box(0.28, 0.04, 0.22, wMat);
        w.position.x = sx * 0.16;
        pivot.add(w);
        pivot.position.set(sx * 0.05, 0.02, 0);
        g.add(pivot);
        wings.push(pivot);
    }
    // petite queue
    const tail = box(0.12, 0.03, 0.18, wMat);
    tail.position.set(0, 0, -0.24);
    g.add(tail);
    g.userData = { parts: { wings, ears: [] }, hop: 0 };
    return g;
}

function buildPapillon() {
    const g = new THREE.Group();
    // corps
    const body = cyl(0.03, 0.03, 0.34, mat('#3a2b4d'), 6);
    g.add(body);
    // antennes
    for (const sx of [-1, 1]) {
        const a = cyl(0.008, 0.008, 0.14, mat('#3a2b4d'), 4);
        a.position.set(sx * 0.03, 0.2, 0.02);
        a.rotation.z = sx * 0.4;
        g.add(a);
    }
    // ailes colorées (2 de chaque côté)
    const wings = [];
    const cols = ['#ff5fa2', '#ffd43b'];
    for (let si = 0; si < 2; si++) {
        const sx = si === 0 ? -1 : 1;
        const pivot = new THREE.Group();
        const haute = box(0.24, 0.02, 0.2, mat(cols[0]));
        haute.position.set(sx * 0.16, 0, 0.08);
        const basse = box(0.18, 0.02, 0.16, mat(cols[1]));
        basse.position.set(sx * 0.13, 0, -0.1);
        pivot.add(haute, basse);
        g.add(pivot);
        wings.push(pivot);
    }
    g.userData = { parts: { wings, ears: [] }, hop: 0 };
    return g;
}

const ANIMAL_BUILDERS = {
    chien: buildChien,
    chat: buildChat,
    lapin: buildLapin,
    licorne: buildLicorne,
    oiseau: buildOiseau,
    papillon: buildPapillon,
};

export function buildAnimal(id) {
    const b = ANIMAL_BUILDERS[id];
    return b ? b() : null;
}

// ============================ DÉCORATIONS ============================

export const DECO_POS = {
    fleurs:     { x: 0,   z: 0 },     // le groupe éparpille des fleurs partout
    ballons:    { x: -10, z: 4 },
    guirlandes: { x: 10,  z: -2 },
    arcenciel:  { x: 0,   z: -10 },
    fontaine:   { x: 6,   z: 8 },
    chateau:    { x: 0,   z: -16 },
};

function uneFleur(couleur) {
    const f = new THREE.Group();
    const tige = cyl(0.03, 0.03, 0.5, mat('#2f9e44'), 5);
    tige.position.y = 0.25;
    f.add(tige);
    const coeur = sph(0.08, mat('#ffd43b'));
    coeur.position.y = 0.52;
    f.add(coeur);
    const petMat = mat(couleur);
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), petMat);
        p.scale.set(1, 0.5, 1.4);
        p.position.set(Math.cos(a) * 0.12, 0.52, Math.sin(a) * 0.12);
        f.add(p);
    }
    return f;
}

function buildFleurs() {
    const g = new THREE.Group();
    const couleurs = ['#ff5fa2', '#ffd43b', '#9775fa', '#4dabf7', '#ff922b', '#ff6b6b'];
    // fleurs éparpillées à des endroits fixes autour du terrain
    const spots = [
        [-3, 2], [-5, -3], [4, 3], [6, -2], [-8, 6], [8, 7], [2, -6],
        [-2, 8], [10, 2], [-10, -1], [1, 5], [-6, -7], [7, -8], [3, 9],
    ];
    spots.forEach(([x, z], i) => {
        const f = uneFleur(couleurs[i % couleurs.length]);
        f.position.set(x, 0, z);
        f.scale.setScalar(0.9 + (i % 3) * 0.2);
        g.add(f);
    });
    return g;
}

function buildBallons() {
    const g = new THREE.Group();
    const couleurs = ['#ff5fa2', '#4dabf7', '#ffd43b', '#51cf66', '#9775fa'];
    couleurs.forEach((c, i) => {
        const a = (i / couleurs.length) * Math.PI * 2;
        const bx = Math.cos(a) * 0.5, bz = Math.sin(a) * 0.5;
        const hauteur = 2.2 + (i % 3) * 0.4;
        // ficelle
        const fic = cyl(0.008, 0.008, hauteur, mat('#ffffff'), 4);
        fic.position.set(bx, hauteur / 2, bz);
        g.add(fic);
        // ballon
        const b = sph(0.32, mat(c));
        b.scale.set(1, 1.25, 1);
        b.position.set(bx, hauteur + 0.3, bz);
        g.add(b);
    });
    return g;
}

function buildGuirlandes() {
    const g = new THREE.Group();
    // deux poteaux
    const poteauMat = mat('#8a5a2b');
    const gauche = cyl(0.06, 0.06, 2.4, poteauMat, 6);
    gauche.position.set(-1.8, 1.2, 0);
    const droite = cyl(0.06, 0.06, 2.4, poteauMat, 6);
    droite.position.set(1.8, 1.2, 0);
    g.add(gauche, droite);
    // guirlande de fanions colorés en arc entre les deux poteaux
    const couleurs = ['#ff5fa2', '#ffd43b', '#4dabf7', '#51cf66', '#ff922b', '#9775fa'];
    const n = 9;
    for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const x = -1.6 + t * 3.2;
        const y = 2.3 - Math.sin(t * Math.PI) * 0.5;   // léger creux
        const fanion = cone(0.12, 0.24, mat(couleurs[i % couleurs.length]), 4);
        fanion.rotation.x = Math.PI;   // pointe vers le bas
        fanion.position.set(x, y, 0);
        g.add(fanion);
    }
    return g;
}

function buildArcEnCiel() {
    const g = new THREE.Group();
    const bandes = ['#ff5252', '#ff922b', '#ffd43b', '#51cf66', '#4dabf7', '#9775fa'];
    const base = 4.2;
    bandes.forEach((c, i) => {
        const r = base + i * 0.5;
        const geo = new THREE.TorusGeometry(r, 0.24, 8, 40, Math.PI);
        const arc = new THREE.Mesh(geo, mat(c, { emissive: c, emissiveIntensity: 0.15 }));
        g.add(arc);
    });
    // l'arc est dans le plan X-Y (debout), pieds au sol
    return g;
}

function buildFontaine() {
    const g = new THREE.Group();
    const pierre = mat('#c7ccd1');
    const eau = mat('#4dc4ff', { transparent: true, opacity: 0.85, emissive: '#1b7fb0', emissiveIntensity: 0.2 });
    // bassin
    const bassin = cyl(1.3, 1.4, 0.5, pierre, 20);
    bassin.position.y = 0.25;
    g.add(bassin);
    const surface = cyl(1.15, 1.15, 0.12, eau, 20);
    surface.position.y = 0.5;
    g.add(surface);
    // pilier central
    const pilier = cyl(0.25, 0.3, 0.9, pierre, 12);
    pilier.position.y = 0.85;
    g.add(pilier);
    const vasque = cyl(0.6, 0.4, 0.2, pierre, 14);
    vasque.position.y = 1.35;
    g.add(vasque);
    // jet d'eau central (il pulse)
    const jet = cyl(0.08, 0.14, 0.8, eau, 8);
    jet.position.y = 1.75;
    g.add(jet);

    // gouttes qui jaillissent du sommet et retombent dans le bassin
    const gouttes = [];
    const N = 12;
    for (let i = 0; i < N; i++) {
        const d = sph(0.11, eau);
        g.add(d);
        gouttes.push({ mesh: d, angle: (i / N) * Math.PI * 2, phase: i / N });
    }

    // animation : appelée à chaque image par le jeu (t en millisecondes)
    g.userData.update = (t) => {
        const s = t * 0.001;
        gouttes.forEach((gt) => {
            const p = (s * 0.7 + gt.phase) % 1;          // progression 0..1
            const r = 0.15 + p * 0.95;                   // s'éloigne du centre
            const y = 2.0 + p * 1.4 - p * p * 3.1;       // parabole : monte puis retombe
            gt.mesh.position.set(Math.cos(gt.angle) * r, Math.max(0.58, y), Math.sin(gt.angle) * r);
            gt.mesh.scale.setScalar(0.55 + (1 - p) * 0.6);
        });
        surface.scale.y = 1 + Math.sin(s * 3) * 0.18;    // l'eau ondule
        jet.scale.y = 1 + Math.sin(s * 6) * 0.14;        // le jet pulse
    };
    return g;
}

function buildChateau() {
    const g = new THREE.Group();
    const murMat = mat('#e9c9a0');
    const toitMat = mat('#e64980');
    const porteMat = mat('#6b4226');

    // corps principal
    const corps = box(3, 2, 2.4, murMat);
    corps.position.y = 1;
    g.add(corps);
    // créneaux sur le corps
    for (let i = -1; i <= 1; i++) {
        const cr = box(0.4, 0.4, 0.4, murMat);
        cr.position.set(i * 1.1, 2.2, 1);
        g.add(cr);
    }
    // porte
    const porte = box(0.7, 1.1, 0.1, porteMat);
    porte.position.set(0, 0.55, 1.25);
    g.add(porte);

    // quatre tours avec toits pointus
    const tourPos = [[-1.6, 1.4], [1.6, 1.4], [-1.6, -1.4], [1.6, -1.4]];
    tourPos.forEach(([x, z]) => {
        const tour = cyl(0.45, 0.5, 3, murMat, 12);
        tour.position.set(x, 1.5, z);
        g.add(tour);
        const toit = cone(0.6, 1, toitMat, 12);
        toit.position.set(x, 3.4, z);
        g.add(toit);
        // petit drapeau
        const mat_ = cyl(0.02, 0.02, 0.5, mat('#ffffff'), 4);
        mat_.position.set(x, 4.1, z);
        g.add(mat_);
        const drap = box(0.3, 0.18, 0.02, mat('#ffd43b'));
        drap.position.set(x + 0.16, 4.25, z);
        g.add(drap);
    });
    return g;
}

const DECO_BUILDERS = {
    fleurs: buildFleurs,
    ballons: buildBallons,
    guirlandes: buildGuirlandes,
    arcenciel: buildArcEnCiel,
    fontaine: buildFontaine,
    chateau: buildChateau,
};

export function buildDeco(id) {
    const b = DECO_BUILDERS[id];
    return b ? b() : null;
}
