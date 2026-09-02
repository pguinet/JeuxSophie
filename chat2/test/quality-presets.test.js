import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, PRESET_ORDER, detectPreset, adjustPreset, createFpsMeter } from '../js/quality-presets.js';

test('3 préréglages ordonnés, cohérents (les coûts croissent)', () => {
    assert.deepEqual(PRESET_ORDER, ['low', 'medium', 'high']);
    for (const k of PRESET_ORDER) assert.ok(PRESETS[k].shells > 0 && PRESETS[k].grassCount > 0);
    assert.ok(PRESETS.low.shells < PRESETS.medium.shells && PRESETS.medium.shells < PRESETS.high.shells);
    assert.ok(PRESETS.low.grassCount < PRESETS.medium.grassCount && PRESETS.medium.grassCount < PRESETS.high.grassCount);
    assert.ok(PRESETS.low.voxel >= PRESETS.medium.voxel && PRESETS.medium.voxel >= PRESETS.high.voxel);
});

test('détection : GPU intégré → moyen, dédié → élevé, logiciel/mobile → faible', () => {
    assert.equal(detectPreset({ renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics, D3D11)' }), 'medium');
    assert.equal(detectPreset({ renderer: 'ANGLE (NVIDIA GeForce RTX 3060)' }), 'high');
    assert.equal(detectPreset({ renderer: 'Google SwiftShader' }), 'low');
    assert.equal(detectPreset({ isMobile: true, renderer: 'Adreno 640' }), 'low');
    assert.equal(detectPreset({ renderer: 'Mystery GPU', deviceMemory: 2 }), 'low');
    assert.equal(detectPreset({}), 'medium');
});

test('ajustement : descend d\'un cran sous le seuil, jamais en dessous de faible, ne remonte pas', () => {
    assert.equal(adjustPreset('high', 25), 'medium');
    assert.equal(adjustPreset('medium', 25), 'low');
    assert.equal(adjustPreset('low', 10), 'low');
    assert.equal(adjustPreset('medium', 60), 'medium');
    assert.equal(adjustPreset('inconnu', 60), 'medium');
});

test('le compteur de FPS moyenne une fenêtre glissante et ignore les valeurs aberrantes', () => {
    const m = createFpsMeter(10);
    assert.equal(m.ready, false);
    for (let i = 0; i < 10; i++) m.push(1 / 50);
    assert.ok(m.ready);
    assert.ok(Math.abs(m.fps - 50) < 1e-6);
    m.push(5); m.push(-1);
    assert.ok(Math.abs(m.fps - 50) < 1e-6);
    for (let i = 0; i < 10; i++) m.push(1 / 25);
    assert.ok(Math.abs(m.fps - 25) < 1e-6);
});
