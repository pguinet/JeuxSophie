// La salle du défilé : un long podium, des projecteurs de couleur, du public
// qui applaudit et trois juges au bout qui lèvent leurs pancartes.
//
// Elle est construite loin de la salle d'habillage (autour de z = -60) : on y
// emmène simplement le personnage et la caméra quand le défilé commence.

import * as THREE from 'three';
import { JUGES } from './themes.js';

export const PODIUM = {
    z0: -72,      // là où le personnage entre
    z1: -54,      // là où il s'arrête pour la pose
    zJuges: -49,
    centre: -62,
};

function matiere(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: opts.rough ?? 0.9,
        metalness: opts.metal ?? 0,
        emissive: opts.emissive ?? '#000000',
        emissiveIntensity: opts.emissiveIntensity ?? 1,
        transparent: !!opts.transparent,
        opacity: opts.opacity ?? 1,
        side: opts.side ?? THREE.FrontSide,
    });
}
function mesh(geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
}

// Un petit spectateur tout simple (corps + tête), qui sautille
function spectateur(x, y, z, couleur) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CapsuleGeometry(0.22, 0.38, 6, 10), matiere(couleur), 0, 0.42, 0));
    g.add(mesh(new THREE.SphereGeometry(0.22, 14, 10), matiere('#f1c27d'), 0, 0.86, 0));
    // deux bras levés qui applaudissent
    const bras = new THREE.Group();
    for (const sx of [-1, 1]) {
        const b = mesh(new THREE.CapsuleGeometry(0.06, 0.3, 4, 8), matiere('#f1c27d'), sx * 0.26, 0.62, 0);
        b.rotation.z = sx * -0.9;
        bras.add(b);
    }
    g.add(bras);
    g.position.set(x, y, z);
    g.userData.bras = bras;
    g.userData.phase = Math.random() * 6;
    return g;
}

// Un juge derrière son pupitre, avec une pancarte qui monte à la fin
function juge(x, z, info) {
    const g = new THREE.Group();

    // pupitre
    g.add(mesh(new THREE.BoxGeometry(1.5, 0.9, 0.6), matiere('#c2255c'), 0, 0.45, 0.4));
    g.add(mesh(new THREE.BoxGeometry(1.6, 0.08, 0.7), matiere('#ffd43b', { metal: 0.4, rough: 0.35 }), 0, 0.92, 0.4));

    // le juge
    g.add(mesh(new THREE.CapsuleGeometry(0.28, 0.5, 6, 12), matiere(info.couleur), 0, 0.75, 0));
    g.add(mesh(new THREE.SphereGeometry(0.28, 18, 14), matiere('#f1c27d'), 0, 1.35, 0));
    // yeux
    const oeil = new THREE.SphereGeometry(0.045, 8, 6);
    g.add(mesh(oeil, matiere('#3a2e2e'), -0.1, 1.38, 0.25), mesh(oeil, matiere('#3a2e2e'), 0.1, 1.38, 0.25));
    // cheveux
    const cheveux = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
        matiere('#5b3a1a'),
    );
    cheveux.position.set(0, 1.37, -0.03);
    g.add(cheveux);

    // la pancarte de note (cachée au départ)
    const pancarte = new THREE.Group();
    pancarte.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), matiere('#deb887'), 0, 0.25, 0));
    const plaque = mesh(new THREE.BoxGeometry(0.7, 0.7, 0.06), matiere('#ffffff'), 0, 0.72, 0);
    pancarte.add(plaque);
    pancarte.position.set(0.6, 0.95, 0.2);
    pancarte.visible = false;
    g.add(pancarte);

    g.position.set(x, 0, z);
    g.userData.info = info;
    g.userData.pancarte = pancarte;
    g.userData.plaque = plaque;
    return g;
}

// Dessine le nombre d'étoiles sur la pancarte du juge
function texturePancarte(note, couleur) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, 242, 242);
    ctx.fillStyle = couleur;
    ctx.font = 'bold 150px "Comic Sans MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(note), 128, 108);
    ctx.font = '54px system-ui, sans-serif';
    ctx.fillText('⭐', 128, 205);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// ===========================================================================

export function construirePodium(scene) {
    // Comme la salle, tout est dans un groupe qu'on cache tant qu'on s'habille.
    const racine = new THREE.Group();
    racine.visible = false;
    scene.add(racine);

    const zC = PODIUM.centre;
    const anim = { spectateurs: [], projecteurs: [], juges: [], groupe: racine };

    // --- Sol sombre de la salle de spectacle ---
    const sol = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        matiere('#2b1b3d', { rough: 1 }),
    );
    sol.rotation.x = -Math.PI / 2;
    sol.position.set(0, 0, zC);
    racine.add(sol);

    // --- Murs autour, pour faire une vraie salle ---
    const murMat = matiere('#3b2456', { rough: 1, side: THREE.DoubleSide });
    const mur = (w, x, z, rotY) => {
        const m = mesh(new THREE.PlaneGeometry(w, 9), murMat, x, 4.5, z);
        m.rotation.y = rotY;
        racine.add(m);
    };
    mur(40, 0, zC - 20, 0);
    mur(40, 0, zC + 20, Math.PI);
    mur(40, -20, zC, Math.PI / 2);
    mur(40, 20, zC, -Math.PI / 2);

    // --- Le podium (long tapis surélevé) ---
    const longueur = PODIUM.z1 - PODIUM.z0;   // 18 : de l'entrée jusqu'aux juges
    const estrade = mesh(new THREE.BoxGeometry(4.4, 0.35, longueur + 6), matiere('#f8f0e3'), 0, 0.175, (PODIUM.z0 + PODIUM.z1) / 2 - 1);
    racine.add(estrade);
    const tapis = mesh(new THREE.BoxGeometry(3.6, 0.06, longueur + 5.6), matiere('#c92a2a', { rough: 1 }), 0, 0.38, (PODIUM.z0 + PODIUM.z1) / 2 - 1);
    racine.add(tapis);

    // liseré lumineux le long du podium
    const liseréMat = matiere('#ffd43b', { emissive: '#ffd43b', emissiveIntensity: 1.1 });
    for (const sx of [-1, 1]) {
        racine.add(mesh(new THREE.BoxGeometry(0.12, 0.1, longueur + 6), liseréMat, sx * 2.15, 0.36, (PODIUM.z0 + PODIUM.z1) / 2 - 1));
    }

    // --- Arche d'entrée au fond du podium ---
    const or = matiere('#ffd43b', { metal: 0.55, rough: 0.35, emissive: '#7a5c00', emissiveIntensity: 0.4 });
    for (const x of [-2.4, 2.4]) racine.add(mesh(new THREE.CylinderGeometry(0.2, 0.24, 4.2, 12), or, x, 2.1, PODIUM.z0 + 1.5));
    const cintre = mesh(new THREE.TorusGeometry(2.4, 0.2, 10, 22, Math.PI), or, 0, 4.2, PODIUM.z0 + 1.5);
    racine.add(cintre);

    // --- Projecteurs de couleur qui balaient la scène ---
    const couleursSpot = ['#ff5fa2', '#4dabf7', '#ffd43b', '#9775fa'];
    couleursSpot.forEach((c, i) => {
        const x = i < 2 ? -6.5 : 6.5;
        const z = zC + (i % 2 === 0 ? -6 : 6);
        // le pied
        racine.add(mesh(new THREE.CylinderGeometry(0.12, 0.2, 6, 10), matiere('#212529'), x, 3, z));
        // le faisceau (un cône transparent)
        const faisceau = mesh(
            new THREE.ConeGeometry(1.5, 6.5, 18, 1, true),
            matiere(c, { transparent: true, opacity: 0.22, emissive: c, emissiveIntensity: 0.9, side: THREE.DoubleSide }),
            x, 3.4, z,
        );
        racine.add(faisceau);
        anim.projecteurs.push({ obj: faisceau, base: { x, z }, phase: i * 1.4 });

        // seulement deux vraies lumières colorées : c'est plus léger pour l'ordinateur
        if (i < 2) {
            const lampe = new THREE.PointLight(c, 22, 26, 2);
            lampe.position.set(x, 6, z);
            racine.add(lampe);
        }
    });

    // lumière douce générale sur la scène
    const douce = new THREE.PointLight('#fff6e0', 40, 40, 2);
    douce.position.set(0, 8, zC);
    racine.add(douce);

    // --- Le public, sur des gradins de chaque côté ---
    const couleursPublic = ['#ff922b', '#20c997', '#4dabf7', '#ff5fa2', '#94d82d', '#ffd43b', '#9775fa', '#e03131'];
    for (const sx of [-1, 1]) {
        for (let rang = 0; rang < 2; rang++) {
            const x = sx * (4.2 + rang * 1.5);
            const y = rang * 0.55;
            // le gradin
            racine.add(mesh(new THREE.BoxGeometry(1.5, 0.5 + y, 22), matiere('#4a2f6b'), x, (0.5 + y) / 2, zC - 1));
            for (let i = 0; i < 6; i++) {
                const z = PODIUM.z0 - 0.5 + i * 3.2;
                const s = spectateur(x, y + 0.5, z, couleursPublic[(rang * 6 + i) % couleursPublic.length]);
                racine.add(s);
                anim.spectateurs.push(s);
            }
        }
    }

    // --- Les trois juges, au bout du podium ---
    JUGES.forEach((info, i) => {
        const j = juge(-3.2 + i * 3.2, PODIUM.zJuges, info);
        j.rotation.y = Math.PI;   // face au podium
        racine.add(j);
        anim.juges.push(j);
    });

    return anim;
}

// --- Animation de la salle de spectacle -----------------------------------

export function animerPodium(anim, t) {
    // le public sautille et applaudit
    for (const s of anim.spectateurs) {
        const p = s.userData.phase;
        s.position.y = (s.userData.y0 ??= s.position.y) + Math.abs(Math.sin(t * 3 + p)) * 0.12;
        if (s.userData.bras) s.userData.bras.rotation.z = Math.sin(t * 9 + p) * 0.25;
    }
    // les projecteurs balaient
    for (const p of anim.projecteurs) {
        p.obj.rotation.z = Math.sin(t * 0.7 + p.phase) * 0.45 * (p.base.x < 0 ? -1 : 1);
        p.obj.rotation.x = Math.PI + Math.sin(t * 0.5 + p.phase) * 0.2;
    }
}

// Montre les pancartes des juges avec leurs notes
export function montrerNotes(anim, notes) {
    anim.juges.forEach((j, i) => {
        const n = notes[i];
        if (!n) return;
        const plaque = j.userData.plaque;
        plaque.material = matiere('#ffffff');
        plaque.material.map = texturePancarte(n.note, n.juge.couleur);
        plaque.material.needsUpdate = true;
        j.userData.pancarte.visible = true;
        j.userData.pancarte.position.y = 0.95;
    });
}

export function cacherNotes(anim) {
    for (const j of anim.juges) j.userData.pancarte.visible = false;
}
