// challenge/js/ui-pendu.js
// Écran « Le pendu » : deviner le mot anglais lettre par lettre, avec une montgolfière
// qui se dégonfle et descend à chaque erreur. L'état vit dans partie.js.
import { creerPartiePendu, proposer, masque, suivante, resultat, ERREURS_MAX } from './partie.js';
import { creer, creerEntete, bonusVolant } from './ui-commun.js';
import * as audio from './audio.js';

const BRAVO = ['Bravo !', 'Super !', 'Génial !', 'Trop fort !', 'Well done!'];
const DELAI_GAGNE = 1200;
const DELAI_PERDU = 2000;    // le mot reste affiché en rouge
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const estLettre = c => /^[a-z]$/i.test(c);

// Dessin SVG de la montgolfière après `erreurs` erreurs (0 à ERREURS_MAX).
// Uniquement des nombres calculés ici : aucun texte de l'utilisatrice.
export function svgMontgolfiere(erreurs) {
    const e = Math.max(0, Math.min(ERREURS_MAX, erreurs));
    const decor = '<ellipse cx="38" cy="40" rx="20" ry="9" fill="#fff" opacity=".85"/>'
        + '<ellipse cx="168" cy="72" rx="16" ry="7" fill="#fff" opacity=".85"/>'
        + '<rect x="0" y="204" width="200" height="16" rx="8" fill="#86efac"/>';
    let ballon;
    if (e >= ERREURS_MAX) {
        // Posée par terre, toute dégonflée.
        ballon = '<path d="M84 186 L138 192" stroke="#78350f" stroke-width="2"/>'
            + '<path d="M84 196 L140 200" stroke="#78350f" stroke-width="2"/>'
            + '<path d="M120 204 Q126 180 150 184 Q176 178 190 204 Z" fill="#ef4444"/>'
            + '<path d="M138 204 Q146 188 160 190 Q170 190 174 204 Z" fill="#fde047"/>'
            + '<rect x="70" y="184" width="28" height="20" rx="4" fill="#a16207"/>';
    } else {
        const rx = 62 * (1 - e * 0.06);
        const ry = 64 * (1 - e * 0.08);
        const panierHaut = 150 + e * 6;
        const bas = panierHaut - 22;
        const cy = bas - ry * 0.9;
        const r = n => n.toFixed(1);
        ballon = `<line x1="${r(100 - rx * 0.42)}" y1="${r(bas - 4)}" x2="88" y2="${panierHaut}" stroke="#78350f" stroke-width="2"/>`
            + `<line x1="${r(100 + rx * 0.42)}" y1="${r(bas - 4)}" x2="112" y2="${panierHaut}" stroke="#78350f" stroke-width="2"/>`
            + `<path d="M${r(100 - rx * 0.5)} ${r(cy + ry * 0.6)} L${r(100 - rx * 0.2)} ${r(bas)} L${r(100 + rx * 0.2)} ${r(bas)} L${r(100 + rx * 0.5)} ${r(cy + ry * 0.6)} Z" fill="#dc2626"/>`
            + `<ellipse cx="100" cy="${r(cy)}" rx="${r(rx)}" ry="${r(ry)}" fill="#ef4444"/>`
            + `<ellipse cx="100" cy="${r(cy)}" rx="${r(rx * 0.58)}" ry="${r(ry)}" fill="#fde047"/>`
            + `<ellipse cx="100" cy="${r(cy)}" rx="${r(rx * 0.2)}" ry="${r(ry)}" fill="#ef4444"/>`
            + `<ellipse cx="${r(100 - rx * 0.45)}" cy="${r(cy - ry * 0.45)}" rx="${r(rx * 0.12)}" ry="${r(ry * 0.2)}" fill="#fff" opacity=".45"/>`
            + `<rect x="86" y="${panierHaut}" width="28" height="20" rx="4" fill="#a16207"/>`
            + `<line x1="86" y1="${panierHaut + 7}" x2="114" y2="${panierHaut + 7}" stroke="#78350f" stroke-width="2"/>`;
    }
    return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Montgolfière">${decor}${ballon}</svg>`;
}

// lancerPendu(app, jeu, questions, { onFin(resultat), onQuitter }) — rend l'écran dans `app`.
export function lancerPendu(app, jeu, questions, { onFin, onQuitter }) {
    const etat = creerPartiePendu(questions);
    let attente = null;     // setTimeout avant le mot suivant
    let fini = false;
    const touches = new Map();   // lettre → bouton du clavier à l'écran

    // --- Construction de l'écran ---
    const ecran = creer('div', 'ecran jeu');
    ecran.style.setProperty('--couleur-jeu', jeu.couleur);
    const { entete, maison, progression, score } = creerEntete(jeu);
    const haut = creer('div', 'pendu-haut');
    const dessin = creer('div', 'pendu-dessin');
    const indice = creer('div', 'pendu-indice');
    const indiceEmoji = creer('div', 'pendu-emoji');
    const indiceTexte = creer('div', 'consigne');
    const vies = creer('div', 'pendu-vies');
    indice.append(creer('div', 'consigne-aide', 'Trouve le mot anglais :'), indiceEmoji, indiceTexte, vies);
    haut.append(dessin, indice);
    const mot = creer('div', 'pendu-mot');
    mot.lang = 'en';
    const message = creer('div', 'message');
    const clavier = creer('div', 'clavier');
    for (const l of ALPHABET) {
        const b = creer('button', 'cle', l.toUpperCase());
        b.addEventListener('click', () => jouer(l));
        touches.set(l, b);
        clavier.append(b);
    }
    ecran.append(entete, haut, mot, message, clavier);
    app.replaceChildren(ecran);

    function fermer() {
        fini = true;
        clearTimeout(attente);
        document.removeEventListener('keydown', surTouche);
    }

    function terminer() {
        if (fini) return;
        fermer();
        onFin(resultat(etat));
    }

    maison.addEventListener('click', () => {
        audio.sfxClic();
        fermer();
        onQuitter();
    });

    // Clavier physique : une lettre = une proposition.
    function surTouche(ev) {
        if (ev.repeat || ev.ctrlKey || ev.altKey || ev.metaKey || fini || etat.attente) return;
        if (ev.key.length !== 1 || !estLettre(ev.key)) return;
        ev.preventDefault();
        jouer(ev.key.toLowerCase());
    }

    function jouer(l) {
        if (fini) return;
        audio.initAudio();
        const avant = etat.points;
        const r = proposer(etat, l);
        if (r === 'ignoree') return;
        if (r === 'deja') {
            message.textContent = 'Tu as déjà essayé cette lettre 😉';
            message.className = 'message';
            return;
        }
        message.textContent = '';
        message.className = 'message';
        if (r === 'bonne') audio.sfxBon(); else audio.sfxFaux();
        dessiner();
        if (r === 'mauvaise') {
            dessin.classList.remove('secoue');
            void dessin.offsetWidth;           // relance l'animation
            dessin.classList.add('secoue');
        }
        if (!etat.attente) return;
        // Mot fini : gagné ou perdu.
        majEntete();
        if (etat.erreurs >= ERREURS_MAX) {
            message.textContent = 'Perdu ! Voici le mot ☝️';
            message.className = 'message faux';
            attente = setTimeout(motSuivant, DELAI_PERDU);
        } else {
            message.textContent = `${BRAVO[Math.floor(Math.random() * BRAVO.length)]} 🎉`;
            message.className = 'message bon';
            bonusVolant(ecran, mot, etat.points - avant);
            attente = setTimeout(motSuivant, DELAI_GAGNE);
        }
    }

    function motSuivant() {
        suivante(etat);
        afficher();
    }

    function majEntete() {
        progression.textContent = `Mot ${Math.min(etat.index + 1, questions.length)}/${questions.length}`;
        score.textContent = `⭐ ${etat.points}`;
    }

    // Redessine la montgolfière, le mot masqué et le clavier.
    function dessiner() {
        const q = etat.questions[etat.index];
        const perdu = etat.erreurs >= ERREURS_MAX;
        const gagne = etat.attente && !perdu;
        // SVG généré par svgMontgolfiere (nombres seulement) : innerHTML sans risque.
        dessin.innerHTML = svgMontgolfiere(etat.erreurs);
        const reste = ERREURS_MAX - etat.erreurs;
        vies.textContent = reste > 0 ? `${'🎈'.repeat(reste)} ${reste} essai${reste > 1 ? 's' : ''}` : '💨 Plus d\'essai';
        const visible = masque(etat);
        mot.classList.toggle('gagne', gagne);
        mot.classList.toggle('perdu', perdu);
        mot.replaceChildren(...[...q.en].map((c, k) => {
            if (c === ' ') return creer('span', 'case-espace');
            if (!estLettre(c)) return creer('span', 'case-signe', c);
            const cachee = visible[k] === '_';
            const span = creer('span', 'case-lettre', cachee && !perdu ? '' : c.toUpperCase());
            if (cachee && perdu) span.classList.add('manquee');
            return span;
        }));
        for (const [l, b] of touches) {
            const bonne = etat.trouvees.includes(l);
            const ratee = etat.ratees.includes(l);
            b.classList.toggle('bonne', bonne);
            b.classList.toggle('mauvaise', ratee);
            b.disabled = bonne || ratee || etat.attente;
        }
    }

    function afficher() {
        if (etat.terminee) { terminer(); return; }
        const q = etat.questions[etat.index];
        majEntete();
        indiceEmoji.textContent = q.emoji ?? '';
        indiceEmoji.hidden = !q.emoji;
        indiceTexte.textContent = `🇫🇷 ${q.fr}`;
        message.textContent = '';
        message.className = 'message';
        dessin.classList.remove('secoue');
        dessiner();
    }

    document.addEventListener('keydown', surTouche);
    afficher();
}
