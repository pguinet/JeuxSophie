// challenge/js/main.js — point d'entrée : écrans compte, accueil, jeu, résultat, classement.
import { charger, sauver, enregistrerPartie } from './save.js';
import { JEUX, genererPartie } from './jeux.js';
import { classement } from './classement.js';
import { avatarSVG } from './avatar.js';
import { lancerQcm } from './ui-qcm.js';
import { lancerPhrases } from './ui-phrases.js';
import { afficherCompte } from './ecran-compte.js';
import { afficherClassement } from './ecran-classement.js';
import { joueursDepasses, phraseDepasses, rangTexte } from './resultat.js';
import * as audio from './audio.js';

const app = document.getElementById('app');
let etat = charger();
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
    app.replaceChildren(ecran);
    window.scrollTo(0, 0);
}

function enregistrer(nouvelEtat) {
    etat = nouvelEtat;
    sauver(etat);
}

// --- Compte et avatar ---

function compte() {
    const p = etat.profil;
    afficherCompte(app, {
        pseudo: p?.pseudo,
        look: p?.look,
        onValider: (pseudo, look) => {
            // Modification : pseudo et date de création conservés.
            const profil = p ? { ...p, look } : { pseudo, look, creeLe: new Date().toISOString() };
            enregistrer({ ...etat, profil });
            accueil();
        },
        onAnnuler: p ? accueil : undefined,
    });
}

// --- Accueil ---

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

function accueil() {
    const lignes = classement(etat.profil, etat.total);
    const moi = lignes.find(l => l.moi);

    const ecran = creer('div', 'ecran accueil');
    const entete = creer('div', 'accueil-entete carte');
    const avatar = creer('div', 'accueil-avatar');
    avatar.innerHTML = avatarSVG(etat.profil.look, { taille: 120 });   // SVG généré, sans texte saisi

    const infos = creer('div', 'accueil-infos');
    const pseudo = creer('div', 'accueil-pseudo', etat.profil.pseudo);   // textContent
    const stats = creer('div', 'accueil-stats');
    const total = creer('span', 'badge badge-total', `⭐ ${etat.total} points`);
    const rang = creer('button', 'badge badge-rang', `🥇 ${rangTexte(moi.rang)} sur ${lignes.length}`);
    rang.title = 'Voir le classement';
    rang.addEventListener('click', () => { audio.sfxClic(); voirClassement(); });
    stats.append(total, rang);
    infos.append(pseudo, stats);

    const outils = creer('div', 'accueil-outils');
    const modifier = creer('button', 'btn-rond', '✏️');
    modifier.title = 'Modifier mon avatar';
    modifier.addEventListener('click', () => { audio.sfxClic(); compte(); });
    outils.append(modifier, boutonMuet());

    entete.append(avatar, infos, outils);

    const titre = creer('h1', 'titre-jeu titre-petit', 'The Biggest Challenge');
    const grille = creer('div', 'grille-jeux');
    grille.append(...JEUX.map(carteJeu));
    ecran.append(titre, entete, creer('h2', 'accueil-question', 'À quoi on joue ? 🎮'), grille);
    afficher(ecran);
}

function voirClassement() {
    afficherClassement(app, classement(etat.profil, etat.total), { onRetour: accueil });
}

// --- Partie et résultat ---

function jouer(jeu) {
    const avant = classement(etat.profil, etat.total);
    const questions = genererPartie(jeu.id);
    const ancienRecord = etat.meilleurs[jeu.id] ?? 0;
    const fin = (res) => {
        enregistrer(enregistrerPartie(etat, jeu.id, res.points));
        afficherResultat(jeu, res, avant, ancienRecord);
    };
    const opts = { onFin: fin, onQuitter: accueil };
    if (jeu.type === 'phrases') lancerPhrases(app, questions, opts);
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

function afficherResultat(jeu, res, avant, ancienRecord) {
    const apres = classement(etat.profil, etat.total);
    const ancien = avant.find(l => l.moi).rang;
    const nouveau = apres.find(l => l.moi).rang;
    audio.sfxFin();

    const ecran = creer('div', 'ecran resultat');
    ecran.style.setProperty('--couleur-jeu', jeu.couleur);
    const carte = creer('div', 'carte resultat-carte');
    carte.append(
        creer('div', 'resultat-jeu', `${jeu.emoji} ${jeu.nom}`),
        creer('h1', 'resultat-titre', bravo(res)),
        creer('div', 'resultat-bonnes',
            `${res.bonnes} bonne${res.bonnes > 1 ? 's' : ''} réponse${res.bonnes > 1 ? 's' : ''} sur ${res.repondues}`),
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
    rejouer.focus();
}

// --- Démarrage (paramètres de test : ?jeu=<id>, ?ecran=compte|accueil|classement) ---

function demarrer() {
    const params = new URLSearchParams(location.search);
    if (!etat.profil) { compte(); return; }
    const jeu = JEUX.find(j => j.id === params.get('jeu'));
    if (jeu) { jouer(jeu); return; }
    const ecran = params.get('ecran');
    if (ecran === 'compte') compte();
    else if (ecran === 'classement') voirClassement();
    else accueil();
}

demarrer();
