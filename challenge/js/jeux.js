// challenge/js/jeux.js
// Les 16 jeux et la fabrication des questions d'une partie.
import { shuffle, pick } from './rng.js';
import { tirerParNiveau, leurresProches } from './tirage.js';
import { qHeure } from './heure.js';
import { VOCAB } from './donnees/vocab.js';
import { GRAMMAIRE } from './donnees/grammaire.js';
import { PIEGES } from './donnees/pieges.js';
import { CULTURE } from './donnees/culture.js';
import { PHRASES } from './donnees/phrases.js';
import { VRAIFAUX } from './donnees/vraifaux.js';
import { CONTRAIRES } from './donnees/contraires.js';

export const JEUX = [
    { id: 'quiz', famille: 'defis', nom: 'Le grand quiz', emoji: '❓', couleur: '#2563eb', type: 'qcm', chrono: 20,
        aide: '15 questions, 20 secondes chacune' },
    { id: 'image', famille: 'mots', nom: 'Image et mot', emoji: '🖼️', couleur: '#16a34a', type: 'qcm',
        aide: 'Trouve le mot anglais de l\'image' },
    { id: 'ecoute', famille: 'ecoute', nom: 'J\'écoute', emoji: '🎧', couleur: '#9333ea', type: 'qcm',
        aide: 'Écoute le mot et clique sur la bonne image' },
    { id: 'phrases', famille: 'grammaire', nom: 'Phrases en morceaux', emoji: '🧩', couleur: '#ea580c', type: 'phrases',
        aide: 'Remets les mots dans l\'ordre' },
    { id: 'course', famille: 'defis', nom: 'Course contre la montre', emoji: '⚡', couleur: '#dc2626', type: 'qcm', duree: 60,
        aide: 'Un maximum de bonnes réponses en 1 minute' },
    { id: 'culture', famille: 'defis', nom: 'Culture', emoji: '🎡', couleur: '#0891b2', type: 'qcm',
        aide: 'Londres, les fêtes, les pays anglophones…' },
    { id: 'relier', famille: 'mots', nom: 'Relie les mots', emoji: '🔗', couleur: '#0d9488', type: 'relier',
        aide: 'Relie chaque mot anglais à sa traduction' },
    { id: 'vraifaux', famille: 'grammaire', nom: 'Vrai ou faux', emoji: '✅', couleur: '#65a30d', type: 'qcm',
        aide: 'Lis la phrase en anglais : vrai ou faux ?' },
    { id: 'intrus', famille: 'mots', nom: 'Cherche l\'intrus', emoji: '🕵️', couleur: '#7c3aed', type: 'qcm',
        aide: 'Trouve le mot qui n\'est pas de la même famille' },
    { id: 'contraires', famille: 'mots', nom: 'Les contraires', emoji: '↔️', couleur: '#db2777', type: 'qcm',
        aide: 'Trouve le contraire du mot' },
    { id: 'heure', famille: 'grammaire', nom: 'Quelle heure est-il ?', emoji: '🕒', couleur: '#0284c7', type: 'qcm',
        aide: 'Lis l\'horloge et dis l\'heure en anglais' },
    { id: 'pendu', famille: 'mots', nom: 'Le pendu', emoji: '🎈', couleur: '#e11d48', type: 'pendu',
        aide: 'Devine le mot anglais lettre par lettre' },
    { id: 'lettres', famille: 'mots', nom: 'Lettres mélangées', emoji: '🔤', couleur: '#ca8a04', type: 'lettres',
        aide: 'Remets les lettres dans l\'ordre' },
    { id: 'ecoutephrases', famille: 'ecoute', nom: 'J\'écoute des phrases', emoji: '🎧', couleur: '#6d28d9', type: 'qcm',
        aide: 'Écoute la phrase et choisis sa traduction' },
    { id: 'survie', famille: 'defis', nom: 'Survie', emoji: '❤️', couleur: '#b91c1c', type: 'qcm', vies: 3,
        aide: '3 vies : de plus en plus dur, jusqu\'où iras-tu ?' },
    { id: 'concours', famille: 'defis', nom: 'Le concours', emoji: '🏆', couleur: '#1e40af', type: 'qcm',
        aide: '45 questions, comme le vrai concours' },
];

// Thèmes de noms bien distincts pour « Cherche l'intrus ».
export const THEMES_INTRUS = ['animaux', 'nourriture', 'couleurs', 'vetements', 'ecole', 'maison', 'transports',
    'sports', 'metiers', 'nature', 'cuisine', 'corps'];
// Thèmes trop proches pour servir d'intrus l'un à l'autre (un « teacher » parmi des métiers,
// un « sink » parmi la maison…).
const THEMES_VOISINS = [['maison', 'cuisine'], ['nourriture', 'cuisine'], ['ecole', 'metiers']];
const voisins = (a, b) => THEMES_VOISINS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export function slugAudio(en) {
    return en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Mots dont l'emoji suffit à les reconnaître (Image et mot, J'écoute).
const IMAGES = VOCAB.filter(m => m.image && m.emoji);
const NIVEAUX_DURS = { 2: 0.55, 3: 0.45 };

function choix(bonne, leurres, rng) {
    return shuffle([{ texte: bonne, juste: true }, ...leurres.map(t => ({ texte: t, juste: false }))], rng);
}

const norm = t => String(t).trim().toLowerCase();

// --- Anti-doublon des parties mélangées ---

// Deux questions ne doivent pas se voir pareilles (même consigne et même image ou horloge),
// et un mot français déjà demandé (« … » d'une traduction ou d'un piège) ne revient pas.
const motsDemandes = q => (/^(v|pg):/.test(q.cle)
    ? [...q.consigne.matchAll(/«\s*([^»]+?)\s*»/g)].map(m => norm(m[1])) : []);

function creerFiltre() {
    const vues = new Set();
    const frs = new Set();
    return q => {
        const k = `${norm(q.consigne)}|${q.visuel ?? ''}|${q.visuelSVG ?? ''}|${q.audio ?? ''}`;
        const mots = motsDemandes(q);
        if (vues.has(k) || mots.some(f => frs.has(f))) return false;
        vues.add(k);
        for (const f of mots) frs.add(f);
        return true;
    };
}

// n questions acceptées par `filtre`, fabriquées dans l'ordre du tirage par niveau.
function tirerFiltre(banque, n, faire, filtre, rng) {
    const res = [];
    for (const item of tirerParNiveau(banque, banque.length, rng)) {
        if (res.length === n) break;
        const q = faire(item, rng);
        if (filtre(q)) res.push(q);
    }
    return res;
}

// --- Vocabulaire ---

function qImage(mot, rng) {
    return { cle: `v:${mot.en}`, niveau: mot.niveau, consigne: 'Comment dit-on en anglais ?', visuel: mot.emoji,
        choix: choix(mot.en, leurresProches(mot, IMAGES, 3, rng).map(m => m.en), rng) };
}

function qEcoute(mot, rng) {
    return { cle: `v:${mot.en}`, niveau: mot.niveau, consigne: 'Écoute et clique sur la bonne image', audio: mot.en,
        grandsChoix: true,
        choix: choix(mot.emoji, leurresProches(mot, IMAGES, 3, rng).map(m => m.emoji), rng) };
}

function qTraduction(mot, rng) {
    return { cle: `v:${mot.en}`, niveau: mot.niveau, consigne: `Comment dit-on « ${mot.fr} » en anglais ?`,
        choix: choix(mot.en, leurresProches(mot, VOCAB, 3, rng).map(m => m.en), rng) };
}

// --- Questions fixes (grammaire, pièges, culture) ---

// Leurres d'une question fixe, sans doublon ni copie de la bonne réponse.
function leurresDistincts(q) {
    const vus = new Set([norm(q.bonne)]);
    return q.leurres.filter(t => !vus.has(norm(t)) && vus.add(norm(t)));
}

function qFixe(q, prefixe, rng) {
    const base = { cle: `${prefixe}:${q.question}`, niveau: q.niveau, consigne: q.question,
        choix: choix(q.bonne, leurresDistincts(q), rng) };
    if (prefixe === 'c') return base;
    // Grammaire et pièges : trou affiché `___` ; les pièges posés en français n'ont pas de trou.
    if (q.question.includes('_')) {
        return { ...base, consigne: q.question.replace(/_/g, '___'), sousConsigne: 'Complète la phrase :' };
    }
    return { ...base, sousConsigne: 'Choisis la bonne réponse :' };
}

const ESTPIEGE = new Set(PIEGES);
const qGrammaire = (q, rng) => qFixe(q, ESTPIEGE.has(q) ? 'pg' : 'g', rng);

// --- Phrases ---

function qPhrase(p, rng) {
    const mots = p.en.split(' ');
    let melange = shuffle(mots, rng);
    while (melange.every((m, i) => m === mots[i])) melange = shuffle(mots, rng);
    return { cle: `p:${p.en}`, niveau: p.niveau, consigne: p.fr, mots, melange };
}

// Écoute d'une phrase : on choisit sa traduction parmi 4 (leurres de préférence du même niveau).
function qEcoutePhrase(p, rng) {
    const vus = new Set([norm(p.fr)]);
    const candidats = [...shuffle(PHRASES.filter(x => x.niveau === p.niveau), rng), ...shuffle(PHRASES, rng)];
    const leurres = [];
    for (const x of candidats) {
        if (leurres.length === 3) break;
        if (vus.has(norm(x.fr))) continue;
        vus.add(norm(x.fr));
        leurres.push(x.fr);
    }
    return { cle: `ep:${p.en}`, niveau: p.niveau, consigne: 'Écoute et choisis la bonne traduction',
        audio: p.en, slug: `phrases/${slugAudio(p.en)}`, choix: choix(p.fr, leurres, rng) };
}

// --- Vrai ou faux ---

function qVraiFaux(v) {
    return { cle: `vf:${v.en}`, niveau: v.niveau, consigne: v.en, sousConsigne: 'Vrai ou faux ?',
        choix: [{ texte: '✅ Vrai', juste: v.vrai }, { texte: '❌ Faux', juste: !v.vrai }],
        explication: v.explication };
}

// --- Contraires ---

function qContraire(p, rng) {
    const [mot, bonne] = rng() < 0.5 ? [p.a, p.b] : [p.b, p.a];
    const interdits = new Set([norm(p.a), norm(p.b)]);
    const autres = CONTRAIRES.filter(x => x !== p);
    const candidats = [...shuffle(autres.filter(x => x.niveau === p.niveau), rng), ...shuffle(autres, rng)];
    const leurres = [];
    for (const x of candidats) {
        if (leurres.length === 3) break;
        const t = rng() < 0.5 ? x.a : x.b;
        if (interdits.has(norm(t))) continue;
        interdits.add(norm(t));
        leurres.push(t);
    }
    return { cle: `ct:${p.a}/${p.b}`, niveau: p.niveau, consigne: `Quel est le contraire de « ${mot} » ?`,
        choix: choix(bonne, leurres, rng) };
}

// --- Heure ---

function qHeureNiveau(rng) {
    return { ...qHeure(rng), niveau: 2 };
}

function heuresDistinctes(n, rng) {
    const res = [];
    const vues = new Set();
    for (let essai = 0; res.length < n && essai < 1000; essai++) {
        const q = qHeureNiveau(rng);
        if (vues.has(q.cle)) continue;
        vues.add(q.cle);
        res.push(q);
    }
    return res;
}

// --- Intrus ---

// Mots qui pourraient appartenir à une autre famille sans être marqués `polyvalent`
// (agneau : animal ou viande ; eau : boisson ou nature ; arbitre : sport ou métier).
const EXCLUS_INTRUS = ['lamb', 'water', 'referee'];
// Un anglais ou un français présent dans plusieurs thèmes est ambigu pour l'intrus.
const themesDe = cle => {
    const m = new Map();
    for (const v of VOCAB) {
        const k = norm(cle(v));
        if (!m.has(k)) m.set(k, new Set());
        m.get(k).add(v.theme);
    }
    return m;
};
const THEMES_EN = themesDe(v => v.en);
const THEMES_FR = themesDe(v => v.fr);
const SANS_POLYVALENT = VOCAB.filter(m => !m.polyvalent && !EXCLUS_INTRUS.includes(m.en)
    && THEMES_EN.get(norm(m.en)).size === 1 && THEMES_FR.get(norm(m.fr)).size === 1);

// Prend dans `banque` un mot dont ni l'anglais ni le français n'est déjà dans `vus`.
function motLibre(banque, vus, rng) {
    return shuffle(banque, rng).find(m => !vus.has(norm(m.en)) && !vus.has(norm(m.fr)));
}

function qIntrus(rng, dejaPris) {
    for (let essai = 0; essai < 100; essai++) {
        const themeA = pick(THEMES_INTRUS, rng);
        const themeB = pick(THEMES_INTRUS.filter(t => t !== themeA && !voisins(t, themeA)), rng);
        const vus = new Set(dejaPris);
        const groupe = [];
        for (let i = 0; i < 3; i++) {
            const m = motLibre(SANS_POLYVALENT.filter(x => x.theme === themeA), vus, rng);
            if (!m) break;
            vus.add(norm(m.en)); vus.add(norm(m.fr));
            groupe.push(m);
        }
        const intrus = motLibre(SANS_POLYVALENT.filter(x => x.theme === themeB), vus, rng);
        if (groupe.length < 3 || !intrus) continue;
        for (const m of [...groupe, intrus]) { dejaPris.add(norm(m.en)); dejaPris.add(norm(m.fr)); }
        return { cle: `i:${intrus.en}`, niveau: Math.max(...[...groupe, intrus].map(m => m.niveau)),
            consigne: 'Trouve l\'intrus !', sousConsigne: 'Quel mot n\'est pas de la même famille ?',
            choix: choix(intrus.en, groupe.map(m => m.en), rng) };
    }
    throw new Error('Intrus : pas assez de mots');
}

// --- Relier, pendu, lettres ---

function relier(rng) {
    const vus = new Set();
    const paires = [];
    for (const m of tirerParNiveau(VOCAB, VOCAB.length, rng)) {
        if (paires.length === 15) break;
        if (vus.has(norm(m.en)) || vus.has(norm(m.fr))) continue;
        vus.add(norm(m.en)); vus.add(norm(m.fr));
        paires.push({ en: m.en, fr: m.fr });
    }
    return [0, 1, 2].map(k => {
        const ps = paires.slice(k * 5, k * 5 + 5);
        return { paires: ps, gauche: shuffle(ps.map(p => p.en), rng), droite: shuffle(ps.map(p => p.fr), rng) };
    });
}

const POUR_PENDU = VOCAB.filter(m => m.niveau >= 2 && /^[A-Za-z][A-Za-z -]{2,10}[A-Za-z]$/.test(m.en));

function pendu(rng) {
    return tirerParNiveau(POUR_PENDU, 5, rng, NIVEAUX_DURS).map(m => (m.image && m.emoji
        ? { en: m.en, fr: m.fr, emoji: m.emoji, niveau: m.niveau }
        : { en: m.en, fr: m.fr, niveau: m.niveau }));
}

const POUR_LETTRES = VOCAB.filter(m => m.niveau >= 2 && /^[a-z]{4,11}$/i.test(m.en)
    && new Set(m.en.toLowerCase()).size > 1);

function lettres(rng) {
    return tirerParNiveau(POUR_LETTRES, 8, rng, NIVEAUX_DURS).map(m => {
        const mot = m.en.toLowerCase();
        let melange = shuffle([...mot], rng);
        while (melange.join('') === mot) melange = shuffle([...mot], rng);
        return { en: m.en, fr: m.fr, niveau: m.niveau, melange };
    });
}

// --- Survie ---

// Les 7 types de la Survie : banque (filtrée par niveau) et fabrication d'une question.
const TYPES_SURVIE = [
    { banque: VOCAB, faire: qTraduction },
    { banque: GRAMMAIRE, faire: (q, rng) => qFixe(q, 'g', rng) },
    { banque: PIEGES, faire: (q, rng) => qFixe(q, 'pg', rng) },
    { banque: CULTURE, faire: (q, rng) => qFixe(q, 'c', rng) },
    { banque: CONTRAIRES, faire: qContraire },
    { heure: true },
    { banque: VRAIFAUX, faire: qVraiFaux },
];

export const NIVEAU_SURVIE = i => (i < 10 ? 1 : i < 25 ? 2 : 3);

function survie(rng) {
    const piles = new Map();   // `${type}:${niveau}` → éléments restants (mélangés)
    const pile = (t, niv) => {
        const k = `${t}:${niv}`;
        if (!piles.has(k)) piles.set(k, shuffle(TYPES_SURVIE[t].banque.filter(x => x.niveau === niv), rng));
        return piles.get(k);
    };
    const cles = new Set();
    const filtre = creerFiltre();
    const accepte = q => !cles.has(q.cle) && filtre(q);
    const res = [];
    let tour = Math.floor(rng() * TYPES_SURVIE.length);
    for (let i = 0; i < 150; i++) {
        const niv = NIVEAU_SURVIE(i);
        // Tourniquet sur les seuls types qui existent à ce niveau (l'heure est de niveau 2).
        const dispo = TYPES_SURVIE.map((_, t) => t).filter(t => !TYPES_SURVIE[t].heure || niv === 2);
        for (let d = 0; d < dispo.length; d++) {
            const t = dispo[(tour + d) % dispo.length];
            let q = null;
            if (TYPES_SURVIE[t].heure) {
                for (let essai = 0; essai < 50 && !q; essai++) {
                    const h = qHeureNiveau(rng);
                    if (accepte(h)) q = h;
                }
            } else {
                const p = pile(t, niv);
                while (p.length > 0 && !q) {
                    const c = TYPES_SURVIE[t].faire(p.pop(), rng);
                    if (accepte(c)) q = c;
                }
            }
            if (q) { cles.add(q.cle); res.push(q); break; }
        }
        tour++;
    }
    return res;
}

// --- Concours ---

function concours(rng) {
    const f = creerFiltre();
    return shuffle([
        ...tirerFiltre(PIEGES, 6, (q, r) => qFixe(q, 'pg', r), f, rng),
        ...tirerFiltre(VOCAB, 12, qTraduction, f, rng),
        ...tirerFiltre(GRAMMAIRE, 10, (q, r) => qFixe(q, 'g', r), f, rng),
        ...tirerFiltre(CULTURE, 7, (q, r) => qFixe(q, 'c', r), f, rng),
        ...heuresDistinctes(4, rng),
        ...tirerFiltre(CONTRAIRES, 3, qContraire, f, rng),
        ...tirerFiltre(VRAIFAUX, 3, qVraiFaux, f, rng),
    ], rng);
}

export function genererPartie(idJeu, rng = Math.random) {
    switch (idJeu) {
    case 'image': return tirerParNiveau(IMAGES, 10, rng).map(m => qImage(m, rng));
    case 'ecoute': return tirerParNiveau(IMAGES, 10, rng).map(m => qEcoute(m, rng));
    case 'culture': return tirerParNiveau(CULTURE, 10, rng).map(q => qFixe(q, 'c', rng));
    case 'phrases': return tirerParNiveau(PHRASES, 8, rng).map(p => qPhrase(p, rng));
    case 'quiz': {
        const f = creerFiltre();
        return shuffle([
            ...tirerFiltre(PIEGES, 2, (q, r) => qFixe(q, 'pg', r), f, rng),
            ...tirerFiltre(VOCAB, 5, qTraduction, f, rng),
            ...tirerFiltre(GRAMMAIRE, 4, (q, r) => qFixe(q, 'g', r), f, rng),
            ...tirerFiltre(CULTURE, 4, (q, r) => qFixe(q, 'c', r), f, rng),
        ], rng);
    }
    case 'course': {
        // Alterne vocabulaire et grammaire (pièges compris) ; 60 questions suffisent pour 1 minute.
        const f = creerFiltre();
        const g = tirerFiltre([...GRAMMAIRE, ...PIEGES], 30, qGrammaire, f, rng);
        const v = tirerFiltre(VOCAB, 30, qTraduction, f, rng);
        return Array.from({ length: 60 }, (_, i) => (i % 2 === 0 ? v[i / 2] : g[(i - 1) / 2]));
    }
    case 'relier': return relier(rng);
    case 'vraifaux': return tirerParNiveau(VRAIFAUX, 15, rng).map(qVraiFaux);
    case 'intrus': {
        const pris = new Set();
        return Array.from({ length: 10 }, () => qIntrus(rng, pris));
    }
    case 'contraires': return tirerParNiveau(CONTRAIRES, 12, rng).map(p => qContraire(p, rng));
    case 'heure': return heuresDistinctes(10, rng);
    case 'pendu': return pendu(rng);
    case 'lettres': return lettres(rng);
    case 'ecoutephrases': return tirerParNiveau(PHRASES, 10, rng).map(p => qEcoutePhrase(p, rng));
    case 'survie': return survie(rng);
    case 'concours': return concours(rng);
    default: throw new Error(`Jeu inconnu : ${idJeu}`);
    }
}
