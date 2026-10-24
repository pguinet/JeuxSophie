// challenge/js/resultat.js
// Calculs purs de l'écran de résultat : joueurs dépassés et textes de rang.

const MAX_NOMS = 3;

// Pseudos des joueurs qui étaient devant Sophie dans `avant` et sont derrière elle
// dans `apres` (lignes de classement()), du mieux classé au moins bien classé.
export function joueursDepasses(avant, apres) {
    const monAncienRang = avant.find(l => l.moi).rang;
    const monRang = apres.find(l => l.moi).rang;
    const devantAvant = new Set(avant.filter(l => !l.moi && l.rang < monAncienRang).map(l => l.pseudo));
    return apres.filter(l => !l.moi && l.rang > monRang && devantAvant.has(l.pseudo)).map(l => l.pseudo);
}

// « Tu as dépassé A, B et C ! » ; au-delà de 3 noms : « … et 2 autres ! ».
export function phraseDepasses(noms) {
    if (noms.length === 0) return '';
    const vus = noms.slice(0, MAX_NOMS);
    const reste = noms.length - vus.length;
    let liste;
    if (reste > 0) liste = `${vus.join(', ')} et ${reste} autre${reste > 1 ? 's' : ''}`;
    else if (vus.length === 1) liste = vus[0];
    else liste = `${vus.slice(0, -1).join(', ')} et ${vus.at(-1)}`;
    return `Tu as dépassé ${liste} !`;
}

export function rangTexte(rang) {
    return rang === 1 ? '1ᵉʳ' : `${rang}ᵉ`;
}
