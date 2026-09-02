import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNeeds, tickNeeds, applyAction, applyEffect, mood, wellbeing, NEED_KEYS, needLevel } from '../js/needs.js';

test('valeurs initiales et taux : après 60 s la faim a baissé de 1, la fatigue monté de 0,7', () => {
    const n = createNeeds();
    assert.equal(n.hunger, 80); assert.equal(n.fatigue, 20);
    tickNeeds(n, 60);
    assert.ok(Math.abs(n.hunger - 79) < 1e-9);
    assert.ok(Math.abs(n.fatigue - 20.7) < 1e-9);
    assert.ok(Math.abs(n.thirst - 78.5) < 1e-9);
});

test('les jauges restent bornées à [0, 100]', () => {
    const n = createNeeds();
    tickNeeds(n, 1e6);
    assert.equal(n.hunger, 0); assert.equal(n.fatigue, 100);
    applyAction(n, 'feed'); applyAction(n, 'feed'); applyAction(n, 'feed'); applyAction(n, 'feed');
    assert.equal(n.hunger, 100);
});

test('actions : effets attendus et liste des jauges modifiées', () => {
    const n = createNeeds();
    assert.deepEqual(applyAction(n, 'sleep'), ['fatigue', 'happiness']);
    assert.equal(n.fatigue, 0);
    assert.equal(n.happiness, 82);
    applyAction(n, 'wash'); assert.equal(n.hygiene, 100);
    assert.throws(() => applyAction(n, 'danser'));
    applyEffect(n, { hunger: 40, inconnu: 5 }); assert.equal(n.hunger, 100);
});

test('humeur et bien-être', () => {
    const n = createNeeds();
    assert.equal(mood(n), 'happy');
    assert.ok(Math.abs(wellbeing(n) - 80) < 1e-9);
    n.fatigue = 90; assert.equal(mood(n), 'sleepy');
    n.fatigue = 20; n.hunger = 10; assert.equal(mood(n), 'hungry');
    n.hunger = 80; n.happiness = 10; assert.equal(mood(n), 'sad');
    assert.equal(NEED_KEYS.length, 5);
    assert.equal(needLevel('fatigue', 100), 0); assert.equal(needLevel('hunger', 100), 1);
});
