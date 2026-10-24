import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bots, pointsBot, classement, jourIndex, NB_BOTS } from '../js/classement.js';
import { lookValide } from '../js/avatar.js';

const profil = { pseudo: 'Sophie', look: {}, creeLe: '2026-10-24T10:00:00' };

test('30 joueurs inventés, uniques et stables', () => {
    const a = bots(), b = bots();
    assert.equal(a.length, NB_BOTS);
    assert.equal(NB_BOTS, 30);
    assert.equal(new Set(a.map(x => x.pseudo)).size, 30);
    assert.deepEqual(a, b);
    for (const x of a) {
        assert.deepEqual(lookValide(x.look), x.look);
        assert.ok(x.depart >= 50 && x.depart <= 4000);
    }
});

test('les points d\'un joueur inventé ne baissent jamais', () => {
    const bot = bots()[5];
    assert.equal(pointsBot(bot, 0), bot.depart);
    let avant = bot.depart;
    for (let j = 1; j <= 30; j++) {
        const p = pointsBot(bot, j);
        assert.ok(p >= avant);
        avant = p;
    }
    assert.ok(pointsBot(bot, 30) > bot.depart);
});

test('premier jour : Sophie à 0 point est dernière', () => {
    const lignes = classement(profil, 0, new Date('2026-10-24T18:00:00'));
    assert.equal(lignes.length, 31);
    assert.deepEqual(lignes.map(l => l.rang), Array.from({ length: 31 }, (_, i) => i + 1));
    assert.equal(lignes.filter(l => l.moi).length, 1);
    assert.equal(lignes.at(-1).moi, true);
    for (let i = 1; i < lignes.length; i++) assert.ok(lignes[i - 1].points >= lignes[i].points);
});

test('à égalité, Sophie passe devant', () => {
    const lignes = classement(profil, 0, new Date('2026-10-24T18:00:00'));
    const cible = lignes[10].points;
    const l2 = classement(profil, cible, new Date('2026-10-24T18:00:00'));
    const moi = l2.find(l => l.moi);
    const egal = l2.find(l => !l.moi && l.points === cible);
    assert.ok(moi.rang < egal.rang);
});

test('date de création dans le futur : comme le jour 0', () => {
    const futur = { ...profil, creeLe: '2030-01-01T00:00:00' };
    const a = classement(futur, 100, new Date('2026-10-24T18:00:00'));
    const b = classement(profil, 100, new Date('2026-10-24T18:00:00'));
    assert.deepEqual(a.map(l => l.points), b.map(l => l.points));
});

test('jourIndex change à minuit (heure locale)', () => {
    assert.equal(jourIndex(new Date(2026, 9, 25, 0, 1)) - jourIndex(new Date(2026, 9, 24, 23, 59)), 1);
});
