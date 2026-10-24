// Tests d'intégrité des banques « vrai ou faux » et « contraires ».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VRAIFAUX } from '../js/donnees/vraifaux.js';
import { CONTRAIRES } from '../js/donnees/contraires.js';
import { verifierNiveaux } from './outils-donnees.js';

test('vrai ou faux : 120 affirmations, équilibrées, avec explication', () => {
    assert.ok(VRAIFAUX.length >= 120, `${VRAIFAUX.length} affirmations`);
    const vrais = VRAIFAUX.filter(v => v.vrai).length / VRAIFAUX.length;
    assert.ok(vrais >= 0.4 && vrais <= 0.6, `part de vrai ${vrais}`);
    assert.equal(new Set(VRAIFAUX.map(v => v.en.toLowerCase())).size, VRAIFAUX.length);
    for (const v of VRAIFAUX) {
        assert.match(v.en, /^[A-Z].*[.!]$/, v.en);
        assert.equal(typeof v.vrai, 'boolean', v.en);
        assert.ok(v.explication && v.explication.length <= 90, `explication (${v.explication?.length}) : ${v.en}`);
        assert.ok(!/usually|often|best|favourite/i.test(v.en), `pas d'opinion : ${v.en}`);
    }
    verifierNiveaux(VRAIFAUX, 'vrai ou faux');
});

test('contraires : 70 paires, mots uniques', () => {
    assert.ok(CONTRAIRES.length >= 70, `${CONTRAIRES.length} paires`);
    const mots = CONTRAIRES.flatMap(c => [c.a.toLowerCase(), c.b.toLowerCase()]);
    assert.equal(new Set(mots).size, mots.length);
    for (const c of CONTRAIRES) {
        assert.notEqual(c.a.toLowerCase(), c.b.toLowerCase());
        assert.ok(c.fr_a && c.fr_b, c.a);
    }
    verifierNiveaux(CONTRAIRES, 'contraires');
    for (const mot of ['expensive', 'open', 'win', 'inside']) {
        assert.ok(mots.includes(mot), `paire manquante : ${mot}`);
    }
});
