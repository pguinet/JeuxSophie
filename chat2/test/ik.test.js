import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solveTwoBone, wrapAngle, damp, dampAngle } from '../js/cat/ik.js';

const reconstruct = (l1, l2, { phi1, phi2 }) => {
    const jx = l1 * Math.cos(phi1), jy = l1 * Math.sin(phi1);
    return { jx, jy, ex: jx + l2 * Math.cos(phi2), ey: jy + l2 * Math.sin(phi2) };
};

test('cible atteignable : l\'extrémité tombe exactement sur la cible', () => {
    const l1 = 0.09, l2 = 0.085;
    for (const [tx, ty] of [[0.02, -0.15], [-0.03, -0.14], [0.08, -0.1], [0.0, -0.17]]) {
        const r = solveTwoBone(l1, l2, tx, ty, 1);
        assert.ok(r.reachable);
        const { ex, ey } = reconstruct(l1, l2, r);
        assert.ok(Math.abs(ex - tx) < 1e-9 && Math.abs(ey - ty) < 1e-9, `(${tx},${ty}) → (${ex},${ey})`);
    }
});

test('le sens de flexion place l\'articulation du bon côté', () => {
    const l1 = 0.09, l2 = 0.085;
    const fwd = reconstruct(l1, l2, solveTwoBone(l1, l2, 0, -0.15, 1));
    const back = reconstruct(l1, l2, solveTwoBone(l1, l2, 0, -0.15, -1));
    assert.ok(fwd.jx > 0.01, 'genou vers l\'avant (+x)');
    assert.ok(back.jx < -0.01, 'coude vers l\'arrière (−x)');
});

test('cible hors de portée : chaîne tendue vers la cible', () => {
    const r = solveTwoBone(0.09, 0.085, 0.3, -0.3, 1);
    assert.equal(r.reachable, false);
    assert.ok(Math.abs(r.phi1 - r.phi2) < 5e-3, `segments alignés (${r.phi1} vs ${r.phi2})`);
    assert.ok(Math.abs(r.phi1 - Math.atan2(-0.3, 0.3)) < 1e-3, 'pointe vers la cible');
});

test('wrapAngle, damp et dampAngle', () => {
    assert.ok(Math.abs(Math.cos(wrapAngle(3 * Math.PI)) + 1) < 1e-9, '3π ≡ ±π');
    assert.ok(Math.abs(wrapAngle(-3.5 * Math.PI) - (0.5 * Math.PI)) < 1e-9);
    assert.ok(Math.abs(damp(0, 1, 0.1, 0.1) - 0.5) < 1e-9, 'moitié de l\'écart en une demi-vie');
    assert.equal(damp(0, 1, 0, 0.1), 1);
    const a = dampAngle(Math.PI - 0.1, -Math.PI + 0.1, 0.1, 100);
    assert.ok(Math.abs(wrapAngle(a - (-Math.PI + 0.1))) < 1e-6, 'passe par le chemin court');
});
