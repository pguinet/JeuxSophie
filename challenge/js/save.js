// challenge/js/save.js
// Sauvegarde locale du compte, des points et des meilleurs scores.
export const CLE = 'biggest_save';
export const PSEUDO_MAX = 16;

export function nouvelleSauvegarde() {
    return { v: 1, profil: null, total: 0, meilleurs: {}, parties: 0, muet: false };
}

function profilValide(p) {
    return p && typeof p === 'object' && typeof p.pseudo === 'string' && validerPseudo(p.pseudo)
        && typeof p.creeLe === 'string' ? p : null;
}

export function charger(storage = globalThis.localStorage) {
    try {
        const d = JSON.parse(storage.getItem(CLE));
        if (!d || typeof d !== 'object' || d.v !== 1) return nouvelleSauvegarde();
        const e = { ...nouvelleSauvegarde(), ...d };
        e.profil = profilValide(e.profil);
        if (!Number.isFinite(e.total)) e.total = 0;
        if (!Number.isFinite(e.parties)) e.parties = 0;
        e.muet = e.muet === true;
        const m = e.meilleurs;
        e.meilleurs = {};
        if (m && typeof m === 'object' && !Array.isArray(m)) {
            for (const [k, v] of Object.entries(m)) if (Number.isFinite(v)) e.meilleurs[k] = v;
        }
        return e;
    } catch {
        return nouvelleSauvegarde();
    }
}

export function sauver(etat, storage = globalThis.localStorage) {
    try {
        storage.setItem(CLE, JSON.stringify(etat));
    } catch {
        // Stockage plein ou bloqué : on continue à jouer sans sauvegarder.
    }
}

export function enregistrerPartie(etat, idJeu, points) {
    return {
        ...etat,
        total: etat.total + points,
        parties: etat.parties + 1,
        meilleurs: { ...etat.meilleurs, [idJeu]: Math.max(etat.meilleurs[idJeu] ?? 0, points) },
    };
}

export function validerPseudo(s) {
    const p = String(s ?? '').trim();
    return p.length >= 1 && p.length <= PSEUDO_MAX ? p : null;
}
