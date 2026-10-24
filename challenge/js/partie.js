// challenge/js/partie.js
// État d'une partie, sans affichage : l'écran appelle repondre()/suivante()
// et lit l'état. Le verrou `attente` empêche de compter deux réponses.
import { pointsQuestion, pointsPhrase } from './points.js';

// vies : mode Survie. Chaque mauvaise réponse retire une vie ; 0 vie termine la partie.
export function creerPartieQcm(questions, { duree = null, vies = null } = {}) {
    return { questions, index: 0, points: 0, bonnes: 0, repondues: 0, serie: 0,
        attente: false, terminee: questions.length === 0, duree, vies };
}

export function repondre(e, indexChoix, ms) {
    if (e.attente || e.terminee) return null;
    const q = e.questions[e.index];
    const juste = Boolean(q.choix[indexChoix]?.juste);
    e.serie = juste ? e.serie + 1 : 0;
    const points = pointsQuestion({ juste, ms, serie: e.serie });
    e.points += points;
    e.repondues++;
    if (juste) e.bonnes++;
    if (!juste && e.vies != null) e.vies = Math.max(0, e.vies - 1);
    e.attente = true;
    return { juste, points, bonneIndex: q.choix.findIndex(c => c.juste), vies: e.vies };
}

// Sert à tous les types de partie : remet à zéro l'état propre à la question.
export function suivante(e) {
    e.attente = false;
    e.index++;
    if ('essai' in e) { e.essai = 1; e.reponse = []; e.utilises = []; }
    if ('faites' in e) { e.faites = []; e.droitesFaites = []; e.ratees = []; e.gaucheChoisie = null; }
    if ('trouvees' in e) { e.trouvees = []; e.ratees = []; e.erreurs = 0; }
    if ('tuiles' in e) { e.reponse = []; e.tuiles = []; e.erreursMot = 0; }
    if (e.index >= e.questions.length || e.vies === 0) e.terminee = true;
}

export function tempsEcoule(e, msDepuisDebut) {
    if (e.duree != null && msDepuisDebut >= e.duree * 1000) e.terminee = true;
    return e.terminee;
}

export function resultat(e) {
    return { bonnes: e.bonnes, repondues: e.repondues, points: e.points };
}

// --- Phrases en morceaux ---

export function creerPartiePhrases(phrases) {
    return { questions: phrases, index: 0, points: 0, bonnes: 0, repondues: 0, essai: 1,
        reponse: [], utilises: [], attente: false, terminee: phrases.length === 0 };
}

// i = index de l'étiquette dans `melange`.
export function placer(e, i) {
    if (e.attente || e.utilises.includes(i)) return;
    e.utilises.push(i);
    e.reponse.push(e.questions[e.index].melange[i]);
}

// i = position dans la réponse en cours.
export function retirer(e, i) {
    if (e.attente) return;
    e.utilises.splice(i, 1);
    e.reponse.splice(i, 1);
}

export function valider(e) {
    const p = e.questions[e.index];
    if (e.attente || e.reponse.length !== p.mots.length) return null;
    const juste = e.reponse.every((m, i) => m === p.mots[i]);
    if (juste) {
        const points = pointsPhrase(e.essai);
        e.points += points;
        e.bonnes++;
        e.repondues++;
        e.attente = true;
        return { juste, points };
    }
    e.essai++;
    e.reponse = [];
    e.utilises = [];
    if (e.essai > 2) {
        e.repondues++;
        e.attente = true;
        return { juste: false, points: 0, solution: p.mots };
    }
    return { juste: false };
}

// --- Relier ---

export function creerPartieRelier(manches) {
    return { questions: manches, index: 0, points: 0, bonnes: 0, repondues: 0,
        gaucheChoisie: null, faites: [], droitesFaites: [], ratees: [], attente: false, terminee: manches.length === 0 };
}

// Renvoie null si le clic est refusé (fin, attente, index hors bornes, déjà apparié) : aucun effet.
export function choisirGauche(e, i) {
    const m = e.questions[e.index];
    if (e.attente || e.terminee || !(i >= 0 && i < m.gauche.length) || e.faites.includes(i)) return null;
    e.gaucheChoisie = i;
}

export function choisirDroite(e, j) {
    if (e.attente || e.terminee || e.gaucheChoisie == null) return null;
    const m = e.questions[e.index];
    if (!(j >= 0 && j < m.droite.length) || e.droitesFaites.includes(j)) return null;
    const i = e.gaucheChoisie;
    e.gaucheChoisie = null;
    const paire = m.paires.find(p => p.en === m.gauche[i]);
    if (paire.fr !== m.droite[j]) {
        if (!e.ratees.includes(i)) e.ratees.push(i);
        return { juste: false };
    }
    const points = e.ratees.includes(i) ? 5 : 10;
    e.faites.push(i);
    e.droitesFaites.push(j);
    e.points += points;
    e.repondues++;
    if (!e.ratees.includes(i)) e.bonnes++;
    if (e.faites.length === m.paires.length) e.attente = true;
    return { juste: true, points };
}

// --- Pendu ---

export const ERREURS_MAX = 7;
const estLettre = c => /^[a-z]$/.test(c);

export function creerPartiePendu(mots) {
    return { questions: mots, index: 0, points: 0, bonnes: 0, repondues: 0,
        trouvees: [], ratees: [], erreurs: 0, attente: false, terminee: mots.length === 0 };
}

export function masque(e) {
    if (e.terminee) return [];
    return [...e.questions[e.index].en].map(c => {
        const l = c.toLowerCase();
        if (!estLettre(l)) return c;
        return e.trouvees.includes(l) ? c : '_';
    });
}

export function proposer(e, touche) {
    if (e.attente || e.terminee) return 'ignoree';
    const l = String(touche).toLowerCase();
    if (!estLettre(l)) return 'ignoree';
    if (e.trouvees.includes(l) || e.ratees.includes(l)) return 'deja';
    const mot = e.questions[e.index].en.toLowerCase();
    if (mot.includes(l)) {
        e.trouvees.push(l);
        if (!masque(e).includes('_')) {
            const points = 10 + 2 * (ERREURS_MAX - e.erreurs);
            e.points += points;
            e.bonnes++;
            e.repondues++;
            e.attente = true;
        }
        return 'bonne';
    }
    e.ratees.push(l);
    e.erreurs++;
    if (e.erreurs >= ERREURS_MAX) {
        e.repondues++;
        e.attente = true;
    }
    return 'mauvaise';
}

// --- Lettres mélangées ---

export const ESSAIS_LETTRES = 3;

export function creerPartieLettres(mots) {
    return { questions: mots, index: 0, points: 0, bonnes: 0, repondues: 0,
        reponse: [], tuiles: [], erreursMot: 0, attente: false, terminee: mots.length === 0 };
}

// Seules les lettres de `en` sont attendues : espaces, tirets et apostrophes ne sont pas dans `melange`.
const lettresDe = texte => [...texte].filter(c => /[a-z]/i.test(c)).join('').toLowerCase();

// Renvoie null si la tuile est refusée (fin, attente, déjà utilisée, hors bornes) ou si le mot n'est pas complet.
export function taper(e, i) {
    if (e.attente || e.terminee) return null;
    const mot = e.questions[e.index];
    if (e.tuiles.includes(i) || !(i >= 0 && i < mot.melange.length)) return null;
    e.tuiles.push(i);
    e.reponse.push(mot.melange[i]);
    if (e.reponse.length < mot.melange.length) return null;
    if (e.reponse.join('').toLowerCase() === lettresDe(mot.en)) {
        const points = e.erreursMot === 0 ? 10 : 5;
        e.points += points;
        if (e.erreursMot === 0) e.bonnes++;
        e.repondues++;
        e.attente = true;
        return { juste: true, points };
    }
    e.erreursMot++;
    e.reponse = [];
    e.tuiles = [];
    if (e.erreursMot >= ESSAIS_LETTRES) {
        e.repondues++;
        e.attente = true;
        return { juste: false, points: 0, solution: mot.en };
    }
    return { juste: false };
}

export function effacer(e) {
    if (e.attente || e.terminee) return null;
    e.tuiles.pop();
    e.reponse.pop();
}
