// challenge/js/ecran-classement.js
// Écran du classement : deux onglets (Total / Aujourd'hui), la liste des 31 joueurs,
// Sophie surlignée et amenée au centre.
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

const ONGLETS = [
    { id: 'total', titre: '🏆 Total' },
    { id: 'jour', titre: '☀️ Aujourd\'hui' },
];

// afficherClassement(app, { total: lignes, jour: lignes }, { onRetour, onglet })
export function afficherClassement(app, lignes, { onRetour, onglet = 'total' }) {
    const ecran = creer('div', 'ecran classement');
    const entete = creer('div', 'classement-entete');
    const retour = creer('button', 'btn-gros btn-blanc classement-retour', '← Accueil');
    const titre = creer('h1', 'classement-titre', '🥇 Classement');
    entete.append(retour, titre);

    const barre = creer('div', 'classement-onglets');
    barre.setAttribute('role', 'tablist');
    const boutons = ONGLETS.map(o => {
        const b = creer('button', 'classement-onglet', o.titre);
        b.setAttribute('role', 'tab');
        b.addEventListener('click', () => { if (o.id !== actif) { audio.sfxClic(); montrer(o.id); } });
        return b;
    });
    barre.append(...boutons);

    const mention = creer('div', 'classement-mention', 'Remis à zéro chaque nuit à minuit 🌙');
    const liste = creer('ol', 'classement-liste carte');
    // En-tête collant : retour, titre et onglets restent visibles pendant le défilement.
    const haut = creer('div', 'classement-haut');
    haut.append(entete, barre, mention);
    ecran.append(haut, liste);

    let actif = null;
    function montrer(id) {
        actif = ONGLETS.some(o => o.id === id) ? id : 'total';
        ONGLETS.forEach((o, i) => {
            const choisi = o.id === actif;
            boutons[i].classList.toggle('actif', choisi);
            boutons[i].setAttribute('aria-selected', String(choisi));
        });
        mention.hidden = actif !== 'jour';
        liste.replaceChildren(...lignes[actif].map(ligneJoueur));
        const moi = liste.querySelector('.classement-moi');
        if (moi && moi.isConnected) moi.scrollIntoView({ block: 'center' });
    }

    function quitter() {
        document.removeEventListener('keydown', surTouche);
        onRetour();
    }
    function surTouche(e) {
        if (!ecran.isConnected) { document.removeEventListener('keydown', surTouche); return; }
        if (e.key === 'Escape') quitter();
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const i = ONGLETS.findIndex(o => o.id === actif);
            const j = (i + (e.key === 'ArrowRight' ? 1 : ONGLETS.length - 1)) % ONGLETS.length;
            audio.sfxClic();
            montrer(ONGLETS[j].id);
        }
    }
    retour.addEventListener('click', () => { audio.sfxClic(); quitter(); });
    document.addEventListener('keydown', surTouche);

    app.replaceChildren(ecran);
    montrer(onglet);
}
