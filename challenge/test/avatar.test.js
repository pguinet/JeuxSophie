// challenge/test/avatar.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COIFFURES, PEAUX, CHEVEUX, HABITS, FONDS, LOOK_DEFAUT,
    avatarSVG, lookAleatoire, lookValide } from '../js/avatar.js';
import { mulberry32 } from '../js/rng.js';

const HEX = /^#[0-9a-f]{6}$/i;

test('12 coiffures : 6 filles et 6 garçons, ids uniques', () => {
    assert.equal(COIFFURES.length, 12);
    assert.equal(COIFFURES.filter(c => c.genre === 'fille').length, 6);
    assert.equal(COIFFURES.filter(c => c.genre === 'garcon').length, 6);
    assert.equal(new Set(COIFFURES.map(c => c.id)).size, 12);
    for (const c of COIFFURES) assert.ok(c.nom && typeof c.arriere === 'string' && typeof c.avant === 'string');
});

test('palettes assez fournies, couleurs hexadécimales', () => {
    for (const [pal, min] of [[PEAUX, 10], [CHEVEUX, 12], [HABITS, 12], [FONDS, 8]]) {
        assert.ok(pal.length >= min);
        assert.equal(new Set(pal.map(p => p.id)).size, pal.length);
        for (const p of pal) assert.match(p.couleur, HEX);
    }
});

test('avatarSVG dessine un SVG avec la peau choisie', () => {
    const peau = PEAUX[3];
    const svg = avatarSVG({ ...LOOK_DEFAUT, peau: peau.id });
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.trim().endsWith('</svg>'));
    assert.ok(svg.includes('viewBox="0 0 200 270"'));
    assert.ok(svg.includes(peau.couleur));
});

test('ids inconnus : valeurs par défaut, pas d\'erreur', () => {
    const v = lookValide({ peau: 'inconnu', coiffure: 'zzz' });
    assert.deepEqual(v, LOOK_DEFAUT);
    const svg = avatarSVG({ peau: 'inconnu', coiffure: 'zzz' });
    assert.ok(svg.includes(PEAUX.find(p => p.id === LOOK_DEFAUT.peau).couleur));
    assert.doesNotThrow(() => avatarSVG(null));
});

test('lookAleatoire : ids existants et déterministe', () => {
    const a = lookAleatoire(mulberry32(3)), b = lookAleatoire(mulberry32(3));
    assert.deepEqual(a, b);
    assert.deepEqual(lookValide(a), a);
});

test('la taille demandée est reportée sur le SVG', () => {
    assert.ok(avatarSVG(LOOK_DEFAUT, { taille: 48 }).includes('height="48"'));
});
