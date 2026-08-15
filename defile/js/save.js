// Sauvegarde du jeu de défilé : les étoiles gagnées, le meilleur défilé, et la
// dernière tenue portée (pour la retrouver en revenant).

import { TENUE_DEFAUT } from '../../shared/garderobe.js';

const CLE = 'defile_save';

const DEFAUT = {
    etoiles: 0,        // total des étoiles gagnées
    defiles: 0,        // nombre de défilés faits
    meilleur: 0,       // meilleure note (1 à 5)
    tenue: null,       // la dernière tenue portée
};

export function charger() {
    let brut = {};
    try { brut = JSON.parse(localStorage.getItem(CLE)) || {}; } catch { brut = {}; }
    const etat = Object.assign({}, DEFAUT, brut);
    etat.tenue = Object.assign({}, TENUE_DEFAUT, brut.tenue || {});
    return etat;
}

export function sauver(etat) {
    try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch { /* indisponible */ }
}
