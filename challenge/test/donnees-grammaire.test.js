// Tests d'intégrité de la banque de grammaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRAMMAIRE } from '../js/donnees/grammaire.js';
import { verifierQcm } from './outils-donnees.js';

test('grammaire : 60 QCM bien formés sur 10 thèmes', () => {
    verifierQcm(GRAMMAIRE, 60, 10);
});

test('grammaire : chaque question contient un trou', () => {
    for (const q of GRAMMAIRE) assert.ok(q.question.includes('_'), q.question);
});
