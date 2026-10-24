// Tests d'intégrité de la banque de vocabulaire (v2 : niveaux, thèmes).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VOCAB, THEMES_VOCAB } from '../js/donnees/vocab.js';

test('vocabulaire v2 : volume, thèmes, niveaux', () => {
    assert.ok(VOCAB.length >= 450, `${VOCAB.length} mots`);
    assert.ok(THEMES_VOCAB.length >= 20);
    for (const t of ['metiers', 'sentiments', 'ville', 'nature', 'verbes', 'adjectifs', 'cuisine']) {
        assert.ok(THEMES_VOCAB.includes(t), t);
    }
    assert.equal(new Set(VOCAB.map(m => m.en.toLowerCase())).size, VOCAB.length);
    for (const m of VOCAB) {
        assert.ok(m.en && m.fr && m.emoji && THEMES_VOCAB.includes(m.theme), JSON.stringify(m));
        assert.ok([1, 2, 3].includes(m.niveau), JSON.stringify(m));
        assert.equal(typeof m.image, 'boolean');
        assert.ok(!/^to /.test(m.en), m.en);
    }
    const part = n => VOCAB.filter(m => m.niveau === n).length / VOCAB.length;
    assert.ok(part(3) >= 0.3 && part(2) >= 0.35, `${part(2)} / ${part(3)}`);
    for (const t of THEMES_VOCAB) {
        const fr = VOCAB.filter(m => m.theme === t).map(m => m.fr.toLowerCase());
        assert.equal(new Set(fr).size, fr.length, `fr en double dans ${t}`);
    }
});

test('vocabulaire v2 : images', () => {
    const images = VOCAB.filter(m => m.image);
    assert.equal(new Set(images.map(m => m.emoji)).size, images.length);
    for (const t of THEMES_VOCAB.filter(x => !['verbes', 'adjectifs'].includes(x))) {
        assert.ok(images.filter(m => m.theme === t).length >= 4, `thème ${t}`);
    }
});
