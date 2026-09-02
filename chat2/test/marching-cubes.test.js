import { test } from 'node:test';
import assert from 'node:assert/strict';
import { polygonize, taubinSmooth, computeNormals, signedVolume, edgeStats } from '../js/cat/marching-cubes.js';
import { buildCatShapes, unionDistance, shapesBounds } from '../js/cat/sdf.js';

const R = 0.5;
const sphere = (x, y, z) => Math.hypot(x, y, z) - R;
const box = { min: [-0.7, -0.7, -0.7], max: [0.7, 0.7, 0.7], res: 48 };

test('sphère : surface fermée, orientée vers l\'extérieur, volume et rayon corrects', () => {
    const { positions, indices, vertexCount } = polygonize(sphere, box);
    assert.ok(indices.length / 3 > 2000, `${indices.length / 3} triangles`);
    assert.equal(vertexCount, positions.length / 3);
    const st = edgeStats(indices);
    assert.equal(st.open, 0, 'aucune arête ouverte');
    assert.equal(st.nonManifold, 0, 'aucune arête non manifold');
    const vol = signedVolume(positions, indices);
    const expected = (4 / 3) * Math.PI * R ** 3;
    assert.ok(vol > 0, 'orientation sortante');
    assert.ok(Math.abs(vol - expected) / expected < 0.05, `volume ${vol} vs ${expected}`);
    let maxErr = 0;
    for (let v = 0; v < positions.length; v += 3) maxErr = Math.max(maxErr, Math.abs(Math.hypot(positions[v], positions[v + 1], positions[v + 2]) - R));
    assert.ok(maxErr < 0.01, `écart max au rayon ${maxErr}`);
});

test('normales unitaires et alignées avec la position pour une sphère', () => {
    const { positions, indices } = polygonize(sphere, box);
    const n = computeNormals(positions, indices);
    let minDot = 1;
    for (let v = 0; v < positions.length; v += 3) {
        const l = Math.hypot(n[v], n[v + 1], n[v + 2]);
        assert.ok(Math.abs(l - 1) < 1e-5);
        const p = Math.hypot(positions[v], positions[v + 1], positions[v + 2]);
        minDot = Math.min(minDot, (n[v] * positions[v] + n[v + 1] * positions[v + 1] + n[v + 2] * positions[v + 2]) / p);
    }
    assert.ok(minDot > 0.9, `normale la moins radiale : ${minDot}`);
});

test('le lissage de Taubin ne rétrécit pas la sphère de plus de 1 %', () => {
    const { positions, indices } = polygonize(sphere, box);
    const before = signedVolume(positions, indices);
    taubinSmooth(positions, indices, 4);
    const after = signedVolume(positions, indices);
    assert.ok(Math.abs(after - before) / before < 0.01, `${before} → ${after}`);
    let maxErr = 0;
    for (let v = 0; v < positions.length; v += 3) maxErr = Math.max(maxErr, Math.abs(Math.hypot(positions[v], positions[v + 1], positions[v + 2]) - R));
    assert.ok(maxErr < 0.01);
});

test('le chat complet se polygonise en une surface fermée de taille raisonnable', () => {
    const shapes = buildCatShapes();
    const b = shapesBounds(shapes, 0.03);
    const t0 = performance.now();
    const { positions, indices } = polygonize((x, y, z) => unionDistance(shapes, [x, y, z]).d, { min: b.min, max: b.max, res: [64, 40, 24] });
    const dt = performance.now() - t0;
    const tris = indices.length / 3;
    assert.ok(tris > 3000 && tris < 60000, `${tris} triangles`);
    const st = edgeStats(indices);
    assert.equal(st.open, 0);
    assert.equal(st.nonManifold, 0);
    assert.ok(signedVolume(positions, indices) > 0.003, 'volume plausible (> 3 litres)');
    assert.ok(dt < 5000, `polygonisation basse résolution en ${dt.toFixed(0)} ms`);
});
