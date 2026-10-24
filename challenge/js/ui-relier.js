// challenge/js/ui-relier.js
// Écran « Relie les mots » : relier chaque mot anglais (à gauche) à sa traduction (à droite).
// L'état de la partie vit dans partie.js ; ce module ne fait que l'afficher.
import { creerPartieRelier, choisirGauche, choisirDroite, suivante, resultat } from './partie.js';
import { creer, creerEntete, bonusVolant } from './ui-commun.js';
import * as audio from './audio.js';

const DELAI_MANCHE = 1000;    // pause avant la manche suivante
const DUREE_SECOUSSE = 400;   // carte rouge qui tremble après une erreur

// lancerRelier(app, jeu, questions, { onFin(resultat), onQuitter }) — rend l'écran dans `app`.
export function lancerRelier(app, jeu, questions, { onFin, onQuitter }) {
    const etat = creerPartieRelier(questions);
    const minuteurs = new Set();
    let fini = false;
    let cartesG = [];
    let cartesD = [];

    // --- Construction de l'écran ---
    const ecran = creer('div', 'ecran jeu');
    ecran.style.setProperty('--couleur-jeu', jeu.couleur);
    const { entete, maison, progression, score } = creerEntete(jeu);
    const aide = creer('div', 'consigne-aide', 'Clique sur un mot anglais, puis sur sa traduction :');
    const colonnes = creer('div', 'relier');
    const colG = creer('div', 'relier-colonne');
    const colD = creer('div', 'relier-colonne');
    colonnes.append(colG, colD);
    const message = creer('div', 'message');
    ecran.append(entete, aide, colonnes, message);
    app.replaceChildren(ecran);

    // setTimeout retenu pour pouvoir tout annuler en quittant.
    function plusTard(fn, ms) {
        const t = setTimeout(() => { minuteurs.delete(t); fn(); }, ms);
        minuteurs.add(t);
    }

    function fermer() {
        fini = true;
        minuteurs.forEach(clearTimeout);
        minuteurs.clear();
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

    function majEntete() {
        progression.textContent = `Manche ${Math.min(etat.index + 1, questions.length)}/${questions.length}`;
        score.textContent = `⭐ ${etat.points}`;
    }

    function cliquerGauche(i) {
        if (fini) return;
        audio.initAudio();
        if (choisirGauche(etat, i) === null) return;
        audio.sfxClic();
        message.textContent = '';
        message.className = 'message';
        cartesG.forEach((c, k) => c.classList.toggle('choisie', k === i));
    }

    function cliquerDroite(j) {
        if (fini) return;
        audio.initAudio();
        const i = etat.gaucheChoisie;
        if (i == null && !etat.attente && !etat.droitesFaites.includes(j)) {
            message.textContent = 'Choisis d\'abord un mot anglais 👈';
            message.className = 'message';
            return;
        }
        const r = choisirDroite(etat, j);
        if (!r) return;
        cartesG[i].classList.remove('choisie');
        if (r.juste) {
            for (const c of [cartesG[i], cartesD[j]]) {
                c.classList.add('faite');
                c.disabled = true;
            }
            audio.sfxBon();
            bonusVolant(ecran, cartesD[j], r.points);
            message.textContent = '';
            message.className = 'message';
            majEntete();
            if (etat.attente) {
                message.textContent = 'Bravo ! 🎉';
                message.className = 'message bon';
                plusTard(mancheSuivante, DELAI_MANCHE);
            }
        } else {
            audio.sfxFaux();
            message.textContent = 'Oups ! Essaie encore 💪';
            message.className = 'message faux';
            for (const c of [cartesG[i], cartesD[j]]) {
                c.classList.remove('erreur');
                void c.offsetWidth;           // relance l'animation
                c.classList.add('erreur');
            }
            plusTard(() => {
                cartesG[i]?.classList.remove('erreur');
                cartesD[j]?.classList.remove('erreur');
            }, DUREE_SECOUSSE);
        }
    }

    function mancheSuivante() {
        suivante(etat);
        afficher();
    }

    function afficher() {
        if (etat.terminee) { terminer(); return; }
        const m = etat.questions[etat.index];
        majEntete();
        message.textContent = '';
        message.className = 'message';
        cartesG = m.gauche.map((mot, i) => {
            const b = creer('button', 'carte-relier carte-en', mot);
            b.lang = 'en';
            b.addEventListener('click', () => cliquerGauche(i));
            return b;
        });
        cartesD = m.droite.map((mot, j) => {
            const b = creer('button', 'carte-relier carte-fr', mot);
            b.addEventListener('click', () => cliquerDroite(j));
            return b;
        });
        colG.replaceChildren(creer('div', 'relier-titre', '🇬🇧 English'), ...cartesG);
        colD.replaceChildren(creer('div', 'relier-titre', '🇫🇷 Français'), ...cartesD);
    }

    afficher();
}
