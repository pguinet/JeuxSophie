import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, createWallet, tickWallet, canBuy, buy } from '../js/shop-logic.js';

test('1 pièce par minute de jeu, reste conservé', () => {
    const w = createWallet();
    assert.equal(tickWallet(w, 59), 0); assert.equal(w.coins, 0);
    assert.equal(tickWallet(w, 2), 1); assert.equal(w.coins, 1);
    assert.equal(tickWallet(w, 180), 3); assert.equal(w.coins, 4);
});

test('achat : prix, pièces insuffisantes, objets uniques', () => {
    const w = createWallet(); w.coins = 100;
    assert.equal(canBuy(w, 'collar').ok, true);
    assert.equal(buy(w, 'collar').id, 'collar'); assert.equal(w.coins, 50);
    assert.deepEqual(canBuy(w, 'collar'), { ok: false, reason: 'déjà acheté' });
    assert.equal(buy(w, 'collar'), null);
    assert.equal(buy(w, 'fish').id, 'fish'); assert.equal(buy(w, 'fish').id, 'fish'); // consommable, rachetable
    assert.equal(w.coins, 20);
    assert.deepEqual(canBuy(w, 'cushion_lux'), { ok: false, reason: 'pas assez de pièces' });
    assert.equal(canBuy(w, 'licorne').ok, false);
    assert.equal(ITEMS.length, 6);
});
