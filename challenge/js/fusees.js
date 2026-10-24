// challenge/js/fusees.js
// Les joueurs « fusées » 🚀 (idée de Sophie) : toutes les 30 minutes, pendant 10 minutes
// (hh:00–hh:10 et hh:30–hh:40), chaque joueur inventé qui est devant Sophie au classement
// Total gagne 100 points par minute. Ça continue même jeu fermé : on rattrape à l'ouverture.
import { bots, pointsBot, pointsBotJour, gainJour, fractionJournee } from './classement.js';
import { jourIndex } from './jour.js';

export const GAIN_FUSEE = 100;          // points gagnés à chaque minute de période
export const DUREE_PERIODE = 10;        // minutes de fusée…
export const ECART_PERIODES = 30;       // … toutes les 30 minutes
export const DELAI_DEPART_MS = 60000;   // pas de fusée pendant la 1ʳᵉ minute du compte
const MINUTE = 60000;
const RATTRAPAGE_MAX_MS = 400 * 86400000;   // au-delà, les gains trop anciens sont oubliés

export function nouvellesFusees() {
    return { maj: null, bonus: {}, bonusJour: { index: 0, parBot: {} } };
}

// Vrai pendant les 10 premières minutes de chaque demi-heure (heure locale).
export function estPeriodeFusee(maintenant) {
    return maintenant.getMinutes() % ECART_PERIODES < DUREE_PERIODE;
}

// Début des fusées pour ce compte (ms), ou NaN si la date de création est illisible.
export function debutFusees(profil) {
    return Date.parse(profil?.creeLe) + DELAI_DEPART_MS;
}

// Instants (ms) des gains dans ]depuis, jusqua], jamais avant `debut`.
export function instantsFusees(depuis, jusqua, debut = -Infinity) {
    const res = [];
    let gauche = Math.max(depuis, jusqua - RATTRAPAGE_MAX_MS);
    if (debut > gauche) gauche = debut - 1;   // `debut` lui-même est un instant possible
    // Première minute ronde strictement après `gauche` (les fuseaux sont décalés de minutes entières).
    let t = Math.floor(gauche / MINUTE) * MINUTE + MINUTE;
    while (t <= jusqua) {
        const m = new Date(t).getMinutes() % ECART_PERIODES;
        if (m < DUREE_PERIODE) {
            res.push(t);
            t += MINUTE;
        } else {
            t += (ECART_PERIODES - m) * MINUTE;   // saute directement à la période suivante
        }
    }
    return res;
}

// Nombre fini ≥ 0, sinon 0.
function positif(v) {
    return Number.isFinite(v) && v >= 0 ? v : 0;
}

// Copie assainie d'une table { idBot: points }.
export function tableBonus(o) {
    const res = {};
    if (o && typeof o === 'object' && !Array.isArray(o)) {
        for (const [k, v] of Object.entries(o)) if (positif(v) > 0) res[k] = v;
    }
    return res;
}

// Copie assainie d'un état des fusées (sauvegarde abîmée ou ancienne → valeurs par défaut).
export function fuseesValides(f) {
    const ok = f && typeof f === 'object';
    const j = ok ? f.bonusJour : null;
    return {
        maj: ok && Number.isFinite(f.maj) && f.maj >= 0 ? f.maj : null,
        bonus: tableBonus(ok ? f.bonus : null),
        bonusJour: {
            index: j && Number.isFinite(j.index) ? j.index : 0,
            parBot: tableBonus(j ? j.parBot : null),
        },
    };
}

// Fait gagner les fusées depuis la dernière mise à jour jusqu'à `maintenant`.
// Pur : renvoie un nouvel objet. `total` = points totaux de Sophie (inchangés pendant l'intervalle).
export function avancerFusees(fusees, { profil, total, maintenant }) {
    const f = fuseesValides(fusees);
    const fin = maintenant.getTime();
    const debut = debutFusees(profil);
    if (!Number.isFinite(debut)) return { ...f, maj: fin };   // compte illisible : pas de fusées
    const depuis = f.maj ?? Date.parse(profil.creeLe);
    if (fin <= depuis) return f.maj === null ? { ...f, maj: fin } : f;   // horloge revenue en arrière : rien

    const joueurs = bots();
    // Points « naturels » d'un joueur au début de chaque jour : mis en cache, avancés jour après jour.
    let jourCache = null;
    let base = [];
    let gains = [];
    for (const instant of instantsFusees(depuis, fin, debut)) {
        const date = new Date(instant);
        const jour = jourIndex(date);
        if (jour !== jourCache) {
            if (jourCache !== null && jour === jourCache + 1) {
                base = base.map((b, i) => b + gains[i]);
            } else {
                base = joueurs.map(b => pointsBot(b, profil.creeLe, date) - pointsBotJour(b, date));
            }
            gains = joueurs.map(b => gainJour(b, jour));
            jourCache = jour;
        }
        if (f.bonusJour.index !== jour) f.bonusJour = { index: jour, parBot: {} };
        const part = fractionJournee(date);
        joueurs.forEach((b, i) => {
            const bonus = f.bonus[b.id] ?? 0;
            const points = base[i] + Math.round(gains[i] * part) + bonus;
            if (points > total) {   // devant Sophie (à égalité, Sophie est devant)
                f.bonus[b.id] = bonus + GAIN_FUSEE;
                f.bonusJour.parBot[b.id] = (f.bonusJour.parBot[b.id] ?? 0) + GAIN_FUSEE;
            }
        });
    }
    f.maj = fin;
    return f;
}
