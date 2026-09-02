import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSkinWeights } from '../js/cat/skin-weights.js';
import { BONES, BONE_INDEX, legLengths } from '../js/cat/skeleton-def.js';
import { buildCatShapes } from '../js/cat/sdf.js';

test('le squelette est une hiérarchie valide dont la racine est en index 0', () => {
    assert.equal(BONES[0].parent, null);
    for (const b of BONES.slice(1)) assert.ok(b.parent in BONE_INDEX, `parent inconnu : ${b.parent}`);
    for (const b of BONES.slice(1)) assert.ok(BONE_INDEX[b.parent] < BONE_INDEX[b.name], 'les parents précèdent les enfants');
    assert.equal(BONES.length, 26);
});

test('toutes les formes SDF référencent un os existant', () => {
    for (const s of buildCatShapes()) assert.ok(s.bone in BONE_INDEX, `os inconnu : ${s.bone}`);
});

test('les longueurs de pattes sont plausibles pour un chat', () => {
    const f = legLengths('legFL'), b = legLengths('legBL');
    assert.ok(f.upper > 0.06 && f.upper < 0.12);
    assert.ok(b.lower > 0.06 && b.lower < 0.12);
});

test('poids normalisés, 4 os max, tête et pattes bien attribuées', () => {
    const shapes = buildCatShapes();
    const pts = [
        [0.255, 0.315, 0],      // centre de la tête
        [0.0, 0.215, 0],        // milieu du dos
        [0.095, 0.07, 0.05],    // bas de patte avant gauche
        [-0.425, 0.42, 0.035],  // bout de queue
    ];
    const { skinIndex, skinWeight } = computeSkinWeights(pts.flat(), shapes, BONE_INDEX);
    for (let v = 0; v < pts.length; v++) {
        let sum = 0;
        for (let j = 0; j < 4; j++) { sum += skinWeight[v * 4 + j]; assert.ok(!Number.isNaN(skinWeight[v * 4 + j])); }
        assert.ok(Math.abs(sum - 1) < 1e-5, `somme = ${sum}`);
    }
    const dominant = (v) => BONES[skinIndex[v * 4]].name;
    assert.equal(dominant(0), 'head');
    assert.ok(skinWeight[0] > 0.5, `poids tête = ${skinWeight[0]}`);
    assert.match(dominant(1), /spine|chest/);
    assert.equal(dominant(2), 'legFL_low');
    assert.match(dominant(3), /tail[456]/);
});

test('chaque articulation du squelette est à l\'intérieur du volume du chat', async () => {
    const { unionDistance } = await import('../js/cat/sdf.js');
    const shapes = buildCatShapes();
    for (const b of BONES) {
        const d = unionDistance(shapes, b.pos).d;
        assert.ok(d < 0, `${b.name} (${b.pos}) est hors du corps : d = ${d.toFixed(4)}`);
    }
});
