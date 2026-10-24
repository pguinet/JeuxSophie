// challenge/js/partie.js
// État d'une partie, sans affichage : l'écran appelle repondre()/suivante()
// et lit l'état. Le verrou `attente` empêche de compter deux réponses.
import { pointsQuestion, pointsPhrase } from './points.js';

export function creerPartieQcm(questions, { duree = null } = {}) {
    return { questions, index: 0, points: 0, bonnes: 0, repondues: 0, serie: 0,
        attente: false, terminee: questions.length === 0, duree };
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
    e.attente = true;
    return { juste, points, bonneIndex: q.choix.findIndex(c => c.juste) };
}

// Sert aux deux types de partie : remet aussi à zéro l'essai en cours des phrases.
export function suivante(e) {
    e.attente = false;
    e.index++;
    if ('essai' in e) { e.essai = 1; e.reponse = []; e.utilises = []; }
    if (e.index >= e.questions.length) e.terminee = true;
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
