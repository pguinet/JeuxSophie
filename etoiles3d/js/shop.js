// Le magasin du jeu « Étoiles en 3D ».
// - un bouton 🏪 en haut de l'écran ouvre le magasin,
// - on transforme ses étoiles en pièces (100 étoiles = 50 pièces),
// - on achète des animaux (qui te suivent) et des décorations (pour ton monde).

import { ANIMAUX, DECOS } from './catalogue.js';

// Combien d'étoiles il faut pour une transformation, et ce que ça rapporte.
export const LOT_ETOILES = 100;
export const LOT_PIECES = 50;

// Petit utilitaire pour créer un élément stylé.
function el(tag, styles, texte) {
    const n = document.createElement(tag);
    if (styles) Object.assign(n.style, styles);
    if (texte != null) n.textContent = texte;
    return n;
}

// options = { etat, sauver, majHud, onAchatAnimal, onAchatDeco }
export function initMagasin(options) {
    const { etat, sauver, majHud, onAchatAnimal, onAchatDeco } = options;

    const btn = document.getElementById('magasin');

    // --- Fond sombre + panneau du magasin ---
    const overlay = el('div', {
        position: 'fixed', inset: '0', zIndex: '50',
        display: 'none', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0, 0, 0, .55)', padding: '4vmin',
    });
    const panneau = el('div', {
        background: 'linear-gradient(160deg, #4dabf7, #1971c2)',
        borderRadius: '28px', padding: '4vmin',
        width: 'min(560px, 94vw)', maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 12px 0 rgba(0,0,0,.35)', color: '#fff', textAlign: 'center',
    });
    overlay.appendChild(panneau);
    document.body.appendChild(overlay);

    panneau.appendChild(el('h2', { fontSize: 'clamp(26px, 6vmin, 42px)', textShadow: '2px 2px 0 rgba(0,0,0,.35)' }, '🏪 Magasin'));

    // Compteurs étoiles + pièces
    const compteurs = el('div', {
        display: 'flex', justifyContent: 'center', gap: '5vw',
        fontSize: 'clamp(20px, 4.6vmin, 30px)', fontWeight: 'bold',
        margin: '2vmin 0 3vmin', textShadow: '1px 1px 0 rgba(0,0,0,.3)',
    });
    const cptEtoiles = el('span', null, '⭐ 0');
    const cptPieces = el('span', null, '🪙 0');
    compteurs.append(cptEtoiles, cptPieces);
    panneau.appendChild(compteurs);

    // --- Transformer étoiles -> pièces ---
    const transfo = el('button', {
        fontFamily: 'inherit', cursor: 'pointer', border: 'none', color: '#5a3d00',
        background: '#ffd43b', borderRadius: '22px', padding: '3vmin 4vw',
        fontSize: 'clamp(17px, 3.8vmin, 26px)', fontWeight: 'bold', width: '100%',
        boxShadow: '0 5px 0 rgba(0,0,0,.3)', marginBottom: '2vmin',
    });
    panneau.appendChild(transfo);
    const aide = el('div', { fontSize: 'clamp(13px, 3vmin, 18px)', opacity: '.9', marginBottom: '3vmin' }, '100 étoiles = 50 pièces');
    panneau.appendChild(aide);

    transfo.addEventListener('click', () => {
        const lots = Math.floor(etat.etoiles / LOT_ETOILES);
        if (lots <= 0) { flash(aide, 'Il te faut au moins 100 étoiles ! 🌟'); return; }
        etat.etoiles -= lots * LOT_ETOILES;
        etat.pieces += lots * LOT_PIECES;
        sauver(etat);
        majHud();
        rafraichir();
        flash(aide, '+' + (lots * LOT_PIECES) + ' pièces ! 🎉');
    });

    // --- Section Animaux ---
    panneau.appendChild(sousTitre('🐾 Animaux'));
    const lignesAnimaux = {};
    const grilleA = el('div', { display: 'flex', flexDirection: 'column', gap: '2vmin', marginBottom: '3vmin' });
    panneau.appendChild(grilleA);
    ANIMAUX.forEach((a) => {
        const ligne = ligneArticle(a.emoji + ' ' + a.nom, () => acheter('animaux', a, onAchatAnimal, lignesAnimaux[a.id]));
        grilleA.appendChild(ligne.racine);
        lignesAnimaux[a.id] = ligne;
    });

    // --- Section Décorations ---
    panneau.appendChild(sousTitre('🌸 Décorations'));
    const lignesDecos = {};
    const grilleD = el('div', { display: 'flex', flexDirection: 'column', gap: '2vmin', marginBottom: '3vmin' });
    panneau.appendChild(grilleD);
    DECOS.forEach((d) => {
        const ligne = ligneArticle(d.emoji + ' ' + d.nom, () => acheter('decos', d, onAchatDeco, lignesDecos[d.id]));
        grilleD.appendChild(ligne.racine);
        lignesDecos[d.id] = ligne;
    });

    // --- Bouton fermer ---
    const fermer = el('button', {
        fontFamily: 'inherit', cursor: 'pointer', border: 'none', color: '#fff',
        background: 'rgba(0,0,0,.3)', borderRadius: '22px', padding: '3vmin 4vw',
        fontSize: 'clamp(17px, 3.8vmin, 26px)', fontWeight: 'bold', width: '100%',
        boxShadow: '0 5px 0 rgba(0,0,0,.3)', marginTop: '1vmin',
    }, '✅ C\'est bon, je joue !');
    fermer.addEventListener('click', ferme);
    panneau.appendChild(fermer);

    // --- Achat ---
    function acheter(champ, article, onAchat, ligne) {
        const possede = etat[champ].includes(article.id);
        if (possede) return;                              // déjà à toi
        if (etat.pieces < article.prix) { secoue(ligne.racine); return; }
        etat.pieces -= article.prix;
        etat[champ].push(article.id);
        sauver(etat);
        if (onAchat) onAchat(article.id);                 // le jeu ajoute l'objet 3D
        majHud();
        rafraichir();
    }

    // --- Rafraîchir l'affichage ---
    function rafraichir() {
        cptEtoiles.textContent = '⭐ ' + etat.etoiles;
        cptPieces.textContent = '🪙 ' + etat.pieces;

        const lots = Math.floor(etat.etoiles / LOT_ETOILES);
        transfo.textContent = lots > 0
            ? '🌟➡️🪙 Transformer (+' + (lots * LOT_PIECES) + ' pièces)'
            : '🌟➡️🪙 Transformer mes étoiles';
        transfo.style.filter = lots > 0 ? 'none' : 'grayscale(.5) brightness(.85)';

        const maj = (liste, champ) => liste.forEach((art) => {
            const l = champ === 'animaux' ? lignesAnimaux[art.id] : lignesDecos[art.id];
            if (etat[champ].includes(art.id)) etatBouton(l.bouton, 'À toi ✓', '#2f9e44', '#fff');
            else etatBouton(l.bouton, '🪙 ' + art.prix, etat.pieces >= art.prix ? '#ffd43b' : '#adb5bd', etat.pieces >= art.prix ? '#5a3d00' : '#fff');
        });
        maj(ANIMAUX, 'animaux');
        maj(DECOS, 'decos');
    }

    function ouvre() { rafraichir(); overlay.style.display = 'flex'; }
    function ferme() { overlay.style.display = 'none'; }

    if (btn) btn.addEventListener('click', ouvre);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) ferme(); });

    return { ouvre, ferme };
}

// --- aides visuelles ---

function sousTitre(txt) {
    return el('h3', { fontSize: 'clamp(19px, 4.2vmin, 28px)', margin: '1vmin 0 2vmin', textShadow: '1px 1px 0 rgba(0,0,0,.3)' }, txt);
}

function ligneArticle(nom, onClick, desc) {
    const racine = el('div', {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '3vw', background: 'rgba(255,255,255,.14)', borderRadius: '18px',
        padding: '2.4vmin 3vw',
    });
    const gauche = el('div', { textAlign: 'left', flex: '1' });
    gauche.appendChild(el('div', { fontSize: 'clamp(16px, 3.6vmin, 24px)', fontWeight: 'bold' }, nom));
    if (desc) gauche.appendChild(el('div', { fontSize: 'clamp(12px, 2.7vmin, 16px)', opacity: '.85' }, desc));

    const bouton = el('button', {
        fontFamily: 'inherit', cursor: 'pointer', border: 'none',
        borderRadius: '16px', padding: '2vmin 4vw', fontWeight: 'bold',
        fontSize: 'clamp(14px, 3.2vmin, 20px)', whiteSpace: 'nowrap',
        boxShadow: '0 4px 0 rgba(0,0,0,.28)',
    });
    bouton.addEventListener('click', onClick);
    racine.append(gauche, bouton);
    return { racine, bouton };
}

function etatBouton(bouton, txt, bg, couleur) {
    bouton.textContent = txt;
    bouton.style.background = bg;
    bouton.style.color = couleur || '#fff';
}

let flashTimer = null;
function flash(elm, txt) {
    const ancien = '100 étoiles = 50 pièces';
    elm.textContent = txt;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { elm.textContent = ancien; }, 1800);
}

function secoue(elm) {
    elm.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
        { duration: 260 },
    );
}
