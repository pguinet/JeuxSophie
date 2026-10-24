// Tests d'intégrité des banques de culture et de phrases (v2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CULTURE, THEMES_CULTURE } from '../js/donnees/culture.js';
import { PHRASES } from '../js/donnees/phrases.js';
import { verifierQcm, verifierNiveaux } from './outils-donnees.js';

test('culture : au moins 110 QCM bien formés sur 10 thèmes', () => {
    verifierQcm(CULTURE, 110, 10, THEMES_CULTURE);
});

test('culture : niveaux (35 % de niveau 3) et réponses courtes', () => {
    verifierNiveaux(CULTURE, 'culture');
    for (const q of CULTURE) {
        for (const r of [q.bonne, ...q.leurres]) {
            assert.ok(r.length <= 28, `réponse trop longue (${r.length}) : ${r}`);
        }
    }
    const questions = CULTURE.map(q => q.question);
    assert.equal(new Set(questions).size, questions.length, 'questions uniques');
});

test('phrases : au moins 100 phrases de 3 à 9 mots sans mot répété', () => {
    assert.ok(PHRASES.length >= 100, `${PHRASES.length} phrases`);
    for (const p of PHRASES) {
        assert.ok(p.fr, JSON.stringify(p));
        assert.match(p.en, /^[A-Z].*[.?!]$/, p.en);
        const mots = p.en.split(' ');
        assert.ok(mots.length >= 3 && mots.length <= 9, p.en);
        assert.equal(new Set(mots.map(m => m.toLowerCase())).size, mots.length, `mot répété : ${p.en}`);
    }
});

test('phrases : traductions et phrases uniques, niveaux, phrases longues', () => {
    verifierNiveaux(PHRASES, 'phrases');
    const fr = PHRASES.map(p => p.fr);
    assert.equal(new Set(fr).size, fr.length, 'fr uniques');
    const en = PHRASES.map(p => p.en);
    assert.equal(new Set(en).size, en.length, 'en uniques');
    const longues = PHRASES.filter(p => p.en.split(' ').length >= 6);
    assert.ok(longues.length >= 40, `${longues.length} phrases de 6 mots ou plus`);
});

test('phrases : passé, questions et comparatifs présents', () => {
    assert.ok(PHRASES.some(p => /\b(did|was|were|went|bought|lost|saw|made|wrote|built)\b/.test(p.en)), 'passé');
    assert.ok(PHRASES.filter(p => p.en.endsWith('?')).length >= 10, 'questions');
    assert.ok(PHRASES.some(p => /\bthan\b/.test(p.en)), 'comparatifs');
});
