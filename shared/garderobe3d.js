// Les vêtements en 3D — chaque habit du catalogue (`garderobe.js`) est ici une
// petite fonction qui assemble des formes Three.js sur le corps du personnage.
//
// Repères du corps (voir `avatar3d.js`) :
//   jambes  : de y = 0 à 0.5, en x = ±0.13
//   torse   : de y = 0.52 à 1.08, rayon ~0.3
//   bras    : de y = 0.59 à 1.09, en x = ±0.34
//   tête    : sphère de rayon 0.42 centrée en y = 1.5

import * as THREE from 'three';

export function matiere(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: opts.rough ?? 0.85,
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
    return matiere(color, { metal: 0.85, rough: 0.18, emissive: color, emissiveIntensity: 0.25 });
}

function mesh(geo, mat, x, y, z) {
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

// ===========================================================================
//  LES HAUTS
// ===========================================================================
// Retourne { manches: true } quand les bras doivent prendre la couleur du haut.

export function construireHaut(g, id, color) {
    if (!id || id === 'aucun') return { manches: false };

    const m = id === 'paillettes' ? matPaillettes(color) : matiere(color);
    const torseGeo = new THREE.CylinderGeometry(0.27, 0.3, 0.56, 24);

    switch (id) {
        case 'debardeur': {
            const t = mesh(new THREE.CylinderGeometry(0.26, 0.29, 0.44, 24), m, 0, 0.74, 0);
            g.add(t);
            // deux bretelles par-dessus les épaules
            const brGeo = new THREE.BoxGeometry(0.06, 0.16, 0.05);
            g.add(mesh(brGeo, m, -0.13, 1.02, 0.06), mesh(brGeo, m, 0.13, 1.02, 0.06));
            return { manches: false };
        }

        case 'pull': {
            g.add(mesh(new THREE.CylinderGeometry(0.29, 0.32, 0.58, 24), m, 0, 0.8, 0));
            // col roulé
            g.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 16), m, 0, 1.12, 0));
            return { manches: true };
        }

        case 'chemise': {
            g.add(mesh(torseGeo, m, 0, 0.8, 0));
            // col + boutons
            const colMat = matiere('#ffffff');
            const colGeo = new THREE.BoxGeometry(0.11, 0.12, 0.04);
            const cg = mesh(colGeo, colMat, -0.07, 1.04, 0.26); cg.rotation.z = 0.35;
            const cd = mesh(colGeo, colMat, 0.07, 1.04, 0.26); cd.rotation.z = -0.35;
            g.add(cg, cd);
            const btGeo = new THREE.SphereGeometry(0.022, 8, 6);
            for (let i = 0; i < 4; i++) g.add(mesh(btGeo, colMat, 0, 0.96 - i * 0.13, 0.29));
            return { manches: true };
        }

        case 'sweat': {
            g.add(mesh(new THREE.CylinderGeometry(0.31, 0.33, 0.6, 24), m, 0, 0.8, 0));
            // capuche derrière la nuque
            const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.6), m);
            cap.position.set(0, 1.12, -0.16);
            cap.rotation.x = 2.5;
            g.add(cap);
            // poche kangourou
            const poche = mesh(new THREE.BoxGeometry(0.3, 0.16, 0.05), matiere(assombrir(color, 0.86)), 0, 0.65, 0.29);
            g.add(poche);
            return { manches: true };
        }

        case 'veste': {
            g.add(mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.58, 24), m, 0, 0.8, 0));
            // deux revers ouverts sur le devant
            const revMat = matiere(assombrir(color, 0.8));
            const revGeo = new THREE.BoxGeometry(0.1, 0.5, 0.04);
            const rg = mesh(revGeo, revMat, -0.1, 0.82, 0.29); rg.rotation.z = 0.1;
            const rd = mesh(revGeo, revMat, 0.1, 0.82, 0.29); rd.rotation.z = -0.1;
            g.add(rg, rd);
            return { manches: true };
        }

        case 'marin': {
            g.add(mesh(torseGeo, m, 0, 0.8, 0));
            // rayures blanches
            const blanc = matiere('#ffffff');
            for (let i = 0; i < 4; i++) {
                const y = 0.6 + i * 0.13;
                const r = 0.283 + (0.8 - y) * 0.05;
                const anneau = mesh(new THREE.CylinderGeometry(r, r, 0.055, 24, 1, true), blanc, 0, y, 0);
                anneau.material.side = THREE.DoubleSide;
                g.add(anneau);
            }
            return { manches: false };
        }

        case 'paillettes': {
            g.add(mesh(new THREE.CylinderGeometry(0.28, 0.31, 0.56, 24), m, 0, 0.8, 0));
            return { manches: false };
        }

        default: {  // t-shirt
            g.add(mesh(torseGeo, m, 0, 0.8, 0));
            // manches courtes
            const mgGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.16, 12);
            const mg = mesh(mgGeo, m, -0.32, 1.0, 0); mg.rotation.z = 0.2;
            const md = mesh(mgGeo, m, 0.32, 1.0, 0); md.rotation.z = -0.2;
            g.add(mg, md);
            return { manches: false };
        }
    }
}

// ===========================================================================
//  LES BAS (pantalons, jupes…)
// ===========================================================================
// `jambes` (facultatif) = [jambeGauche, jambeDroite] : quand on les passe, le
// tissu est accroché aux jambes et suit donc l'animation de la marche.
// Retourne { jambes: true } quand les jambes sont recouvertes.

// Pose un élément « par jambe » : sur la jambe si elle est fournie (il bougera
// avec elle), sinon simplement dans le groupe du personnage.
function poserSurJambe(g, jambes, i, obj, dx, y, z) {
    if (jambes && jambes[i]) {
        obj.position.set(dx, y - 0.25, z);
        jambes[i].add(obj);
    } else {
        obj.position.set((i === 0 ? -0.13 : 0.13) + dx, y, z);
        g.add(obj);
    }
}
// Répète un élément sur les deux jambes (sens = -1 à gauche, +1 à droite)
function surLesDeuxJambes(faire) {
    for (let i = 0; i < 2; i++) faire(i, i === 0 ? -1 : 1);
}

export function construireBas(g, id, color, jambes) {
    if (!id || id === 'aucun') return { jambes: false };

    const m = matiere(color);
    const ceinture = (couleur, y = 0.55) =>
        mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24), matiere(couleur), 0, y, 0);
    const tubes = (geo, y) =>
        surLesDeuxJambes((i) => poserSurJambe(g, jambes, i, new THREE.Mesh(geo, m), 0, y, 0));

    switch (id) {
        case 'short': {
            g.add(ceinture(color, 0.54));
            tubes(new THREE.CylinderGeometry(0.125, 0.13, 0.24, 14), 0.4);
            return { jambes: false };
        }

        case 'jupe': {
            const j = mesh(new THREE.CylinderGeometry(0.28, 0.46, 0.32, 24, 1, true), m, 0, 0.42, 0);
            j.material.side = THREE.DoubleSide;
            g.add(j, ceinture(assombrir(color), 0.56));
            return { jambes: false };
        }

        case 'jupe_longue': {
            const j = mesh(new THREE.CylinderGeometry(0.29, 0.54, 0.56, 24, 1, true), m, 0, 0.3, 0);
            j.material.side = THREE.DoubleSide;
            g.add(j, ceinture(assombrir(color), 0.56));
            return { jambes: false };
        }

        case 'tutu': {
            // un nuage de tulle bouffant autour de la taille, en trois couches
            const tulle = matiere(color, { rough: 0.95 });
            for (let i = 0; i < 3; i++) {
                const t = mesh(new THREE.CylinderGeometry(0.27, 0.44 + i * 0.09, 0.17, 24, 1, true), tulle, 0, 0.52 - i * 0.07, 0);
                t.material.side = THREE.DoubleSide;
                g.add(t);
            }
            g.add(ceinture(assombrir(color, 0.85), 0.57));
            return { jambes: false };
        }

        case 'legging': {
            tubes(new THREE.CylinderGeometry(0.107, 0.107, 0.52, 14), 0.26);
            g.add(ceinture(color, 0.54));
            return { jambes: true };
        }

        case 'jogging': {
            tubes(new THREE.CylinderGeometry(0.13, 0.135, 0.52, 14), 0.26);
            g.add(ceinture(color, 0.55));
            // bandes blanches sur le côté de chaque jambe
            const blanc = matiere('#ffffff');
            const bGeo = new THREE.BoxGeometry(0.025, 0.5, 0.03);
            surLesDeuxJambes((i, sens) =>
                poserSurJambe(g, jambes, i, new THREE.Mesh(bGeo, blanc), sens * 0.13, 0.26, 0));
            return { jambes: true };
        }

        case 'jean': {
            tubes(new THREE.CylinderGeometry(0.125, 0.135, 0.52, 14), 0.26);
            g.add(ceinture(color, 0.55));
            // la ceinture de cuir
            g.add(mesh(new THREE.CylinderGeometry(0.305, 0.305, 0.06, 24), matiere('#5b3a1a'), 0, 0.58, 0));
            return { jambes: true };
        }

        default: {  // pantalon
            tubes(new THREE.CylinderGeometry(0.125, 0.14, 0.52, 14), 0.26);
            g.add(ceinture(color, 0.55));
            return { jambes: true };
        }
    }
}

// ===========================================================================
//  LES ROBES (elles remplacent le haut ET le bas)
// ===========================================================================
// Retourne { manches: bool, jambes: bool }

export function construireRobe(g, id, color) {
    const brillante = id === 'robe_paillettes';
    const m = brillante ? matPaillettes(color) : matiere(color);

    switch (id) {
        case 'robe_longue': {
            const j = mesh(new THREE.CylinderGeometry(0.28, 0.5, 1.0, 28, 1, true), m, 0, 0.58, 0);
            j.material.side = THREE.DoubleSide;
            g.add(j);
            g.add(mesh(new THREE.CylinderGeometry(0.27, 0.3, 0.5, 24), m, 0, 0.83, 0));
            return { manches: false, jambes: false };
        }

        case 'robe_paillettes': {
            const j = mesh(new THREE.CylinderGeometry(0.28, 0.48, 1.0, 28, 1, true), m, 0, 0.58, 0);
            j.material.side = THREE.DoubleSide;
            g.add(j);
            g.add(mesh(new THREE.CylinderGeometry(0.27, 0.3, 0.5, 24), m, 0, 0.83, 0));
            // ceinture dorée
            g.add(mesh(new THREE.CylinderGeometry(0.305, 0.305, 0.07, 24), matiere('#ffd43b', { metal: 0.7, rough: 0.25 }), 0, 0.6, 0));
            return { manches: false, jambes: false };
        }

        case 'robe_princesse': {
            // buste ajusté
            g.add(mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.42, 24), m, 0, 0.86, 0));
            // grande jupe bouffante
            const jupe = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 20), m);
            jupe.position.set(0, 0.5, 0);
            jupe.scale.set(1, 0.85, 1);
            g.add(jupe);
            // manches bouffantes aux épaules
            const bouf = new THREE.SphereGeometry(0.15, 14, 12);
            g.add(mesh(bouf, m, -0.32, 1.02, 0), mesh(bouf, m, 0.32, 1.02, 0));
            // ruban à la taille
            g.add(mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.08, 24), matiere('#ffffff'), 0, 0.66, 0));
            return { manches: false, jambes: false };
        }

        case 'combinaison': {
            g.add(mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.56, 24), m, 0, 0.8, 0));
            const jGeo = new THREE.CylinderGeometry(0.125, 0.13, 0.52, 14);
            g.add(mesh(jGeo, m, -0.13, 0.26, 0), mesh(jGeo, m, 0.13, 0.26, 0));
            g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.09, 24), matiere(assombrir(color, 0.7)), 0, 0.55, 0));
            return { manches: true, jambes: true };
        }

        case 'kimono': {
            const k = mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.9, 24, 1, true), m, 0, 0.62, 0);
            k.material.side = THREE.DoubleSide;
            g.add(k);
            g.add(mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.12, 24), matiere('#e03131'), 0, 0.78, 0));
            // grandes manches carrées
            const manche = new THREE.BoxGeometry(0.16, 0.34, 0.24);
            g.add(mesh(manche, m, -0.36, 0.9, 0), mesh(manche, m, 0.36, 0.9, 0));
            return { manches: true, jambes: false };
        }

        case 'costume': {
            g.add(mesh(new THREE.CylinderGeometry(0.28, 0.31, 0.58, 24), m, 0, 0.8, 0));
            const jGeo = new THREE.CylinderGeometry(0.13, 0.14, 0.52, 14);
            g.add(mesh(jGeo, m, -0.13, 0.26, 0), mesh(jGeo, m, 0.13, 0.26, 0));
            // chemise blanche + cravate rouge
            g.add(mesh(new THREE.BoxGeometry(0.14, 0.4, 0.04), matiere('#ffffff'), 0, 0.88, 0.28));
            g.add(mesh(new THREE.BoxGeometry(0.06, 0.3, 0.03), matiere('#c0392b'), 0, 0.85, 0.31));
            return { manches: true, jambes: true };
        }

        default: {  // robe simple
            const j = mesh(new THREE.CylinderGeometry(0.24, 0.48, 0.66, 24, 1, true), m, 0, 0.75, 0);
            j.material.side = THREE.DoubleSide;
            g.add(j);
            g.add(mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.44, 24), m, 0, 0.88, 0));
            return { manches: false, jambes: false };
        }
    }
}

// ===========================================================================
//  LES CHAUSSURES
// ===========================================================================

// `jambes` : même principe que pour les bas — les chaussures suivent les pieds.
export function construireChaussures(g, id, color, jambes) {
    if (!id || id === 'aucune') return;
    const m = matiere(color);
    const semelle = matiere(assombrir(color, 0.55));
    const poser = (i, geo, mat_, y, z, prep) => {
        const o = new THREE.Mesh(geo, mat_);
        if (prep) prep(o);
        poserSurJambe(g, jambes, i, o, 0, y, z);
    };

    surLesDeuxJambes((i) => {
        switch (id) {
            case 'bottes':
                poser(i, new THREE.CylinderGeometry(0.145, 0.145, 0.34, 14), m, 0.17, 0);
                poser(i, new THREE.SphereGeometry(0.15, 16, 12), m, 0.06, 0.05, (o) => o.scale.set(1, 0.55, 1.3));
                break;

            case 'bottes_pluie':
                poser(i, new THREE.CylinderGeometry(0.16, 0.16, 0.44, 14), m, 0.22, 0);
                poser(i, new THREE.SphereGeometry(0.16, 16, 12), m, 0.06, 0.06, (o) => o.scale.set(1, 0.5, 1.35));
                poser(i, new THREE.CylinderGeometry(0.165, 0.165, 0.05, 14), semelle, 0.44, 0);
                break;

            case 'talons':
                poser(i, new THREE.SphereGeometry(0.13, 16, 12), m, 0.07, 0.06, (o) => o.scale.set(0.95, 0.5, 1.4));
                poser(i, new THREE.CylinderGeometry(0.022, 0.03, 0.13, 8), m, 0.065, -0.09);   // le talon fin
                break;

            case 'ballerines':
                poser(i, new THREE.SphereGeometry(0.13, 16, 12), m, 0.045, 0.04, (o) => o.scale.set(1, 0.4, 1.3));
                poser(i, new THREE.SphereGeometry(0.035, 8, 6), matiere('#ffffff'), 0.09, 0.14);
                break;

            case 'sandales':
                poser(i, new THREE.BoxGeometry(0.16, 0.035, 0.3), m, 0.02, 0.04);
                poser(i, new THREE.BoxGeometry(0.15, 0.03, 0.04), m, 0.07, 0.05, (o) => { o.rotation.x = 0.25; });
                break;

            default:   // baskets
                poser(i, new THREE.SphereGeometry(0.145, 16, 12), m, 0.07, 0.05, (o) => o.scale.set(1, 0.55, 1.35));
                poser(i, new THREE.BoxGeometry(0.28, 0.045, 0.38), semelle, 0.025, 0.05);
                break;
        }
    });
}

// ===========================================================================
//  LES CHAPEAUX
// ===========================================================================

export function construireChapeau(g, id, color) {
    if (!id || id === 'aucun') return;
    const m = matiere(color);
    const brillant = matiere(color, { metal: 0.6, rough: 0.3 });

    switch (id) {
        case 'couronne': {
            g.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 24, 1, true), brillant, 0, 1.86, -0.02));
            const pointe = new THREE.ConeGeometry(0.06, 0.14, 8);
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                g.add(mesh(pointe, brillant, Math.cos(a) * 0.34, 1.98, Math.sin(a) * 0.34 - 0.02));
            }
            break;
        }
        case 'diademe': {
            const arc = mesh(new THREE.TorusGeometry(0.33, 0.022, 8, 24, Math.PI), brillant, 0, 1.8, -0.02);
            arc.rotation.x = -0.35;
            g.add(arc);
            g.add(mesh(new THREE.OctahedronGeometry(0.07), matiere('#7ee8fa', { metal: 0.4, rough: 0.15 }), 0, 1.94, 0.16));
            break;
        }
        case 'chapeau': {
            g.add(mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.04, 28), m, 0, 1.82, -0.02));
            g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.32, 24), m, 0, 1.97, -0.02));
            g.add(mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.07, 24), matiere(assombrir(color, 0.6)), 0, 1.86, -0.02));
            break;
        }
        case 'paille': {
            const paille = matiere('#e8c07d', { rough: 1 });
            const bord = mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.035, 32), paille, 0, 1.8, -0.02);
            g.add(bord);
            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), paille);
            dome.position.set(0, 1.79, -0.02);
            g.add(dome);
            // le ruban de couleur
            g.add(mesh(new THREE.CylinderGeometry(0.355, 0.355, 0.09, 24), m, 0, 1.84, -0.02));
            break;
        }
        case 'casquette': {
            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), m);
            dome.position.set(0, 1.62, -0.02);
            g.add(dome);
            g.add(mesh(new THREE.BoxGeometry(0.5, 0.04, 0.28), matiere(assombrir(color)), 0, 1.6, 0.34));
            break;
        }
        case 'bonnet': {
            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), m);
            dome.position.set(0, 1.66, -0.02);
            g.add(dome);
            g.add(mesh(new THREE.CylinderGeometry(0.465, 0.465, 0.1, 24), matiere(assombrir(color, 0.85)), 0, 1.7, -0.02));
            g.add(mesh(new THREE.SphereGeometry(0.09, 12, 10), matiere('#ffffff'), 0, 2.02, -0.02));
            break;
        }
        case 'noeud': {
            const c = mesh(new THREE.SphereGeometry(0.075, 12, 10), m, 0.3, 1.76, 0.1);
            const bg = mesh(new THREE.SphereGeometry(0.15, 14, 12), m, 0.44, 1.79, 0.1);
            bg.scale.set(1, 0.8, 0.45);
            const bd = mesh(new THREE.SphereGeometry(0.15, 14, 12), m, 0.16, 1.79, 0.1);
            bd.scale.set(1, 0.8, 0.45);
            g.add(c, bg, bd);
            break;
        }
        case 'fleur': {
            const coeur = mesh(new THREE.SphereGeometry(0.07, 10, 8), matiere('#ffd43b'), 0.3, 1.72, 0.2);
            g.add(coeur);
            const petGeo = new THREE.SphereGeometry(0.085, 10, 8);
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2;
                const p = mesh(petGeo, m, 0.3 + Math.cos(a) * 0.11, 1.72 + Math.sin(a) * 0.11, 0.2);
                p.scale.set(1, 1, 0.55);
                g.add(p);
            }
            break;
        }
        case 'bandeau': {
            const b = mesh(new THREE.TorusGeometry(0.4, 0.035, 10, 28), m, 0, 1.66, -0.02);
            b.rotation.x = Math.PI / 2 - 0.2;
            g.add(b);
            break;
        }
        case 'oreilles': {
            for (const x of [-0.24, 0.24]) {
                const o = mesh(new THREE.ConeGeometry(0.13, 0.24, 12), m, x, 1.9, -0.04);
                o.rotation.z = x < 0 ? 0.2 : -0.2;
                g.add(o);
                const i = mesh(new THREE.ConeGeometry(0.07, 0.15, 10), matiere('#ffc9de'), x, 1.89, 0.03);
                i.rotation.z = x < 0 ? 0.2 : -0.2;
                g.add(i);
            }
            break;
        }
        default: break;
    }
}

// ===========================================================================
//  LES LUNETTES
// ===========================================================================

export function construireLunettes(g, id, color) {
    if (!id || id === 'aucune') return;

    const monture = matiere(color, { rough: 0.4, metal: 0.2 });
    let verre = null;
    if (id === 'soleil') verre = matiere(assombrir(color, 0.35), { rough: 0.2 });
    else if (id === 'coeur') verre = matiere(color, { transparent: true, opacity: 0.5, rough: 0.2 });
    else if (id === 'etoile') verre = matiere(color, { transparent: true, opacity: 0.5, rough: 0.2 });

    const grp = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(0.09, 0.018, 10, 24);
    const lensGeo = new THREE.CircleGeometry(0.085, 20);

    for (const x of [-0.15, 0.15]) {
        if (id === 'coeur') {
            // deux petites boules qui forment un cœur, plus un bas pointu
            const hg = mesh(new THREE.SphereGeometry(0.05, 12, 10), monture, x - 0.035, 0.03, 0);
            const hd = mesh(new THREE.SphereGeometry(0.05, 12, 10), monture, x + 0.035, 0.03, 0);
            const b = mesh(new THREE.ConeGeometry(0.07, 0.1, 10), monture, x, -0.05, 0);
            b.rotation.x = Math.PI;
            grp.add(hg, hd, b);
        } else if (id === 'etoile') {
            const e = mesh(new THREE.OctahedronGeometry(0.095), monture, x, 0, 0);
            e.scale.set(1, 1, 0.35);
            grp.add(e);
        } else {
            grp.add(mesh(ringGeo, monture, x, 0, 0));
        }
        if (verre && id !== 'coeur' && id !== 'etoile') grp.add(mesh(lensGeo, verre, x, 0, 0.002));
    }
    const pont = mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.13, 8), monture, 0, 0, 0);
    pont.rotation.z = Math.PI / 2;
    grp.add(pont);

    grp.position.set(0, 1.55, 0.44);
    g.add(grp);
}

// ===========================================================================
//  LES ACCESSOIRES MAGIQUES
// ===========================================================================
// Certains bougent : on remplit `animes` avec { obj, type }.

export function construireAccessoire(g, id, color, animes) {
    if (!id || id === 'aucun') return;
    const m = matiere(color);

    switch (id) {
        case 'cape': {
            const cape = mesh(new THREE.CylinderGeometry(0.32, 0.5, 0.95, 20, 1, true, Math.PI * 0.25, Math.PI * 1.5), m, 0, 0.68, -0.06);
            cape.material.side = THREE.DoubleSide;
            g.add(cape);
            g.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 16), matiere('#ffd43b', { metal: 0.6, rough: 0.3 }), 0, 1.12, 0));
            break;
        }
        case 'ailes': {
            const ailesMat = matiere(color, { transparent: true, opacity: 0.75, rough: 0.3, emissive: color, emissiveIntensity: 0.2 });
            for (const x of [-1, 1]) {
                const grande = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), ailesMat);
                grande.position.set(x * 0.3, 1.16, -0.34);
                grande.scale.set(0.55, 1.05, 0.1);
                grande.rotation.z = x * -0.4;
                const petite = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), ailesMat);
                petite.position.set(x * 0.3, 0.76, -0.34);
                petite.scale.set(0.55, 0.9, 0.1);
                petite.rotation.z = x * -0.22;
                g.add(grande, petite);
                if (animes) animes.push({ obj: grande, type: 'aile', sens: x }, { obj: petite, type: 'aile', sens: x });
            }
            break;
        }
        case 'baguette': {
            const b = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.52, 8), matiere('#deb887'), 0.46, 0.98, 0.16);
            b.rotation.z = -0.42;
            g.add(b);
            const etoile = mesh(new THREE.OctahedronGeometry(0.13), matiere(color, { metal: 0.5, rough: 0.2, emissive: color, emissiveIntensity: 0.6 }), 0.58, 1.22, 0.16);
            g.add(etoile);
            if (animes) animes.push({ obj: etoile, type: 'tourne' });
            break;
        }
        case 'collier': {
            const or = matiere(color, { metal: 0.6, rough: 0.25 });
            const c = mesh(new THREE.TorusGeometry(0.17, 0.028, 8, 22), or, 0, 1.06, 0.04);
            c.rotation.x = Math.PI / 2.4;
            g.add(c);
            g.add(mesh(new THREE.OctahedronGeometry(0.075), or, 0, 0.98, 0.26));
            break;
        }
        case 'sac': {
            const sac = mesh(new THREE.BoxGeometry(0.2, 0.17, 0.09), m, 0.42, 0.72, 0.06);
            g.add(sac);
            const anse = mesh(new THREE.TorusGeometry(0.09, 0.014, 8, 18, Math.PI), matiere(assombrir(color, 0.7)), 0.42, 0.81, 0.06);
            g.add(anse);
            break;
        }
        case 'echarpe': {
            const tour = mesh(new THREE.TorusGeometry(0.19, 0.085, 10, 24), m, 0, 1.1, 0);
            tour.rotation.x = Math.PI / 2;
            g.add(tour);
            const pan = mesh(new THREE.BoxGeometry(0.16, 0.5, 0.07), m, 0.11, 0.84, 0.24);
            g.add(pan);
            break;
        }
        case 'aureole': {
            const a = mesh(new THREE.TorusGeometry(0.22, 0.03, 10, 24), matiere('#ffe066', { metal: 0.5, rough: 0.2, emissive: '#ffd43b', emissiveIntensity: 0.7 }), 0, 2.12, -0.02);
            a.rotation.x = Math.PI / 2;
            g.add(a);
            if (animes) animes.push({ obj: a, type: 'flotte' });
            break;
        }
        case 'ballons': {
            const grp = new THREE.Group();
            const couleurs = [color, '#ffd43b', '#4dabf7'];
            const fil = matiere('#ffffff');
            couleurs.forEach((c, i) => {
                const a = (i / 3) * Math.PI * 2;
                const bx = 0.62 + Math.cos(a) * 0.2, bz = Math.sin(a) * 0.2;
                const b = mesh(new THREE.SphereGeometry(0.18, 16, 12), matiere(c, { rough: 0.35 }), bx, 2.15 + i * 0.1, bz);
                b.scale.set(1, 1.2, 1);
                // le fil qui redescend jusqu'à la main
                const f = mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.1, 6), fil, (bx + 0.42) / 2, 1.5 + i * 0.05, bz / 2);
                grp.add(b, f);
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
