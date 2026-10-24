// Dessin de la montgolfière du pendu (fonction pure, sans DOM).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { svgMontgolfiere } from '../js/ui-pendu.js';
import { ERREURS_MAX } from '../js/partie.js';

test('montgolfière : un dessin différent pour chaque nombre d\'erreurs, sans NaN', () => {
    const dessins = [];
    for (let e = 0; e <= ERREURS_MAX; e++) {
        const svg = svgMontgolfiere(e);
        assert.match(svg, /^<svg [^>]*viewBox="0 0 200 220"/);
        assert.ok(svg.endsWith('</svg>'));
        assert.doesNotMatch(svg, /NaN|undefined/);
        dessins.push(svg);
    }
    assert.equal(new Set(dessins).size, ERREURS_MAX + 1);
});

test('montgolfière : bornée entre 0 et ERREURS_MAX', () => {
    assert.equal(svgMontgolfiere(-2), svgMontgolfiere(0));
    assert.equal(svgMontgolfiere(ERREURS_MAX + 3), svgMontgolfiere(ERREURS_MAX));
});
