// challenge/js/jeux.js
// Les 6 jeux et la fabrication des questions d'une partie.
import { shuffle, sample } from './rng.js';
import { VOCAB } from './donnees/vocab.js';
import { GRAMMAIRE } from './donnees/grammaire.js';
import { CULTURE } from './donnees/culture.js';
import { PHRASES } from './donnees/phrases.js';

export const JEUX = [
    { id: 'quiz', nom: 'Le grand quiz', emoji: '❓', couleur: '#2563eb', type: 'qcm', chrono: 20,
        aide: '15 questions, 20 secondes chacune' },
    { id: 'image', nom: 'Image et mot', emoji: '🖼️', couleur: '#16a34a', type: 'qcm',
        aide: 'Trouve le mot anglais de l\'image' },
    { id: 'ecoute', nom: 'J\'écoute', emoji: '🎧', couleur: '#9333ea', type: 'qcm',
        aide: 'Écoute le mot et clique sur la bonne image' },
    { id: 'phrases', nom: 'Phrases en morceaux', emoji: '🧩', couleur: '#ea580c', type: 'phrases',
        aide: 'Remets les mots dans l\'ordre' },
    { id: 'course', nom: 'Course contre la montre', emoji: '⚡', couleur: '#dc2626', type: 'qcm', duree: 60,
        aide: 'Un maximum de bonnes réponses en 1 minute' },
    { id: 'culture', nom: 'Culture', emoji: '🎡', couleur: '#0891b2', type: 'qcm',
        aide: 'Londres, les fêtes, les pays anglophones…' },
];

export function slugAudio(en) {
    return en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const IMAGES = VOCAB.filter(m => m.image);

function choix(bonne, leurres, rng) {
    return shuffle([{ texte: bonne, juste: true }, ...leurres.map(t => ({ texte: t, juste: false }))], rng);
}

const norm = t => String(t).trim().toLowerCase();

// 3 leurres du même thème que `mot`, pris dans `banque`. On écarte ceux qui
// ressemblent au bon mot (même anglais, même français ou même emoji) et les
// doublons entre eux, pour que la question ait une seule bonne réponse.
function leurresMemeTheme(mot, banque, rng) {
    const vus = new Set([norm(mot.en), norm(mot.fr), mot.emoji]);
    const res = [];
    for (const m of shuffle(banque.filter(x => x.theme === mot.theme), rng)) {
        if (vus.has(norm(m.en)) || vus.has(norm(m.fr)) || vus.has(m.emoji)) continue;
        vus.add(norm(m.en)); vus.add(norm(m.fr)); vus.add(m.emoji);
        res.push(m);
        if (res.length === 3) break;
    }
    return res;
}

function qImage(mot, rng) {
    return { cle: `v:${mot.en}`, consigne: 'Comment dit-on en anglais ?', visuel: mot.emoji,
        choix: choix(mot.en, leurresMemeTheme(mot, IMAGES, rng).map(m => m.en), rng) };
}

function qEcoute(mot, rng) {
    return { cle: `v:${mot.en}`, consigne: 'Écoute et clique sur la bonne image', audio: mot.en,
        grandsChoix: true,
        choix: choix(mot.emoji, leurresMemeTheme(mot, IMAGES, rng).map(m => m.emoji), rng) };
}

function qTraduction(mot, rng) {
    return { cle: `v:${mot.en}`, consigne: `Comment dit-on « ${mot.fr} » en anglais ?`,
        choix: choix(mot.en, leurresMemeTheme(mot, VOCAB, rng).map(m => m.en), rng) };
}

// Leurres d'une question fixe, sans doublon ni copie de la bonne réponse.
function leurresDistincts(q) {
    const vus = new Set([norm(q.bonne)]);
    return q.leurres.filter(t => !vus.has(norm(t)) && vus.add(norm(t)));
}

function qFixe(q, prefixe, rng) {
    const base = { cle: `${prefixe}:${q.question}`, consigne: q.question, choix: choix(q.bonne, leurresDistincts(q), rng) };
    // Grammaire : consigne française au-dessus, trou affiché `___` (données inchangées).
    if (prefixe === 'g') {
        return { ...base, consigne: q.question.replace(/_/g, '___'), sousConsigne: 'Complète la phrase :' };
    }
    return base;
}

function qPhrase(p, rng) {
    const mots = p.en.split(' ');
    let melange = shuffle(mots, rng);
    while (melange.every((m, i) => m === mots[i])) melange = shuffle(mots, rng);
    return { cle: `p:${p.en}`, consigne: p.fr, mots, melange };
}

export function genererPartie(idJeu, rng = Math.random) {
    switch (idJeu) {
    case 'image': return sample(IMAGES, 10, rng).map(m => qImage(m, rng));
    case 'ecoute': return sample(IMAGES, 10, rng).map(m => qEcoute(m, rng));
    case 'culture': return sample(CULTURE, 10, rng).map(q => qFixe(q, 'c', rng));
    case 'phrases': return sample(PHRASES, 8, rng).map(p => qPhrase(p, rng));
    case 'quiz': return shuffle([
        ...sample(VOCAB, 5, rng).map(m => qTraduction(m, rng)),
        ...sample(GRAMMAIRE, 6, rng).map(q => qFixe(q, 'g', rng)),
        ...sample(CULTURE, 4, rng).map(q => qFixe(q, 'c', rng)),
    ], rng);
    case 'course': {
        // Alterne vocabulaire et grammaire ; 60 questions suffisent largement pour 1 minute.
        const v = shuffle(VOCAB, rng), g = shuffle(GRAMMAIRE, rng);
        return Array.from({ length: 60 }, (_, i) => (i % 2 === 0
            ? qTraduction(v[(i / 2) % v.length], rng)
            : qFixe(g[((i - 1) / 2) % g.length], 'g', rng)));
    }
    default: throw new Error(`Jeu inconnu : ${idJeu}`);
    }
}
