// Tests d'intégrité des banques de grammaire et de pièges.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRAMMAIRE } from '../js/donnees/grammaire.js';
import { PIEGES } from '../js/donnees/pieges.js';
import { verifierQcm, verifierNiveaux } from './outils-donnees.js';

const THEMES_NOUVEAUX = ['passé be', 'passé réguliers', 'passé irréguliers', 'did', 'comparatifs', 'superlatifs',
    'going to', 'must', 'some/any', 'much/many', 'présent ou -ing', 'there was/were', 'could',
    'pronoms compléments', 'whose', 'prépositions de temps'];

// Aucune question en double dans une banque.
function verifierSansDoublon(items, nom) {
    const vues = new Set();
    for (const q of items) {
        assert.ok(!vues.has(q.question), `${nom} : question en double : ${q.question}`);
        vues.add(q.question);
    }
}

test('grammaire v2 : 220 QCM, 24 thèmes, niveaux, un seul trou', () => {
    verifierQcm(GRAMMAIRE, 220, 24);
    verifierNiveaux(GRAMMAIRE, 'grammaire');
    verifierSansDoublon(GRAMMAIRE, 'grammaire');
    for (const t of THEMES_NOUVEAUX) assert.ok(GRAMMAIRE.some(q => q.theme === t), t);
    for (const q of GRAMMAIRE) assert.equal(q.question.split('_').length - 1, 1, q.question);
});

test('grammaire : chaque thème a au moins 4 questions', () => {
    const parTheme = new Map();
    for (const q of GRAMMAIRE) parTheme.set(q.theme, (parTheme.get(q.theme) ?? 0) + 1);
    for (const [t, n] of parTheme) assert.ok(n >= 4, `${t} : ${n}`);
});

test('pièges : 80 QCM, 15 thèmes, niveaux', () => {
    verifierQcm(PIEGES, 80, 15);
    verifierNiveaux(PIEGES, 'pièges');
    verifierSansDoublon(PIEGES, 'pièges');
});

test('pièges : un trou unique, sauf les questions posées en français', () => {
    for (const q of PIEGES) {
        const trous = q.question.split('_').length - 1;
        if (trous === 0) assert.ok(q.question.includes('?') || q.question.includes('«'), q.question);
        else assert.equal(trous, 1, q.question);
    }
});
