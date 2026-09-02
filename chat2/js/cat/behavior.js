// Comportement autonome du chat : machine d'états + déplacement 2D (x, z). Module pur, déterministe via `rng`.
// Les états visuels (manger, dormir…) n'affectent pas les jauges : seules les actions du joueur le font (needs.js).

export const STATES = ['idle', 'sit', 'wander', 'goto', 'eat', 'drink', 'sleep', 'groom', 'sad', 'play', 'pet', 'stretch'];

const rand = (rng, a, b) => a + (b - a) * rng();

export function createBehavior(x = 0, z = 0) {
    return {
        state: 'idle', timer: 2, pos: [x, z], heading: 0, target: null, next: null,
        speed: 0, wantSpeed: 0.35, arrivedAt: null, moodSad: false, event: null,
    };
}

/** Distance et direction 2D. */
function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }

/** Choisit un état autonome selon les jauges (0..100) ; `spots` = { bowl:[x,z], water:[x,z], bed:[x,z], litter:[x,z] }. */
export function chooseAutonomous(b, needs, rng, spots) {
    if (needs.fatigue > 75 && rng() < 0.6) return { state: 'goto', target: spots.bed, next: 'sleep', duration: rand(rng, 18, 35), face: spots.bedFace };
    if (needs.hunger < 30 && rng() < 0.6) return { state: 'goto', target: spots.bowl, next: 'eat', duration: rand(rng, 5, 8), face: spots.bowlFace };
    if (needs.thirst < 30 && rng() < 0.5) return { state: 'goto', target: spots.water, next: 'drink', duration: rand(rng, 4, 6), face: spots.waterFace };
    if (needs.hygiene < 35 && rng() < 0.5) return { state: 'groom', duration: rand(rng, 5, 9) };
    if (needs.happiness < 30 && rng() < 0.7) return { state: 'sad', duration: rand(rng, 6, 10) };
    const r = rng();
    if (r < 0.45) return { state: 'wander', duration: 0 };
    if (r < 0.65) return { state: 'sit', duration: rand(rng, 4, 10) };
    if (r < 0.75) return { state: 'groom', duration: rand(rng, 4, 7) };
    if (r < 0.82) return { state: 'stretch', duration: 2.2 };
    return { state: 'idle', duration: rand(rng, 2, 5) };
}

/** Applique une transition. */
export function enter(b, t, spots = null) {
    b.state = t.state;
    b.timer = t.duration ?? 0;
    b.path = [];
    if (t.target) {
        const route = spots && spots.route ? spots.route(b.pos, t.target) : [t.target];
        b.path = route.map((p) => [p[0], p[1]]);
        b.target = b.path.shift();
    } else b.target = null;
    b.face = t.face ? [t.face[0], t.face[1]] : null;
    b.next = t.next ?? null;
    b.nextDuration = t.nextDuration ?? t.duration;
    b.event = `enter:${t.state}`;
    return b;
}

/**
 * Demande du joueur : le chat va au bon endroit puis joue l'état.
 * kind ∈ eat | drink | sleep | groom | pet | play. Retourne b.
 */
export function requestAction(b, kind, spots) {
    const gotoThen = (target, next, duration, face) => (dist(b.pos, target) > 0.15
        ? enter(b, { state: 'goto', target, next, nextDuration: duration, duration: 0, face }, spots)
        : (faceToward(b, face), enter(b, { state: next, duration })));
    switch (kind) {
        case 'eat': return gotoThen(spots.bowl, 'eat', 6, spots.bowlFace);
        case 'drink': return gotoThen(spots.water, 'drink', 5, spots.waterFace);
        case 'sleep': return gotoThen(spots.bed, 'sleep', 14, spots.bedFace);
        case 'groom': return enter(b, { state: 'groom', duration: 6 });
        case 'pet': return enter(b, { state: 'pet', duration: 4 });
        case 'play': return enter(b, { state: 'play', duration: 6, target: spots.toy || null });
        default: return b;
    }
}

/**
 * Avance la simulation de dt secondes.
 * @param {object} b état (mutable)
 * @param {object} needs jauges { hunger, thirst, happiness, hygiene, fatigue }
 * @param {number} dt
 * @param {() => number} rng
 * @param {{ bowl, water, bed, litter, randomPoint(rng): [x,z], clamp([x,z]): [x,z] }} spots
 */
export function stepBehavior(b, needs, dt, rng, spots) {
    b.event = null;
    b.moodSad = needs.happiness < 30;
    switch (b.state) {
        case 'wander':
            if (!b.target && !(b.path && b.path.length)) {
                const route = spots.route ? spots.route(b.pos, spots.randomPoint(rng)) : [spots.randomPoint(rng)];
                b.path = route.map((p) => [p[0], p[1]]); b.target = b.path.shift();
            }
            if (moveToward(b, dt, b.wantSpeed, spots)) {
                if (b.path && b.path.length) b.target = b.path.shift();
                else enter(b, { state: 'idle', duration: rand(rng, 1.5, 4) });
            }
            break;
        case 'goto':
            if (moveToward(b, dt, b.wantSpeed * 1.15, spots)) {
                if (b.path && b.path.length) { b.target = b.path.shift(); break; }
                const next = b.next || 'idle';
                faceToward(b, b.face);
                enter(b, { state: next, duration: b.nextDuration ?? rand(rng, 4, 8) });
                b.event = `arrive:${next}`;
            }
            break;
        default:
            b.speed = 0;
            b.timer -= dt;
            if (b.timer <= 0) {
                if (b.state === 'sleep' && needs.fatigue > 60 && rng() < 0.5) { b.timer = rand(rng, 8, 15); break; } // se rendort
                enter(b, chooseAutonomous(b, needs, rng, spots), spots);
            }
    }
    return b;
}

/** Oriente le chat vers un point (à l'arrivée devant la gamelle, le panier…). */
export function faceToward(b, face) {
    if (!face) return;
    const dx = face[0] - b.pos[0], dz = face[1] - b.pos[1];
    if (Math.hypot(dx, dz) > 1e-3) b.heading = Math.atan2(dx, dz);
}

/** Déplace vers b.target ; retourne true à l'arrivée. Met à jour heading et speed. */
export function moveToward(b, dt, speed, spots) {
    if (!b.target) return true;
    const dx = b.target[0] - b.pos[0], dz = b.target[1] - b.pos[1];
    const d = Math.hypot(dx, dz);
    if (d < 0.03) { b.speed = 0; b.target = null; return true; }
    const desired = Math.atan2(dx, dz); // heading : 0 = +z, π/2 = +x
    const delta = Math.atan2(Math.sin(desired - b.heading), Math.cos(desired - b.heading));
    const turn = Math.min(Math.abs(delta), 3.5 * dt) * Math.sign(delta);
    b.heading += turn;
    // Avance seulement si à peu près orienté
    const aligned = Math.abs(delta) < 0.6;
    b.speed = aligned ? Math.min(speed, d / Math.max(dt, 1e-3)) : 0;
    const step = b.speed * dt;
    const nx = b.pos[0] + Math.sin(b.heading) * step, nz = b.pos[1] + Math.cos(b.heading) * step;
    const c = spots.clamp ? spots.clamp([nx, nz], b.pos) : [nx, nz];
    const blocked = c[0] !== nx || c[1] !== nz;
    b.pos[0] = c[0]; b.pos[1] = c[1];
    if (blocked) { b.target = null; b.path = []; b.speed = 0; return true; } // bloqué : on abandonne
    return false;
}
