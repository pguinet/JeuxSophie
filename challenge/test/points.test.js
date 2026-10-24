// challenge/test/points.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bonusVitesse, bonusSerie, pointsQuestion, pointsPhrase } from '../js/points.js';

test('bonus de vitesse : 5 jusqu\'à 3 s, 0 à partir de 10 s, linéaire entre', () => {
    assert.equal(bonusVitesse(0), 5);
    assert.equal(bonusVitesse(3000), 5);
    assert.equal(bonusVitesse(6500), 3);
    assert.equal(bonusVitesse(10000), 0);
    assert.equal(bonusVitesse(60000), 0);
});

test('bonus de série : +2 dès la 3e bonne réponse, plafonné à 10', () => {
    assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 20].map(bonusSerie), [0, 0, 2, 4, 6, 8, 10, 10]);
});

test('points d\'une question', () => {
    assert.equal(pointsQuestion({ juste: false, ms: 1000, serie: 5 }), 0);
    assert.equal(pointsQuestion({ juste: true, ms: 2000, serie: 1 }), 15);
    assert.equal(pointsQuestion({ juste: true, ms: 12000, serie: 1 }), 10);
    assert.equal(pointsQuestion({ juste: true, ms: 6500, serie: 1 }), 13);
    assert.equal(pointsQuestion({ juste: true, ms: 1000, serie: 4 }), 19);
});

test('points d\'une phrase selon l\'essai', () => {
    assert.deepEqual([1, 2, 3, 4].map(pointsPhrase), [10, 5, 0, 0]);
});
