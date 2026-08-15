// La grande salle d'habillage — sol, murs, et tous les meubles du magasin :
// cabines de couleur de peau, coin perruques, étagères de vêtements, portant de
// robes, présentoir de lunettes, cabine des accessoires magiques, et l'arche
// dorée qui mène au podium.
//
// Chaque meuble porte dans `userData` :
//   rayon   : le nom du rayon de `garderobe.js` ('haut', 'bas', 'coiffure'…)
//             ou 'podium' pour l'arche du défilé
//   accueil : { x, z } où le personnage vient se placer
//   titre   : le texte affiché au-dessus

import * as THREE from 'three';
import { PEAUX, COULEURS, COULEURS_CHEVEUX } from '../../shared/garderobe.js';

export const SALLE = { largeur: 26, profondeur: 21, hauteur: 5.5 };

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

// --- Étiquette flottante au-dessus d'un meuble --------------------------
function etiquette(texte, couleur = '#ff5fa2') {
    const cnv = document.createElement('canvas');
    cnv.width = 512; cnv.height = 128;
    const ctx = cnv.getContext('2d');

    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.beginPath();
    ctx.roundRect(6, 6, 500, 116, 40);
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = couleur;
    ctx.stroke();

    ctx.fillStyle = couleur;
    ctx.font = 'bold 58px "Comic Sans MS", "Baloo 2", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texte, 256, 68, 470);

    const tex = new THREE.CanvasTexture(cnv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(2.6, 0.65, 1);
    sp.renderOrder = 5;
    return sp;
}

// ===========================================================================
//  Les meubles
// ===========================================================================

// Une gondole de magasin : un dos, trois planches, et plein de petits articles
// pliés dessus (des cubes de couleurs).
function etagere(couleurs, couleurMeuble) {
    const g = new THREE.Group();
    const bois = matiere(couleurMeuble);

    g.add(mesh(new THREE.BoxGeometry(3.4, 2.6, 0.12), bois, 0, 1.3, -0.35));   // le dos
    g.add(mesh(new THREE.BoxGeometry(3.4, 0.16, 0.8), bois, 0, 0.08, 0));      // le socle

    for (let p = 0; p < 3; p++) {
        const y = 0.55 + p * 0.72;
        g.add(mesh(new THREE.BoxGeometry(3.4, 0.09, 0.8), bois, 0, y, 0));
        // les articles pliés sur la planche
        for (let i = 0; i < 5; i++) {
            const c = couleurs[(p * 5 + i) % couleurs.length];
            const pile = mesh(
                new THREE.BoxGeometry(0.5, 0.24, 0.5),
                matiere(c, { rough: 0.95 }),
                -1.3 + i * 0.65, y + 0.17, 0,
            );
            pile.rotation.y = (i % 2 ? 1 : -1) * 0.06;
            g.add(pile);
        }
    }
    return g;
}

// Le coin perruques : des têtes de mannequin qui portent des chevelures
function coinPerruques() {
    const g = new THREE.Group();
    const bois = matiere('#c9a227');

    g.add(mesh(new THREE.BoxGeometry(3.6, 0.16, 1), bois, 0, 0.9, 0));
    for (const x of [-1.6, 1.6]) g.add(mesh(new THREE.BoxGeometry(0.16, 0.9, 0.9), bois, x, 0.45, 0));

    const teteMat = matiere('#f3e7d3');
    COULEURS_CHEVEUX.slice(0, 4).forEach((c, i) => {
        const x = -1.35 + i * 0.9;
        g.add(mesh(new THREE.CylinderGeometry(0.09, 0.16, 0.34, 12), teteMat, x, 1.15, 0));
        g.add(mesh(new THREE.SphereGeometry(0.24, 18, 14), teteMat, x, 1.5, 0));
        // la perruque posée dessus
        const perruque = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.68),
            matiere(c, { rough: 0.8 }),
        );
        perruque.position.set(x, 1.52, -0.02);
        g.add(perruque);
        if (i % 2 === 0) {   // une longueur qui retombe, pour varier
            const l = mesh(new THREE.SphereGeometry(0.24, 16, 12), matiere(c, { rough: 0.8 }), x, 1.3, -0.1);
            l.scale.set(1, 1.2, 0.8);
            g.add(l);
        }
    });
    return g;
}

// Le portant de robes : une barre avec des robes suspendues
function portantRobes() {
    const g = new THREE.Group();
    const metal = matiere('#c0c0c0', { metal: 0.7, rough: 0.3 });

    for (const x of [-1.5, 1.5]) {
        g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 2, 10), metal, x, 1, 0));
        g.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 12), metal, x, 0.03, 0));
    }
    const barre = mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.1, 10), metal, 0, 2, 0);
    barre.rotation.z = Math.PI / 2;
    g.add(barre);

    ['#ff5fa2', '#9775fa', '#4dabf7', '#ffd43b', '#20c997'].forEach((c, i) => {
        const x = -1.2 + i * 0.6;
        const robe = mesh(new THREE.CylinderGeometry(0.13, 0.34, 1.1, 14, 1, true), matiere(c), x, 1.35, 0);
        robe.material.side = THREE.DoubleSide;
        g.add(robe);
        const cintre = mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 12), metal, x, 1.94, 0);
        g.add(cintre);
    });
    return g;
}

// Les cabines d'essayage : trois box avec un rideau, pour la couleur de peau
function cabinesPeau() {
    const g = new THREE.Group();
    const murCab = matiere('#f8f0e3');
    const rideaux = ['#ff5fa2', '#9775fa', '#4dabf7'];

    rideaux.forEach((c, i) => {
        const z = -2.2 + i * 2.2;
        // les parois de la cabine
        g.add(mesh(new THREE.BoxGeometry(1.6, 2.6, 0.12), murCab, 0, 1.3, z - 1));
        g.add(mesh(new THREE.BoxGeometry(1.6, 2.6, 0.12), murCab, 0, 1.3, z + 1));
        g.add(mesh(new THREE.BoxGeometry(0.12, 2.6, 2.1), murCab, -0.74, 1.3, z));
        // le rideau
        const rideau = mesh(new THREE.BoxGeometry(0.1, 2.3, 1.9), matiere(c, { rough: 1 }), 0.7, 1.35, z);
        g.add(rideau);
        // un petit miroir dedans
        g.add(mesh(new THREE.BoxGeometry(0.06, 1.4, 0.8), matiere('#dff3ff', { metal: 0.6, rough: 0.15 }), -0.64, 1.5, z));
    });

    // le nuancier de teintes de peau au-dessus
    PEAUX.forEach((c, i) => {
        const p = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16), matiere(c), 0.4, 3.1, -2.6 + i * 1.05);
        p.rotation.z = Math.PI / 2;
        g.add(p);
    });
    return g;
}

// Le présentoir de lunettes : un comptoir vitré
function presentoirLunettes() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(2.4, 1, 0.9), matiere('#f1f3f5'), 0, 0.5, 0));
    g.add(mesh(new THREE.BoxGeometry(2.5, 0.1, 1), matiere('#9775fa'), 0, 1.05, 0));
    // quelques paires posées dessus
    const paires = ['#212529', '#ff5fa2', '#ffd43b'];
    paires.forEach((c, i) => {
        const x = -0.7 + i * 0.7;
        const m = matiere(c, { metal: 0.3, rough: 0.35 });
        for (const dx of [-0.11, 0.11]) {
            const v = mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 16), m, x + dx, 1.14, 0);
            v.rotation.x = Math.PI / 2;
            g.add(v);
        }
    });
    return g;
}

// La cabine des accessoires magiques : une alcôve qui brille
function cabineMagique() {
    const g = new THREE.Group();
    const violet = matiere('#6741d9', { emissive: '#3b1e91', emissiveIntensity: 0.5 });

    g.add(mesh(new THREE.BoxGeometry(2.8, 3, 0.16), violet, 0, 1.5, -0.5));
    g.add(mesh(new THREE.BoxGeometry(0.16, 3, 1), violet, -1.4, 1.5, 0));
    g.add(mesh(new THREE.BoxGeometry(0.16, 3, 1), violet, 1.4, 1.5, 0));
    g.add(mesh(new THREE.BoxGeometry(2.8, 0.16, 1), violet, 0, 3, 0));
    g.add(mesh(new THREE.BoxGeometry(2.8, 0.12, 1), matiere('#9775fa'), 0, 0.06, 0));

    // des étoiles qui flottent et tournent dans l'alcôve
    const etoiles = new THREE.Group();
    const or = matiere('#ffe066', { metal: 0.5, rough: 0.2, emissive: '#ffd43b', emissiveIntensity: 0.8 });
    for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const e = mesh(new THREE.OctahedronGeometry(0.13), or, Math.cos(a) * 0.85, 1.1 + (i % 3) * 0.55, Math.sin(a) * 0.2 - 0.2);
        etoiles.add(e);
    }
    g.add(etoiles);
    g.userData.etoiles = etoiles;
    return g;
}

// L'arche dorée du podium
function archePodium() {
    const g = new THREE.Group();
    const or = matiere('#ffd43b', { metal: 0.6, rough: 0.3, emissive: '#7a5c00', emissiveIntensity: 0.4 });

    for (const x of [-1.6, 1.6]) g.add(mesh(new THREE.CylinderGeometry(0.22, 0.26, 3.4, 14), or, x, 1.7, 0));
    const haut = mesh(new THREE.TorusGeometry(1.6, 0.22, 12, 24, Math.PI), or, 0, 3.4, 0);
    g.add(haut);
    // le tapis rouge qui invite à passer
    g.add(mesh(new THREE.BoxGeometry(2.6, 0.05, 5), matiere('#c92a2a', { rough: 1 }), 0, 0.03, 2.4));
    // rideau lumineux dans l'arche
    g.add(mesh(
        new THREE.PlaneGeometry(3.2, 3.4),
        matiere('#ffe8a3', { transparent: true, opacity: 0.35, emissive: '#ffd43b', emissiveIntensity: 0.6, side: THREE.DoubleSide }),
        0, 1.7, 0,
    ));
    return g;
}

// Un grand miroir mural pour se regarder
function grandMiroir() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(2.6, 3.4, 0.16), matiere('#ffd43b', { metal: 0.5, rough: 0.35 }), 0, 1.8, 0));
    g.add(mesh(new THREE.BoxGeometry(2.2, 3, 0.08), matiere('#e7f5ff', { metal: 0.85, rough: 0.08 }), 0, 1.8, 0.1));
    return g;
}

// ===========================================================================
//  Construction de la salle complète
// ===========================================================================

export function construireSalle(scene) {
    // Tout est rangé dans un groupe : on peut ainsi cacher la salle d'un coup
    // pendant le défilé (et l'ordinateur n'a plus rien à dessiner).
    const racine = new THREE.Group();
    scene.add(racine);

    const meubles = [];        // les meubles sur lesquels on peut cliquer
    const animes = [];         // les objets qui bougent (les étoiles magiques)

    const L = SALLE.largeur / 2, P = SALLE.profondeur / 2, H = SALLE.hauteur;

    // --- Sol en damier ---
    const damier = document.createElement('canvas');
    damier.width = damier.height = 128;
    const dc = damier.getContext('2d');
    dc.fillStyle = '#fff0f6'; dc.fillRect(0, 0, 128, 128);
    dc.fillStyle = '#ffdeeb'; dc.fillRect(0, 0, 64, 64); dc.fillRect(64, 64, 64, 64);
    const texSol = new THREE.CanvasTexture(damier);
    texSol.colorSpace = THREE.SRGBColorSpace;
    texSol.wrapS = texSol.wrapT = THREE.RepeatWrapping;
    texSol.repeat.set(13, 11);

    const sol = new THREE.Mesh(
        new THREE.PlaneGeometry(SALLE.largeur, SALLE.profondeur),
        new THREE.MeshStandardMaterial({ map: texSol, roughness: 0.95 }),
    );
    sol.rotation.x = -Math.PI / 2;
    racine.add(sol);

    // --- Murs ---
    const murMat = matiere('#ffe3ee', { rough: 1, side: THREE.DoubleSide });
    const murFond = mesh(new THREE.PlaneGeometry(SALLE.largeur, H), murMat, 0, H / 2, -P);
    const murGauche = mesh(new THREE.PlaneGeometry(SALLE.profondeur, H), murMat, -L, H / 2, 0);
    murGauche.rotation.y = Math.PI / 2;
    const murDroite = mesh(new THREE.PlaneGeometry(SALLE.profondeur, H), murMat, L, H / 2, 0);
    murDroite.rotation.y = -Math.PI / 2;
    racine.add(murFond, murGauche, murDroite);

    // frise de cœurs en haut des murs
    const frise = matiere('#ff8cc8');
    racine.add(mesh(new THREE.BoxGeometry(SALLE.largeur, 0.25, 0.1), frise, 0, H - 0.4, -P + 0.06));

    // --- Plafond lumineux (des panneaux qui éclairent) ---
    const lampeMat = matiere('#fffbe6', { emissive: '#fff3bf', emissiveIntensity: 0.9 });
    for (const x of [-7, 0, 7]) {
        for (const z of [-6, 0, 6]) {
            racine.add(mesh(new THREE.BoxGeometry(3, 0.14, 1.4), lampeMat, x, H - 0.3, z));
        }
    }

    // --- Les meubles, avec leur étiquette et leur place d'accueil ---
    function poser(groupe, rayon, titre, couleurTitre, x, z, rotY, accueil, hauteurTitre = 3.3) {
        groupe.position.set(x, 0, z);
        groupe.rotation.y = rotY;
        groupe.userData.rayon = rayon;
        groupe.userData.accueil = accueil;
        groupe.userData.titre = titre;

        const et = etiquette(titre, couleurTitre);
        et.position.set(0, hauteurTitre, 0);
        groupe.add(et);

        racine.add(groupe);
        meubles.push(groupe);
        return groupe;
    }

    // Mur du fond : perruques, hauts, l'arche du podium au centre, bas, chaussures
    poser(coinPerruques(), 'coiffure', '💇 Perruques', '#9775fa',
        -10.5, -P + 1, 0, { x: -10.5, z: -P + 3 });

    poser(etagere(COULEURS.slice(0, 12), '#f4a261'), 'haut', '👕 Les hauts', '#e8590c',
        -6, -P + 0.8, 0, { x: -6, z: -P + 2.6 });

    poser(archePodium(), 'podium', '✨ Aller défiler ! ✨', '#e8590c',
        0, -P + 2, 0, { x: 0, z: -P + 4.6 }, 2.1);

    poser(etagere(COULEURS.slice(8, 20), '#8a5a2b'), 'bas', '👖 Pantalons et jupes', '#1971c2',
        6, -P + 0.8, 0, { x: 6, z: -P + 2.6 });

    poser(etagere(['#ffffff', '#212529', '#ff5fa2', '#4dabf7', '#ffd43b', '#20c997'], '#a0522d'), 'chaussures', '👟 Les chaussures', '#2f9e44',
        10.5, -P + 0.8, 0, { x: 10.5, z: -P + 2.6 });

    // Mur de gauche : cabines de peau, puis portant de robes
    poser(cabinesPeau(), 'peau', '🚪 Cabines couleur', '#e64980',
        -L + 1, -1.5, 0, { x: -L + 3, z: -1.5 }, 3.9);

    poser(portantRobes(), 'robe', '👗 Les robes', '#c2255c',
        -L + 2.2, 5.5, Math.PI / 2, { x: -L + 4.4, z: 5.5 }, 2.6);

    // Mur de droite : chapeaux, lunettes, accessoires magiques
    poser(etagere(['#ffd43b', '#e03131', '#4dabf7', '#212529', '#ff5fa2', '#94d82d'], '#c9a227'), 'chapeau', '👒 Les chapeaux', '#f08c00',
        L - 1.2, -5, -Math.PI / 2, { x: L - 3, z: -5 });

    poser(presentoirLunettes(), 'lunettes', '🕶️ Les lunettes', '#6741d9',
        L - 1.2, 0.5, -Math.PI / 2, { x: L - 3, z: 0.5 }, 2.2);

    const magique = poser(cabineMagique(), 'accessoire', '✨ Accessoires magiques', '#7048e8',
        L - 1.2, 6, -Math.PI / 2, { x: L - 3.2, z: 6 }, 3.7);
    animes.push(magique.userData.etoiles);

    // Le grand miroir (juste pour faire joli)
    const miroir = grandMiroir();
    miroir.position.set(-L + 0.4, 0, -7.5);
    miroir.rotation.y = Math.PI / 2;
    racine.add(miroir);

    return { meubles, animes, sol, groupe: racine };
}

// Fait tourner doucement les étoiles de la cabine magique
export function animerSalle(animes, t) {
    for (const g of animes) {
        g.rotation.y = t * 0.6;
        g.children.forEach((e, i) => { e.position.y += Math.sin(t * 2 + i) * 0.002; });
    }
}
