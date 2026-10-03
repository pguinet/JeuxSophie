// Avatar de Sophie en 3D, façon Roblox classique (tout en cubes) — construit un personnage Three.js
// à partir du même état que le jeu d'habillage (shared/avatar.js).
//
// Le corps tout en cubes vient de `corps3d.js`, les habits de `garderobe3d.js`
// et les cheveux (couches de brins, comme la fourrure du chat) de `cheveux3d.js`.
// La tête cubique et son visage Roblox viennent de `visage3d.js`.
//
// Retourne un THREE.Group posé sur le sol (pieds à y = 0), tourné vers +Z.
//   group.userData.parts = { leftArm, rightArm, leftLeg, rightLeg,
//                            leftKnee, rightKnee, leftElbow, rightElbow, head }
//   group.userData.animes = accessoires qui bougent (voir animerAccessoires)
// Pour l'animer : `animerMarche(group, phase, force)` et `animerVie(group, t, dt)`.

import * as THREE from 'three';
import {
    construireHaut, construireBas, construireRobe, construireChaussures,
    construireChapeau, construireLunettes, construireAccessoire, construirePieds,
} from './garderobe3d.js';
import { construireCheveux, finirCheveux } from './cheveux3d.js';
import { construireCorps, projeterSurCube } from './corps3d.js';
import { construireTete } from './visage3d.js';
import { lookDepuisTenueSimple } from './avatar.js';

export function buildAvatar3D(s) {
    const g = new THREE.Group();
    const gender = s.gender || 'fille';
    const peau = new THREE.MeshStandardMaterial({ color: s.skin, roughness: 0.6 });

    // Deux garde-robes possibles :
    //   - `s.look` : la grande garde-robe du défilé (haut + bas + robe + …)
    //   - sinon    : la tenue simple du jeu d'habillage, traduite en « look »
    const look = s.look || lookDepuisTenueSimple(s);
    const animes = [];

    // --- Le corps en blocs ---
    const corps = construireCorps(g, gender, peau);

    // --- Vêtements et chaussures ---
    if (look.robe && look.robe !== 'aucune') {
        construireRobe(corps, look.robe, look.robeColor);
    } else {
        construireBas(corps, look.bottom, look.bottomColor);
        construireHaut(corps, look.top, look.topColor);
    }
    if (look.shoes && look.shoes !== 'aucune') construireChaussures(corps, look.shoes, look.shoesColor);
    else construirePieds(corps);

    // --- Tête et visage ---
    const tete = corps.tete;
    const visage = construireTete(tete, s, peau);
    const avant = new Set(tete.children);

    // --- Cheveux ---
    const cheveux = construireCheveux(tete, s.hairStyle, s.hairColor, gender);

    // --- Chapeau / lunettes / accessoires ---
    construireChapeau(corps, look.hat, look.hatColor);
    construireAccessoire(corps, look.accessoire, look.accColor, animes);
    // cheveux, chapeau (et auréole) ont été faits pour une tête ronde : on les
    // plaque sur une coque arrondie autour du cube…
    const brins = cheveux ? cheveux.children.filter((o) => o.isMesh) : [];
    projeterSurCube(tete, tete.children.filter((o) => !avant.has(o)), { arrondi: true });
    if (brins.length) finirCheveux(brins[0].geometry);
    // … et les lunettes directement sur le visage
    const avantLunettes = new Set(tete.children);
    construireLunettes(corps, look.glasses, look.glassesColor);
    projeterSurCube(tete, tete.children.filter((o) => !avantLunettes.has(o)));

    const [bg, bd] = corps.bras, [jg, jd] = corps.jambes;
    g.userData.parts = {
        leftArm: bg.epaule, rightArm: bd.epaule, leftLeg: jg.hanche, rightLeg: jd.hanche,
        leftElbow: bg.coude, rightElbow: bd.coude, leftKnee: jg.genou, rightKnee: jd.genou,
        head: corps.teteGroupe,
    };
    g.userData.visage = visage;
    g.userData.animes = animes;
    return g;
}

// ---------------------------------------------------------------------------
//  Animations
// ---------------------------------------------------------------------------

// La marche, façon Roblox classique : bras et jambes tout droits qui se balancent.
// `phase` avance avec le temps, `force` de 0 (immobile) à 1.
export function animerMarche(avatar, phase, force = 1) {
    const p = avatar.userData.parts;
    if (!p) return;
    const sw = Math.sin(phase) * 0.7 * force;
    p.leftLeg.rotation.x = sw;
    p.rightLeg.rotation.x = -sw;
    p.leftArm.rotation.x = -sw;
    p.rightArm.rotation.x = sw;
}

// La vie : clignement des yeux, tête qui bouge un tout petit peu
export function animerVie(avatar, t, dt = 1 / 60) {
    const p = avatar.userData.parts, v = avatar.userData.visage;
    if (!p) return;
    p.head.rotation.y = Math.sin(t * 0.7) * 0.08;
    p.head.rotation.x = Math.sin(t * 0.5) * 0.03;
    if (!v || v.cligne === false) return;
    v.prochainClin -= dt;
    const ferme = v.prochainClin < 0;
    if (v.prochainClin < -0.13) v.prochainClin = 2 + Math.random() * 3;
    if (ferme !== v.ferme) {
        v.ferme = ferme;
        v.mat.map = ferme ? v.tex.fermes : v.tex.ouverts;
    }
}
