// challenge/test/fusees.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    instantsFusees, estPeriodeFusee, avancerFusees, nouvellesFusees, GAIN_FUSEE,
} from '../js/fusees.js';
import { bots, pointsBot, classement, classementJour } from '../js/classement.js';
import { jourIndex } from '../js/jour.js';

const t = (j, h, m, s = 0) => new Date(2026, 9, j, h, m, s).getTime();
const profil = { pseudo: 'Sophie', look: {}, creeLe: new Date(2026, 9, 24, 17, 0).toISOString() };

// Nombre total de points fusées reçus par tous les joueurs.
const somme = o => Object.values(o).reduce((a, b) => a + b, 0);

test('instantsFusees : 10 gains par période, aux minutes rondes', () => {
    const l = instantsFusees(t(24, 17, 0) - 1, t(24, 17, 59, 59));
    assert.equal(l.length, 20);
    assert.equal(l[0], t(24, 17, 0));
    assert.equal(l[9], t(24, 17, 9));
    assert.equal(l[10], t(24, 17, 30));
    assert.equal(l[19], t(24, 17, 39));
    // Intervalle ]depuis, jusqua] : la borne de gauche est exclue, celle de droite incluse.
    assert.deepEqual(instantsFusees(t(24, 17, 0), t(24, 17, 2)), [t(24, 17, 1), t(24, 17, 2)]);
    assert.deepEqual(instantsFusees(t(24, 17, 10), t(24, 17, 29, 59)), []);
    assert.equal(instantsFusees(t(24, 0, 0), t(25, 0, 0)).length, 480);
    assert.deepEqual(instantsFusees(t(24, 18, 0), t(24, 17, 0)), []);
});

test('instantsFusees : jamais avant le début donné', () => {
    const l = instantsFusees(t(24, 17, 0) - 1, t(24, 17, 9), t(24, 17, 5));
    assert.deepEqual(l, [t(24, 17, 5), t(24, 17, 6), t(24, 17, 7), t(24, 17, 8), t(24, 17, 9)]);
});

test('estPeriodeFusee : hh:00–hh:10 et hh:30–hh:40', () => {
    assert.equal(estPeriodeFusee(new Date(t(24, 17, 30))), true);
    assert.equal(estPeriodeFusee(new Date(t(24, 17, 39, 59))), true);
    assert.equal(estPeriodeFusee(new Date(t(24, 17, 40))), false);
    assert.equal(estPeriodeFusee(new Date(t(24, 18, 0))), true);
    assert.equal(estPeriodeFusee(new Date(t(24, 18, 15))), false);
});

test('rien avant la création du compte + 1 minute', () => {
    // Compte créé à 17 h 05 : premier gain possible à 17 h 06.
    const p = { ...profil, creeLe: new Date(t(24, 17, 5)).toISOString() };
    const f1 = avancerFusees(nouvellesFusees(), { profil: p, total: 0, maintenant: new Date(t(24, 17, 5, 59)) });
    assert.equal(somme(f1.bonus), 0);
    const f2 = avancerFusees(f1, { profil: p, total: 0, maintenant: new Date(t(24, 17, 6)) });
    assert.equal(somme(f2.bonus), GAIN_FUSEE * 30);   // Sophie à 0 : tout le monde est devant
});

test('un joueur toujours devant gagne 100 points par minute de période', () => {
    const f = avancerFusees(nouvellesFusees(), { profil, total: 0, maintenant: new Date(t(24, 17, 45)) });
    // Compte créé à 17 h 00 : gains de 17 h 01 à 17 h 09 puis 17 h 30 à 17 h 39 = 19 gains.
    for (const b of bots()) assert.equal(f.bonus[b.id], 19 * GAIN_FUSEE);
    assert.equal(f.maj, t(24, 17, 45));
});

test('les joueurs derrière Sophie ne gagnent rien', () => {
    const f = avancerFusees(nouvellesFusees(), { profil, total: 1e9, maintenant: new Date(t(24, 23, 0)) });
    assert.equal(somme(f.bonus), 0);
    assert.equal(somme(f.bonusJour.parBot), 0);
});

test('joueur dépassé : il garde ses points mais n\'en gagne plus', () => {
    const bot = bots()[0];
    const f1 = avancerFusees(nouvellesFusees(), { profil, total: 0, maintenant: new Date(t(24, 17, 20)) });
    assert.equal(f1.bonus[bot.id], 9 * GAIN_FUSEE);
    // Sophie joue et passe devant ce joueur (mais pas devant le dernier).
    const m = new Date(t(24, 17, 25));
    // (+50 : ses points « normaux » montent encore un peu d'ici 17 h 45.)
    const total = pointsBot(bot, profil.creeLe, m) + f1.bonus[bot.id] + 50;
    const f2 = avancerFusees(f1, { profil, total, maintenant: new Date(t(24, 17, 45)) });
    assert.equal(f2.bonus[bot.id], 9 * GAIN_FUSEE);
    const champion = bots().at(-1);
    assert.equal(f2.bonus[champion.id], 19 * GAIN_FUSEE);
});

test('idempotent : même instant → aucun changement, sans mutation', () => {
    const m = new Date(t(24, 17, 35));
    const f1 = avancerFusees(nouvellesFusees(), { profil, total: 2000, maintenant: m });
    const copie = JSON.parse(JSON.stringify(f1));
    const f2 = avancerFusees(f1, { profil, total: 2000, maintenant: m });
    assert.deepEqual(f2, f1);
    assert.deepEqual(f1, copie);
    // Avancer en deux fois donne la même chose qu'en une fois.
    const a = avancerFusees(nouvellesFusees(), { profil, total: 2000, maintenant: new Date(t(24, 17, 33)) });
    const b = avancerFusees(a, { profil, total: 2000, maintenant: m });
    assert.deepEqual(b, f1);
});

test('bonus du jour remis à zéro le lendemain, total conservé', () => {
    const f1 = avancerFusees(nouvellesFusees(), { profil, total: 0, maintenant: new Date(t(24, 23, 50)) });
    assert.equal(f1.bonusJour.index, jourIndex(new Date(t(24, 23, 50))));
    assert.deepEqual(f1.bonusJour.parBot, f1.bonus);
    const f2 = avancerFusees(f1, { profil, total: 0, maintenant: new Date(t(25, 0, 5)) });
    assert.equal(f2.bonusJour.index, jourIndex(new Date(t(25, 0, 5))));
    // 00 h 00 → 00 h 05 : 6 gains depuis minuit.
    for (const b of bots()) {
        assert.equal(f2.bonusJour.parBot[b.id], 6 * GAIN_FUSEE);
        assert.equal(f2.bonus[b.id], f1.bonus[b.id] + 6 * GAIN_FUSEE);
    }
});

test('rattrapage après 3 jours fermé : un gain par instant pour un joueur toujours devant', () => {
    const debut = new Date(t(24, 17, 50));
    const f1 = avancerFusees(nouvellesFusees(), { profil, total: 0, maintenant: debut });
    const fin = new Date(t(27, 17, 50));
    const f2 = avancerFusees(f1, { profil, total: 0, maintenant: fin });
    const n = instantsFusees(debut.getTime(), fin.getTime()).length;
    // 3 × 480 instants, plus 2 périodes si l'heure d'hiver rajoute une heure (nuit du 25 octobre).
    assert.ok(n === 3 * 480 || n === 3 * 480 + 20, `instants : ${n}`);
    for (const b of bots()) assert.equal(f2.bonus[b.id] - f1.bonus[b.id], n * GAIN_FUSEE);
});

test('une semaine d\'absence se rattrape vite', () => {
    const f1 = avancerFusees(nouvellesFusees(), { profil, total: 5000, maintenant: new Date(t(24, 18, 0)) });
    const debut = performance.now();
    const f2 = avancerFusees(f1, { profil, total: 5000, maintenant: new Date(t(31, 18, 0)) });
    const duree = performance.now() - debut;
    assert.ok(duree < 500, `durée : ${duree} ms`);
    assert.ok(somme(f2.bonus) > somme(f1.bonus));
});

test('aucune valeur NaN, même avec une sauvegarde abîmée ou un compte illisible', () => {
    const abime = { maj: 'x', bonus: { 0: 'a' }, bonusJour: null };
    for (const p of [profil, { ...profil, creeLe: 'n\'importe quoi' }, { ...profil, creeLe: '2030-01-01' }]) {
        const f = avancerFusees(abime, { profil: p, total: 0, maintenant: new Date(t(24, 20, 0)) });
        assert.ok(Number.isFinite(f.maj));
        assert.ok(Number.isFinite(f.bonusJour.index));
        for (const v of [...Object.values(f.bonus), ...Object.values(f.bonusJour.parBot)]) {
            assert.ok(Number.isFinite(v) && v >= 0);
        }
    }
    const lignes = classement(profil, 0, new Date(t(24, 20, 0)), abime);
    assert.ok(lignes.every(l => Number.isFinite(l.points)));
});

test('classement : bonus ajoutés, fusées marquées pendant une période', () => {
    const m = new Date(t(24, 17, 35));
    const f = avancerFusees(nouvellesFusees(), { profil, total: 3000, maintenant: m });
    const lignes = classement(profil, 3000, m, f);
    const b = bots();
    for (const l of lignes.filter(x => !x.moi)) {
        const bot = b.find(x => x.pseudo === l.pseudo);
        assert.equal(l.points, pointsBot(bot, profil.creeLe, m) + (f.bonus[bot.id] ?? 0));
        assert.equal(l.fusee, l.points > 3000);
    }
    assert.ok(lignes.some(l => l.fusee));
    assert.equal(lignes.find(l => l.moi).fusee, false);
    // Hors période : personne n'est marqué.
    const hors = new Date(t(24, 17, 45));
    assert.ok(classement(profil, 3000, hors, f).every(l => !l.fusee));
    // Avant creeLe + 1 min : pas encore de fusées.
    assert.ok(classement(profil, 0, new Date(t(24, 17, 0, 30)), f).every(l => !l.fusee));
});

test('classementJour : bonus du jour seulement si c\'est aujourd\'hui', () => {
    const m = new Date(t(24, 17, 35));
    const f = avancerFusees(nouvellesFusees(), { profil, total: 0, maintenant: m });
    const sans = classementJour(profil, 0, m);
    const avec = classementJour(profil, 0, m, f);
    const pts = l => new Map(l.filter(x => !x.moi).map(x => [x.pseudo, x.points]));
    const a = pts(sans), b = pts(avec);
    for (const [p, v] of a) assert.equal(b.get(p), v + 15 * GAIN_FUSEE);
    assert.ok(avec.filter(l => !l.moi).every(l => l.fusee));
    // Le lendemain, le bonus d'hier ne compte plus dans « Aujourd'hui ».
    const demain = new Date(t(25, 17, 45));
    assert.deepEqual(pts(classementJour(profil, 0, demain, f)), pts(classementJour(profil, 0, demain)));
});
