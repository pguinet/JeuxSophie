import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, hashString, pick, shuffle, sample } from '../js/rng.js';

test('mulberry32 est déterministe et dans [0, 1)', () => {
    const a = mulberry32(42), b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
        const x = a();
        assert.equal(x, b());
        assert.ok(x >= 0 && x < 1);
    }
});

test('hashString distingue les chaînes et rend un entier non signé', () => {
    assert.notEqual(hashString('a'), hashString('b'));
    const h = hashString('Sophie');
    assert.ok(Number.isInteger(h) && h >= 0 && h < 2 ** 32);
});

test('shuffle garde les éléments sans toucher l\'entrée', () => {
    const src = [1, 2, 3, 4, 5, 6];
    const out = shuffle(src, mulberry32(1));
    assert.deepEqual(src, [1, 2, 3, 4, 5, 6]);
    assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5, 6]);
});

test('sample rend n éléments distincts, pick un élément du tableau', () => {
    const rng = mulberry32(7);
    const s = sample([...'abcdefgh'], 4, rng);
    assert.equal(s.length, 4);
    assert.equal(new Set(s).size, 4);
    assert.ok('abc'.includes(pick(['a', 'b', 'c'], rng)));
});
