// Les cheveux en 3D — de vraies mèches, pas des boules.
//
// Chaque coiffure est faite de dizaines de mèches : un tube qui part du crâne,
// épouse la tête, puis retombe en ondulant, et qui s'affine vers la pointe.
// Toutes les mèches d'une coiffure sont fusionnées en UN SEUL objet 3D, donc
// c'est joli sans ralentir le jeu.
//
// Bonus : la couleur va de la racine (foncée) vers la pointe (plus claire),
// et une bande de lumière court sur le dessus de la tête.

import * as THREE from 'three';

// La tête du personnage (voir `avatar3d.js`)
const TETE = new THREE.Vector3(0, 1.5, 0);
const R = 0.42;

// ---------------------------------------------------------------------------
//  Le fabricant de mèches : il empile tout dans une seule géométrie
// ---------------------------------------------------------------------------
class Meches {
    constructor(couleur) {
        this.pos = []; this.nor = []; this.col = []; this.idx = [];
        this.racine = new THREE.Color(couleur);
        this.pointe = this.racine.clone().offsetHSL(0, -0.04, 0.13);   // pointes plus claires
        this.n = 0;
    }

    // `points` : la ligne que suit la mèche ; r0/r1 : épaisseur racine/pointe ;
    // `plat` : 1 = ronde, 0.45 = ruban (plus joli pour les cheveux lisses)
    ajouter(points, r0, r1, plat = 0.6, tub = 14, rad = 6) {
        const courbe = new THREE.CatmullRomCurve3(points);
        const frames = courbe.computeFrenetFrames(tub, false);
        const debut = this.n;
        const teinte = (Math.random() - 0.5) * 0.06;   // chaque mèche a sa nuance

        for (let i = 0; i <= tub; i++) {
            const t = i / tub;
            const p = courbe.getPointAt(t);
            const N = frames.normals[i], B = frames.binormals[i];
            const r = r0 + (r1 - r0) * t;
            const c = this.racine.clone().lerp(this.pointe, t * 0.92).offsetHSL(0, 0, teinte);

            for (let j = 0; j <= rad; j++) {
                const a = (j / rad) * Math.PI * 2;
                const cs = Math.cos(a) * r, sn = Math.sin(a) * r * plat;
                const nx = N.x * cs + B.x * sn, ny = N.y * cs + B.y * sn, nz = N.z * cs + B.z * sn;
                this.pos.push(p.x + nx, p.y + ny, p.z + nz);
                const l = Math.hypot(nx, ny, nz) || 1;
                this.nor.push(nx / l, ny / l, nz / l);
                this.col.push(c.r, c.g, c.b);
                this.n++;
            }
        }
        for (let i = 0; i < tub; i++) {
            for (let j = 0; j < rad; j++) {
                const a = debut + i * (rad + 1) + j;
                const b = a + rad + 1;
                this.idx.push(a, b, a + 1, b, b + 1, a + 1);
            }
        }
    }

    fini() {
        if (!this.n) return null;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
        geo.setIndex(this.idx);
        return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.38,      // des cheveux qui brillent un peu
            metalness: 0.05,
        }));
    }
}

// ---------------------------------------------------------------------------
//  Les trajets des mèches
// ---------------------------------------------------------------------------

// Un point sur le crâne, repéré par l'angle autour de la tête (a) et la
// hauteur (e). a = 0 devant, a = π derrière.
function surCrane(a, e, rayon = R * 1.03) {
    return new THREE.Vector3(
        Math.sin(a) * Math.cos(e) * rayon,
        TETE.y + Math.sin(e) * rayon,
        Math.cos(a) * Math.cos(e) * rayon,
    );
}

// Une mèche qui part du haut du crâne, le longe, puis retombe en ondulant
function mecheLongue(a, eDepart, longueur, opts = {}) {
    const { gonfle = 0.05, ondul = 0.035, phase = 0, vagues = 2.6, eFin = -0.3, ecart = 0 } = opts;
    const pts = [];
    const PAS = 3;
    for (let i = 0; i <= PAS; i++) {
        const e = eDepart + (eFin - eDepart) * (i / PAS);
        pts.push(surCrane(a, e));
    }
    const bas = pts[pts.length - 1];
    const out = new THREE.Vector3(bas.x, 0, bas.z).normalize();
    const cote = new THREE.Vector3(-out.z, 0, out.x);

    const CHUTE = 4;
    for (let i = 1; i <= CHUTE; i++) {
        const t = i / CHUTE;
        const p = bas.clone();
        p.y -= longueur * t;
        p.addScaledVector(out, Math.sin(t * Math.PI) * gonfle + t * ecart);
        p.addScaledVector(cote, Math.sin(t * vagues * Math.PI + phase) * ondul);
        pts.push(p);
    }
    return pts;
}

// Une mèche de frange : elle part du haut du front et s'arrête juste
// au-dessus des yeux (qui sont à y = 1.55) pour ne pas cacher le visage.
function mecheFrange(a, longueur, opts = {}) {
    const { avance = 0.04, phase = 0 } = opts;
    const pts = [surCrane(a, 1.15), surCrane(a, 0.96), surCrane(a, 0.78)];
    const bas = pts[2];
    const out = new THREE.Vector3(bas.x, 0, bas.z).normalize();
    for (let i = 1; i <= 3; i++) {
        const t = i / 3;
        const p = bas.clone();
        p.y -= longueur * t;
        p.addScaledVector(out, Math.sin(t * Math.PI) * avance);
        p.x += Math.sin(t * 2 + phase) * 0.014;
        pts.push(p);
    }
    return pts;
}

// ---------------------------------------------------------------------------
//  Les pièces communes
// ---------------------------------------------------------------------------

// La calotte : le dessus de la tête, pour qu'on ne voie jamais la peau à
// travers les mèches.
function calotte(couleur, ouverture = 0.62) {
    const m = new THREE.Mesh(
        new THREE.SphereGeometry(R * 1.05, 32, 22, 0, Math.PI * 2, 0, Math.PI * ouverture),
        new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.55, metalness: 0.04 }),
    );
    m.position.set(0, TETE.y + 0.02, -0.03);
    m.rotation.x = -0.2;
    return m;
}

// La masse de cheveux : une coque pleine derrière la tête qui descend jusqu'aux
// pointes. Les mèches se posent par-dessus : ainsi on ne voit jamais au travers.
function masseCheveux(couleur, yBas, ouverture = 0.9) {
    const profil = [
        new THREE.Vector2(0.10, TETE.y + 0.42),
        new THREE.Vector2(0.28, TETE.y + 0.30),
        new THREE.Vector2(0.40, TETE.y + 0.13),
        new THREE.Vector2(0.445, TETE.y - 0.08),
        new THREE.Vector2(0.44, TETE.y - 0.26),
        new THREE.Vector2(0.42, (TETE.y - 0.26 + yBas) / 2),
        new THREE.Vector2(0.37, yBas + 0.06),
        new THREE.Vector2(0.20, yBas),
    ];
    const geo = new THREE.LatheGeometry(profil, 26, ouverture, Math.PI * 2 - ouverture * 2);
    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: couleur, roughness: 0.5, metalness: 0.04, side: THREE.DoubleSide,
    }));
}

// Quelques mèches plaquées sur le dessus du crâne, pour casser l'aspect « boule »
function mechesDessus(meches, nb = 12, arriere = 0.55) {
    for (let i = 0; i < nb; i++) {
        const t = i / (nb - 1);
        const a = -2.5 + t * 5;
        const pts = [];
        for (let j = 0; j <= 4; j++) {
            const e = 1.42 - (j / 4) * (1.42 - arriere);
            const p = surCrane(a * (0.35 + 0.65 * (j / 4)), e, R * 1.07);
            p.z -= 0.02;
            pts.push(p);
        }
        meches.ajouter(pts, 0.05, 0.035, 0.45, 10, 5);
    }
}

// La bande de lumière sur le dessus de la tête (comme dans les dessins animés)
function reflet() {
    const m = new THREE.Mesh(
        new THREE.TorusGeometry(R * 0.82, 0.035, 8, 28, Math.PI * 1.25),
        new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.16 }),
    );
    m.position.set(0, TETE.y + 0.19, 0.02);
    m.rotation.set(Math.PI / 2 - 0.35, 0, Math.PI * 0.87);
    return m;
}

// Une natte : des petits paquets de cheveux qui s'entrecroisent
function natte(g, depart, longueur, couleur, sens) {
    const mat = new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.42, metalness: 0.05 });
    const N = 7;
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const taille = 0.095 * (1 - t * 0.55);
        for (const cote of [-1, 1]) {
            const b = new THREE.Mesh(new THREE.SphereGeometry(taille, 12, 10), mat);
            b.position.set(
                depart.x + cote * taille * 0.5 + sens * t * 0.06,
                depart.y - t * longueur,
                depart.z - t * 0.05,
            );
            b.scale.set(1.15, 0.85, 0.9);
            b.rotation.z = cote * 0.5;
            g.add(b);
        }
    }
    // le petit élastique au bout
    const el = new THREE.Mesh(
        new THREE.TorusGeometry(0.05, 0.018, 8, 14),
        new THREE.MeshStandardMaterial({ color: '#ff5fa2', roughness: 0.5 }),
    );
    el.position.set(depart.x + sens * 0.06, depart.y - longueur - 0.03, depart.z - 0.05);
    el.rotation.x = Math.PI / 2;
    g.add(el);
}

// Un macaron / chignon : des mèches enroulées en boule
function macaron(meches, centre, rayon) {
    for (let i = 0; i < 7; i++) {
        const a0 = (i / 7) * Math.PI * 2;
        const pts = [];
        for (let j = 0; j <= 6; j++) {
            const t = j / 6;
            const a = a0 + t * Math.PI * 1.7;
            const r = rayon * (1 - t * 0.55);
            pts.push(new THREE.Vector3(
                centre.x + Math.cos(a) * r,
                centre.y + Math.sin(a) * r * 0.95,
                centre.z + Math.sin(t * Math.PI) * rayon * 0.5 - rayon * 0.2,
            ));
        }
        meches.ajouter(pts, 0.045, 0.035, 0.9, 10, 5);
    }
}

// Des petites boucles serrées (cheveux frisés), en un seul objet 3D
function boucles(couleur, gender) {
    const base = new THREE.Color(couleur);
    const items = [];
    function semer(nb, rayon, minT, maxT) {
        for (let i = 0; i < nb; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(1 - Math.random() * 1.55);
            const v = new THREE.Vector3(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta));
            if (v.z > 0.34 && v.y < 0.3) continue;              // pas de boucles sur le visage
            const p = TETE.clone().addScaledVector(v, rayon + (Math.random() - 0.5) * 0.05);
            p.y += 0.04;
            items.push({
                p,
                s: minT + Math.random() * (maxT - minT),
                c: base.clone().offsetHSL(0, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.08 + 0.03),
            });
        }
    }
    semer(gender === 'garcon' ? 90 : 110, 0.44, 0.085, 0.15);
    semer(gender === 'garcon' ? 75 : 95, 0.5, 0.05, 0.09);

    const mesh = new THREE.InstancedMesh(
        new THREE.SphereGeometry(1, 8, 7),
        new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.04 }),
        items.length,
    );
    const d = new THREE.Object3D();
    items.forEach((it, i) => {
        d.position.copy(it.p);
        d.scale.setScalar(it.s);
        d.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        d.updateMatrix();
        mesh.setMatrixAt(i, d.matrix);
        mesh.setColorAt(i, it.c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
}

// ---------------------------------------------------------------------------
//  Les coiffures
// ---------------------------------------------------------------------------

// Répartit des mèches autour de la tête en évitant le visage.
// `retour` reçoit (angle, indice, position de 0 à 1)
function autourDeLaTete(nb, ouvertureVisage, retour) {
    for (let i = 0; i < nb; i++) {
        const t = i / (nb - 1);
        // on balaie de l'avant-gauche à l'avant-droite en passant derrière
        const a = ouvertureVisage + t * (Math.PI * 2 - ouvertureVisage * 2);
        retour(a, i, t);
    }
}

// Une frange « rideau » : un peu plus courte au milieu, plus longue sur les côtés
function frangeStandard(meches, nb = 9, longueur = 0.17) {
    for (let i = 0; i < nb; i++) {
        const t = i / (nb - 1);
        const a = -0.82 + t * 1.64;
        meches.ajouter(mecheFrange(a, longueur * (0.85 + 0.35 * Math.abs(Math.cos(t * Math.PI))), { phase: i }),
            0.05, 0.02, 0.55, 10, 5);
    }
}

export function construireCheveux(g, style, couleur, gender = 'fille') {
    if (!style || style === 'aucun') return;

    const meches = new Meches(couleur);
    const garcon = gender === 'garcon';
    let avecCalotte = true, avecReflet = true;

    switch (style) {

        case 'longs': {
            g.add(masseCheveux(couleur, 0.68, 0.86));
            frangeStandard(meches);
            mechesDessus(meches, 11);
            // deux couches de mèches, décalées, pour un beau volume
            autourDeLaTete(30, 0.86, (a, i) => {
                const devant = Math.abs(Math.sin(a));              // plus court près du visage
                meches.ajouter(
                    mecheLongue(a, 0.42, 0.78 + devant * 0.16, { phase: i * 1.3, ondul: 0.045, gonfle: 0.07 }),
                    0.085, 0.03, 0.62,
                );
            });
            autourDeLaTete(18, 0.95, (a, i) => {
                meches.ajouter(
                    mecheLongue(a, 0.16, 0.52, { phase: i * 2.1 + 1, ondul: 0.03, gonfle: 0.03 }),
                    0.07, 0.028, 0.6, 12, 5,
                );
            });
            break;
        }

        case 'ondules': {
            g.add(masseCheveux(couleur, 0.58, 0.84));
            frangeStandard(meches, 8, 0.17);
            mechesDessus(meches, 11);
            autourDeLaTete(32, 0.84, (a, i) => {
                meches.ajouter(
                    mecheLongue(a, 0.45, 0.95, { phase: i * 1.1, ondul: 0.085, vagues: 3.4, gonfle: 0.11, ecart: 0.05 }),
                    0.09, 0.032, 0.7,
                );
            });
            autourDeLaTete(18, 0.92, (a, i) => {
                meches.ajouter(
                    mecheLongue(a, 0.2, 0.66, { phase: i * 2.4 + 1, ondul: 0.06, vagues: 3, gonfle: 0.05 }),
                    0.07, 0.028, 0.65, 12, 5,
                );
            });
            break;
        }

        case 'carre': {
            g.add(masseCheveux(couleur, 1.08, 0.8));
            frangeStandard(meches, 10, 0.18);
            mechesDessus(meches, 11);
            // toutes les mèches s'arrêtent à la même hauteur : la coupe est nette
            autourDeLaTete(30, 0.8, (a, i) => {
                meches.ajouter(
                    mecheLongue(a, 0.4, 0.36, { phase: i, ondul: 0.02, gonfle: 0.08, vagues: 1.6 }),
                    0.088, 0.05, 0.62, 12, 6,
                );
            });
            break;
        }

        case 'courts': {
            g.add(masseCheveux(couleur, 1.3, 0.7));
            frangeStandard(meches, 8, 0.15);
            mechesDessus(meches, 13);
            autourDeLaTete(24, 0.7, (a, i) => {
                meches.ajouter(
                    mecheLongue(a, 0.5, 0.13, { phase: i, ondul: 0.02, gonfle: 0.055, vagues: 1.4 }),
                    0.08, 0.045, 0.6, 10, 5,
                );
            });
            break;
        }

        case 'couettes': {
            g.add(masseCheveux(couleur, 1.3, 0.78));
            frangeStandard(meches, 9, 0.17);
            mechesDessus(meches, 12);
            // les cheveux sont ramenés vers les deux attaches
            autourDeLaTete(16, 0.78, (a, i) => {
                meches.ajouter(
                    mecheLongue(a, 0.5, 0.1, { phase: i, ondul: 0.015, gonfle: 0.04, vagues: 1.2 }),
                    0.07, 0.05, 0.6, 8, 5,
                );
            });
            // deux grosses couettes sur les côtés
            for (const cote of [-1, 1]) {
                const attache = new THREE.Vector3(cote * 0.4, TETE.y + 0.16, -0.05);
                for (let i = 0; i < 7; i++) {
                    const p = i / 6;
                    const pts = [attache.clone()];
                    for (let j = 1; j <= 4; j++) {
                        const t = j / 4;
                        pts.push(new THREE.Vector3(
                            attache.x + cote * (0.06 + Math.sin(t * 2.2) * 0.1) + Math.cos(p * 6.3) * 0.05,
                            attache.y - t * 0.46,
                            attache.z + Math.sin(p * 6.3) * 0.06 + Math.sin(t * 3) * 0.03,
                        ));
                    }
                    meches.ajouter(pts, 0.06, 0.025, 0.8, 12, 5);
                }
                // l'élastique
                const el = new THREE.Mesh(
                    new THREE.TorusGeometry(0.09, 0.028, 8, 16),
                    new THREE.MeshStandardMaterial({ color: '#ff5fa2', roughness: 0.5 }),
                );
                el.position.copy(attache);
                el.rotation.y = Math.PI / 2;
                g.add(el);
            }
            break;
        }

        case 'queue': {
            g.add(masseCheveux(couleur, 1.32, 0.72));
            frangeStandard(meches, 8, 0.17);
            mechesDessus(meches, 13);
            // cheveux tirés en arrière
            autourDeLaTete(18, 0.72, (a, i) => {
                meches.ajouter(
                    mecheLongue(a, 0.55, 0.08, { phase: i, ondul: 0.012, gonfle: 0.035, vagues: 1 }),
                    0.07, 0.05, 0.55, 8, 5,
                );
            });
            // la grosse queue de cheval qui retombe dans le dos
            const attache = new THREE.Vector3(0, TETE.y + 0.12, -0.44);
            for (let i = 0; i < 16; i++) {
                const p = (i / 16) * Math.PI * 2;
                const r = 0.055 + (i % 2) * 0.07;          // deux couronnes de mèches
                const pts = [attache.clone()];
                for (let j = 1; j <= 4; j++) {
                    const t = j / 4;
                    pts.push(new THREE.Vector3(
                        attache.x + Math.cos(p) * r * (0.6 + t * 1.6),
                        attache.y - t * 0.86,
                        attache.z - 0.12 * Math.sin(t * 1.9) + Math.sin(p) * r * (0.6 + t * 1.4),
                    ));
                }
                meches.ajouter(pts, 0.075, 0.028, 0.9, 14, 5);
            }
            // l'élastique, bien serré autour de l'attache
            const el = new THREE.Mesh(
                new THREE.TorusGeometry(0.11, 0.035, 8, 20),
                new THREE.MeshStandardMaterial({ color: '#ff5fa2', roughness: 0.5 }),
            );
            el.position.set(0, TETE.y + 0.06, -0.42);
            el.rotation.x = Math.PI / 2 - 0.25;
            g.add(el);
            break;
        }

        case 'tresses': {
            g.add(masseCheveux(couleur, 1.28, 0.72));
            frangeStandard(meches, 9, 0.17);
            mechesDessus(meches, 12);
            autourDeLaTete(18, 0.72, (a, i) => {
                meches.ajouter(
                    mecheLongue(a, 0.5, 0.14, { phase: i, ondul: 0.015, gonfle: 0.045, vagues: 1.2 }),
                    0.07, 0.05, 0.6, 8, 5,
                );
            });
            for (const cote of [-1, 1]) {
                natte(g, new THREE.Vector3(cote * 0.38, TETE.y - 0.04, -0.08), 0.62, couleur, cote);
            }
            break;
        }

        case 'chignon': {
            g.add(masseCheveux(couleur, 1.32, 0.72));
            frangeStandard(meches, 8, 0.17);
            mechesDessus(meches, 13);
            autourDeLaTete(18, 0.72, (a, i) => {
                meches.ajouter(
                    mecheLongue(a, 0.55, 0.09, { phase: i, ondul: 0.012, gonfle: 0.035, vagues: 1 }),
                    0.07, 0.05, 0.55, 8, 5,
                );
            });
            macaron(meches, new THREE.Vector3(0, TETE.y + 0.44, -0.1), 0.17);
            break;
        }

        case 'macarons': {
            g.add(masseCheveux(couleur, 1.3, 0.75));
            frangeStandard(meches, 8, 0.17);
            mechesDessus(meches, 12);
            autourDeLaTete(16, 0.75, (a, i) => {
                meches.ajouter(
                    mecheLongue(a, 0.5, 0.1, { phase: i, ondul: 0.015, gonfle: 0.04, vagues: 1.1 }),
                    0.07, 0.05, 0.6, 8, 5,
                );
            });
            // deux macarons en haut, comme deux petites oreilles rondes
            for (const cote of [-1, 1]) {
                macaron(meches, new THREE.Vector3(cote * 0.32, TETE.y + 0.42, -0.05), 0.15);
            }
            break;
        }

        case 'crete': {
            avecCalotte = true;
            // les cheveux sont rasés sur les côtés, dressés au milieu
            for (let i = 0; i < 11; i++) {
                const t = i / 10;
                const z = 0.28 - t * 0.62;
                const h = 0.22 + Math.sin(t * Math.PI) * 0.16;
                const pts = [
                    new THREE.Vector3(0, TETE.y + 0.3, z),
                    new THREE.Vector3(0, TETE.y + 0.38, z - 0.01),
                    new THREE.Vector3(Math.sin(i) * 0.02, TETE.y + 0.36 + h * 0.6, z - 0.02),
                    new THREE.Vector3(Math.sin(i) * 0.04, TETE.y + 0.36 + h, z - 0.05),
                ];
                meches.ajouter(pts, 0.055, 0.012, 0.5, 8, 5);
            }
            break;
        }

        case 'boucles': {
            g.add(boucles(couleur, garcon));
            avecReflet = false;
            if (!garcon) {
                // quelques anglaises qui retombent sur les épaules
                for (let i = 0; i < 10; i++) {
                    const a = 0.9 + (i / 9) * (Math.PI * 2 - 1.8);
                    const dep = surCrane(a, -0.05, R * 1.08);
                    const out = new THREE.Vector3(dep.x, 0, dep.z).normalize();
                    const pts = [dep];
                    const tours = 2.2 + Math.random();
                    for (let j = 1; j <= 8; j++) {
                        const t = j / 8;
                        const ang = t * tours * Math.PI * 2;
                        pts.push(new THREE.Vector3(
                            dep.x + Math.cos(ang) * 0.055 + out.x * 0.02,
                            dep.y - t * 0.44,
                            dep.z + Math.sin(ang) * 0.055 + out.z * 0.02,
                        ));
                    }
                    meches.ajouter(pts, 0.05, 0.03, 0.95, 18, 5);
                }
            }
            break;
        }

        default: {   // au cas où : une coupe simple
            frangeStandard(meches, 8, 0.22);
            autourDeLaTete(18, 0.78, (a, i) => {
                meches.ajouter(mecheLongue(a, 0.45, 0.3, { phase: i }), 0.075, 0.035, 0.6, 12, 5);
            });
            break;
        }
    }

    if (avecCalotte) g.add(calotte(couleur, style === 'crete' ? 0.5 : 0.62));
    const m = meches.fini();
    if (m) g.add(m);
    if (avecReflet) g.add(reflet());
}
