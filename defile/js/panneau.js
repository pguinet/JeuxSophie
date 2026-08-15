// Le panneau qui s'ouvre quand on arrive devant un meuble : la grille des
// habits du rayon, la palette de couleurs, et le bouton pour tout enlever.

import { RAYONS, paletteDe } from '../../shared/garderobe.js';

const style = (el, css) => Object.assign(el.style, css);

function bouton(texte, css) {
    const b = document.createElement('button');
    b.textContent = texte;
    style(b, Object.assign({
        fontFamily: 'inherit', cursor: 'pointer', border: 'none', color: '#fff',
        borderRadius: '18px', padding: '2vmin 4vmin',
        fontSize: 'clamp(14px, 2.6vmin, 20px)', fontWeight: 'bold',
        boxShadow: '0 4px 0 rgba(0,0,0,.28)', whiteSpace: 'nowrap',
    }, css || {}));
    return b;
}

export function initPanneau({ getTenue, onChange }) {
    // --- Le voile sombre ---
    const fond = document.createElement('div');
    style(fond, {
        position: 'fixed', inset: '0', zIndex: '30', display: 'none',
        background: 'rgba(0,0,0,.45)', alignItems: 'flex-end', justifyContent: 'center',
        fontFamily: "'Comic Sans MS', 'Baloo 2', 'Segoe UI', system-ui, sans-serif",
    });

    // --- La carte blanche ---
    const carte = document.createElement('div');
    style(carte, {
        background: '#fff9fb', width: 'min(900px, 100%)', maxHeight: '78vh',
        borderRadius: '28px 28px 0 0', padding: '2.4vmin 3vmin 3vmin',
        boxShadow: '0 -8px 30px rgba(0,0,0,.35)', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '2vmin',
    });
    fond.appendChild(carte);

    // Barre du haut : titre + fermer
    const barre = document.createElement('div');
    style(barre, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2vmin' });
    const titre = document.createElement('h2');
    style(titre, { fontSize: 'clamp(20px, 4vmin, 32px)', color: '#c2255c' });
    const fermer = bouton('✖️', { background: '#868e96', padding: '1.8vmin 3.4vmin' });
    barre.append(titre, fermer);
    carte.appendChild(barre);

    // La grille des habits
    const grille = document.createElement('div');
    style(grille, {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: '1.6vmin',
    });
    carte.appendChild(grille);

    // Le titre « couleur » + la palette
    const labelCouleur = document.createElement('div');
    style(labelCouleur, { fontSize: 'clamp(15px, 3vmin, 22px)', color: '#5f3dc4', fontWeight: 'bold' });
    const palette = document.createElement('div');
    style(palette, { display: 'flex', flexWrap: 'wrap', gap: '1.4vmin' });
    carte.append(labelCouleur, palette);

    // Le bas : enlever
    const bas = document.createElement('div');
    style(bas, { display: 'flex', justifyContent: 'center', gap: '2vmin', marginTop: '1vmin' });
    const enlever = bouton('🗑️ Enlever', { background: '#fa5252' });
    bas.appendChild(enlever);
    carte.appendChild(bas);

    document.body.appendChild(fond);

    let rayonCourant = null;

    // --- Dessin du contenu ------------------------------------------------
    function dessiner() {
        const rayon = rayonCourant;
        const tenue = getTenue();
        titre.textContent = rayon.emoji + ' ' + rayon.titre;

        // les habits
        grille.innerHTML = '';
        grille.style.display = rayon.items.length ? 'grid' : 'none';
        rayon.items.forEach((item) => {
            const choisi = tenue[rayon.champ] === item.id;
            const c = document.createElement('button');
            style(c, {
                fontFamily: 'inherit', cursor: 'pointer', borderRadius: '20px',
                border: choisi ? '4px solid #ff5fa2' : '4px solid transparent',
                background: choisi ? '#ffe3ee' : '#fff',
                boxShadow: '0 4px 0 rgba(0,0,0,.16)',
                padding: '1.4vmin 0.6vmin', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '0.6vmin', color: '#495057',
            });
            const e = document.createElement('div');
            e.textContent = item.emoji;
            style(e, { fontSize: 'clamp(30px, 6vmin, 46px)', lineHeight: '1' });
            const n = document.createElement('div');
            n.textContent = item.nom;
            style(n, { fontSize: 'clamp(12px, 2.2vmin, 16px)', textAlign: 'center' });
            c.append(e, n);
            c.addEventListener('click', () => {
                onChange(rayon.champ, item.id);
                dessiner();
            });
            grille.appendChild(c);
        });

        // les couleurs
        const champCouleur = rayon.couleursSeulement ? rayon.champ : rayon.champCouleur;
        if (champCouleur) {
            labelCouleur.style.display = '';
            palette.style.display = 'flex';
            labelCouleur.textContent = rayon.couleursSeulement
                ? '🎨 Choisis ta couleur de peau :'
                : '🎨 Change la couleur :';
            palette.innerHTML = '';
            paletteDe(rayon).forEach((couleur) => {
                const p = document.createElement('button');
                const actif = tenue[champCouleur] === couleur;
                style(p, {
                    width: 'clamp(38px, 7vmin, 54px)', height: 'clamp(38px, 7vmin, 54px)',
                    borderRadius: '50%', cursor: 'pointer', background: couleur,
                    border: actif ? '5px solid #ff5fa2' : '3px solid rgba(0,0,0,.2)',
                    boxShadow: '0 3px 0 rgba(0,0,0,.22)',
                });
                p.addEventListener('click', () => {
                    onChange(champCouleur, couleur);
                    dessiner();
                });
                palette.appendChild(p);
            });
        } else {
            labelCouleur.style.display = 'none';
            palette.style.display = 'none';
        }

        // le bouton enlever n'a pas de sens pour la couleur de peau
        enlever.style.display = rayon.couleursSeulement ? 'none' : '';
    }

    // --- Actions ----------------------------------------------------------
    enlever.addEventListener('click', () => {
        const vide = rayonCourant.items[0];   // le premier item est toujours « rien »
        onChange(rayonCourant.champ, vide.id);
        dessiner();
    });
    fermer.addEventListener('click', () => api.fermer());
    fond.addEventListener('click', (e) => { if (e.target === fond) api.fermer(); });

    const api = {
        ouvrir(id) {
            const rayon = RAYONS[id];
            if (!rayon) return;
            rayonCourant = rayon;
            dessiner();
            fond.style.display = 'flex';
        },
        fermer() {
            fond.style.display = 'none';
            rayonCourant = null;
        },
        estOuvert: () => fond.style.display !== 'none',
    };
    return api;
}
