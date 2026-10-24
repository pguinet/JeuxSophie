// challenge/js/main.js — point d'entrée : écrans compte, accueil, jeu, résultat, classement.
import { charger, sauver, enregistrerPartie, pointsDuJour } from './save.js';
import { JEUX, genererPartie } from './jeux.js';
import { classement, classementJour } from './classement.js';
import { avancerFusees } from './fusees.js';
import { jourIndex } from './jour.js';
import { avatarSVG } from './avatar.js';
import { lancerQcm } from './ui-qcm.js';
import { lancerPhrases } from './ui-phrases.js';
import { lancerRelier } from './ui-relier.js';
import { lancerPendu } from './ui-pendu.js';
import { lancerLettres } from './ui-lettres.js';
import { afficherCompte } from './ecran-compte.js';
import { afficherClassement } from './ecran-classement.js';
import { joueursDepasses, phraseDepasses, rangTexte } from './resultat.js';
import * as audio from './audio.js';

const app = document.getElementById('app');
let etat = charger();
const DELAI_RESULTAT_MS = 600;   // Entrée/Espace ignorés juste après l'affichage du résultat
const RAFRAICHIR_ACCUEIL_MS = 15000;   // places de l'accueil mises à jour (les fusées bougent)

// Horloge du jeu. Paramètre de test ?maintenant=<date ISO> : le jeu démarre à cette heure-là
// (et le temps continue de s'écouler normalement).
const DECALAGE_MS = (() => {
    const t = Date.parse(new URLSearchParams(location.search).get('maintenant') ?? '');
    return Number.isFinite(t) ? t - Date.now() : 0;
})();
function horloge() {
    return new Date(Date.now() + DECALAGE_MS);
}

// Minuteur de rafraîchissement de l'écran affiché (un seul à la fois).
let minuteur = null;
function arreterMinuteur() {
    if (minuteur !== null) clearInterval(minuteur);
    minuteur = null;
}
audio.setMuet(etat.muet);

// Politique d'autoplay : le son ne peut démarrer qu'après un geste de l'enfant.
document.addEventListener('pointerdown', () => audio.initAudio(), { once: true });
document.addEventListener('keydown', () => audio.initAudio(), { once: true });

function creer(tag, classe, texte) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texte != null) el.textContent = texte;
    return el;
}

function afficher(ecran) {
    arreterMinuteur();
    app.replaceChildren(ecran);
    window.scrollTo(0, 0);
}

function enregistrer(nouvelEtat) {
    etat = nouvelEtat;
    sauver(etat);
}

// --- Compte et avatar ---

function compte() {
    arreterMinuteur();
    const p = etat.profil;
    afficherCompte(app, {
        pseudo: p?.pseudo,
        look: p?.look,
        onValider: (pseudo, look) => {
            // Modification : pseudo et date de création conservés.
            const profil = p ? { ...p, look } : { pseudo, look, creeLe: horloge().toISOString() };
            enregistrer({ ...etat, profil });
            accueil();
        },
        onAnnuler: p ? accueil : undefined,
    });
}

// --- Accueil ---

const FAMILLES = [
    { id: 'mots', titre: '📚 Les mots' },
    { id: 'grammaire', titre: '✏️ Phrases et grammaire' },
    { id: 'ecoute', titre: '🎧 L\'écoute' },
    { id: 'defis', titre: '🏆 Les défis' },
];

function boutonMuet() {
    const b = creer('button', 'btn-rond btn-muet');
    const maj = () => {
        b.textContent = audio.estMuet() ? '🔇' : '🔊';
        b.title = audio.estMuet() ? 'Remettre le son' : 'Couper le son';
    };
    b.addEventListener('click', () => {
        audio.setMuet(!audio.estMuet());
        enregistrer({ ...etat, muet: audio.estMuet() });
        maj();
        audio.sfxClic();
    });
    maj();
    return b;
}

function carteJeu(jeu) {
    const b = creer('button', 'carte-jeu');
    b.style.setProperty('--couleur-jeu', jeu.couleur);
    const record = etat.meilleurs[jeu.id];
    b.append(
        creer('span', 'carte-jeu-emoji', jeu.emoji),
        creer('span', 'carte-jeu-nom', jeu.nom),
        creer('span', 'carte-jeu-aide', jeu.aide),
        creer('span', 'carte-jeu-record', record ? `🏅 Record : ${record}` : '✨ Pas encore joué'),
    );
    b.addEventListener('click', () => { audio.initAudio(); audio.sfxClic(); jouer(jeu); });
    return b;
}

// Les joueurs fusées gagnent leurs points jusqu'à maintenant (rattrapage si le jeu était fermé).
function avancer(maintenant = horloge()) {
    if (!etat.profil) return;
    const fusees = avancerFusees(etat.fusees, { profil: etat.profil, total: etat.total, maintenant });
    enregistrer({ ...etat, fusees });
}

// Les deux classements (Total et Aujourd'hui) calculés au même instant, fusées à jour.
function classements(maintenant = horloge()) {
    avancer(maintenant);
    return {
        index: jourIndex(maintenant),
        total: classement(etat.profil, etat.total, maintenant, etat.fusees),
        jour: classementJour(etat.profil, pointsDuJour(etat, maintenant), maintenant, etat.fusees, etat.total),
    };
}

function medaille(rang, defaut) {
    return ['🥇', '🥈', '🥉'][rang - 1] ?? defaut;
}

function accueil() {

    const ecran = creer('div', 'ecran accueil');
    const entete = creer('div', 'accueil-entete carte');
    const avatar = creer('div', 'accueil-avatar');
    avatar.innerHTML = avatarSVG(etat.profil.look, { taille: 120 });   // SVG généré, sans texte saisi

    const infos = creer('div', 'accueil-infos');
    const pseudo = creer('div', 'accueil-pseudo', etat.profil.pseudo);   // textContent
    const stats = creer('div', 'accueil-stats');
    const total = creer('span', 'badge badge-total', `⭐ ${etat.total} points`);
    const rang = creer('button', 'badge badge-rang');
    rang.title = 'Voir le classement de tous les points';
    rang.addEventListener('click', () => { audio.sfxClic(); voirClassement('total'); });
    const rangJour = creer('button', 'badge badge-rang badge-jour');
    rangJour.title = 'Voir le classement du jour';
    rangJour.addEventListener('click', () => { audio.sfxClic(); voirClassement('jour'); });
    stats.append(total, rang, rangJour);
    // Places dans les deux classements (recalculées régulièrement : les fusées avancent).
    const majPlaces = () => {
        const { total: lignes, jour: lignesJour } = classements();
        const moi = lignes.find(l => l.moi);
        const moiJour = lignesJour.find(l => l.moi);
        rang.textContent = `${medaille(moi.rang, '🏆')} ${rangTexte(moi.rang)} sur ${lignes.length}`;
        rangJour.textContent = `${medaille(moiJour.rang, '☀️')} ${rangTexte(moiJour.rang)} aujourd'hui`;
    };
    majPlaces();
    infos.append(pseudo, stats);

    const outils = creer('div', 'accueil-outils');
    const modifier = creer('button', 'btn-rond', '✏️');
    modifier.title = 'Modifier mon avatar';
    modifier.addEventListener('click', () => { audio.sfxClic(); compte(); });
    outils.append(modifier, boutonMuet());

    entete.append(avatar, infos, outils);

    const titre = creer('h1', 'titre-jeu titre-petit', 'The Biggest Challenge');
    ecran.append(titre, entete, creer('h2', 'accueil-question', 'À quoi on joue ? 🎮'));
    for (const f of FAMILLES) {
        const jeux = JEUX.filter(j => j.famille === f.id);
        if (jeux.length === 0) continue;
        const section = creer('section', 'accueil-famille');
        const grille = creer('div', 'grille-jeux');
        grille.append(...jeux.map(carteJeu));
        section.append(creer('h2', 'accueil-famille-titre', f.titre), grille);
        ecran.append(section);
    }
    afficher(ecran);
    minuteur = setInterval(() => {
        if (ecran.isConnected) majPlaces();
        else arreterMinuteur();
    }, RAFRAICHIR_ACCUEIL_MS);
}

function voirClassement(onglet = 'total') {
    arreterMinuteur();
    afficherClassement(app, classements(), { onRetour: accueil, onglet, rafraichir: () => classements() });
}

// --- Partie et résultat ---

function jouer(jeu) {
    arreterMinuteur();
    const avant = classements();
    const questions = genererPartie(jeu.id);
    const ancienRecord = etat.meilleurs[jeu.id] ?? 0;
    const fin = (res) => {
        // Les fusées avancent jusqu'à la fin de la partie avec l'ancien total, puis on compte les points.
        const maintenant = horloge();
        avancer(maintenant);
        enregistrer(enregistrerPartie(etat, jeu.id, res.points, maintenant));
        afficherResultat(jeu, { ...res, total: questions.length }, avant, ancienRecord);
    };
    const opts = { onFin: fin, onQuitter: accueil };
    if (jeu.type === 'phrases') lancerPhrases(app, questions, opts);
    else if (jeu.type === 'relier') lancerRelier(app, jeu, questions, opts);
    else if (jeu.type === 'pendu') lancerPendu(app, jeu, questions, opts);
    else if (jeu.type === 'lettres') lancerLettres(app, jeu, questions, opts);
    else lancerQcm(app, jeu, questions, opts);
}

function bravo(res) {
    if (res.repondues === 0) return 'Partie terminée';
    const taux = res.bonnes / res.repondues;
    if (taux >= 0.9) return 'Incroyable ! 🤩';
    if (taux >= 0.6) return 'Bravo ! 🎉';
    if (taux >= 0.3) return 'Bien joué ! 👍';
    return 'Continue, tu progresses ! 💪';
}

// Ligne du score : dépend du jeu (concours sur le nombre de questions, survie, sinon x sur y).
function texteBonnes(jeu, res) {
    if (jeu.id === 'concours') return `🏆 ${res.bonnes} / ${res.total ?? res.repondues}`;
    if (jeu.id === 'survie') {
        return `❤️ ${res.bonnes} bonne${res.bonnes > 1 ? 's' : ''} réponse${res.bonnes > 1 ? 's' : ''} !`;
    }
    return `${res.bonnes} bonne${res.bonnes > 1 ? 's' : ''} réponse${res.bonnes > 1 ? 's' : ''} sur ${res.repondues}`;
}

function afficherResultat(jeu, res, avants, ancienRecord) {
    const apress = classements();
    const avant = avants.total, apres = apress.total;
    const ancien = avant.find(l => l.moi).rang;
    const nouveau = apres.find(l => l.moi).rang;
    // Classement du jour : si minuit est passé pendant la partie, l'ancien rang n'a plus de sens.
    const memeJour = avants.index === apress.index;
    const ancienJour = avants.jour.find(l => l.moi).rang;
    const nouveauJour = apress.jour.find(l => l.moi).rang;
    audio.sfxFin();

    const ecran = creer('div', 'ecran resultat');
    ecran.style.setProperty('--couleur-jeu', jeu.couleur);
    const carte = creer('div', 'carte resultat-carte');
    carte.append(
        creer('div', 'resultat-jeu', `${jeu.emoji} ${jeu.nom}`),
        creer('h1', 'resultat-titre', bravo(res)),
        creer('div', 'resultat-bonnes', texteBonnes(jeu, res)),
        creer('div', 'resultat-points', `+${res.points} points`),
    );
    if (res.points > ancienRecord) {
        carte.append(creer('div', 'resultat-record', '🏅 Nouveau record !'));
    }

    const rang = creer('div', 'resultat-rang');
    const avatar = creer('div', 'resultat-avatar');
    avatar.innerHTML = avatarSVG(etat.profil.look, { taille: 90 });   // SVG généré, sans texte saisi
    const texteRang = creer('div', 'resultat-rang-texte');
    if (nouveau < ancien) {
        texteRang.append(
            creer('span', 'rang-ancien', rangTexte(ancien)),
            creer('span', 'rang-fleche', '➜'),
            creer('span', 'rang-nouveau', rangTexte(nouveau)),
            creer('span', 'rang-sur', ` sur ${apres.length}`),
        );
    } else {
        texteRang.append(creer('span', 'rang-sur', `Tu es ${rangTexte(nouveau)} sur ${apres.length}`));
    }
    rang.append(avatar, texteRang);
    carte.append(rang);

    const rangJour = creer('div', 'resultat-rang-jour');
    rangJour.append(creer('span', 'rang-sur', '☀️ Aujourd\'hui : '));
    if (memeJour && nouveauJour < ancienJour) {
        rangJour.append(
            creer('span', 'rang-ancien', rangTexte(ancienJour)),
            creer('span', 'rang-fleche', '➜'),
            creer('span', 'rang-nouveau', rangTexte(nouveauJour)),
        );
    } else {
        rangJour.append(creer('span', 'rang-nouveau', rangTexte(nouveauJour)));
    }
    rangJour.append(creer('span', 'rang-sur', ` sur ${apress.jour.length}`));
    carte.append(rangJour);

    const phrase = phraseDepasses(joueursDepasses(avant, apres));
    if (phrase) carte.append(creer('div', 'resultat-depasse', `🚀 ${phrase}`));   // textContent

    const boutons = creer('div', 'resultat-boutons');
    const rejouer = creer('button', 'btn-gros btn-vert', '🔁 Rejouer');
    rejouer.addEventListener('click', () => { audio.initAudio(); audio.sfxClic(); jouer(jeu); });
    const maison = creer('button', 'btn-gros btn-blanc', '🏠 Accueil');
    maison.addEventListener('click', () => { audio.sfxClic(); accueil(); });
    boutons.append(rejouer, maison);
    carte.append(boutons);

    ecran.append(carte);
    afficher(ecran);
    // Aucun bouton focalisé, et Entrée/Espace ignorés un instant : un Entrée de trop
    // (validation de la dernière phrase) ne doit pas relancer la partie. Le clic reste possible.
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const ouvertA = performance.now();
    const filtre = ev => {
        if (!ecran.isConnected) { document.removeEventListener('keydown', filtre, true); return; }
        if ((ev.key === 'Enter' || ev.key === ' ') && performance.now() - ouvertA < DELAI_RESULTAT_MS) {
            ev.preventDefault();
            ev.stopPropagation();
        }
    };
    document.addEventListener('keydown', filtre, true);
}

// --- Démarrage (paramètres de test : ?jeu=<id>, ?ecran=compte|accueil|classement|classement-jour,
// ?maintenant=<date ISO>) ---

function demarrer() {
    const params = new URLSearchParams(location.search);
    if (!etat.profil) { compte(); return; }
    avancer();   // rattrape les gains des fusées pendant que le jeu était fermé
    const jeu = JEUX.find(j => j.id === params.get('jeu'));
    if (jeu) { jouer(jeu); return; }
    const ecran = params.get('ecran');
    if (ecran === 'compte') compte();
    else if (ecran === 'classement') voirClassement('total');
    else if (ecran === 'classement-jour') voirClassement('jour');
    else accueil();
}

demarrer();
