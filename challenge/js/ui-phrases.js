// challenge/js/ui-phrases.js
// Écran « Phrases en morceaux » : remettre les mots anglais dans l'ordre.
// L'état de la partie vit dans partie.js ; ce module ne fait que l'afficher.
import { creerPartiePhrases, placer, retirer, valider, suivante, resultat } from './partie.js';
import { JEUX } from './jeux.js';
import { creerEntete, bonusVolant } from './ui-commun.js';
import * as audio from './audio.js';

const JEU = JEUX.find(j => j.id === 'phrases');
const BRAVO = ['Bravo !', 'Super !', 'Génial !', 'Parfait !', 'Well done!'];
const DELAI_BON = 1200;
const DELAI_SOLUTION = 2800;

function creer(tag, classe, texte) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texte != null) el.textContent = texte;
    return el;
}

// lancerPhrases(app, questions, { onFin(resultat), onQuitter }) — rend l'écran dans `app`.
export function lancerPhrases(app, questions, { onFin, onQuitter }) {
    const etat = creerPartiePhrases(questions);
    let attente = null;     // setTimeout avant la phrase suivante
    let fini = false;

    // --- Construction de l'écran ---
    const ecran = creer('div', 'ecran jeu');
    ecran.style.setProperty('--couleur-jeu', JEU.couleur);
    const { entete, maison, progression, score } = creerEntete(JEU);
    const aide = creer('div', 'consigne-aide', 'Remets les mots anglais dans l\'ordre :');
    const consigne = creer('div', 'consigne');
    const ligne = creer('div', 'ligne-reponse');
    const etiquettes = creer('div', 'etiquettes');
    const message = creer('div', 'message');
    const verifier = creer('button', 'btn-verifier', 'Vérifier ✔️');
    ecran.append(entete, aide, consigne, ligne, etiquettes, message, verifier);
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

    // Clavier : Entrée = vérifier, Retour arrière = enlever le dernier mot.
    function surTouche(ev) {
        if (ev.repeat || fini || etat.attente) return;
        if (ev.key === 'Enter' && !verifier.disabled) {
            ev.preventDefault();
            verifierPhrase();
        } else if (ev.key === 'Backspace' && etat.reponse.length > 0) {
            ev.preventDefault();
            enlever(etat.reponse.length - 1);
        }
    }

    function poser(i) {
        if (fini) return;
        audio.initAudio();
        audio.sfxClic();
        message.textContent = '';
        placer(etat, i);
        dessiner();
    }

    function enlever(pos) {
        if (fini) return;
        audio.sfxClic();
        retirer(etat, pos);
        dessiner();
    }

    function verifierPhrase() {
        if (fini) return;
        const r = valider(etat);
        if (!r) return;                       // phrase incomplète ou déjà validée
        if (r.juste) {
            dessiner();
            ligne.classList.add('correct');
            audio.sfxBon();
            message.textContent = `${BRAVO[Math.floor(Math.random() * BRAVO.length)]} 🎉`;
            message.className = 'message bon';
            bonusVolant(ecran, ligne, r.points);
            majEntete();
            attente = setTimeout(phraseSuivante, DELAI_BON);
        } else if (r.solution) {
            audio.sfxFaux();
            dessiner();
            ligne.replaceChildren(...r.solution.map(m => creer('span', 'mot-place solution', m)));
            ligne.classList.add('montre-solution');
            message.textContent = 'Voici la bonne phrase ☝️';
            message.className = 'message faux';
            attente = setTimeout(phraseSuivante, DELAI_SOLUTION);
        } else {
            audio.sfxFaux();
            dessiner();
            message.textContent = 'Essaie encore ! 💪';
            message.className = 'message faux';
            ligne.classList.remove('secoue');
            void ligne.offsetWidth;           // relance l'animation
            ligne.classList.add('secoue');
        }
    }

    function phraseSuivante() {
        suivante(etat);
        afficher();
    }

    function majEntete() {
        progression.textContent = `${Math.min(etat.index + 1, questions.length)}/${questions.length}`;
        score.textContent = `⭐ ${etat.points}`;
    }

    // Redessine la ligne réponse, les étiquettes et le bouton Vérifier.
    function dessiner() {
        const p = etat.questions[etat.index];
        ligne.replaceChildren(...etat.reponse.map((m, pos) => {
            const b = creer('button', 'mot-place', m);
            b.title = 'Enlever ce mot';
            b.disabled = etat.attente;
            b.addEventListener('click', () => enlever(pos));
            return b;
        }));
        if (etat.reponse.length === 0) ligne.append(creer('span', 'ligne-vide', 'Clique sur les mots…'));
        etiquettes.replaceChildren(...p.melange.map((m, i) => {
            const b = creer('button', 'etiquette', m);
            const utilise = etat.utilises.includes(i);
            b.classList.toggle('utilisee', utilise);
            b.disabled = utilise || etat.attente;
            b.addEventListener('click', () => poser(i));
            return b;
        }));
        verifier.disabled = etat.attente || etat.reponse.length !== p.mots.length;
    }

    function afficher() {
        if (etat.terminee) { terminer(); return; }
        const p = etat.questions[etat.index];
        majEntete();
        consigne.textContent = `🇫🇷 ${p.consigne}`;
        message.textContent = '';
        message.className = 'message';
        ligne.className = 'ligne-reponse';
        dessiner();
    }

    verifier.addEventListener('click', verifierPhrase);
    document.addEventListener('keydown', surTouche);
    afficher();
}
