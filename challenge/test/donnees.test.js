// Tests d'intégrité des banques de données (vocabulaire, grammaire, culture, phrases).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VOCAB, THEMES_VOCAB } from '../js/donnees/vocab.js';
import { GRAMMAIRE } from '../js/donnees/grammaire.js';
import { CULTURE } from '../js/donnees/culture.js';
import { PHRASES } from '../js/donnees/phrases.js';

export function verifierQcm(items, min, nbThemes, themesPermis) {
    assert.ok(items.length >= min, `au moins ${min} questions (${items.length})`);
    for (const q of items) {
        assert.ok(q.question && q.bonne && q.theme, JSON.stringify(q));
        if (themesPermis) assert.ok(themesPermis.includes(q.theme), `thème inconnu : ${q.theme}`);
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

test('culture : 50 QCM bien formés sur 6 thèmes', () => {
    verifierQcm(CULTURE, 50, 6, ['uk', 'usa', 'londres', 'fetes', 'drapeaux', 'royaute', 'nourriture', 'pays']);
});

test('phrases : 40 phrases de 3 à 7 mots sans mot répété', () => {
    assert.ok(PHRASES.length >= 40, `${PHRASES.length} phrases`);
    for (const p of PHRASES) {
        assert.ok(p.fr, JSON.stringify(p));
        assert.match(p.en, /^[A-Z].*[.?!]$/, p.en);
        const mots = p.en.split(' ');
        assert.ok(mots.length >= 3 && mots.length <= 7, p.en);
        assert.equal(new Set(mots.map(m => m.toLowerCase())).size, mots.length, `mot répété : ${p.en}`);
    }
});
