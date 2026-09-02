// Cinématique inverse à deux os dans un plan (x = avant, y = haut). Module pur.

/**
 * Résout une chaîne de deux segments (l1, l2) partant de l'origine vers la cible (tx, ty).
 * Retourne les angles ABSOLUS (rad, sens trigonométrique) des deux segments :
 *   articulation = l1 · (cos φ1, sin φ1), extrémité = articulation + l2 · (cos φ2, sin φ2).
 * `bend` = +1 : l'articulation se place du côté trigonométrique de la direction de la cible
 * (genou vers l'avant pour une cible sous la hanche), −1 : de l'autre côté (coude vers l'arrière).
 * Si la cible est hors de portée, la chaîne est tendue vers elle ; si elle est trop proche, repliée au maximum.
 */
export function solveTwoBone(l1, l2, tx, ty, bend = 1) {
    const eps = 1e-9;
    let d = Math.hypot(tx, ty);
    const dMin = Math.abs(l1 - l2) + eps, dMax = l1 + l2 - eps;
    const reachable = d >= dMin && d <= dMax;
    d = Math.min(Math.max(d, dMin), dMax);
    const target = Math.atan2(ty, tx);
    // Angle entre le premier segment et la direction de la cible (loi des cosinus)
    const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
    const alpha = Math.acos(Math.min(1, Math.max(-1, cosA)));
    const phi1 = target + bend * alpha;
    const jx = l1 * Math.cos(phi1), jy = l1 * Math.sin(phi1);
    // Direction du second segment : de l'articulation vers la cible (ramenée à portée)
    const ex = d * Math.cos(target), ey = d * Math.sin(target);
    const phi2 = Math.atan2(ey - jy, ex - jx);
    return { phi1, phi2, reachable };
}

/** Angle d'un vecteur (dx, dy) dans le plan, en radians. */
export function planeAngle(dx, dy) { return Math.atan2(dy, dx); }

/** Ramène un angle dans ]-π, π]. */
export function wrapAngle(a) {
    a = (a + Math.PI) % (2 * Math.PI);
    if (a < 0) a += 2 * Math.PI;
    return a - Math.PI;
}

/**
 * Amortisseur critique (ressort sans oscillation) : rapproche `current` de `target`.
 * `halfLife` = temps (s) pour parcourir la moitié de l'écart.
 */
export function damp(current, target, halfLife, dt) {
    if (halfLife <= 0) return target;
    return target + (current - target) * Math.pow(2, -dt / halfLife);
}

/** Idem pour un angle (chemin le plus court). */
export function dampAngle(current, target, halfLife, dt) {
    return current + (wrapAngle(target - current)) * (1 - Math.pow(2, -dt / halfLife));
}
