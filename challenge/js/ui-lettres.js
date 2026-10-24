// challenge/js/ui-lettres.js
// Écran « Lettres mélangées » : remettre les lettres du mot anglais dans l'ordre,
// avec la traduction française en indice. L'état vit dans partie.js.
import { creerPartieLettres, taper, effacer, suivante, resultat, ESSAIS_LETTRES } from './partie.js';
import { creer, creerEntete, bonusVolant } from './ui-commun.js';
import * as audio from './audio.js';

const BRAVO = ['Bravo !', 'Super !', 'Génial !', 'Parfait !', 'Well done!'];
const DELAI_BON = 1200;
const DELAI_SOLUTION = 2000;
const DUREE_FAUX = 600;      // le mot faux reste visible (en rouge, qui tremble) avant d'être vidé

// lancerLettres(app, jeu, questions, { onFin(resultat), onQuitter }) — rend l'écran dans `app`.
export function lancerLettres(app, jeu, questions, { onFin, onQuitter }) {
    const etat = creerPartieLettres(questions);
    let attente = null;     // setTimeout avant le mot suivant
    let effaceFaux = null;  // setTimeout qui vide le mot faux affiché
    let fini = false;

    // --- Construction de l'écran ---
    const ecran = creer('div', 'ecran jeu');
    ecran.style.setProperty('--couleur-jeu', jeu.couleur);
    const { entete, maison, progression, score } = creerEntete(jeu);
    const aide = creer('div', 'consigne-aide', 'Remets les lettres dans l\'ordre pour écrire en anglais :');
    const indice = creer('div', 'consigne lettres-indice');
    const cases = creer('div', 'lettres-cases');
    cases.lang = 'en';
    const tuilesEl = creer('div', 'lettres-tuiles');
    const message = creer('div', 'message');
    const btnEffacer = creer('button', 'btn-effacer', '⌫ Effacer');
    btnEffacer.title = 'Enlever la dernière lettre (Retour arrière)';
    const essais = creer('div', 'lettres-essais');
    ecran.append(entete, aide, indice, cases, tuilesEl, message, btnEffacer, essais);
    app.replaceChildren(ecran);

    function fermer() {
        fini = true;
        clearTimeout(attente);
        clearTimeout(effaceFaux);
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

    // Clavier physique : une lettre prend la première tuile libre de cette lettre ;
    // Retour arrière enlève la dernière lettre.
    function surTouche(ev) {
        if (ev.repeat || ev.ctrlKey || ev.altKey || ev.metaKey || fini || etat.attente) return;
        if (ev.key === 'Backspace') {
            ev.preventDefault();
            enlever();
            return;
        }
        if (ev.key.length !== 1 || !/^[a-z]$/i.test(ev.key)) return;
        const l = ev.key.toLowerCase();
        const melange = etat.questions[etat.index].melange;
        const i = melange.findIndex((c, k) => c.toLowerCase() === l && !etat.tuiles.includes(k));
        if (i >= 0) {
            ev.preventDefault();
            poser(i);
        }
    }

    function poser(i) {
        if (fini) return;
        audio.initAudio();
        const essai = [...etat.reponse, etat.questions[etat.index].melange[i]];
        const avant = etat.points;
        const nbAvant = etat.tuiles.length;
        const r = taper(etat, i);
        if (r === null && etat.tuiles.length === nbAvant) return;   // tuile refusée
        clearTimeout(effaceFaux);
        message.textContent = '';
        message.className = 'message';
        if (!r) {                                  // lettre posée, mot pas encore complet
            audio.sfxClic();
            dessiner();
            return;
        }
        if (r.juste) {
            audio.sfxBon();
            dessiner();
            cases.classList.add('correct');
            message.textContent = `${BRAVO[Math.floor(Math.random() * BRAVO.length)]} 🎉`;
            message.className = 'message bon';
            bonusVolant(ecran, cases, etat.points - avant);
            majEntete();
            attente = setTimeout(motSuivant, DELAI_BON);
        } else if (r.solution) {
            audio.sfxFaux();
            dessiner();
            cases.replaceChildren(...[...r.solution].map(c => creer('span', 'case-lettre solution', c.toUpperCase())));
            cases.classList.add('montre-solution');
            message.textContent = 'Voici le bon mot ☝️';
            message.className = 'message faux';
            majEntete();
            attente = setTimeout(motSuivant, DELAI_SOLUTION);
        } else {
            audio.sfxFaux();
            dessiner();
            // On montre un instant le mot faux, en rouge, puis les cases se vident.
            cases.replaceChildren(...essai.map(c => creer('span', 'case-lettre fausse', c.toUpperCase())));
            cases.classList.remove('secoue');
            void cases.offsetWidth;                // relance l'animation
            cases.classList.add('secoue');
            message.textContent = 'Essaie encore ! 💪';
            message.className = 'message faux';
            effaceFaux = setTimeout(dessiner, DUREE_FAUX);
        }
    }

    function enlever() {
        if (fini || etat.attente || etat.tuiles.length === 0) return;
        audio.initAudio();
        audio.sfxClic();
        effacer(etat);
        clearTimeout(effaceFaux);
        dessiner();
    }

    function motSuivant() {
        suivante(etat);
        afficher();
    }

    function majEntete() {
        progression.textContent = `Mot ${Math.min(etat.index + 1, questions.length)}/${questions.length}`;
        score.textContent = `⭐ ${etat.points}`;
    }

    // Redessine les cases de réponse, les tuiles, le bouton Effacer et les essais.
    function dessiner() {
        const q = etat.questions[etat.index];
        cases.classList.remove('secoue');
        cases.replaceChildren(...q.melange.map((_, k) => {
            const c = etat.reponse[k];
            return creer('span', c ? 'case-lettre pleine' : 'case-lettre', c ? c.toUpperCase() : '');
        }));
        tuilesEl.replaceChildren(...q.melange.map((c, i) => {
            const b = creer('button', 'tuile', c.toUpperCase());
            const utilisee = etat.tuiles.includes(i);
            b.classList.toggle('utilisee', utilisee);
            b.disabled = utilisee || etat.attente;
            b.addEventListener('click', () => poser(i));
            return b;
        }));
        btnEffacer.disabled = etat.attente || etat.tuiles.length === 0;
        const reste = ESSAIS_LETTRES - etat.erreursMot;
        essais.textContent = etat.attente ? '' : `Essais : ${'🟢'.repeat(reste)}${'⚪'.repeat(etat.erreursMot)}`;
    }

    function afficher() {
        if (etat.terminee) { terminer(); return; }
        const q = etat.questions[etat.index];
        majEntete();
        indice.textContent = `🇫🇷 ${q.fr}`;
        message.textContent = '';
        message.className = 'message';
        cases.className = 'lettres-cases';
        dessiner();
    }

    btnEffacer.addEventListener('click', enlever);
    document.addEventListener('keydown', surTouche);
    afficher();
}
