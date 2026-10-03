// Tests de la sauvegarde du personnage (shared/avatar.js, sans Three.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_AVATAR, migrerAvatar, OUTFIT_BY_GENDER } from '../avatar.js';

test('un nouveau personnage porte la tenue noire', () => {
    const e = migrerAvatar(null);
    assert.equal(e.outfit, 'moulant');
    assert.equal(e.outfitColor, '#212529');
    assert.equal(e.v, 2);
});

test('une ancienne sauvegarde passe une fois à la tenue noire, sans perdre le reste', () => {
    const e = migrerAvatar({ gender: 'fille', hairStyle: 'couettes', outfit: 'robe', outfitColor: '#e84aa0' });
    assert.equal(e.outfit, 'moulant');
    assert.equal(e.outfitColor, '#212529');
    assert.equal(e.hairStyle, 'couettes');
});

test('après la migration, les choix de Sophie sont gardés', () => {
    const e = migrerAvatar({ ...DEFAULT_AVATAR, outfit: 'robe', outfitColor: '#4dabf7', v: 2 });
    assert.equal(e.outfit, 'robe');
    assert.equal(e.outfitColor, '#4dabf7');
});

test('la tenue noire existe pour les filles et pour les garçons', () => {
    assert.ok(OUTFIT_BY_GENDER.fille.includes('moulant') && OUTFIT_BY_GENDER.garcon.includes('moulant'));
});
