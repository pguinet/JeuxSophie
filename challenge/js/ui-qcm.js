// challenge/js/ui-qcm.js
// Écran de jeu pour les QCM (grand quiz, image et mot, j'écoute, course, culture).
// L'état de la partie vit dans partie.js ; ce module ne fait que l'afficher.
import { creerPartieQcm, repondre, suivante, tempsEcoule, resultat } from './partie.js';
import { slugAudio } from './jeux.js';
import * as audio from './audio.js';

const BRAVO = ['Bravo !', 'Super !', 'Génial !', 'Trop fort !', 'Bien joué !', 'Yes!'];
const OUPS = ['Oups !', 'Presque !', 'Pas grave !'];
const DELAI_BON = 900;
const DELAI_FAUX = 1400;

const auHasard = liste => liste[Math.floor(Math.random() * liste.length)];

function creer(tag, classe, texte) {
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

// lancerQcm(app, jeu, questions, { onFin(resultat), onQuitter }) — rend l'écran dans `app`.
export function lancerQcm(app, jeu, questions, { onFin, onQuitter }) {
    const etat = creerPartieQcm(questions, { duree: jeu.duree ?? null });
    const debutPartie = performance.now();
    let debutQuestion = performance.now();
    let minuteur = null;      // setInterval du chrono
    let attente = null;       // setTimeout avant la question suivante
    let attenteMot = null;    // setTimeout qui montre le mot écrit (J'écoute sans son)
    let jetonEcoute = 0;      // seul le dernier appel à prononcer() compte (question affichée incluse)
    let fini = false;
    let boutons = [];

    // --- Construction de l'écran ---
    const ecran = creer('div', 'ecran jeu');
    ecran.style.setProperty('--couleur-jeu', jeu.couleur);
    const { entete, maison, progression, score } = creerEntete(jeu);
    const chrono = creer('div', 'chrono');
    const chronoBarre = creer('div', 'chrono-barre');
    const chronoTexte = creer('div', 'chrono-texte');
    chrono.append(chronoBarre, chronoTexte);
    const aChrono = Boolean(jeu.chrono || jeu.duree);
    chrono.hidden = !aChrono;

    const consigne = creer('div', 'consigne');
    const visuel = creer('div', 'visuel');
    const choixEl = creer('div', 'choix');
    const message = creer('div', 'message');
    ecran.append(entete, chrono, consigne, visuel, choixEl, message);
    app.replaceChildren(ecran);

    function fermer() {
        fini = true;
        clearInterval(minuteur);
        clearTimeout(attente);
        clearTimeout(attenteMot);
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

    // Sur ordinateur : touches 1 à 4 pour répondre.
    function surTouche(ev) {
        if (ev.repeat || ev.ctrlKey || ev.altKey || ev.metaKey) return;
        const n = Number(ev.key);
        if (n >= 1 && n <= boutons.length) choisir(n - 1);
    }

    function majEntete() {
        progression.textContent = jeu.duree
            ? `Question ${etat.index + 1}`
            : `${Math.min(etat.index + 1, questions.length)}/${questions.length}`;
        score.textContent = `⭐ ${etat.points}`;
    }

    // i = -1 : temps écoulé (la question compte fausse).
    function choisir(i) {
        if (fini) return;
        audio.initAudio();
        const r = repondre(etat, i, performance.now() - debutQuestion);
        if (!r) return;                       // déjà répondu (double clic, touche)
        boutons.forEach(b => { b.disabled = true; });
        if (r.juste) {
            boutons[i].classList.add('correct');
            audio.sfxBon();
            message.textContent = `${auHasard(BRAVO)} 🎉`;
            message.className = 'message bon';
            bonusVolant(ecran, boutons[i], r.points);
        } else {
            if (i >= 0) boutons[i].classList.add('faux');
            if (r.bonneIndex >= 0) boutons[r.bonneIndex].classList.add('correct');
            audio.sfxFaux();
            message.textContent = i < 0 ? '⏰ Temps écoulé !' : auHasard(OUPS);
            message.className = 'message faux';
        }
        majEntete();
        attente = setTimeout(() => { suivante(etat); afficher(); }, r.juste ? DELAI_BON : DELAI_FAUX);
    }

    function ecouter(q, motEcrit) {
        const jeton = ++jetonEcoute;
        audio.initAudio();
        audio.prononcer(q.audio, slugAudio(q.audio)).then(source => {
            // Appel remplacé (autre clic 🔊 ou question suivante) : on l'ignore.
            if (fini || jeton !== jetonEcoute) return;
            // 'texte' (aucune voix) ou 'muet' (son coupé) : on montre le mot écrit.
            if (source !== 'texte' && source !== 'muet') return;
            clearTimeout(attenteMot);
            attenteMot = setTimeout(() => { motEcrit.textContent = q.audio; }, 1000);
        });
    }

    function afficher() {
        if (etat.terminee) { terminer(); return; }
        jetonEcoute++;
        clearTimeout(attenteMot);
        const q = etat.questions[etat.index];
        majEntete();
        message.textContent = '';
        message.className = 'message';
        consigne.textContent = q.consigne;

        visuel.replaceChildren();
        if (q.visuel) {
            visuel.append(creer('div', 'visuel-emoji', q.visuel));
        } else if (q.audio) {
            const hp = creer('button', 'btn-ecouter', '🔊');
            hp.title = 'Écouter encore';
            const motEcrit = creer('div', 'mot-ecrit');
            hp.addEventListener('click', () => ecouter(q, motEcrit));
            visuel.append(hp, motEcrit);
            ecouter(q, motEcrit);
        }
        visuel.hidden = !q.visuel && !q.audio;

        choixEl.classList.toggle('grands', Boolean(q.grandsChoix));
        boutons = q.choix.map((c, i) => {
            const b = creer('button', 'choix-btn');
            b.append(creer('span', 'touche', String(i + 1)), creer('span', 'choix-texte', c.texte));
            b.addEventListener('click', () => choisir(i));
            return b;
        });
        choixEl.replaceChildren(...boutons);
        debutQuestion = performance.now();
        majChrono();
    }

    // Barre de chrono : pleine et verte au départ, vide et rouge à la fin.
    // Grand quiz : la barre reste figée pendant la pause entre deux questions.
    function majChrono() {
        if (!aChrono || (jeu.chrono && etat.attente)) return;
        const total = (jeu.duree ?? jeu.chrono) * 1000;
        const depuis = jeu.duree ? debutPartie : debutQuestion;
        const reste = Math.max(0, total - (performance.now() - depuis));
        const f = reste / total;
        chronoBarre.style.width = `${f * 100}%`;
        chronoBarre.style.background = `hsl(${Math.round(f * 120)}, 80%, 45%)`;
        chronoTexte.textContent = `⏱️ ${Math.ceil(reste / 1000)} s`;
    }

    minuteur = setInterval(() => {
        const maintenant = performance.now();
        // Course : chrono global, la partie s'arrête net à 0.
        if (jeu.duree && tempsEcoule(etat, maintenant - debutPartie)) { majChrono(); terminer(); return; }
        // Grand quiz : jeu.chrono secondes par question, à 0 la question compte fausse.
        if (jeu.chrono && !etat.attente && maintenant - debutQuestion >= jeu.chrono * 1000) choisir(-1);
        majChrono();
    }, 100);
    document.addEventListener('keydown', surTouche);
    afficher();
}
