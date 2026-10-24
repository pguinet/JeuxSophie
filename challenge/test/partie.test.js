// challenge/test/partie.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creerPartieQcm, repondre, suivante, tempsEcoule, resultat,
    creerPartiePhrases, placer, retirer, valider } from '../js/partie.js';

const q = (bonne) => ({ consigne: '?', choix: [0, 1, 2, 3].map(i => ({ texte: `r${i}`, juste: i === bonne })) });

test('une seule réponse comptée par question', () => {
    const e = creerPartieQcm([q(0), q(1)]);
    const r = repondre(e, 0, 1000);
    assert.equal(r.juste, true);
    assert.equal(repondre(e, 0, 1000), null);
    assert.equal(e.points, 15);
    suivante(e);
    assert.equal(e.index, 1);
});

test('série et points', () => {
    const e = creerPartieQcm([q(0), q(0), q(0), q(2)]);
    for (let i = 0; i < 3; i++) { repondre(e, 0, 1000); suivante(e); }
    assert.equal(e.points, 15 + 15 + 17);
    const r = repondre(e, 0, 1000);
    assert.equal(r.juste, false);
    assert.equal(r.bonneIndex, 2);
    assert.equal(e.serie, 0);
    suivante(e);
    assert.equal(e.terminee, true);
    assert.deepEqual(resultat(e), { bonnes: 3, repondues: 4, points: 47 });
});

test('chrono global', () => {
    const e = creerPartieQcm([q(0), q(0)], { duree: 60 });
    assert.equal(tempsEcoule(e, 59000), false);
    assert.equal(tempsEcoule(e, 60000), true);
    assert.equal(e.terminee, true);
});

test('phrases : placer, retirer, valider', () => {
    const e = creerPartiePhrases([{ consigne: 'x', mots: ['I', 'am', 'here'], melange: ['am', 'here', 'I'] }]);
    placer(e, 2); placer(e, 1);              // I here
    assert.deepEqual(e.reponse, ['I', 'here']);
    retirer(e, 1);                             // I
    placer(e, 0); placer(e, 1);              // I am here
    assert.deepEqual(valider(e), { juste: true, points: 10 });
    assert.equal(e.points, 10);
});

test('phrases : 2e essai 5 points, 3e essai révèle la solution', () => {
    const p = { consigne: 'x', mots: ['a', 'b', 'c'], melange: ['c', 'b', 'a'] };
    const e = creerPartiePhrases([p, p]);
    placer(e, 0); placer(e, 1); placer(e, 2);
    assert.equal(valider(e).juste, false);
    assert.deepEqual(e.reponse, []);          // on recommence
    placer(e, 2); placer(e, 1); placer(e, 0);
    assert.deepEqual(valider(e), { juste: true, points: 5 });
    suivante(e);
    placer(e, 0); placer(e, 1); placer(e, 2);
    valider(e);
    placer(e, 0); placer(e, 1); placer(e, 2);
    assert.deepEqual(valider(e), { juste: false, points: 0, solution: ['a', 'b', 'c'] });
});
