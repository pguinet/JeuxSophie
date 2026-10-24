import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tirerParNiveau, distanceEdition, leurresProches, POIDS_DEFAUT } from '../js/tirage.js';
import { mulberry32 } from '../js/rng.js';

const banque = Array.from({ length: 90 }, (_, i) => ({ id: i, niveau: 1 + (i % 3) }));

test('tirerParNiveau : distincts, bonne taille, favorise les niveaux 2 et 3', () => {
    const rng = mulberry32(5);
    let n1 = 0, total = 0;
    for (let k = 0; k < 2000; k++) {
        const t = tirerParNiveau(banque, 10, rng);
        assert.equal(t.length, 10);
        assert.equal(new Set(t.map(x => x.id)).size, 10);
        n1 += t.filter(x => x.niveau === 1).length;
        total += t.length;
    }
    assert.ok(n1 / total < 0.3, `part niveau 1 = ${n1 / total}`);
    assert.deepEqual(POIDS_DEFAUT, { 1: 0.2, 2: 0.45, 3: 0.35 });
});

test('tirerParNiveau : n > taille, niveau absent', () => {
    const petite = [{ id: 1, niveau: 1 }, { id: 2, niveau: 1 }];
    assert.equal(tirerParNiveau(petite, 5, mulberry32(1)).length, 2);
    assert.equal(tirerParNiveau(petite, 2, mulberry32(1)).length, 2);
    assert.deepEqual(tirerParNiveau([], 3, mulberry32(1)), []);
});

test('tirerParNiveau : déterministe', () => {
    assert.deepEqual(tirerParNiveau(banque, 8, mulberry32(3)), tirerParNiveau(banque, 8, mulberry32(3)));
});

test('distanceEdition', () => {
    assert.equal(distanceEdition('bread', 'beard'), 2);
    assert.equal(distanceEdition('cat', 'cat'), 0);
    assert.equal(distanceEdition('', 'abc'), 3);
    assert.equal(distanceEdition('kitten', 'sitting'), 3);
});

const vocab = [
    { en: 'bread', fr: 'pain', emoji: '🍞', theme: 'nourriture', niveau: 1 },
    { en: 'beard', fr: 'barbe', emoji: '🧔', theme: 'corps', niveau: 2 },
    { en: 'cheese', fr: 'fromage', emoji: '🧀', theme: 'nourriture', niveau: 1 },
    { en: 'butter', fr: 'beurre', emoji: '🧈', theme: 'nourriture', niveau: 2 },
    { en: 'flour', fr: 'farine', emoji: '🌾', theme: 'nourriture', niveau: 3 },
    { en: 'Bread', fr: 'pain de mie', emoji: '🥪', theme: 'nourriture', niveau: 2 },
    { en: 'toast', fr: 'pain', emoji: '🍞', theme: 'nourriture', niveau: 2 },
    { en: 'dog', fr: 'chien', emoji: '🐶', theme: 'animaux', niveau: 1 },
];

test('leurresProches : 3 leurres distincts, jamais une autre « bonne réponse »', () => {
    for (let g = 1; g <= 50; g++) {
        const l = leurresProches(vocab[0], vocab, 3, mulberry32(g));
        assert.equal(l.length, 3);
        assert.equal(new Set(l.map(m => m.en.toLowerCase())).size, 3);
        for (const m of l) {
            assert.notEqual(m.en.toLowerCase(), 'bread');
            assert.notEqual(m.fr, 'pain');
            assert.notEqual(m.emoji, '🍞');
        }
        assert.ok(l.filter(m => m.theme === 'nourriture').length >= 2);
    }
});
