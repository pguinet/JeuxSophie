// Classement contre 30 joueurs inventés. Tout est calculé à partir d'une graine fixe :
// rien à sauvegarder, mêmes joueurs et mêmes points à chaque ouverture.
import { mulberry32, hashString, pick, shuffle } from './rng.js';
import { lookAleatoire } from './avatar.js';

export const NB_BOTS = 30;
const GRAINE = 20261024;

const PRENOMS = ['Lucas', 'Emma', 'Léo', 'Jade', 'Hugo', 'Louise', 'Gabriel', 'Alice', 'Nathan', 'Chloé',
    'Arthur', 'Lina', 'Jules', 'Mia', 'Tom', 'Rose', 'Noah', 'Léna', 'Adam', 'Zoé', 'Ethan', 'Inès',
    'Sacha', 'Manon', 'Liam', 'Camille', 'Paul', 'Anna', 'Raphaël', 'Lou', 'Maël', 'Nina', 'Oscar', 'Eva'];
const SUFFIXES = ['', '_78', 'Star', '2014', '_UK', 'Cool', '_9', 'Pro', '42', 'Smile', '_London', 'Wow'];

const DEPART_MIN = 50, DEPART_MAX = 4000;

export function bots() {
    const rng = mulberry32(GRAINE);
    const noms = shuffle(PRENOMS, rng);
    return Array.from({ length: NB_BOTS }, (_, i) => ({
        id: i,
        pseudo: noms[i] + pick(SUFFIXES, rng),
        look: lookAleatoire(rng),
        // Répartition en courbe : beaucoup de joueurs modestes, quelques champions.
        depart: Math.round(DEPART_MIN + (DEPART_MAX - DEPART_MIN) * Math.pow(i / (NB_BOTS - 1), 1.6)),
        rythme: Math.round(20 + rng() * 160), // points max gagnés par jour
    }));
}

// Points d'un joueur inventé `jours` jours après la création du compte de Sophie.
export function pointsBot(bot, jours) {
    let p = bot.depart;
    for (let j = 1; j <= jours; j++) {
        p += Math.round(bot.rythme * mulberry32(hashString(`${bot.id}:${j}`))());
    }
    return p;
}

// Numéro du jour (heure locale) : change à minuit.
export function jourIndex(date) {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

export function classement(profil, total, aujourdhui = new Date()) {
    const jours = Math.max(0, jourIndex(aujourdhui) - jourIndex(new Date(profil.creeLe)));
    const lignes = bots().map(b => ({ pseudo: b.pseudo, look: b.look, points: pointsBot(b, jours), moi: false }));
    lignes.push({ pseudo: profil.pseudo, look: profil.look, points: total, moi: true });
    lignes.sort((a, b) => b.points - a.points || Number(b.moi) - Number(a.moi));
    return lignes.map((l, i) => ({ ...l, rang: i + 1 }));
}
