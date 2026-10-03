// Les cheveux en 3D — une forme lisse « à la Roblox » (calotte, frange, masse,
// queue, tresses…) recouverte de vrais petits brins, avec la même technique que
// la fourrure du chat de Mon Chat 2 : des couches (« shells ») empilées, chacune
// un peu plus loin du crâne, où l'on ne garde que la section des brins. Les
// brins sont étirés vers le bas (cheveux peignés), plus foncés à la racine et
// plus clairs aux pointes, et retombent un peu avec la gravité.
//
// Tout est construit dans le repère de l'ancienne tête (voir corps3d.js) :
// sphère de rayon 0.42 centrée en y = 1.5. Les yeux dessinés sont en y ≈ 1.515
// et les sourcils montent jusqu'à y ≈ 1.62 : la frange s'arrête au-dessus.

import * as THREE from 'three';

const TETE = new THREE.Vector3(0, 1.5, 0);
const R = 0.42;
export const NB_COUCHES = 20;

// ---------------------------------------------------------------------------
//  Le shader des brins (injecté dans un MeshStandardMaterial)
// ---------------------------------------------------------------------------
const VERTEX_PARS = /* glsl */`
uniform float uShellH;
uniform float uLongueur;
uniform float uLisse;
attribute float aVolume;
attribute vec3 aFlux;
varying vec3 vCheveuPos;
varying vec3 vCheveuNor;
varying vec3 vFlux;
varying vec3 vFluxVue;
varying float vVolume;
`;
const VERTEX_MAIN = /* glsl */`
    vCheveuPos = position.xyz;
    vCheveuNor = normalize(objectNormal);
    vFlux = aFlux;
    vVolume = aVolume;
    vFluxVue = normalize((modelViewMatrix * vec4(aFlux, 0.0)).xyz);
    // chaque couche s'éloigne du crâne (plus ou moins selon le volume voulu à
    // cet endroit), se couche dans le sens de la coiffure et retombe un peu
    // cheveux lisses (uLisse = 1) : couches plus serrées et brins couchés à plat
    float hc = uShellH * uLongueur * aVolume * (1.0 - 0.8 * uLisse);
    transformed += objectNormal * hc;
    transformed += aFlux * (uShellH * uLongueur * aVolume * mix(0.06, 0.25, uLisse));
    transformed.y -= uShellH * hc * 0.15;
`;
const FRAGMENT_PARS = /* glsl */`
uniform float uShellH;
uniform float uLisse;
uniform float uDensite;
uniform float uEtirement;
uniform float uIsShell;
uniform vec3 uRacine;
uniform vec3 uPointe;
varying vec3 vCheveuPos;
varying vec3 vCheveuNor;
varying vec3 vFlux;
varying vec3 vFluxVue;
varying float vVolume;
float cheveuHash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float cheveuBruit(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(cheveuHash(i), cheveuHash(i + vec3(1, 0, 0)), f.x), mix(cheveuHash(i + vec3(0, 1, 0)), cheveuHash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(cheveuHash(i + vec3(0, 0, 1)), cheveuHash(i + vec3(1, 0, 1)), f.x), mix(cheveuHash(i + vec3(0, 1, 1)), cheveuHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
`;
const FRAGMENT_MAIN = /* glsl */`
    float rndBrin;
    {
        // Repère local : F = sens de la coiffure, B = en travers des brins
        vec3 N = normalize(vCheveuNor);
        vec3 F = vFlux - dot(vFlux, N) * N;
        F = length(F) > 1e-4 ? normalize(F) : vec3(0.0, -1.0, 0.0);
        vec3 B = normalize(cross(N, F));
        // une cellule 3D = un brin, très allongée dans le sens de la coiffure :
        // on « tasse » la position le long de F avant de la découper en cases
        vec3 pc = vCheveuPos * uDensite;
        pc -= F * dot(pc, F) * (1.0 - uEtirement);
        rndBrin = cheveuHash(floor(pc));
        if (uIsShell > 0.5) {
            vec3 l = fract(pc) - 0.5;
            vec2 sec = vec2(dot(l, B), dot(l, F) * uEtirement);     // section du brin dans la couche
            // section qui s'affine vers la pointe ; brins plus fins là où il y a peu de volume
            float epaisseur = (1.0 - uShellH * mix(0.85, 0.45, uLisse)) * mix(0.75, 1.0, clamp(vVolume, 0.0, 1.0));
            if (rndBrin < uShellH * mix(0.88, 0.6, uLisse) || length(sec) * 2.0 > epaisseur) discard;
        }
        // mèches plus ou moins claires, dans le sens de la coiffure, + racine sombre
        vec3 pm = vCheveuPos * 30.0;
        pm -= F * dot(pm, F) * 0.92;
        float meche = cheveuBruit(pm);
        // fines lignes de cheveux peignés, dessinées sur la surface lisse
        vec3 pf = vCheveuPos * 160.0;
        pf -= F * dot(pf, F) * 0.97;
        meche = mix(meche, 0.5 * meche + 0.5 * cheveuBruit(pf), uLisse);
        vec3 col = mix(uRacine, uPointe, clamp(max(uShellH * 1.1, uLisse * 0.55), 0.0, 1.0));
        col *= 0.8 + mix(0.3, 0.2, uLisse) * meche + mix(0.14, 0.06, uLisse) * (rndBrin - 0.5);
        col *= uIsShell > 0.5 ? mix(0.65, 1.0, uShellH) : mix(0.8, 1.0, uLisse);   // l'ombre entre les brins
        diffuseColor.rgb *= col;
    }
`;
// Le reflet des cheveux (modèle de Kajiya-Kay) : une bande de lumière qui suit
// le sens des brins, comme sur des cheveux bien brossés.
const FRAGMENT_REFLET = /* glsl */`
    #if NUM_DIR_LIGHTS > 0
    {
        vec3 T = normalize(vFluxVue);
        vec3 V = normalize(vViewPosition);
        vec3 L = directionalLights[0].direction;
        vec3 H = normalize(L + V);
        float th = dot(T, H);
        float bande = pow(sqrt(max(0.0, 1.0 - th * th)), 60.0);
        float large = pow(sqrt(max(0.0, 1.0 - th * th)), 14.0);
        vec3 teinte = mix(vec3(1.0), uPointe * 1.6, 0.5);
        outgoingLight += directionalLights[0].color * teinte * (bande * mix(0.13, 0.22, uLisse) + large * 0.035) * mix(0.3, 1.0, max(uShellH, uLisse)) * (0.7 + 0.6 * rndBrin);
    }
    #endif
`;

// ---------------------------------------------------------------------------
//  Volume et sens de la coiffure, point par point
// ---------------------------------------------------------------------------
// aVolume : longueur des brins (plus de volume sur le dessus et derrière, des
// cheveux fins à la lisière du visage, des pointes qui s'affinent) ;
// aFlux : la direction des brins (ils partent du sommet de la tête et retombent).
// À rappeler après chaque déformation de la géométrie (projection sur le cube).
const SOMMET = new THREE.Vector3(0, 0.34, -0.1);       // le « tourbillon », relatif au centre de la tête
const douce = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function finirCheveux(geo) {
    const p = geo.attributes.position, n = geo.attributes.normal;
    const vol = new Float32Array(p.count), flux = new Float32Array(p.count * 3);
    const q = new THREE.Vector3(), nn = new THREE.Vector3(), f = new THREE.Vector3(), bas = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
        q.fromBufferAttribute(p, i).sub(TETE);
        nn.fromBufferAttribute(n, i);
        const yn = q.y / R, zn = q.z / R;
        // volume
        let v = 1;
        v += 0.55 * douce(0.15, 0.9, yn);                                   // dessus de la tête
        v += 0.25 * douce(0.0, -0.8, zn) * douce(-1.2, 0.2, yn);            // l'arrière
        v -= 0.5 * douce(0.25, 0.75, zn) * (1 - douce(0.45, 0.85, yn));     // lisière autour du visage
        v *= 1 - 0.45 * douce(-1.0, -2.6, yn);                              // les pointes s'affinent
        vol[i] = Math.min(1.7, Math.max(0.3, v));
        // sens : depuis le tourbillon sur le dessus, vers le bas ailleurs
        f.copy(q).sub(SOMMET);
        bas.set(0, -1, 0);
        f.normalize().lerp(bas, 1 - douce(-0.1, 0.6, yn));
        f.addScaledVector(nn, -f.dot(nn));
        if (f.lengthSq() < 1e-8) f.set(1, 0, 0);
        f.normalize();
        flux[i * 3] = f.x; flux[i * 3 + 1] = f.y; flux[i * 3 + 2] = f.z;
    }
    geo.setAttribute('aVolume', new THREE.Float32BufferAttribute(vol, 1));
    geo.setAttribute('aFlux', new THREE.Float32BufferAttribute(flux, 3));
    return geo;
}

function materiauxCheveux(couleur, opts = {}) {
    const racine = new THREE.Color(couleur);
    const pointe = racine.clone().offsetHSL(0, -0.03, 0.12);
    racine.multiplyScalar(0.85);
    const partages = {
        uRacine: { value: racine },
        uPointe: { value: pointe },
        uLongueur: { value: opts.longueur ?? 0.055 },
        uDensite: { value: opts.densite ?? ((opts.lisse ?? 1) > 0.5 ? 220 : 130) },
        uEtirement: { value: opts.etirement ?? (opts.lisse === 0 ? 0.1 : 0.06) },
        uLisse: { value: opts.lisse ?? 1 },
    };
    const fabriquer = (h, coque) => {
        const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.0, side: THREE.DoubleSide });
        const u = { ...partages, uShellH: { value: h }, uIsShell: { value: coque ? 1 : 0 } };
        m.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, u);
            shader.vertexShader = shader.vertexShader
                .replace('#include <common>', `#include <common>\n${VERTEX_PARS}`)
                .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERTEX_MAIN}`);
            shader.fragmentShader = shader.fragmentShader
                .replace('#include <common>', `#include <common>\n${FRAGMENT_PARS}`)
                .replace('#include <color_fragment>', `#include <color_fragment>\n${FRAGMENT_MAIN}`)
                .replace('#include <opaque_fragment>', `${FRAGMENT_REFLET}\n#include <opaque_fragment>`);
        };
        m.customProgramCacheKey = () => (coque ? 'cheveux-couche' : 'cheveux-base');
        m.userData.uniforms = u;
        return m;
    };
    const base = fabriquer(0, false);
    const couches = [];
    // Cheveux lisses : une seule surface toute lisse (pas de brins qui dépassent),
    // seuls les bouclés, ondulés et la crête gardent leurs couches de brins.
    const nb = (opts.lisse ?? 1) >= 0.9 ? 0 : NB_COUCHES;
    for (let i = 1; i <= nb; i++) couches.push(fabriquer(i / nb, true));
    return { base, couches };
}

// ---------------------------------------------------------------------------
//  Assembler plusieurs formes en une seule géométrie (positions + normales)
// ---------------------------------------------------------------------------
class Forme {
    constructor() { this.geos = []; }
    // ajoute une géométrie, déplacée par la matrice de `obj` (position, rotation, échelle)
    ajouter(geo, x = 0, y = 0, z = 0, opts = {}) {
        const o = new THREE.Object3D();
        o.position.set(x, y, z);
        if (opts.rot) o.rotation.set(...opts.rot);
        if (opts.echelle) o.scale.set(...opts.echelle);
        o.updateMatrix();
        const g = geo.index ? geo.clone() : geo.clone();
        g.applyMatrix4(o.matrix);
        this.geos.push(g);
        return this;
    }
    fusionner() {
        let n = 0;
        const pos = [], nor = [], idx = [];
        for (const g of this.geos) {
            const p = g.attributes.position, q = g.attributes.normal;
            for (let i = 0; i < p.count; i++) {
                pos.push(p.getX(i), p.getY(i), p.getZ(i));
                nor.push(q.getX(i), q.getY(i), q.getZ(i));
            }
            if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + n);
            else for (let i = 0; i < p.count; i++) idx.push(i + n);
            n += p.count;
            g.dispose();
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        geo.setIndex(idx);
        return geo;
    }
}

// Un point sur le crâne : a = angle autour de la tête (0 devant, π derrière),
// e = hauteur (0 = équateur, π/2 = sommet)
function surCrane(a, e, rayon = R) {
    return new THREE.Vector3(
        TETE.x + Math.sin(a) * Math.cos(e) * rayon,
        TETE.y + Math.sin(e) * rayon,
        TETE.z + Math.cos(a) * Math.cos(e) * rayon,
    );
}

// Un tube qui s'affine (mèche, queue, couette), avec une pointe arrondie
function tubeEffile(points, r0, r1, plat = 1, tub = 40, rad = 16) {
    const courbe = new THREE.CatmullRomCurve3(points);
    const frames = courbe.computeFrenetFrames(tub, false);
    const pos = [], nor = [], idx = [];
    for (let i = 0; i <= tub; i++) {
        const t = i / tub;
        const p = courbe.getPointAt(t);
        const N = frames.normals[i], B = frames.binormals[i];
        // rayon : s'affine, avec un bout tout rond
        const r = (r0 + (r1 - r0) * t) * (t > 0.9 ? Math.sqrt(Math.max(0.02, 1 - ((t - 0.9) / 0.1) ** 2)) : 1);
        for (let j = 0; j <= rad; j++) {
            const a = (j / rad) * Math.PI * 2;
            const cs = Math.cos(a), sn = Math.sin(a) * plat;
            const nx = N.x * cs + B.x * sn, ny = N.y * cs + B.y * sn, nz = N.z * cs + B.z * sn;
            pos.push(p.x + nx * r, p.y + ny * r, p.z + nz * r);
            const l = Math.hypot(nx, ny, nz) || 1;
            nor.push(nx / l, ny / l, nz / l);
        }
    }
    for (let i = 0; i < tub; i++) {
        for (let j = 0; j < rad; j++) {
            const a = i * (rad + 1) + j, b = a + rad + 1;
            idx.push(a, a + 1, b, b, a + 1, b + 1);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setIndex(idx);
    return geo;
}

// ---------------------------------------------------------------------------
//  Les pièces de coiffure
// ---------------------------------------------------------------------------

// La calotte : le dessus de la tête. Inclinée vers l'arrière : le bord avant
// passe au-dessus du front, le bord arrière descend sur la nuque.
// `taille` : angle couvert depuis le sommet (plus petit = front plus dégagé)
function calotte(f, epais = 1.04, nuque = 0.29, taille = 1.48) {
    const geo = new THREE.SphereGeometry(R * epais, 56, 28, 0, Math.PI * 2, 0, taille);
    f.ajouter(geo, TETE.x, TETE.y, TETE.z, { rot: [-nuque, 0, 0] });
}

// La frange. `style` : 'cote' (mèche sur le côté), 'droite' (frange droite),
// 'raie' (raie au milieu, rideaux de chaque côté)
function frange(f, style = 'cote') {
    const lobe = new THREE.SphereGeometry(1, 28, 18);
    const poser = (a, e, sx, sy, sz, rotZ, decol = 1.02) => {
        const p = surCrane(a, e, R * decol);
        f.ajouter(lobe, p.x, p.y, p.z, { rot: [-0.35, a, rotZ], echelle: [sx, sy, sz] });
    };
    if (style === 'droite') {
        for (let i = 0; i < 5; i++) {
            const a = -0.62 + i * 0.31;
            poser(a, 0.55, 0.12, 0.09, 0.05, 0);
        }
    } else if (style === 'raie') {
        for (const s of [-1, 1]) {
            poser(s * 0.28, 0.66, 0.15, 0.07, 0.05, s * 0.5);
            poser(s * 0.62, 0.5, 0.12, 0.1, 0.05, s * 0.9);
        }
    } else {
        // une grande mèche plate qui balaie le front de gauche à droite (bien
        // collée au crâne : sinon elle fait une bosse sur le dessus)
        // (assez bas sur le front pour ne pas déborder sur l'arête du haut de la tête)
        poser(-0.25, 0.54, 0.22, 0.055, 0.026, -0.3, 0.995);
        poser(0.25, 0.5, 0.17, 0.055, 0.026, -0.5, 0.995);
        poser(0.58, 0.45, 0.1, 0.065, 0.028, -0.85, 0.995);
    }
}

// La grande masse de cheveux derrière et sur les côtés, ouverte devant le visage.
// `yBas` : hauteur des pointes ; `ouverture` : demi-angle laissé devant le visage
function masse(f, yBas, opts = {}) {
    const { ouverture = 0.95, ondule = 0, evase = 0, pointes = 0.03 } = opts;
    const prof = [];
    const N = 30;
    const yHaut = TETE.y + R * 0.55;
    for (let i = 0; i <= N; i++) {
        const t = i / N;
        const y = yHaut + (yBas - yHaut) * t;
        const dy = y - TETE.y;
        // épouse la tête en haut, puis tombe droit en s'affinant un peu
        let r = Math.abs(dy) < R ? Math.sqrt(R * R - dy * dy) * 1.06 + 0.02 : 0;
        if (dy < 0) r = Math.max(r, R * (1.02 - 0.18 * Math.min(1, -dy / (TETE.y - yBas + 0.001))) + evase * t * t);
        r += Math.sin(t * Math.PI * 5) * ondule * t;
        if (t > 0.94) r *= Math.sqrt(Math.max(0.03, 1 - ((t - 0.94) / 0.06) ** 2));
        prof.push(new THREE.Vector2(Math.max(0.005, r), y));
    }
    prof.reverse();
    const geo = new THREE.LatheGeometry(prof, 64, ouverture, Math.PI * 2 - ouverture * 2);
    // pointes en dents de scie douces + un peu moins épais d'avant en arrière
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        const t = (yHaut - y) / (yHaut - yBas);
        const a = Math.atan2(p.getX(i), p.getZ(i));
        if (t > 0.75) p.setY(i, y + Math.sin(a * 11) * pointes * (t - 0.75) * 4);
        p.setZ(i, p.getZ(i) * (p.getZ(i) < 0 ? 0.92 : 1));
    }
    geo.computeVertexNormals();
    f.ajouter(geo);
}

// Deux mèches qui encadrent le visage et tombent devant les épaules
function mechesVisage(f, yBas, r = 0.07) {
    for (const s of [-1, 1]) {
        const pts = [surCrane(s * 0.75, 0.55, R * 1.02), surCrane(s * 0.95, 0.0, R * 1.08),
            new THREE.Vector3(s * R * 0.92, (TETE.y - R + yBas) / 2, R * 0.38), new THREE.Vector3(s * R * 0.86, yBas, R * 0.36)];
        f.ajouter(tubeEffile(pts, r, r * 0.6, 0.55));
    }
}

// ---------------------------------------------------------------------------
//  Les coiffures
// ---------------------------------------------------------------------------
// Retourne { forme, attaches: [{ geo, x, y, z }] } — les attaches (élastiques)
// ne sont pas en cheveux.
function coiffure(style, gender) {
    const f = new Forme();
    const attaches = [];
    const elastique = (x, y, z, rot) => attaches.push({ geo: new THREE.TorusGeometry(0.075, 0.03, 10, 20), x, y, z, rot });
    const garcon = gender === 'garcon';
    const opts = {};

    switch (style) {
        case 'longs':
            // une frange courte et lisse, d'un seul morceau (pas de mèches qui font
            // des bosses) : c'est le bord de la calotte qui s'arrête au-dessus des yeux
            calotte(f, 1.04, 0.22, 1.41);
            masse(f, 0.5, { ouverture: 1.1, pointes: 0.01 });
            break;

        case 'ondules':
            calotte(f); frange(f, 'raie');
            masse(f, 0.52, { ouverture: 0.95, ondule: 0.035, evase: 0.06, pointes: 0.05 });
            mechesVisage(f, 0.8, 0.08);
            opts.etirement = 0.14;
            opts.lisse = 0.3;
            break;

        case 'carre':
            calotte(f); frange(f, 'droite');
            masse(f, 1.12, { ouverture: 0.9, evase: 0.05, pointes: 0.01 });
            break;

        case 'courts':
            calotte(f, 1.04, 0.38);
            frange(f, garcon ? 'cote' : 'droite');
            masse(f, 1.2, { ouverture: 1.25, pointes: 0.01 });
            opts.longueur = 0.045;
            break;

        case 'couettes': {
            calotte(f); frange(f, 'droite');
            masse(f, 1.2, { ouverture: 1.35, pointes: 0.005 });     // la nuque
            for (const s of [-1, 1]) {
                const depart = surCrane(s * 1.45, 0.45, R * 1.02);
                const pts = [depart, depart.clone().add(new THREE.Vector3(s * 0.16, -0.02, -0.02)),
                    depart.clone().add(new THREE.Vector3(s * 0.26, -0.35, -0.04)), depart.clone().add(new THREE.Vector3(s * 0.24, -0.72, 0))];
                f.ajouter(tubeEffile(pts, 0.11, 0.06, 0.85));
                elastique(depart.x + s * 0.04, depart.y, depart.z, [0, 0, s * 1.2]);
            }
            break;
        }

        case 'queue': {
            calotte(f, 1.04, 0.2); frange(f, 'raie');
            masse(f, 1.2, { ouverture: 1.35, pointes: 0.005 });     // la nuque
            const depart = surCrane(Math.PI, 0.5, R * 1.03);
            const pts = [depart, depart.clone().add(new THREE.Vector3(0, 0.02, -0.15)),
                depart.clone().add(new THREE.Vector3(0, -0.3, -0.22)), depart.clone().add(new THREE.Vector3(0.02, -0.75, -0.16))];
            f.ajouter(tubeEffile(pts, 0.12, 0.06, 0.85));
            elastique(depart.x, depart.y, depart.z - 0.04, [Math.PI / 2 - 0.4, 0, 0]);
            break;
        }

        case 'tresses': {
            calotte(f); frange(f, 'raie');
            masse(f, 1.3, { ouverture: 1.1, pointes: 0.01 });
            const perle = new THREE.SphereGeometry(1, 20, 14);
            for (const s of [-1, 1]) {
                const courbe = new THREE.CatmullRomCurve3([surCrane(s * 1.6, -0.1, R * 1.02),
                    new THREE.Vector3(s * 0.44, 1.2, 0.08), new THREE.Vector3(s * 0.42, 0.85, 0.2), new THREE.Vector3(s * 0.4, 0.62, 0.22)]);
                const n = 11;
                for (let i = 0; i < n; i++) {
                    const t = i / (n - 1);
                    const p = courbe.getPointAt(t);
                    const k = 1 - t * 0.35;
                    f.ajouter(perle, p.x, p.y, p.z, { echelle: [0.075 * k, 0.065 * k, 0.07 * k], rot: [0, 0, (i % 2 ? 0.5 : -0.5)] });
                }
                const bout = courbe.getPointAt(1);
                elastique(bout.x, bout.y - 0.04, bout.z, [Math.PI / 2, 0, 0]);
            }
            opts.longueur = 0.04;
            break;
        }

        case 'chignon': {
            calotte(f, 1.04, 0.15); frange(f, 'raie');
            masse(f, 1.2, { ouverture: 1.35, pointes: 0.005 });     // la nuque
            const c = surCrane(Math.PI, 1.0, R * 1.08);
            f.ajouter(new THREE.SphereGeometry(0.2, 32, 20), c.x, c.y, c.z, { echelle: [1, 0.85, 1] });
            break;
        }

        case 'macarons': {
            calotte(f, 1.04, 0.2); frange(f, 'droite');
            masse(f, 1.2, { ouverture: 1.35, pointes: 0.005 });     // la nuque
            for (const s of [-1, 1]) {
                const c = surCrane(s * 0.9, 1.0, R * 1.05);
                f.ajouter(new THREE.SphereGeometry(0.16, 28, 18), c.x, c.y, c.z);
            }
            break;
        }

        case 'crete': {
            calotte(f, 1.015, 0.38);
            const lobe = new THREE.SphereGeometry(1, 24, 16);
            for (let i = 0; i < 7; i++) {
                const e = 0.55 + i * 0.36;              // de l'avant du crâne jusqu'à l'arrière
                const a = e > Math.PI / 2 ? Math.PI : 0;
                const ee = e > Math.PI / 2 ? Math.PI - e : e;
                const p = surCrane(a, ee, R * 1.02);
                const haut = 0.12 + 0.06 * Math.sin((i / 6) * Math.PI);
                f.ajouter(lobe, p.x, p.y + haut * 0.4, p.z, { echelle: [0.06, haut, 0.1], rot: [-(e - Math.PI / 2), 0, 0] });
            }
            opts.longueur = 0.04;
            opts.lisse = 0.3;
            break;
        }

        case 'boucles': {
            calotte(f, 1.05);
            const boucle = new THREE.SphereGeometry(1, 20, 14);
            // des boucles qui pavent le crâne, puis (fille) descendent sur les épaules
            const rangs = garcon ? [[1.2, 7], [0.85, 12], [0.5, 14], [0.15, 12]] : [[1.2, 7], [0.85, 12], [0.5, 14], [0.15, 14], [-0.25, 14], [-0.6, 14], [-0.95, 12]];
            rangs.forEach(([e, n], k) => {
                for (let i = 0; i < n; i++) {
                    const a = (i / n) * Math.PI * 2 + k * 0.4;
                    // pas de boucles sur le visage
                    const devant = Math.cos(a) > 0.45 && e < 0.62;
                    if (devant) continue;
                    let p = surCrane(a, Math.max(e, -0.2), R * 1.06);
                    if (e < -0.2) p = new THREE.Vector3(Math.sin(a) * R * 1.05, TETE.y + e * R * 0.95, Math.cos(a) * R * 0.95);
                    const taille = 0.085 + ((i * 7 + k * 3) % 5) * 0.006;
                    f.ajouter(boucle, p.x, p.y, p.z, { echelle: [taille, taille, taille] });
                }
            });
            opts.longueur = 0.05;
            opts.etirement = 0.45;           // brins frisés : moins étirés
            opts.lisse = 0;
            break;
        }

        default:
            return null;
    }
    return { forme: f, attaches, opts };
}

// ---------------------------------------------------------------------------
//  Point d'entrée
// ---------------------------------------------------------------------------
export function construireCheveux(g, style, couleur, gender = 'fille') {
    if (!style || style === 'aucun') return null;
    const c = coiffure(style, gender) || coiffure('longs', gender);
    const geo = finirCheveux(c.forme.fusionner());
    const mats = materiauxCheveux(couleur, c.opts);

    const groupe = new THREE.Group();
    groupe.name = 'cheveux';
    const base = new THREE.Mesh(geo, mats.base);
    base.castShadow = true;
    groupe.add(base);
    mats.couches.forEach((m, i) => {
        const couche = new THREE.Mesh(geo, m);
        couche.renderOrder = i + 1;
        groupe.add(couche);
    });

    // élastiques
    const elas = new THREE.MeshStandardMaterial({ color: '#ff5fa2', roughness: 0.5 });
    for (const a of c.attaches) {
        const m = new THREE.Mesh(a.geo, elas);
        m.position.set(a.x, a.y, a.z);
        if (a.rot) m.rotation.set(...a.rot);
        groupe.add(m);
    }
    g.add(groupe);
    return groupe;
}
