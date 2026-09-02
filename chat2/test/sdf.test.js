import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sdCapsule, sdRoundCone, sdEllipsoid, smin, buildCatShapes, unionDistance, shapesBounds } from '../js/cat/sdf.js';

test('smin est toujours ≤ min(a, b) et égale min loin de la jonction', () => {
    assert.ok(smin(0.1, 0.12, 0.05) <= Math.min(0.1, 0.12));
    assert.equal(smin(0.1, 1.0, 0.05), 0.1);
    assert.ok(smin(0.1, 0.1, 0.05) < 0.1);
});

test('capsule : négatif à l\'intérieur, positif dehors, zéro sur la surface', () => {
    assert.ok(sdCapsule([0, 0, 0], [-1, 0, 0], [1, 0, 0], 0.5) < 0);
    assert.ok(sdCapsule([0, 2, 0], [-1, 0, 0], [1, 0, 0], 0.5) > 0);
    assert.ok(Math.abs(sdCapsule([0, 0.5, 0], [-1, 0, 0], [1, 0, 0], 0.5)) < 1e-9);
    assert.ok(Math.abs(sdCapsule([1.5, 0, 0], [-1, 0, 0], [1, 0, 0], 0.5)) < 1e-9);
});

test('cône arrondi : rayons respectés aux deux extrémités', () => {
    const a = [0, 0, 0], b = [0, 1, 0];
    assert.ok(Math.abs(sdRoundCone([0, -0.3, 0], a, b, 0.3, 0.1)) < 1e-6, 'bout de la grosse sphère');
    assert.ok(Math.abs(sdRoundCone([0, 1.1, 0], a, b, 0.3, 0.1)) < 1e-6, 'bout de la petite sphère');
    assert.ok(sdRoundCone([0, 0.5, 0], a, b, 0.3, 0.1) < 0, 'axe : intérieur');
    assert.ok(sdRoundCone([0.5, 0.5, 0], a, b, 0.3, 0.1) > 0, 'côté : extérieur');
    // Le flanc est tangent aux deux sphères : à mi-hauteur le rayon vaut ~0.2 (légèrement plus à cause de l'inclinaison)
    assert.ok(Math.abs(sdRoundCone([0.204, 0.5, 0], a, b, 0.3, 0.1)) < 2e-3, 'flanc à mi-hauteur');
});

test('ellipsoïde : signe correct et surface aux extrémités des axes', () => {
    assert.ok(sdEllipsoid([0, 0, 0], [0, 0, 0], [1, 0.5, 0.25]) < 0);
    assert.ok(Math.abs(sdEllipsoid([1, 0, 0], [0, 0, 0], [1, 0.5, 0.25])) < 1e-9);
    assert.ok(Math.abs(sdEllipsoid([0, 0, 0.25], [0, 0, 0], [1, 0.5, 0.25])) < 1e-9);
    assert.ok(sdEllipsoid([0, 2, 0], [0, 0, 0], [1, 0.5, 0.25]) > 0);
});

test('le chat : intérieur du tronc négatif, très au-dessus positif, tête attribuée à un os head', () => {
    const shapes = buildCatShapes();
    assert.ok(shapes.length > 25);
    assert.ok(unionDistance(shapes, [0.0, 0.21, 0]).d < 0, 'centre du tronc');
    assert.ok(unionDistance(shapes, [0.0, 1.0, 0]).d > 0.5, 'un mètre au-dessus');
    assert.ok(unionDistance(shapes, [0.0, 0.005, 0]).d > 0, 'sous le ventre, entre les pattes');
    const head = unionDistance(shapes, [0.255, 0.315, 0]);
    assert.ok(head.d < 0);
    assert.equal(shapes[head.nearest].bone, 'head');
    const paw = unionDistance(shapes, [0.109, 0.018, 0.05]);
    assert.ok(paw.d < 0, 'intérieur de la patte avant gauche');
    assert.equal(shapes[paw.nearest].bone, 'legFL_foot');
});

test('les pattes touchent le sol (y≈0) et rien ne passe sous le sol de plus de 2 mm', () => {
    const shapes = buildCatShapes();
    assert.ok(unionDistance(shapes, [0.109, 0.0, 0.05]).d < 0.003);
    // Rien sous le sol : le champ est positif partout dans le plan y = -4 mm
    let minBelow = Infinity;
    for (let x = -0.5; x <= 0.4; x += 0.01) for (let z = -0.15; z <= 0.15; z += 0.01) minBelow = Math.min(minBelow, unionDistance(shapes, [x, -0.004, z]).d);
    assert.ok(minBelow > 0, `champ sous le sol = ${minBelow}`);
    const b = shapesBounds(shapes, 0);
    assert.ok(b.max[0] - b.min[0] > 0.7 && b.max[0] - b.min[0] < 0.95, 'longueur totale plausible');
});

test('shapesBounds englobe toutes les formes avec la marge', () => {
    const b = shapesBounds(buildCatShapes(), 0.05);
    assert.ok(b.min[1] <= -0.05 + 1e-9);
    assert.ok(b.max[1] > 0.45);
});
