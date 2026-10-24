// Tests d'intégrité des banques de culture et de phrases.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CULTURE } from '../js/donnees/culture.js';
import { PHRASES } from '../js/donnees/phrases.js';
import { verifierQcm } from './outils-donnees.js';

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
