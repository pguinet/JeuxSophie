// challenge/test/save.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLE, charger, sauver, nouvelleSauvegarde, enregistrerPartie, validerPseudo } from '../js/save.js';

function memoire(init = {}) {
    const m = new Map(Object.entries(init));
    return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

test('sauvegardes absentes ou abîmées → nouveau compte', () => {
    assert.deepEqual(charger(memoire()), nouvelleSauvegarde());
    assert.deepEqual(charger(memoire({ [CLE]: '{pas du json' })), nouvelleSauvegarde());
    assert.deepEqual(charger(memoire({ [CLE]: '{"v":7}' })), nouvelleSauvegarde());
    assert.deepEqual(charger(memoire({ [CLE]: 'null' })), nouvelleSauvegarde());
    assert.deepEqual(charger({ getItem() { throw new Error('bloqué'); } }), nouvelleSauvegarde());
});

test('sauvegarde partielle complétée, profil invalide écarté', () => {
    const e = charger(memoire({ [CLE]: '{"v":1,"total":50,"profil":{"look":{}}}' }));
    assert.equal(e.total, 50);
    assert.deepEqual(e.meilleurs, {});
    assert.equal(e.profil, null);
});

test('aller-retour sauver/charger', () => {
    const s = memoire();
    const e = { ...nouvelleSauvegarde(), profil: { pseudo: 'Sophie', look: { peau: 'p3' }, creeLe: '2026-10-24T10:00:00.000Z' }, total: 42 };
    sauver(e, s);
    assert.deepEqual(charger(s), e);
    assert.doesNotThrow(() => sauver(e, { setItem() { throw new Error('plein'); } }));
});

test('enregistrerPartie cumule et garde le meilleur score', () => {
    const e0 = nouvelleSauvegarde();
    const e1 = enregistrerPartie(e0, 'quiz', 120);
    const e2 = enregistrerPartie(e1, 'quiz', 80);
    assert.equal(e0.total, 0);
    assert.equal(e2.total, 200);
    assert.equal(e2.parties, 2);
    assert.equal(e2.meilleurs.quiz, 120);
});

test('validerPseudo', () => {
    assert.equal(validerPseudo('  Sophie  '), 'Sophie');
    assert.equal(validerPseudo(''), null);
    assert.equal(validerPseudo('   '), null);
    assert.equal(validerPseudo('a'.repeat(16)), 'a'.repeat(16));
    assert.equal(validerPseudo('a'.repeat(17)), null);
});

test('charger assainit parties, meilleurs et muet', () => {
    const brut = '{"v":1,"parties":"x","muet":"oui","meilleurs":{"quiz":120,"image":"a","course":null}}';
    const e = charger(memoire({ [CLE]: brut }));
    assert.equal(e.parties, 0);
    assert.equal(e.muet, false);
    assert.deepEqual(e.meilleurs, { quiz: 120 });
    assert.deepEqual(charger(memoire({ [CLE]: '{"v":1,"meilleurs":[5,6]}' })).meilleurs, {});
    assert.equal(charger(memoire({ [CLE]: '{"v":1,"muet":true}' })).muet, true);
});
