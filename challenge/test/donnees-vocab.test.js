// Tests d'intégrité de la banque de vocabulaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VOCAB, THEMES_VOCAB } from '../js/donnees/vocab.js';

test('vocabulaire : 150 mots, uniques, thèmes connus', () => {
    assert.ok(VOCAB.length >= 150, `${VOCAB.length} mots`);
    assert.equal(new Set(VOCAB.map(m => m.en.toLowerCase())).size, VOCAB.length);
    for (const m of VOCAB) {
        assert.ok(m.en && m.fr && m.emoji, JSON.stringify(m));
        assert.ok(THEMES_VOCAB.includes(m.theme), m.theme);
        assert.equal(typeof m.image, 'boolean');
    }
});

test('vocabulaire : ≥ 4 images par thème, emojis d\'image uniques', () => {
    const images = VOCAB.filter(m => m.image);
    assert.equal(new Set(images.map(m => m.emoji)).size, images.length);
    for (const t of THEMES_VOCAB) {
        assert.ok(images.filter(m => m.theme === t).length >= 4, `thème ${t}`);
    }
});
