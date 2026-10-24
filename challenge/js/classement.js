// Classement contre 30 joueurs inventés. Tout est calculé à partir d'une graine fixe :
// rien à sauvegarder, mêmes joueurs et mêmes points à chaque ouverture.
import { mulberry32, hashString, pick, shuffle } from './rng.js';
import { lookAleatoire } from './avatar.js';
import { jourIndex } from './jour.js';

export { jourIndex };

export const NB_BOTS = 30;
const GRAINE = 20261024;

const PRENOMS = ['Lucas', 'Emma', 'Léo', 'Jade', 'Hugo', 'Louise', 'Gabriel', 'Alice', 'Nathan', 'Chloé',
    'Arthur', 'Lina', 'Jules', 'Mia', 'Tom', 'Rose', 'Noah', 'Léna', 'Adam', 'Zoé', 'Ethan', 'Inès',
    'Sacha', 'Manon', 'Liam', 'Camille', 'Paul', 'Anna', 'Raphaël', 'Lou', 'Maël', 'Nina', 'Oscar', 'Eva'];
const SUFFIXES = ['', '_78', 'Star', '2014', '_UK', 'Cool', '_9', 'Pro', '42', 'Smile', '_London', 'Wow'];

const DEPART_MIN = 50, DEPART_MAX = 4000;
const GAIN_MAX = 900;          // points max gagnés par un joueur inventé en une journée
const PROBA_ABSENT = 0.2;      // chance qu'un joueur inventé ne joue pas un jour donné
// Trois profils de joueurs (rythme = points moyens par jour), un tiers chacun.
const PROFILS = [
    { min: 80, max: 250 },     // calme
    { min: 250, max: 550 },    // régulier
    { min: 550, max: 900 },    // fort
];

// Rythmes des 30 joueurs, tirés avec un hasard séparé pour ne pas changer pseudos et looks.
function rythmes() {
    const rng = mulberry32(GRAINE + 1);
    const profils = shuffle(Array.from({ length: NB_BOTS }, (_, i) => PROFILS[i % PROFILS.length]), rng);
    // Borne haute exclue (sauf pour le dernier profil, plafonné au gain max).
    return profils.map(p => Math.min(p.max === GAIN_MAX ? GAIN_MAX : p.max - 1,
        Math.round(p.min + rng() * (p.max - p.min))));
}

export function bots() {
    const rng = mulberry32(GRAINE);
    const noms = shuffle(PRENOMS, rng);
    const r = rythmes();
    return Array.from({ length: NB_BOTS }, (_, i) => {
        const pseudo = noms[i] + pick(SUFFIXES, rng);
        const look = lookAleatoire(rng);
        rng();   // ancien tirage du rythme (v1) : conservé pour que les joueurs suivants ne changent pas
        return {
            id: i,
            pseudo,
            look,
            // Répartition en courbe : beaucoup de joueurs modestes, quelques champions.
            depart: Math.round(DEPART_MIN + (DEPART_MAX - DEPART_MIN) * Math.pow(i / (NB_BOTS - 1), 1.6)),
            rythme: r[i],   // points moyens gagnés par jour
        };
    });
}

// Points gagnés par un joueur inventé pendant tout le jour `jour` (numéro absolu, voir jourIndex).
export function gainJour(bot, jour) {
    const r = mulberry32(hashString(`${bot.id}:${jour}`));
    if (r() < PROBA_ABSENT) return 0;   // pas joué ce jour-là
    return Math.min(GAIN_MAX, Math.round(bot.rythme * (0.6 + 0.8 * r())));
}

// Part de la journée écoulée depuis minuit (0 à minuit pile, presque 1 à 23 h 59).
export function fractionJournee(maintenant) {
    const minutes = maintenant.getHours() * 60 + maintenant.getMinutes() + maintenant.getSeconds() / 60;
    return minutes / 1440;
}

// Points gagnés depuis minuit : ils montent au fil des heures.
export function pointsBotJour(bot, maintenant) {
    return Math.round(gainJour(bot, jourIndex(maintenant)) * fractionJournee(maintenant));
}

// Points totaux : départ + jours complets depuis la création du compte de Sophie + aujourd'hui.
export function pointsBot(bot, creeLe, maintenant) {
    const debut = jourIndex(new Date(creeLe));
    const aujourdhui = jourIndex(maintenant);
    if (!Number.isFinite(debut) || debut > aujourdhui) return bot.depart;
    let p = bot.depart;
    for (let d = debut; d < aujourdhui; d++) p += gainJour(bot, d);
    return p + pointsBotJour(bot, maintenant);
}

// Range les lignes (Sophie devant à égalité) et numérote les rangs.
function ranger(lignes) {
    lignes.sort((a, b) => b.points - a.points || Number(b.moi) - Number(a.moi));
    return lignes.map((l, i) => ({ ...l, rang: i + 1 }));
}

// Classement sur les points totaux.
export function classement(profil, total, maintenant = new Date()) {
    const lignes = bots().map(b => ({
        pseudo: b.pseudo, look: b.look, points: pointsBot(b, profil.creeLe, maintenant), moi: false,
    }));
    lignes.push({ pseudo: profil.pseudo, look: profil.look, points: total, moi: true });
    return ranger(lignes);
}

// Classement du jour : points gagnés depuis minuit (remis à zéro chaque nuit).
export function classementJour(profil, pointsJour, maintenant = new Date()) {
    const lignes = bots().map(b => ({ pseudo: b.pseudo, look: b.look, points: pointsBotJour(b, maintenant), moi: false }));
    lignes.push({ pseudo: profil.pseudo, look: profil.look, points: pointsJour, moi: true });
    return ranger(lignes);
}
