// challenge/js/ecran-classement.js
// Écran du classement : la liste des 31 joueurs, Sophie surlignée et amenée au centre.
import { avatarSVG } from './avatar.js';
import * as audio from './audio.js';

const MEDAILLES = ['🥇', '🥈', '🥉'];

function creer(tag, classe, texte) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texte != null) el.textContent = texte;
    return el;
}

function ligneJoueur(l) {
    const podium = l.rang <= 3 ? ` podium-${l.rang}` : '';
    const li = creer('li', `classement-ligne${podium}${l.moi ? ' classement-moi' : ''}`);
    const rang = creer('span', 'classement-rang', MEDAILLES[l.rang - 1] ?? String(l.rang));
    const avatar = creer('span', 'classement-avatar');
    avatar.innerHTML = avatarSVG(l.look, { taille: 40 });   // SVG généré, sans texte saisi
    const pseudo = creer('span', 'classement-pseudo', l.pseudo);   // textContent
    if (l.moi) pseudo.append(creer('span', 'classement-toi', ' (toi)'));
    const points = creer('span', 'classement-points', `⭐ ${l.points}`);
    li.append(rang, avatar, pseudo, points);
    return li;
}

// afficherClassement(app, lignes, { onRetour })
export function afficherClassement(app, lignes, { onRetour }) {
    const ecran = creer('div', 'ecran classement');
    const entete = creer('div', 'classement-entete');
    const retour = creer('button', 'btn-gros btn-blanc classement-retour', '← Accueil');
    const titre = creer('h1', 'classement-titre', '🥇 Classement');
    entete.append(retour, titre);

    const liste = creer('ol', 'classement-liste carte');
    liste.append(...lignes.map(ligneJoueur));
    ecran.append(entete, liste);

    function quitter() {
        document.removeEventListener('keydown', surTouche);
        onRetour();
    }
    function surTouche(e) {
        if (e.key === 'Escape') quitter();
    }
    retour.addEventListener('click', () => { audio.sfxClic(); quitter(); });
    document.addEventListener('keydown', surTouche);

    app.replaceChildren(ecran);
    const moi = liste.querySelector('.classement-moi');
    if (moi) moi.scrollIntoView({ block: 'center' });
}
