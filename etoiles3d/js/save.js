// Sauvegarde du jeu « Étoiles en 3D » dans le navigateur (localStorage).
// On garde : les étoiles ramassées, les pièces, les animaux et les
// décorations achetés au magasin, et l'expérience des animaux (petXp,
// qui donne leur niveau).

const CLE = 'etoiles3d_save';

function vide() {
    return { etoiles: 0, pieces: 0, animaux: [], decos: [], petXp: 0, renaissances: 0 };
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
            renaissances: Number(data.renaissances) || 0,
        };
    } catch (e) {
        return vide();
    }
}

// Fait une « Renaissance » : on repart à zéro MAIS on garde (et on augmente)
// le compteur de renaissances, qui donne un bonus permanent.
export function renaitre(renaissancesActuelles) {
    const neuf = vide();
    neuf.renaissances = (Number(renaissancesActuelles) || 0) + 1;
    sauver(neuf);
    return neuf;
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
