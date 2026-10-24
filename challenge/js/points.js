// challenge/js/points.js
// Points gagnés : 10 par bonne réponse, + bonus si on répond vite,
// + bonus quand on enchaîne les bonnes réponses.

export const POINTS_BASE = 10;

// ms = temps de réponse. 5 points jusqu'à 3 s, puis baisse jusqu'à 0 à 10 s.
export function bonusVitesse(ms) {
    const s = ms / 1000;
    if (s <= 3) return 5;
    if (s >= 10) return 0;
    return Math.round(5 * (10 - s) / 7);
}

// serie = nombre de bonnes réponses d'affilée, celle-ci comprise.
export function bonusSerie(serie) {
    return serie >= 3 ? Math.min(10, 2 * (serie - 2)) : 0;
}

export function pointsQuestion({ juste, ms, serie }) {
    if (!juste) return 0;
    return POINTS_BASE + bonusVitesse(ms) + bonusSerie(serie);
}

// essai = numéro de la tentative pour remettre la phrase dans l'ordre.
export function pointsPhrase(essai) {
    if (essai === 1) return 10;
    if (essai === 2) return 5;
    return 0;
}
