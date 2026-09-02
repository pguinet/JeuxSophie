import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, serialize, deserialize, migrateV1, createStorage, SAVE_KEY, V1_KEY } from '../js/save.js';

test('aller-retour serialize/deserialize', () => {
    const s = createState('grey'); s.needs.hunger = 42.5; s.wallet.coins = 17; s.wallet.owned.push('collar'); s.name = 'Réglisse';
    const back = deserialize(serialize(s));
    assert.equal(back.coat, 'grey'); assert.equal(back.needs.hunger, 42.5); assert.equal(back.wallet.coins, 17);
    assert.deepEqual(back.wallet.owned, ['collar']); assert.equal(back.name, 'Réglisse'); assert.ok(back.savedAt > 0);
});

test('données invalides → null ou valeurs corrigées', () => {
    assert.equal(deserialize('pas du json'), null);
    assert.equal(deserialize(JSON.stringify({ version: 1 })), null);
    const s = deserialize(JSON.stringify({ version: 2, coat: 'licorne', needs: { hunger: 250, thirst: 'x' }, wallet: { coins: -5 } }));
    assert.equal(s.coat, 'tabby'); assert.equal(s.needs.hunger, 100); assert.equal(s.needs.thirst, 80); assert.equal(s.wallet.coins, 0);
});

test('migration v1 : couleur → robe, jauges, pièces', () => {
    const v1 = JSON.stringify({ color: 0x888888, needs: { hunger: 55, thirst: 60, happiness: 70, hygiene: 20, fatigue: 90 }, coins: 33, playTime: 1200, owned: ['ball'] });
    const s = migrateV1(v1);
    assert.equal(s.coat, 'grey'); assert.equal(s.needs.hygiene, 20); assert.equal(s.needs.fatigue, 90); assert.equal(s.wallet.coins, 33);
    assert.deepEqual(s.wallet.owned, ['ball']);
    // Jauges au format { value } (au cas où) et champs absents
    const s2 = migrateV1(JSON.stringify({ needs: { hunger: { value: 12 } } }));
    assert.equal(s2.needs.hunger, 12); assert.equal(s2.coat, 'tabby'); assert.equal(s2.wallet.coins, 0);
    assert.equal(migrateV1('{'), null);
});

test('façade de stockage : sauvegarde, détection et lecture v1', () => {
    const mem = new Map();
    const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
    const st = createStorage(storage);
    assert.equal(st.load(), null); assert.equal(st.hasV1(), false);
    assert.ok(st.save(createState('white')));
    assert.equal(st.load().coat, 'white');
    mem.set(V1_KEY, JSON.stringify({ color: 0xe87e24, coins: 5 }));
    assert.ok(st.hasV1()); assert.equal(st.loadV1().coat, 'tabby'); assert.equal(st.loadV1().wallet.coins, 5);
    st.clear(); assert.equal(mem.has(SAVE_KEY), false);
});
