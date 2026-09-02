// Champ de distance signé (SDF) du chat — module pur (sans three), testable sous Node.
// Toutes les positions sont des tableaux [x, y, z] en mètres. Repère : +X = avant du chat, +Y = haut, +Z = côté gauche.

export function vsub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
export function vdot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
export function vlen(a) { return Math.sqrt(vdot(a, a)); }
export function vlerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Distance signée à une capsule d'axe a→b et de rayon r. */
export function sdCapsule(p, a, b, r) {
    const pa = vsub(p, a), ba = vsub(b, a);
    const h = clamp01(vdot(pa, ba) / vdot(ba, ba));
    return vlen([pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h]) - r;
}

/** Cône arrondi entre a (rayon r1) et b (rayon r2) : idéal pour pattes, queue, museau. */
export function sdRoundCone(p, a, b, r1, r2) {
    const ba = vsub(b, a), pa = vsub(p, a);
    const l2 = vdot(ba, ba);
    const rr = r1 - r2;
    const a2 = l2 - rr * rr;
    const il2 = 1 / l2;
    const y = vdot(pa, ba);
    const z = y - l2;
    const x2 = vdot([pa[0] * l2 - ba[0] * y, pa[1] * l2 - ba[1] * y, pa[2] * l2 - ba[2] * y],
        [pa[0] * l2 - ba[0] * y, pa[1] * l2 - ba[1] * y, pa[2] * l2 - ba[2] * y]);
    const y2 = y * y * l2;
    const z2 = z * z * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

/** Ellipsoïde centré en c de demi-axes radii (approximation classique, bonne près de la surface). */
export function sdEllipsoid(p, c, radii) {
    const q = vsub(p, c);
    const k0 = Math.sqrt((q[0] / radii[0]) ** 2 + (q[1] / radii[1]) ** 2 + (q[2] / radii[2]) ** 2);
    const k1 = Math.sqrt((q[0] / (radii[0] * radii[0])) ** 2 + (q[1] / (radii[1] * radii[1])) ** 2 + (q[2] / (radii[2] * radii[2])) ** 2);
    if (k1 === 0) return -Math.min(radii[0], radii[1], radii[2]);
    return (k0 * (k0 - 1)) / k1;
}

/** Ellipsoïde tourné autour de l'axe Z (dans le plan XY) d'un angle rz, puis autour de Y de ry. */
export function sdEllipsoidRot(p, c, radii, ry = 0, rz = 0) {
    let q = vsub(p, c);
    if (ry) { const cy = Math.cos(-ry), sy = Math.sin(-ry); q = [q[0] * cy + q[2] * sy, q[1], -q[0] * sy + q[2] * cy]; }
    if (rz) { const cz = Math.cos(-rz), sz = Math.sin(-rz); q = [q[0] * cz - q[1] * sz, q[0] * sz + q[1] * cz, q[2]]; }
    return sdEllipsoid(q, [0, 0, 0], radii);
}

/** Union lisse polynomiale (Inigo Quilez). Toujours ≤ min(a, b). */
export function smin(a, b, k) {
    if (k <= 0) return Math.min(a, b);
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
}

/** Soustraction lisse : enlève b de a. */
export function smax(a, b, k) {
    if (k <= 0) return Math.max(a, b);
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.max(a, b) + h * h * k * 0.25;
}

/** Distance d'une forme décrite par un objet { type, ... }. */
export function shapeDistance(s, p) {
    switch (s.type) {
        case 'capsule': return sdCapsule(p, s.a, s.b, s.r);
        case 'cone': return sdRoundCone(p, s.a, s.b, s.r1, s.r2);
        case 'ellipsoid': return sdEllipsoidRot(p, s.c, s.radii, s.ry || 0, s.rz || 0);
        default: throw new Error(`forme inconnue : ${s.type}`);
    }
}

/**
 * Distance signée de l'union lisse de toutes les formes.
 * Retourne { d, nearest } où nearest = index de la forme la plus proche (pour le skinning).
 * `shapes` = tableau plat de formes avec { bone, blend } ; `cuts` = formes soustraites (optionnel).
 */
const preparedUnions = new WeakMap();
export function unionDistance(shapes, p, cuts = []) {
    // Même algorithme que createUnionSDF (mémoïsé par tableau de formes) : résultats bit-à-bit identiques.
    let u = preparedUnions.get(shapes);
    if (!u || u.cuts !== cuts) { u = createUnionSDF(shapes, cuts); u.cuts = cuts; preparedUnions.set(shapes, u); }
    return { d: u.distance(p[0], p[1], p[2]), nearest: u.nearest(p[0], p[1], p[2]) };
}

/**
 * Anatomie du chat au repos (debout, 4 pattes au sol), en mètres.
 * Longueur museau→base de queue ≈ 0.50 m, hauteur d'épaule ≈ 0.26 m, queue ≈ 0.28 m.
 * Chaque forme porte `bone` (nom d'os de skeleton-def.js) et `blend` (rayon de fusion).
 */
export function buildCatShapes(opts = {}) {
    const s = opts.scale ?? 1;
    const S = (v) => v.map((x) => x * s);
    const sh = [];
    const add = (type, bone, blend, params) => sh.push({ type, bone, blend: blend * s, ...params });

    // Tronc : bassin (arrière, x négatif) → poitrail (avant). Chat debout, hauteur d'épaule ≈ 0.27 m.
    add('cone', 'spine1', 0.045, { a: S([-0.17, 0.215, 0]), b: S([-0.02, 0.222, 0]), r1: 0.070 * s, r2: 0.076 * s });
    add('cone', 'chest', 0.045, { a: S([-0.02, 0.222, 0]), b: S([0.11, 0.225, 0]), r1: 0.076 * s, r2: 0.070 * s });
    add('ellipsoid', 'root', 0.045, { c: S([-0.19, 0.205, 0]), radii: S([0.062, 0.074, 0.068]) });          // croupe
    add('ellipsoid', 'chest', 0.04, { c: S([0.12, 0.185, 0]), radii: S([0.048, 0.062, 0.056]) });           // poitrail bas
    add('ellipsoid', 'spine2', 0.05, { c: S([-0.03, 0.175, 0]), radii: S([0.125, 0.052, 0.068]) });         // ventre

    // Cou et tête (le chat regarde vers +X)
    add('cone', 'neck', 0.04, { a: S([0.13, 0.245, 0]), b: S([0.22, 0.30, 0]), r1: 0.052 * s, r2: 0.04 * s });
    add('ellipsoid', 'head', 0.028, { c: S([0.255, 0.315, 0]), radii: S([0.058, 0.055, 0.06]) });           // crâne
    add('ellipsoid', 'head', 0.022, { c: S([0.288, 0.287, 0]), radii: S([0.036, 0.03, 0.042]) });           // museau (court)
    add('ellipsoid', 'head', 0.016, { c: S([0.308, 0.294, 0]), radii: S([0.016, 0.015, 0.02]) });           // bout du museau
    add('ellipsoid', 'head', 0.016, { c: S([0.293, 0.268, 0]), radii: S([0.026, 0.017, 0.026]) });          // menton
    add('ellipsoid', 'head', 0.014, { c: S([0.282, 0.288, 0.036]), radii: S([0.026, 0.02, 0.02]) });        // joue gauche
    add('ellipsoid', 'head', 0.014, { c: S([0.282, 0.288, -0.036]), radii: S([0.026, 0.02, 0.02]) });       // joue droite
    // Oreilles : cônes arrondis sur le haut arrière du crâne, pointant vers le haut et l'extérieur
    add('cone', 'earL', 0.012, { a: S([0.24, 0.35, 0.03]), b: S([0.235, 0.415, 0.048]), r1: 0.026 * s, r2: 0.005 * s });
    add('cone', 'earR', 0.012, { a: S([0.24, 0.35, -0.03]), b: S([0.235, 0.415, -0.048]), r1: 0.026 * s, r2: 0.005 * s });

    // Pattes : positions des articulations partagées avec skeleton-def.js (LEG_JOINTS). Z>0 = gauche.
    for (const [prefix, j] of Object.entries(LEG_JOINTS)) {
        const back = prefix.startsWith('legB');
        add('cone', `${prefix}_up`, 0.03, { a: S(j.hip), b: S(j.knee), r1: (back ? 0.044 : 0.03) * s, r2: (back ? 0.026 : 0.022) * s });
        add('cone', `${prefix}_low`, 0.018, { a: S(j.knee), b: S(j.foot), r1: (back ? 0.024 : 0.022) * s, r2: 0.019 * s });
        add('ellipsoid', `${prefix}_foot`, 0.014, { c: S([j.foot[0] + 0.014, 0.018, j.foot[2]]), radii: S([0.032, 0.018, 0.024]) });
    }

    // Queue : 6 segments partant de la croupe (articulations partagées : TAIL_JOINTS)
    for (let i = 0; i < 6; i++) {
        const r1 = 0.024 - i * 0.0024, r2 = 0.024 - (i + 1) * 0.0024;
        add('cone', `tail${i + 1}`, 0.018, { a: S(TAIL_JOINTS[i]), b: S(TAIL_JOINTS[i + 1]), r1: r1 * s, r2: r2 * s });
    }
    return sh;
}

/** Articulations des pattes (hanche/épaule, genou/coude, pied) — source unique pour le SDF et le squelette. */
export const LEG_JOINTS = {
    legFL: { hip: [0.095, 0.20, 0.05], knee: [0.095, 0.115, 0.05], foot: [0.095, 0.03, 0.05] },
    legFR: { hip: [0.095, 0.20, -0.05], knee: [0.095, 0.115, -0.05], foot: [0.095, 0.03, -0.05] },
    legBL: { hip: [-0.19, 0.21, 0.055], knee: [-0.15, 0.125, 0.055], foot: [-0.18, 0.03, 0.055] },
    legBR: { hip: [-0.19, 0.21, -0.055], knee: [-0.15, 0.125, -0.055], foot: [-0.18, 0.03, -0.055] },
};

/** Articulations de la queue (7 points = 6 segments), de la croupe vers la pointe. */
export const TAIL_JOINTS = [
    [-0.24, 0.235, 0], [-0.30, 0.26, 0.005], [-0.355, 0.295, 0.012], [-0.395, 0.34, 0.02], [-0.42, 0.39, 0.03], [-0.43, 0.44, 0.04], [-0.43, 0.485, 0.05],
];

/** Boîte englobante (avec marge) d'un ensemble de formes. */
export function shapesBounds(shapes, margin = 0.04) {
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    const grow = (pt, r) => { for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], pt[i] - r); max[i] = Math.max(max[i], pt[i] + r); } };
    for (const s of shapes) {
        if (s.type === 'capsule') { grow(s.a, s.r); grow(s.b, s.r); }
        else if (s.type === 'cone') { grow(s.a, s.r1); grow(s.b, s.r2); }
        else grow(s.c, Math.max(...s.radii));
    }
    return { min: min.map((v) => v - margin), max: max.map((v) => v + margin) };
}

/** Sphère englobante d'une forme : { c, r }. */
export function shapeBoundingSphere(s) {
    if (s.type === 'capsule') return { c: vlerp(s.a, s.b, 0.5), r: vlen(vsub(s.b, s.a)) / 2 + s.r };
    if (s.type === 'cone') return { c: vlerp(s.a, s.b, 0.5), r: vlen(vsub(s.b, s.a)) / 2 + Math.max(s.r1, s.r2) };
    return { c: s.c, r: Math.max(...s.radii) };
}

/**
 * Prépare une fonction de distance rapide pour l'union lisse des formes :
 * on n'évalue exactement que les formes dont la borne inférieure (sphère englobante)
 * peut influencer le résultat (à `blend` près).
 * Retourne { distance(x, y, z), nearest(x, y, z) }.
 */
export function createUnionSDF(shapes, cuts = []) {
    const n = shapes.length;
    const cx = new Float64Array(n), cy = new Float64Array(n), cz = new Float64Array(n), cr = new Float64Array(n), blend = new Float64Array(n);
    shapes.forEach((s, i) => { const b = shapeBoundingSphere(s); cx[i] = b.c[0]; cy[i] = b.c[1]; cz[i] = b.c[2]; cr[i] = b.r; blend[i] = s.blend; });
    const p = [0, 0, 0];
    function distance(x, y, z) {
        p[0] = x; p[1] = y; p[2] = z;
        // Ordre du tableau (identique à unionDistance). Une forme dont la borne inférieure de distance
        // dépasse d + blend ne modifie pas smin : on la saute, le résultat est bit-à-bit identique.
        let d = shapeDistance(shapes[0], p);
        for (let i = 1; i < n; i++) {
            const dx = x - cx[i], dy = y - cy[i], dz = z - cz[i];
            const lb = Math.sqrt(dx * dx + dy * dy + dz * dz) - cr[i];
            if (lb >= d + blend[i]) continue;
            d = smin(d, shapeDistance(shapes[i], p), blend[i]);
        }
        for (const c of cuts) d = smax(d, -shapeDistance(c, p), c.blend);
        return d;
    }
    function nearest(x, y, z) {
        p[0] = x; p[1] = y; p[2] = z;
        let best = Infinity, bi = -1;
        for (let i = 0; i < n; i++) { const di = shapeDistance(shapes[i], p); if (di < best) { best = di; bi = i; } }
        return bi;
    }
    return { distance, nearest };
}
