import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Nav } from '../js/nav.js';

const nav = new Nav({
    zones: [{ name: 'house', min: [-6.6, -2.1], max: [-1.4, 2.1] }, { name: 'garden', min: [-0.6, -7], max: [7, 7] }],
    obstacles: [{ type: 'circle', c: [4, 1.5], r: 1.2 }, { type: 'rect', min: [-5.2, -2.4], max: [-3.2, -1.6] }],
    door: { pos: [-1.0, 0], radius: 0.6, zones: ['house', 'garden'], dir: [1, 0] },
});

test('zones et obstacles', () => {
    assert.equal(nav.zoneAt([-3, 0]), 'house');
    assert.equal(nav.zoneAt([3, 3]), 'garden');
    assert.equal(nav.zoneAt([-1, 3]), null, 'mur');
    assert.ok(!nav.isWalkable([4, 1.5]), 'dans le bassin');
    assert.ok(!nav.isWalkable([-4, -2]), 'dans le canapé');
    assert.ok(nav.isWalkable([-1.0, 0.1]), 'sur le seuil de la porte');
    assert.ok(!nav.isWalkable([-1.0, 1.5]), 'dans le mur est hors porte');
});

test('randomPoint renvoie toujours un point praticable (déterministe)', () => {
    let seed = 1; const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 200; i++) assert.ok(nav.isWalkable(nav.randomPoint(rng)));
    for (let i = 0; i < 50; i++) assert.equal(nav.zoneAt(nav.randomPoint(rng, 'house')), 'house');
});

test('clamp bloque un pas dans un obstacle et renvoie la position précédente', () => {
    assert.deepEqual(nav.clamp([4, 1.5], [2, 1.5]), [2, 1.5]);
    assert.deepEqual(nav.clamp([2, 1.5], [1.9, 1.5]), [2, 1.5]);
});

test('route : passe par la porte pour changer de zone, direct sinon', () => {
    const r = nav.route([-4, 0], [3, 2]);
    assert.equal(r.length, 3);
    assert.ok(r[0][0] < -1.0 && r[1][0] > -1.0, 'jalons intérieur puis extérieur');
    assert.deepEqual(r[2], [3, 2]);
    const back = nav.route([3, 2], [-4, 0]);
    assert.ok(back[0][0] > -1.0 && back[1][0] < -1.0, 'dans l\'autre sens : extérieur puis intérieur');
    assert.deepEqual(nav.route([-4, 0], [-2, 1]), [[-2, 1]]);
});
