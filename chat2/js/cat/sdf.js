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
export function unionDistance(shapes, p, cuts = []) {
    // smin n'est pas associatif : on fixe l'ordre (forme la plus proche d'abord, puis l'ordre du tableau)
    // pour obtenir exactement le même champ que createUnionSDF.
    const dist = new Array(shapes.length);
    let nearest = -1, best = Infinity;
    for (let i = 0; i < shapes.length; i++) {
        dist[i] = shapeDistance(shapes[i], p);
        if (dist[i] < best) { best = dist[i]; nearest = i; }
    }
    let d = best;
    for (let i = 0; i < shapes.length; i++) if (i !== nearest) d = smin(d, dist[i], shapes[i].blend);
    for (const c of cuts) d = smax(d, -shapeDistance(c, p), c.blend);
    return { d, nearest };
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

    // Tronc : bassin (arrière, x négatif) → poitrail (avant). Le dos est légèrement plus haut à l'arrière.
    add('cone', 'spine1', 0.05, { a: S([-0.17, 0.19, 0]), b: S([-0.02, 0.20, 0]), r1: 0.085 * s, r2: 0.095 * s });
    add('cone', 'chest', 0.05, { a: S([-0.02, 0.20, 0]), b: S([0.12, 0.205, 0]), r1: 0.095 * s, r2: 0.088 * s });
    add('ellipsoid', 'root', 0.05, { c: S([-0.19, 0.19, 0]), radii: S([0.075, 0.085, 0.082]) });           // croupe
    add('ellipsoid', 'chest', 0.04, { c: S([0.14, 0.17, 0]), radii: S([0.06, 0.075, 0.07]) });             // poitrail bas
    add('ellipsoid', 'spine2', 0.05, { c: S([-0.05, 0.14, 0]), radii: S([0.14, 0.06, 0.085]) });           // ventre

    // Cou et tête (le chat regarde vers +X, tête légèrement au-dessus du dos)
    add('cone', 'neck', 0.045, { a: S([0.14, 0.23, 0]), b: S([0.235, 0.29, 0]), r1: 0.06 * s, r2: 0.05 * s });
    add('ellipsoid', 'head', 0.03, { c: S([0.265, 0.31, 0]), radii: S([0.066, 0.062, 0.064]) });           // crâne
    add('ellipsoid', 'head', 0.025, { c: S([0.305, 0.285, 0]), radii: S([0.045, 0.036, 0.048]) });         // museau / joues
    add('ellipsoid', 'head', 0.02, { c: S([0.328, 0.29, 0]), radii: S([0.022, 0.02, 0.026]) });            // truffe / bout du museau
    add('ellipsoid', 'head', 0.02, { c: S([0.31, 0.262, 0]), radii: S([0.03, 0.02, 0.03]) });              // menton
    add('ellipsoid', 'head', 0.015, { c: S([0.29, 0.30, 0.04]), radii: S([0.028, 0.026, 0.022]) });        // joue gauche
    add('ellipsoid', 'head', 0.015, { c: S([0.29, 0.30, -0.04]), radii: S([0.028, 0.026, 0.022]) });       // joue droite
    // Oreilles : cônes arrondis, écartés et légèrement tournés vers l'extérieur
    add('cone', 'earL', 0.012, { a: S([0.245, 0.345, 0.035]), b: S([0.24, 0.415, 0.052]), r1: 0.028 * s, r2: 0.006 * s });
    add('cone', 'earR', 0.012, { a: S([0.245, 0.345, -0.035]), b: S([0.24, 0.415, -0.052]), r1: 0.028 * s, r2: 0.006 * s });

    // Pattes (avant : FL/FR sous les épaules ; arrière : BL/BR sous les hanches). Z>0 = gauche.
    const leg = (prefix, x, z, upperR, lowerR) => {
        const hipY = prefix.startsWith('legB') ? 0.20 : 0.19;
        const kneeX = prefix.startsWith('legB') ? x + 0.045 : x - 0.005;
        add('cone', `${prefix}_up`, 0.035, { a: S([x, hipY, z]), b: S([kneeX, 0.11, z]), r1: upperR * s, r2: lowerR * s });
        add('cone', `${prefix}_low`, 0.02, { a: S([kneeX, 0.11, z]), b: S([kneeX - (prefix.startsWith('legB') ? 0.03 : 0.0), 0.03, z]), r1: lowerR * s, r2: (lowerR * 0.85) * s });
        const footX = kneeX - (prefix.startsWith('legB') ? 0.03 : 0.0);
        add('ellipsoid', `${prefix}_foot`, 0.015, { c: S([footX + 0.012, 0.018, z]), radii: S([0.034, 0.02, 0.026]) });
    };
    leg('legFL', 0.10, 0.055, 0.038, 0.024);
    leg('legFR', 0.10, -0.055, 0.038, 0.024);
    leg('legBL', -0.19, 0.06, 0.05, 0.026);
    leg('legBR', -0.19, -0.06, 0.05, 0.026);

    // Queue : 6 segments partant de la croupe, courbe douce vers le haut puis l'arrière
    const tail = [
        [-0.25, 0.22, 0], [-0.31, 0.25, 0.005], [-0.365, 0.285, 0.012], [-0.405, 0.33, 0.02], [-0.43, 0.38, 0.03], [-0.44, 0.43, 0.04], [-0.44, 0.475, 0.05],
    ];
    for (let i = 0; i < 6; i++) {
        const r1 = 0.026 - i * 0.0025, r2 = 0.026 - (i + 1) * 0.0025;
        add('cone', `tail${i + 1}`, 0.02, { a: S(tail[i]), b: S(tail[i + 1]), r1: r1 * s, r2: r2 * s });
    }
    return sh;
}

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
    let maxBlend = 0;
    shapes.forEach((s, i) => { const b = shapeBoundingSphere(s); cx[i] = b.c[0]; cy[i] = b.c[1]; cz[i] = b.c[2]; cr[i] = b.r; blend[i] = s.blend; maxBlend = Math.max(maxBlend, s.blend); });
    const lb = new Float64Array(n);
    const p = [0, 0, 0];
    function distance(x, y, z) {
        p[0] = x; p[1] = y; p[2] = z;
        let best = Infinity, bi = -1;
        for (let i = 0; i < n; i++) {
            const dx = x - cx[i], dy = y - cy[i], dz = z - cz[i];
            lb[i] = Math.sqrt(dx * dx + dy * dy + dz * dz) - cr[i];
            if (lb[i] < best) { best = lb[i]; bi = i; }
        }
        let d = shapeDistance(shapes[bi], p);
        for (let i = 0; i < n; i++) {
            if (i === bi || lb[i] > d + maxBlend) continue;
            const di = shapeDistance(shapes[i], p);
            d = smin(d, di, blend[i]);
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
