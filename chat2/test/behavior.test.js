import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBehavior, stepBehavior, requestAction, chooseAutonomous } from '../js/cat/behavior.js';

const spots = {
    bowl: [1, 0], water: [1, 0.3], bed: [-1, -1], litter: [-1, 1],
    randomPoint: () => [0.5, 0.5],
    clamp: (p) => [Math.max(-2, Math.min(2, p[0])), Math.max(-2, Math.min(2, p[1]))],
};
const okNeeds = { hunger: 80, thirst: 80, happiness: 80, hygiene: 80, fatigue: 20 };
const seq = (values) => { let i = 0; return () => values[i++ % values.length]; };

test('faim basse → va à la gamelle puis mange', () => {
    const b = createBehavior(0, 0);
    const t = chooseAutonomous(b, { ...okNeeds, hunger: 10 }, seq([0.1, 0.5]), spots);
    assert.equal(t.state, 'goto'); assert.deepEqual(t.target, spots.bowl); assert.equal(t.next, 'eat');
});

test('fatigue haute → va dormir au panier', () => {
    const t = chooseAutonomous(createBehavior(), { ...okNeeds, fatigue: 90 }, seq([0.1]), spots);
    assert.equal(t.next, 'sleep'); assert.deepEqual(t.target, spots.bed);
});

test('le chat marche vers sa cible, s\'oriente et arrive', () => {
    const b = createBehavior(0, 0);
    requestAction(b, 'eat', spots);
    assert.equal(b.state, 'goto');
    let arrived = false, steps = 0;
    while (!arrived && steps < 2000) { stepBehavior(b, okNeeds, 1 / 60, seq([0.5]), spots); steps++; if (b.state === 'eat') arrived = true; }
    assert.ok(arrived, 'arrive à la gamelle');
    assert.ok(Math.hypot(b.pos[0] - 1, b.pos[1]) < 0.05, `position ${b.pos}`);
    assert.ok(Math.abs(b.heading - Math.PI / 2) < 0.3, `cap ${b.heading} (doit regarder vers +x)`);
    assert.ok(steps / 60 > 2 && steps / 60 < 6, `durée ${steps / 60}s plausible pour 1 m`);
});

test('après un état à durée, il choisit un nouvel état', () => {
    const b = createBehavior(0, 0);
    requestAction(b, 'pet', spots);
    assert.equal(b.state, 'pet');
    for (let i = 0; i < 60 * 4.5; i++) stepBehavior(b, okNeeds, 1 / 60, seq([0.9]), spots);
    assert.notEqual(b.state, 'pet');
});

test('action déjà sur place : pas de déplacement', () => {
    const b = createBehavior(1, 0);
    requestAction(b, 'eat', spots);
    assert.equal(b.state, 'eat');
});

test('un déplacement bloqué par les limites se termine proprement', () => {
    const b = createBehavior(1.95, 0);
    b.state = 'wander'; b.target = [5, 0]; b.heading = Math.PI / 2;
    for (let i = 0; i < 120; i++) stepBehavior(b, okNeeds, 1 / 60, seq([0.5]), spots);
    assert.ok(b.pos[0] <= 2.0001);
    assert.notEqual(b.state, 'wander');
});
