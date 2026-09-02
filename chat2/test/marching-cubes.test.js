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

test('createUnionSDF donne la même distance que unionDistance près de la surface', async () => {
    const { createUnionSDF } = await import('../js/cat/sdf.js');
    const shapes = buildCatShapes();
    const fast = createUnionSDF(shapes);
    let maxErr = 0;
    for (let x = -0.5; x <= 0.4; x += 0.023) for (let y = -0.05; y <= 0.5; y += 0.021) for (let z = -0.17; z <= 0.17; z += 0.019) {
        const a = unionDistance(shapes, [x, y, z]).d, b = fast.distance(x, y, z);
        if (Math.abs(a) < 0.03) maxErr = Math.max(maxErr, Math.abs(a - b));
    }
    assert.ok(maxErr < 1e-9, `écart max ${maxErr}`);
});

test('le chat à 6 mm de voxel se génère en moins de 1,5 s (élagage + saut de lignes)', async () => {
    const { createUnionSDF } = await import('../js/cat/sdf.js');
    const shapes = buildCatShapes();
    const fast = createUnionSDF(shapes);
    const b = shapesBounds(shapes, 0.03);
    const res = [0, 1, 2].map((i) => Math.ceil((b.max[i] - b.min[i]) / 0.006));
    const t0 = performance.now();
    const { indices } = polygonize(fast.distance, { min: b.min, max: b.max, res });
    const dt = performance.now() - t0;
    const st = edgeStats(indices);
    assert.equal(st.open, 0);
    assert.ok(dt < 1500, `${dt.toFixed(0)} ms pour ${indices.length / 3} triangles (grille ${res.join('x')})`);
    console.log(`  chat 6 mm : ${indices.length / 3} triangles en ${dt.toFixed(0)} ms (grille ${res.join('x')})`);
});
