import { test } from 'node:test';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import {
    bots, pointsBot, pointsBotJour, gainJour, fractionJournee, classement, classementJour, jourIndex, NB_BOTS,
} from '../js/classement.js';
import { jourIndex as jourIndexPartage } from '../js/jour.js';
import { lookValide } from '../js/avatar.js';

const profil = { pseudo: 'Sophie', look: {}, creeLe: '2026-10-24T10:00:00' };

// Pseudos de la v1 (capturés avant l'ajout du classement du jour) : ils ne doivent pas changer.
const PSEUDOS_V1 = ['AliceWow', 'Louise_London', 'Emma_London', 'Nina_9', 'Noah', 'LéoCool', 'Lou2014',
    'Raphaël_78', 'JadeSmile', 'LinaStar', 'Adam_UK', 'GabrielWow', 'LucasCool', 'Liam42', 'Nathan_9',
    'Arthur_78', 'Sacha_UK', 'Inès_78', 'AnnaStar', 'HugoCool', 'Camille_9', 'Manon', 'EvaSmile', 'JulesPro',
    'Mia_9', 'Zoé_London', 'Maël2014', 'Rose42', 'Oscar_78', 'PaulStar'];
// Empreinte des looks de la v1 (contrôle que l'ordre des tirages est conservé).
const EMPREINTE_LOOKS_V1 = 'ae4949bbe657f8fe7eaa9f660d13c7f14c7c84c6';

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

test('pseudos inchangés par rapport à la v1', () => {
    assert.deepEqual(bots().map(b => b.pseudo), PSEUDOS_V1);
    const empreinte = createHash('sha1').update(JSON.stringify(bots().map(b => b.look))).digest('hex');
    assert.equal(empreinte, EMPREINTE_LOOKS_V1);
});

test('profils de joueurs : un tiers calmes, un tiers réguliers, un tiers forts', () => {
    const r = bots().map(b => b.rythme);
    assert.equal(r.filter(x => x >= 80 && x < 250).length, 10);
    assert.equal(r.filter(x => x >= 250 && x < 550).length, 10);
    assert.equal(r.filter(x => x >= 550 && x <= 900).length, 10);
});

test('gainJour : déterministe, parfois absent, jamais plus de 900', () => {
    const tous = [];
    for (const b of bots()) {
        for (let d = 20000; d < 20060; d++) {
            const g = gainJour(b, d);
            assert.equal(g, gainJour(b, d));
            assert.ok(Number.isInteger(g) && g >= 0 && g <= 900);
            tous.push(g);
        }
    }
    const absents = tous.filter(g => g === 0).length / tous.length;
    assert.ok(absents >= 0.1 && absents <= 0.3, `part d'absents : ${absents}`);
    assert.ok(Math.max(...tous) > 700);
});

test('fractionJournee : 0 à minuit, 0,5 à midi', () => {
    assert.equal(fractionJournee(new Date(2026, 9, 24, 0, 0)), 0);
    assert.equal(fractionJournee(new Date(2026, 9, 24, 12, 0)), 0.5);
    assert.ok(fractionJournee(new Date(2026, 9, 24, 23, 59)) < 1);
});

test('pointsBotJour monte pendant la journée et vaut 0 à minuit', () => {
    for (const b of bots()) {
        assert.equal(pointsBotJour(b, new Date(2026, 9, 24, 0, 0)), 0);
        const matin = pointsBotJour(b, new Date(2026, 9, 24, 8, 0));
        const soir = pointsBotJour(b, new Date(2026, 9, 24, 20, 0));
        assert.ok(matin <= soir);
    }
});

test('les points totaux d\'un joueur inventé ne baissent jamais', () => {
    const bot = bots()[5];
    const cree = profil.creeLe;
    assert.equal(pointsBot(bot, cree, new Date(2026, 9, 24, 0, 0)), bot.depart);
    let avant = bot.depart;
    for (let j = 0; j <= 30; j++) {
        for (const h of [0, 6, 12, 18, 23]) {
            const p = pointsBot(bot, cree, new Date(2026, 9, 24 + j, h, 30));
            assert.ok(p >= avant, `jour ${j} ${h} h`);
            avant = p;
        }
    }
    assert.ok(avant > bot.depart);
});

test('les points du jour s\'ajoutent au total', () => {
    const bot = bots()[3];
    const t = new Date(2026, 9, 26, 15, 0);
    const hier = pointsBot(bot, profil.creeLe, new Date(2026, 9, 25, 23, 59, 59, 999));
    const veille = gainJour(bot, jourIndex(new Date(2026, 9, 25)));
    const avantHier = gainJour(bot, jourIndex(new Date(2026, 9, 24)));
    assert.equal(pointsBot(bot, profil.creeLe, t), bot.depart + avantHier + veille + pointsBotJour(bot, t));
    assert.ok(hier <= bot.depart + avantHier + veille);
});

test('date de création future ou illisible : seulement le départ', () => {
    const bot = bots()[7];
    const t = new Date(2026, 9, 24, 18, 0);
    assert.equal(pointsBot(bot, '2030-01-01T00:00:00', t), bot.depart);
    assert.equal(pointsBot(bot, 'n\'importe quoi', t), bot.depart);
    assert.equal(pointsBot(bot, undefined, t), bot.depart);
});

test('classement total : forme, tri, Sophie unique', () => {
    const lignes = classement(profil, 0, new Date('2026-10-24T18:00:00'));
    assert.equal(lignes.length, 31);
    assert.deepEqual(lignes.map(l => l.rang), Array.from({ length: 31 }, (_, i) => i + 1));
    assert.equal(lignes.filter(l => l.moi).length, 1);
    assert.equal(lignes.at(-1).moi, true);
    for (let i = 1; i < lignes.length; i++) assert.ok(lignes[i - 1].points >= lignes[i].points);
    for (const l of lignes) assert.ok(Number.isFinite(l.points));
});

test('à égalité, Sophie passe devant', () => {
    const t = new Date('2026-10-24T18:00:00');
    const cible = classement(profil, 0, t)[10].points;
    const l2 = classement(profil, cible, t);
    const moi = l2.find(l => l.moi);
    const egal = l2.find(l => !l.moi && l.points === cible);
    assert.ok(moi.rang < egal.rang);
});

test('classementJour : points du jour, forme identique', () => {
    const t = new Date(2026, 9, 24, 20, 0);
    const lignes = classementJour(profil, 400, t);
    assert.equal(lignes.length, 31);
    assert.deepEqual(lignes.map(l => l.rang), Array.from({ length: 31 }, (_, i) => i + 1));
    assert.equal(lignes.find(l => l.moi).points, 400);
    const b = bots();
    for (const l of lignes.filter(x => !x.moi)) {
        const bot = b.find(x => x.pseudo === l.pseudo);
        assert.equal(l.points, pointsBotJour(bot, t));
    }
    for (let i = 1; i < lignes.length; i++) assert.ok(lignes[i - 1].points >= lignes[i].points);
});

test('classementJour à minuit : tout le monde à 0, Sophie première', () => {
    const lignes = classementJour(profil, 0, new Date(2026, 9, 25, 0, 0));
    assert.ok(lignes.every(l => l.points === 0));
    assert.equal(lignes[0].moi, true);
});

test('jourIndex change à minuit (heure locale) et vient du module partagé', () => {
    assert.equal(jourIndex(new Date(2026, 9, 25, 0, 1)) - jourIndex(new Date(2026, 9, 24, 23, 59)), 1);
    assert.equal(jourIndex, jourIndexPartage);
});
