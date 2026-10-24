import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joueursDepasses, phraseDepasses, rangTexte } from '../js/resultat.js';
import { classement } from '../js/classement.js';

const ligne = (pseudo, points, moi = false) => ({ pseudo, points, moi });
const ranger = lignes => [...lignes].sort((a, b) => b.points - a.points || Number(b.moi) - Number(a.moi))
    .map((l, i) => ({ ...l, rang: i + 1 }));

test('joueursDepasses : ceux qui étaient devant et sont maintenant derrière', () => {
    const bots = [ligne('Lucas_78', 300), ligne('Emma', 200), ligne('Hugo', 120), ligne('Zoé', 50)];
    const avant = ranger([...bots, ligne('Sophie', 100, true)]);
    const apres = ranger([...bots, ligne('Sophie', 250, true)]);
    assert.deepEqual(joueursDepasses(avant, apres), ['Emma', 'Hugo']);
});

test('joueursDepasses : personne si le rang ne change pas', () => {
    const bots = [ligne('A', 300), ligne('B', 50)];
    const avant = ranger([...bots, ligne('Sophie', 100, true)]);
    const apres = ranger([...bots, ligne('Sophie', 110, true)]);
    assert.deepEqual(joueursDepasses(avant, apres), []);
});

test('joueursDepasses : ignore un bot qui porte le même pseudo que Sophie', () => {
    const avant = ranger([ligne('Sophie', 200), ligne('Sophie', 100, true)]);
    const apres = ranger([ligne('Sophie', 200), ligne('Sophie', 300, true)]);
    assert.deepEqual(joueursDepasses(avant, apres), ['Sophie']);
});

test('joueursDepasses : fonctionne avec le vrai classement', () => {
    const profil = { pseudo: 'Sophie', look: {}, creeLe: '2026-10-24T10:00:00' };
    const jour = new Date('2026-10-24T12:00:00');
    const avant = classement(profil, 0, jour);
    const apres = classement(profil, 100000, jour);
    assert.equal(joueursDepasses(avant, apres).length, 30);
});

test('phraseDepasses : 3 noms au plus, puis « et N autres »', () => {
    assert.equal(phraseDepasses([]), '');
    assert.equal(phraseDepasses(['Lucas_78']), 'Tu as dépassé Lucas_78 !');
    assert.equal(phraseDepasses(['A', 'B']), 'Tu as dépassé A et B !');
    assert.equal(phraseDepasses(['A', 'B', 'C']), 'Tu as dépassé A, B et C !');
    assert.equal(phraseDepasses(['A', 'B', 'C', 'D']), 'Tu as dépassé A, B, C et 1 autre !');
    assert.equal(phraseDepasses(['A', 'B', 'C', 'D', 'E']), 'Tu as dépassé A, B, C et 2 autres !');
});

test('rangTexte : 1er puis 2e, 3e…', () => {
    assert.equal(rangTexte(1), '1ᵉʳ');
    assert.equal(rangTexte(2), '2ᵉ');
    assert.equal(rangTexte(12), '12ᵉ');
});
