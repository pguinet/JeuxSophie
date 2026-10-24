// challenge/test/partie.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creerPartieQcm, repondre, suivante, tempsEcoule, resultat,
    creerPartiePhrases, placer, retirer, valider,
    creerPartieRelier, choisirGauche, choisirDroite,
    creerPartiePendu, proposer, masque,
    creerPartieLettres, taper, effacer } from '../js/partie.js';

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

test('survie : 3 vies, fin à 0', () => {
    const e = creerPartieQcm(Array.from({ length: 20 }, () => q(0)), { vies: 3 });
    assert.equal(e.vies, 3);
    assert.equal(repondre(e, 0, 1000).vies, 3); suivante(e);
    for (let i = 0; i < 3; i++) { repondre(e, 1, 1000); if (i < 2) suivante(e); }
    assert.equal(e.vies, 0);
    assert.equal(e.terminee, false);
    suivante(e);
    assert.equal(e.terminee, true);
    assert.equal(e.bonnes, 1);
});

test('sans vies : comportement v1', () => {
    const e = creerPartieQcm([q(0), q(0)]);
    assert.equal(e.vies, null);
    repondre(e, 1, 1000); suivante(e);
    assert.equal(e.terminee, false);
});

test('survie : questions épuisées avant 0 vie, fin comme en v1', () => {
    const e = creerPartieQcm([q(0), q(0)], { vies: 3 });
    repondre(e, 0, 1000); suivante(e);
    repondre(e, 1, 1000); suivante(e);
    assert.equal(e.vies, 2);
    assert.equal(e.terminee, true);
});

test('relier : 10 au 1er coup, 5 après une erreur, manche finie', () => {
    const manche = { paires: [{ en: 'dog', fr: 'chien' }, { en: 'cat', fr: 'chat' }],
        gauche: ['dog', 'cat'], droite: ['chat', 'chien'] };
    const e = creerPartieRelier([manche]);
    choisirGauche(e, 0);
    assert.deepEqual(choisirDroite(e, 0), { juste: false });   // dog-chat
    choisirGauche(e, 0);
    assert.deepEqual(choisirDroite(e, 1), { juste: true, points: 5 });
    choisirGauche(e, 1);
    assert.deepEqual(choisirDroite(e, 0), { juste: true, points: 10 });
    assert.equal(e.attente, true);
    assert.deepEqual(resultat(e), { bonnes: 1, repondues: 2, points: 15 });
    suivante(e);
    assert.equal(e.terminee, true);
});

test('pendu : casse, touches ignorées, espace et tiret visibles', () => {
    const e = creerPartiePendu([{ en: 'T-shirt', fr: 't-shirt' }, { en: 'ice cream', fr: 'glace' }]);
    assert.deepEqual(masque(e), ['_', '-', '_', '_', '_', '_', '_']);
    assert.equal(proposer(e, 'é'), 'ignoree');
    assert.equal(proposer(e, '3'), 'ignoree');
    assert.equal(proposer(e, 'T'), 'bonne');
    assert.equal(proposer(e, 't'), 'deja');
    assert.equal(e.erreurs, 0);
    for (const l of 'shir') proposer(e, l);
    assert.equal(e.attente, true);
    assert.equal(e.points, 10 + 2 * 7);
    suivante(e);
    assert.deepEqual(masque(e), ['_', '_', '_', ' ', '_', '_', '_', '_', '_']);
});

test('pendu : 7 erreurs = perdu', () => {
    const e = creerPartiePendu([{ en: 'cat', fr: 'chat' }]);
    for (const l of 'bdefghi') proposer(e, l);
    assert.equal(e.erreurs, 7);
    assert.equal(e.attente, true);
    assert.equal(e.points, 0);
    assert.equal(proposer(e, 'c'), 'ignoree');
});

test('lettres : lettres répétées interchangeables, erreurs', () => {
    const e = creerPartieLettres([{ en: 'apple', fr: 'pomme', melange: ['p', 'l', 'a', 'p', 'e'] }]);
    for (const i of [2, 3, 0, 1, 4]) taper(e, i);        // a p p l e (tuiles p échangées)
    assert.equal(e.points, 10);
    assert.equal(e.attente, true);
    const f = creerPartieLettres([{ en: 'cat', fr: 'chat', melange: ['t', 'a', 'c'] }]);
    taper(f, 0); taper(f, 1);
    effacer(f);
    assert.deepEqual(f.reponse, ['t']);
    assert.deepEqual(taper(f, 2), null);                 // 't','c' : le mot n'est pas encore complet, rien n'est jugé
    assert.deepEqual(taper(f, 1), { juste: false });     // t c a
    for (const i of [2, 1, 0]) taper(f, i);              // c a t
    assert.equal(f.points, 5);
});

test('relier : carte déjà appariée, index hors bornes, clic droit sans gauche = sans effet', () => {
    const manche = { paires: [{ en: 'dog', fr: 'chien' }, { en: 'cat', fr: 'chat' }],
        gauche: ['dog', 'cat'], droite: ['chat', 'chien'] };
    const e = creerPartieRelier([manche]);
    assert.equal(choisirDroite(e, 0), null);                       // pas de gauche choisie
    assert.deepEqual(resultat(e), { bonnes: 0, repondues: 0, points: 0 });
    assert.equal(choisirGauche(e, 5), null);                       // hors bornes
    choisirGauche(e, 0);
    assert.deepEqual(choisirDroite(e, 1), { juste: true, points: 10 });   // dog-chien
    choisirGauche(e, 1);
    assert.equal(choisirDroite(e, 1), null);                       // chien déjà apparié
    assert.equal(choisirDroite(e, 9), null);                       // hors bornes
    assert.equal(e.gaucheChoisie, 1);                              // sélection conservée
    assert.equal(e.ratees.length, 0);
    assert.deepEqual(choisirDroite(e, 0), { juste: true, points: 10 });
    assert.equal(e.points, 20);
});

test('relier : la manche suivante repart à zéro (erreurs et cartes utilisées)', () => {
    const m1 = { paires: [{ en: 'dog', fr: 'chien' }], gauche: ['dog'], droite: ['chat', 'chien'] };
    const m2 = { paires: [{ en: 'cat', fr: 'chat' }], gauche: ['cat'], droite: ['chat'] };
    const e = creerPartieRelier([m1, m2]);
    choisirGauche(e, 0);
    assert.deepEqual(choisirDroite(e, 0), { juste: false });
    choisirGauche(e, 0);                                           // la gauche est désélectionnée après une erreur
    assert.deepEqual(choisirDroite(e, 1), { juste: true, points: 5 });
    suivante(e);
    choisirGauche(e, 0);
    assert.deepEqual(choisirDroite(e, 0), { juste: true, points: 10 });   // pas 5 : erreur oubliée
    assert.deepEqual(resultat(e), { bonnes: 1, repondues: 2, points: 15 });
});

test('relier : après la dernière manche, aucune action ne lève d erreur', () => {
    const e = creerPartieRelier([{ paires: [{ en: 'dog', fr: 'chien' }], gauche: ['dog'], droite: ['chien'] }]);
    choisirGauche(e, 0); choisirDroite(e, 0); suivante(e);
    assert.equal(e.terminee, true);
    assert.equal(choisirGauche(e, 0), null);
    assert.equal(choisirDroite(e, 0), null);
});

test("pendu : apostrophe visible d'office, touche ignorée", () => {
    const e = creerPartiePendu([{ en: "o'clock", fr: 'heure pile' }]);
    assert.deepEqual(masque(e), ['_', "'", '_', '_', '_', '_', '_']);
    assert.equal(proposer(e, "'"), 'ignoree');
    assert.equal(proposer(e, 'o'), 'bonne');
    assert.deepEqual(masque(e), ['o', "'", '_', '_', 'o', '_', '_']);
});

test('pendu : après la dernière question, masque vide et touches ignorées', () => {
    const e = creerPartiePendu([{ en: 'cat', fr: 'chat' }]);
    for (const l of 'cat') proposer(e, l);
    suivante(e);
    assert.equal(e.terminee, true);
    assert.deepEqual(masque(e), []);
    assert.equal(proposer(e, 'a'), 'ignoree');
});

test('lettres : mot avec tiret, complétion sur les tuiles (pas sur la longueur de en)', () => {
    const e = creerPartieLettres([{ en: 'T-shirt', fr: 't-shirt', melange: ['t', 's', 'h', 'i', 'r', 't'] }]);
    for (const i of [0, 1, 2, 3, 4]) assert.equal(taper(e, i), null);
    assert.deepEqual(taper(e, 5), { juste: true, points: 10 });
    assert.equal(e.attente, true);
});

test('lettres : 3e erreur révèle la solution, 0 pt, attente', () => {
    const e = creerPartieLettres([{ en: 'cat', fr: 'chat', melange: ['t', 'a', 'c'] }]);
    taper(e, 0); taper(e, 1); assert.deepEqual(taper(e, 2), { juste: false });
    taper(e, 0); taper(e, 1); assert.deepEqual(taper(e, 2), { juste: false });
    taper(e, 0); taper(e, 1);
    assert.deepEqual(taper(e, 2), { juste: false, points: 0, solution: 'cat' });
    assert.equal(e.attente, true);
    assert.deepEqual(resultat(e), { bonnes: 0, repondues: 1, points: 0 });
});

test('lettres : erreurs et réponse repartent à zéro au mot suivant', () => {
    const e = creerPartieLettres([
        { en: 'cat', fr: 'chat', melange: ['t', 'a', 'c'] },
        { en: 'dog', fr: 'chien', melange: ['o', 'd', 'g'] }]);
    taper(e, 0); taper(e, 1); taper(e, 2);      // tac : faux
    suivante(e);
    assert.equal(e.erreursMot, 0);
    for (const i of [1, 0, 2]) taper(e, i);     // dog
    assert.equal(e.points, 10);
});

test('lettres : après la dernière question, aucune action ne lève d erreur', () => {
    const e = creerPartieLettres([{ en: 'cat', fr: 'chat', melange: ['t', 'a', 'c'] }]);
    for (const i of [2, 1, 0]) taper(e, i);
    suivante(e);
    assert.equal(e.terminee, true);
    assert.equal(taper(e, 0), null);
    assert.equal(effacer(e), null);
});
