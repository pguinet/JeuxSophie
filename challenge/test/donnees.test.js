// Tests d'intégrité des banques de données (vocabulaire, grammaire, et la suite en Task 7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VOCAB, THEMES_VOCAB } from '../js/donnees/vocab.js';
import { GRAMMAIRE } from '../js/donnees/grammaire.js';

export function verifierQcm(items, min, nbThemes) {
    assert.ok(items.length >= min, `au moins ${min} questions (${items.length})`);
    for (const q of items) {
        assert.ok(q.question && q.bonne && q.theme, JSON.stringify(q));
        assert.equal(q.leurres.length, 3, q.question);
        const toutes = [q.bonne, ...q.leurres].map(s => s.toLowerCase());
        assert.equal(new Set(toutes).size, 4, `réponses distinctes : ${q.question}`);
    }
    assert.ok(new Set(items.map(q => q.theme)).size >= nbThemes);
}

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

test('grammaire : 60 QCM bien formés sur 10 thèmes', () => {
    verifierQcm(GRAMMAIRE, 60, 10);
});

test('grammaire : chaque question contient un trou', () => {
    for (const q of GRAMMAIRE) assert.ok(q.question.includes('_'), q.question);
});
