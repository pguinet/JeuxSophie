// challenge/js/ui-commun.js
// Petits outils partagés par les écrans de jeu : création d'élément, en-tête, « +15 » qui s'envole.

// Crée un élément ; le texte passe toujours par textContent (jamais innerHTML).
export function creer(tag, classe, texte) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texte != null) el.textContent = texte;
    return el;
}

// En-tête commun aux écrans de jeu : 🏠, nom du jeu, progression, points.
export function creerEntete(jeu) {
    const entete = creer('div', 'jeu-entete');
    entete.style.setProperty('--couleur-jeu', jeu.couleur);
    const maison = creer('button', 'btn-maison', '🏠');
    maison.title = 'Retour au menu';
    const titre = creer('div', 'jeu-titre', `${jeu.emoji} ${jeu.nom}`);
    const progression = creer('div', 'pastille progression');
    const score = creer('div', 'pastille score');
    entete.append(maison, titre, progression, score);
    return { entete, maison, progression, score };
}

// Petit « +15 » qui s'envole depuis l'élément `depuis`.
export function bonusVolant(ecran, depuis, points) {
    const r = depuis.getBoundingClientRect();
    const e = ecran.getBoundingClientRect();
    const b = creer('div', 'bonus-vol', `+${points}`);
    b.style.left = `${r.left - e.left + r.width / 2}px`;
    b.style.top = `${r.top - e.top}px`;
    b.addEventListener('animationend', () => b.remove());
    ecran.appendChild(b);
}
