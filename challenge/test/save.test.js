// challenge/test/save.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    CLE, charger, sauver, nouvelleSauvegarde, enregistrerPartie, validerPseudo, pointsDuJour,
} from '../js/save.js';
import { jourIndex } from '../js/jour.js';

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

test('nouvelle sauvegarde : points du jour à 0', () => {
    assert.deepEqual(nouvelleSauvegarde().jour, { index: 0, points: 0 });
    assert.equal(pointsDuJour(nouvelleSauvegarde(), new Date(2026, 9, 24, 12, 0)), 0);
});

test('points du jour : cumul dans la journée, remise à zéro le lendemain', () => {
    const matin = new Date(2026, 9, 24, 9, 0);
    const soir = new Date(2026, 9, 24, 21, 0);
    const lendemain = new Date(2026, 9, 25, 0, 5);
    const e1 = enregistrerPartie(nouvelleSauvegarde(), 'quiz', 120, matin);
    const e2 = enregistrerPartie(e1, 'quiz', 80, soir);
    assert.deepEqual(e2.jour, { index: jourIndex(matin), points: 200 });
    assert.equal(pointsDuJour(e2, soir), 200);
    assert.equal(pointsDuJour(e2, lendemain), 0);
    const e3 = enregistrerPartie(e2, 'image', 30, lendemain);
    assert.deepEqual(e3.jour, { index: jourIndex(lendemain), points: 30 });
    assert.equal(e3.total, 230);
});

test('sauvegarde v1 sans jour ou jour abîmé : 0 point du jour, sans erreur', () => {
    const t = new Date(2026, 9, 24, 12, 0);
    const e = charger(memoire({ [CLE]: '{"v":1,"total":500}' }));
    assert.deepEqual(e.jour, { index: 0, points: 0 });
    assert.equal(pointsDuJour(e, t), 0);
    const abime = charger(memoire({ [CLE]: '{"v":1,"jour":{"index":"x","points":null}}' }));
    assert.deepEqual(abime.jour, { index: 0, points: 0 });
    assert.deepEqual(charger(memoire({ [CLE]: '{"v":1,"jour":[1,2]}' })).jour, { index: 0, points: 0 });
    const ok = charger(memoire({ [CLE]: `{"v":1,"jour":{"index":${jourIndex(t)},"points":40}}` }));
    assert.equal(pointsDuJour(ok, t), 40);
    // Ancien état en mémoire sans champ jour : enregistrerPartie ne plante pas.
    const sansJour = nouvelleSauvegarde();
    delete sansJour.jour;
    assert.equal(enregistrerPartie(sansJour, 'quiz', 10, t).jour.points, 10);
    assert.equal(pointsDuJour(sansJour, t), 0);
});

test('fusées : absentes de la sauvegarde → état par défaut, abîmées → assainies', () => {
    assert.deepEqual(nouvelleSauvegarde().fusees, { maj: null, bonus: {}, bonusJour: { index: 0, parBot: {} } });
    const sans = charger(memoire({ [CLE]: '{"v":1,"total":500}' }));
    assert.deepEqual(sans.fusees, nouvelleSauvegarde().fusees);
    const brut = '{"v":1,"fusees":{"maj":"x","bonus":{"0":300,"1":-5,"2":"a","3":null},'
        + '"bonusJour":{"index":20385,"parBot":{"0":100,"4":1e400}}}}';
    const e = charger(memoire({ [CLE]: brut }));
    assert.deepEqual(e.fusees, { maj: null, bonus: { 0: 300 }, bonusJour: { index: 20385, parBot: { 0: 100 } } });
    assert.deepEqual(charger(memoire({ [CLE]: '{"v":1,"fusees":[1]}' })).fusees, nouvelleSauvegarde().fusees);
    const ok = { ...nouvelleSauvegarde(), fusees: { maj: 1761000000000, bonus: { 5: 1200 }, bonusJour: { index: 3, parBot: { 5: 200 } } } };
    const s = memoire();
    sauver(ok, s);
    assert.deepEqual(charger(s).fusees, ok.fusees);
});
