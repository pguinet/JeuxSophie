// Sauvegarde du jeu « Étoiles en 3D » dans le navigateur (localStorage).
// On garde : les étoiles ramassées, les pièces, les animaux et les
// décorations achetés au magasin, et l'expérience des animaux (petXp,
// qui donne leur niveau).

const CLE = 'etoiles3d_save';

function vide() {
    return { etoiles: 0, pieces: 0, animaux: [], decos: [], petXp: 0 };
}

export function charger() {
    try {
        const brut = localStorage.getItem(CLE);
        if (!brut) return vide();
        const data = JSON.parse(brut);
        return {
            etoiles: Number(data.etoiles) || 0,
            pieces: Number(data.pieces) || 0,
            animaux: Array.isArray(data.animaux) ? data.animaux : [],
            decos: Array.isArray(data.decos) ? data.decos : [],
            petXp: Number(data.petXp) || 0,
        };
    } catch (e) {
        return vide();
    }
}

export function sauver(data) {
    try {
        localStorage.setItem(CLE, JSON.stringify(data));
    } catch (e) { /* pas grave si le navigateur refuse */ }
}

// Efface complètement la sauvegarde (pour tout recommencer à zéro).
export function reinitialiser() {
    try { localStorage.removeItem(CLE); } catch (e) { /* rien */ }
}
