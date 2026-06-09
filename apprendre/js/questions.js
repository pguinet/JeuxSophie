// Banque de questions du jeu éducatif.
// Chaque thème expose make(level) qui fabrique une question aléatoire :
//   { prompt, visual (HTML optionnel), choices: [{ label, correct }] }
// `level` est l'indice de la classe choisie (0 = GS … 5 = CM2).
// Pour ajouter une matière, il suffit d'ajouter un thème dans THEMES.

export const QUESTIONS_PER_GAME = 10;

// Classes de l'école primaire, de la plus facile à la plus difficile.
export const LEVELS = [
    { id: 'gs', name: 'GS' },
    { id: 'cp', name: 'CP' },
    { id: 'ce1', name: 'CE1' },
    { id: 'ce2', name: 'CE2' },
    { id: 'cm1', name: 'CM1' },
    { id: 'cm2', name: 'CM2' },
];
export const DEFAULT_LEVEL = 1; // CP

function clampLevel(level) {
    return Math.max(0, Math.min(LEVELS.length - 1, level | 0));
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Construit les boutons de réponse : la bonne + des leurres uniques, mélangés.
function buildChoices(correct, distractors, count = 4) {
    const set = new Set([String(correct)]);
    for (const d of shuffle(distractors.map(String))) {
        if (set.size >= count) break;
        set.add(d);
    }
    return shuffle([...set]).map(label => ({ label, correct: label === String(correct) }));
}

// Leurres numériques proches de la bonne réponse (jamais sous `min`).
function numericDistractors(value, min = 0) {
    const out = new Set();
    const near = value >= 30 ? [1, 2, 10, 20, -1, -2, -10] : [1, 2, 3, 4, -1, -2, -3, -4];
    for (const d of near) {
        const v = value + d;
        if (v >= min && v !== value) out.add(v);
    }
    return [...out];
}

// --- Le calcul : la difficulté grimpe avec la classe ---
// addMax : plus grand résultat des +/− ; tables : tables de multiplication ;
// div : autorise la division.
const CALCUL_BY_LEVEL = [
    { ops: ['+'], addMax: 5 },                                                   // GS
    { ops: ['+', '−'], addMax: 10 },                                             // CP
    { ops: ['+', '−', '×'], addMax: 20, tables: [2, 5, 10] },                    // CE1
    { ops: ['+', '−', '×'], addMax: 100, tables: [2, 3, 4, 5, 10] },             // CE2
    { ops: ['+', '−', '×', '÷'], addMax: 100, tables: [2, 3, 4, 5, 6, 7, 8, 9, 10] }, // CM1
    { ops: ['+', '−', '×', '÷'], addMax: 1000, tables: [2, 3, 4, 5, 6, 7, 8, 9, 10] }, // CM2
];

function makeCalcul(level) {
    const cfg = CALCUL_BY_LEVEL[clampLevel(level)];
    const op = cfg.ops[randInt(0, cfg.ops.length - 1)];
    let a, b, res, sign;
    if (op === '+') {
        a = randInt(0, cfg.addMax); b = randInt(0, cfg.addMax - a); res = a + b; sign = '+';
    } else if (op === '−') {
        a = randInt(1, cfg.addMax); b = randInt(0, a); res = a - b; sign = '−';
    } else if (op === '×') {
        a = cfg.tables[randInt(0, cfg.tables.length - 1)]; b = randInt(1, 10); res = a * b; sign = '×';
    } else { // division : on part d'une multiplication pour tomber juste
        b = cfg.tables[randInt(0, cfg.tables.length - 1)]; res = randInt(1, 10); a = b * res; sign = '÷';
    }
    return {
        prompt: `Combien font ${a} ${sign} ${b} ?`,
        visual: `<div class="big-sum">${a} ${sign} ${b}</div>`,
        choices: buildChoices(res, numericDistractors(res)),
    };
}

// --- Compter : on montre N images, combien y en a-t-il ? ---
const COUNT_EMOJIS = ['🍎', '🐱', '⭐', '🍓', '🎈', '🐶', '🌸', '🚗', '🦋', '🍌'];
const COUNT_MAX_BY_LEVEL = [5, 10, 15, 20, 20, 20];
function makeCompter(level) {
    const max = COUNT_MAX_BY_LEVEL[clampLevel(level)];
    const n = randInt(1, max);
    const emoji = COUNT_EMOJIS[randInt(0, COUNT_EMOJIS.length - 1)];
    const items = Array.from({ length: n }, () => `<span>${emoji}</span>`).join('');
    return {
        prompt: 'Combien y en a-t-il ?',
        visual: `<div class="count-grid">${items}</div>`,
        choices: buildChoices(n, numericDistractors(n, 1)),
    };
}

// Choisit la cible + ses leurres dans une banque, en privilégiant les éléments
// "confondables" (même `group`) quand `hard` est vrai — c'est ce qui rend le
// niveau CM2 vraiment difficile (ex. distinguer indigo / azur / cyan / bleu).
function questionFrom(bank, target, hard) {
    const others = bank.filter(x => x.name !== target.name);
    let distractors;
    if (hard && target.group) {
        const same = shuffle(others.filter(x => x.group === target.group)).map(x => x.name);
        const rest = shuffle(others.filter(x => x.group !== target.group)).map(x => x.name);
        distractors = [...same, ...rest];
    } else {
        distractors = shuffle(others).map(x => x.name);
    }
    return buildChoices(target.name, distractors);
}

// --- Les couleurs : pastille à nommer. Pool et difficulté croissants ; CM2 = nuances subtiles ---
// group = famille de couleur (sert à fabriquer des leurres trompeurs en CM2).
const COLORS = [
    // tier 0 — couleurs de base (toutes classes)
    { name: 'rouge', css: '#e63946', tier: 0, group: 'rouge' },
    { name: 'bleu', css: '#1d72c4', tier: 0, group: 'bleu' },
    { name: 'vert', css: '#2a9d3f', tier: 0, group: 'vert' },
    { name: 'jaune', css: '#f4c20d', tier: 0, group: 'jaune' },
    { name: 'orange', css: '#f3722c', tier: 0, group: 'orange' },
    { name: 'rose', css: '#e84aa0', tier: 0, group: 'rose' },
    { name: 'violet', css: '#7b2cbf', tier: 0, group: 'violet' },
    { name: 'marron', css: '#8d5524', tier: 0, group: 'marron' },
    // tier 1 — à partir du CE1
    { name: 'gris', css: '#9aa0a6', tier: 1, group: 'gris' },
    { name: 'noir', css: '#1f2126', tier: 1, group: 'gris' },
    { name: 'turquoise', css: '#1abc9c', tier: 1, group: 'vert' },
    { name: 'beige', css: '#e6d6ad', tier: 1, group: 'marron' },
    // tier 2 — nuances subtiles, réservées au CM2
    { name: 'indigo', css: '#3f3cbb', tier: 2, group: 'bleu' },
    { name: 'cyan', css: '#22d3ee', tier: 2, group: 'bleu' },
    { name: 'azur', css: '#4aa3ff', tier: 2, group: 'bleu' },
    { name: 'émeraude', css: '#0f9d58', tier: 2, group: 'vert' },
    { name: 'olive', css: '#7f8c1f', tier: 2, group: 'vert' },
    { name: 'magenta', css: '#d6249f', tier: 2, group: 'rose' },
    { name: 'fuchsia', css: '#e0218a', tier: 2, group: 'rose' },
    { name: 'corail', css: '#ff6f61', tier: 2, group: 'orange' },
    { name: 'saumon', css: '#fa8072', tier: 2, group: 'orange' },
    { name: 'bordeaux', css: '#6e0d25', tier: 2, group: 'rouge' },
    { name: 'lilas', css: '#b497d6', tier: 2, group: 'violet' },
    { name: 'prune', css: '#701c45', tier: 2, group: 'violet' },
    { name: 'ocre', css: '#cc7722', tier: 2, group: 'marron' },
];
function makeCouleur(level) {
    const L = clampLevel(level);
    const hard = L >= 5;
    const maxTier = L >= 5 ? 2 : L >= 2 ? 1 : 0;
    const pool = COLORS.filter(c => c.tier <= maxTier);
    // En CM2 la cible est une nuance subtile (tier 2) pour forcer la connaissance.
    const targets = hard ? COLORS.filter(c => c.tier === 2) : pool;
    const target = targets[randInt(0, targets.length - 1)];
    return {
        prompt: 'Quelle est cette couleur ?',
        visual: `<div class="color-blob" style="background:${target.css}"></div>`,
        choices: questionFrom(pool, target, hard),
    };
}

// --- Les formes : dessinées en SVG. CM2 = polygones avancés à distinguer ---
function regularPolygon(n, rot = -Math.PI / 2, r = 44, cx = 50, cy = 52) {
    const pts = [];
    for (let i = 0; i < n; i++) {
        const a = rot + i * 2 * Math.PI / n;
        pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}"/>`;
}
function starShape(spikes = 5, outer = 46, inner = 19, cx = 50, cy = 52) {
    const pts = [];
    for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = -Math.PI / 2 + i * Math.PI / spikes;
        pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}"/>`;
}
function svgShape(inner, color = '#fa5252') {
    return `<svg class="shape-svg" viewBox="0 0 100 100"><g fill="${color}">${inner}</g></svg>`;
}

const SHAPES = [
    // tier 0 — formes simples (toutes classes)
    { name: 'rond', tier: 0, svg: '<circle cx="50" cy="50" r="42"/>' },
    { name: 'carré', tier: 0, group: 'quad', svg: '<rect x="12" y="12" width="76" height="76" rx="3"/>' },
    { name: 'triangle', tier: 0, svg: regularPolygon(3) },
    { name: 'étoile', tier: 0, svg: starShape(5) },
    { name: 'cœur', tier: 0, svg: '<path d="M50,86 C10,58 12,22 34,22 C45,22 50,32 50,32 C50,32 55,22 66,22 C88,22 90,58 50,86 Z"/>' },
    // tier 1 — à partir du CE1
    { name: 'losange', tier: 1, group: 'quad', svg: '<polygon points="50,6 90,50 50,94 10,50"/>' },
    { name: 'rectangle', tier: 1, group: 'quad', svg: '<rect x="6" y="26" width="88" height="48" rx="3"/>' },
    { name: 'ovale', tier: 1, svg: '<ellipse cx="50" cy="50" rx="45" ry="30"/>' },
    // tier 2 — géométrie avancée, réservée au CM2
    { name: 'pentagone', tier: 2, group: 'poly', svg: regularPolygon(5) },
    { name: 'hexagone', tier: 2, group: 'poly', svg: regularPolygon(6, 0) },
    { name: 'heptagone', tier: 2, group: 'poly', svg: regularPolygon(7) },
    { name: 'octogone', tier: 2, group: 'poly', svg: regularPolygon(8, Math.PI / 8) },
    { name: 'trapèze', tier: 2, group: 'quad', svg: '<polygon points="24,26 76,26 94,78 6,78"/>' },
    { name: 'parallélogramme', tier: 2, group: 'quad', svg: '<polygon points="30,26 94,26 70,78 6,78"/>' },
    { name: 'demi-cercle', tier: 2, svg: '<path d="M6,64 A44,44 0 0 1 94,64 Z"/>' },
];
function makeForme(level) {
    const L = clampLevel(level);
    const hard = L >= 5;
    const maxTier = L >= 5 ? 2 : L >= 2 ? 1 : 0;
    const pool = SHAPES.filter(s => s.tier <= maxTier);
    const targets = hard ? SHAPES.filter(s => s.tier === 2) : pool;
    const target = targets[randInt(0, targets.length - 1)];
    return {
        prompt: 'Quelle est cette forme ?',
        visual: svgShape(target.svg),
        choices: questionFrom(pool, target, hard),
    };
}

// --- L'alphabet : « après » seul aux petites classes, « avant » et « 2 après » ensuite ---
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function makeLettre(level) {
    const L = clampLevel(level);
    let kind = 'after';
    if (L >= 3) kind = ['after', 'before', 'after2'][randInt(0, 2)];
    else if (L === 2) kind = ['after', 'before'][randInt(0, 1)];

    let cur, ans, prompt, vis;
    if (kind === 'after') {
        const i = randInt(0, 24); cur = ALPHABET[i]; ans = ALPHABET[i + 1];
        prompt = `Quelle lettre vient après ${cur} ?`; vis = `${cur} → ?`;
    } else if (kind === 'before') {
        const i = randInt(1, 25); cur = ALPHABET[i]; ans = ALPHABET[i - 1];
        prompt = `Quelle lettre vient avant ${cur} ?`; vis = `? → ${cur}`;
    } else { // 2 lettres après
        const i = randInt(0, 23); cur = ALPHABET[i]; ans = ALPHABET[i + 2];
        prompt = `Quelle lettre vient 2 lettres après ${cur} ?`; vis = `${cur} → ? → ?`;
    }
    const others = ALPHABET.split('').filter(l => l !== ans);
    return { prompt, visual: `<div class="big-letter">${vis}</div>`, choices: buildChoices(ans, others) };
}

// ===========================================================================
//  Jeux avancés — débloqués dans les grandes classes (voir minLevel ci-dessous)
// ===========================================================================

// --- Conjugaison : verbes du 1er groupe (-er) au présent ---
const VERBES_ER = [
    'chanter', 'danser', 'jouer', 'parler', 'regarder', 'donner', 'trouver', 'sauter',
    'dessiner', 'écouter', 'marcher', 'montrer', 'fermer', 'laver', 'pousser', 'tirer',
    'porter', 'gagner', 'attraper', 'rouler', 'grimper', 'plier', 'goûter', 'dépenser',
];
const PRONOMS = [['je', 'e'], ['tu', 'es'], ['il', 'e'], ['nous', 'ons'], ['vous', 'ez'], ['ils', 'ent']];
function makeConjugaison() {
    const verbe = VERBES_ER[randInt(0, VERBES_ER.length - 1)];
    const stem = verbe.slice(0, -2); // retire la terminaison « er »
    const [pron, end] = PRONOMS[randInt(0, PRONOMS.length - 1)];
    const ENDINGS = ['e', 'es', 'ons', 'ez', 'ent', 'é']; // « é » = leurre (participe passé)
    const distractors = ENDINGS.filter(e => e !== end).map(e => stem + e);
    return {
        prompt: `Conjugue « ${verbe} » avec « ${pron} »`,
        visual: `<div class="big-letter">${pron} …</div>`,
        choices: buildChoices(stem + end, distractors),
    };
}

// --- Nombres en lettres : écriture française correcte de 1 à 9999 ---
const NUM_UNITS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const NUM_TENS = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante', 8: 'quatre-vingt' };
function below100(n) {
    if (n < 20) return NUM_UNITS[n];
    const t = Math.floor(n / 10), u = n % 10;
    if (t === 7) {
        if (u === 0) return 'soixante-dix';
        if (u === 1) return 'soixante et onze';
        return 'soixante-' + NUM_UNITS[10 + u];
    }
    if (t === 9) return 'quatre-vingt-' + NUM_UNITS[10 + u];
    if (t === 8 && u === 0) return 'quatre-vingts';
    const w = NUM_TENS[t];
    if (u === 0) return w;
    if (u === 1 && t !== 8) return w + ' et un';
    return w + '-' + NUM_UNITS[u];
}
function below1000(n) {
    if (n < 100) return below100(n);
    const h = Math.floor(n / 100), r = n % 100;
    const w = h === 1 ? 'cent' : NUM_UNITS[h] + ' cent';
    if (r === 0) return h > 1 ? w + 's' : w;
    return w + ' ' + below100(r);
}
export function numberToFrench(n) {
    if (n < 1000) return below1000(n);
    const th = Math.floor(n / 1000), r = n % 1000;
    const w = th === 1 ? 'mille' : below1000(th) + ' mille';
    return r === 0 ? w : w + ' ' + below1000(r);
}
function makeNombreLettres(level) {
    const L = clampLevel(level);
    const [min, max] = L >= 5 ? [1000, 9999] : L >= 4 ? [100, 9999] : [100, 999];
    const n = randInt(min, max);
    const distractors = [];
    for (const c of [n + 1, n - 1, n + 10, n - 10, n + 100, n - 100, n + 2, n - 2]) {
        if (c >= 1 && c <= 9999 && c !== n) distractors.push(numberToFrench(c));
    }
    return {
        prompt: "Comment s'écrit ce nombre ?",
        visual: `<div class="big-sum">${n}</div>`,
        choices: buildChoices(numberToFrench(n), distractors),
    };
}

// --- Les fractions : la moitié / le tiers / le quart… d'un nombre ---
const FRACTIONS = [
    { name: 'la moitié', d: 2 },
    { name: 'le tiers', d: 3 },
    { name: 'le quart', d: 4 },
    { name: 'le cinquième', d: 5 },
    { name: 'le dixième', d: 10 },
];
function makeFraction() {
    const fr = FRACTIONS[randInt(0, FRACTIONS.length - 1)];
    const total = fr.d * randInt(2, 12);
    const ans = total / fr.d;
    return {
        prompt: `Combien fait ${fr.name} de ${total} ?`,
        visual: `<div class="big-sum">${total}</div>`,
        choices: buildChoices(ans, numericDistractors(ans, 1)),
    };
}

// --- Les mesures : conversions d'unités ---
const MESURES = [
    { q: 'km', a: 'm', f: 1000 }, { q: 'm', a: 'cm', f: 100 }, { q: 'cm', a: 'mm', f: 10 },
    { q: 'kg', a: 'g', f: 1000 }, { q: 'L', a: 'mL', f: 1000 }, { q: 'L', a: 'cL', f: 100 },
    { q: 'h', a: 'min', f: 60 }, { q: 'min', a: 's', f: 60 }, { q: 'jour', a: 'h', f: 24 },
];
function makeMesure() {
    const m = MESURES[randInt(0, MESURES.length - 1)];
    const k = randInt(1, 9);
    const ans = k * m.f;
    const candidates = [ans * 10, Math.round(ans / 10), k, ans + m.f, ans - m.f];
    const distractors = candidates.filter(v => v > 0 && v !== ans);
    return {
        prompt: `${k} ${m.q} = ? ${m.a}`,
        visual: `<div class="big-sum">${k} ${m.q}</div>`,
        choices: buildChoices(ans, distractors),
    };
}

// --- Les capitales du monde (CM2) ---
// 47 pays des 5 continents, avec des « pièges » (Canberra, Washington, Brasília…).
// pays = forme avec article pour la question ; court = nom seul (réponse "à l'envers") ;
// cont = continent (sert à fabriquer des leurres trompeurs, du même continent).
const PAYS = [
    // Europe
    { pays: 'la France', court: 'France', cap: 'Paris', cont: 'Europe' },
    { pays: "l'Italie", court: 'Italie', cap: 'Rome', cont: 'Europe' },
    { pays: "l'Espagne", court: 'Espagne', cap: 'Madrid', cont: 'Europe' },
    { pays: "l'Allemagne", court: 'Allemagne', cap: 'Berlin', cont: 'Europe' },
    { pays: 'le Portugal', court: 'Portugal', cap: 'Lisbonne', cont: 'Europe' },
    { pays: 'la Belgique', court: 'Belgique', cap: 'Bruxelles', cont: 'Europe' },
    { pays: 'le Royaume-Uni', court: 'Royaume-Uni', cap: 'Londres', cont: 'Europe' },
    { pays: 'la Suisse', court: 'Suisse', cap: 'Berne', cont: 'Europe' },
    { pays: 'les Pays-Bas', court: 'Pays-Bas', cap: 'Amsterdam', cont: 'Europe' },
    { pays: 'la Grèce', court: 'Grèce', cap: 'Athènes', cont: 'Europe' },
    { pays: "l'Autriche", court: 'Autriche', cap: 'Vienne', cont: 'Europe' },
    { pays: 'la Pologne', court: 'Pologne', cap: 'Varsovie', cont: 'Europe' },
    { pays: 'la Suède', court: 'Suède', cap: 'Stockholm', cont: 'Europe' },
    { pays: 'la Norvège', court: 'Norvège', cap: 'Oslo', cont: 'Europe' },
    { pays: "l'Irlande", court: 'Irlande', cap: 'Dublin', cont: 'Europe' },
    { pays: 'le Danemark', court: 'Danemark', cap: 'Copenhague', cont: 'Europe' },
    { pays: 'la Finlande', court: 'Finlande', cap: 'Helsinki', cont: 'Europe' },
    { pays: 'la Hongrie', court: 'Hongrie', cap: 'Budapest', cont: 'Europe' },
    { pays: 'la Roumanie', court: 'Roumanie', cap: 'Bucarest', cont: 'Europe' },
    { pays: 'la Croatie', court: 'Croatie', cap: 'Zagreb', cont: 'Europe' },
    { pays: 'la Russie', court: 'Russie', cap: 'Moscou', cont: 'Europe' },
    // Asie
    { pays: 'la Turquie', court: 'Turquie', cap: 'Ankara', cont: 'Asie' },
    { pays: 'le Japon', court: 'Japon', cap: 'Tokyo', cont: 'Asie' },
    { pays: 'la Chine', court: 'Chine', cap: 'Pékin', cont: 'Asie' },
    { pays: "l'Inde", court: 'Inde', cap: 'New Delhi', cont: 'Asie' },
    { pays: 'la Corée du Sud', court: 'Corée du Sud', cap: 'Séoul', cont: 'Asie' },
    { pays: 'la Thaïlande', court: 'Thaïlande', cap: 'Bangkok', cont: 'Asie' },
    { pays: 'le Vietnam', court: 'Vietnam', cap: 'Hanoï', cont: 'Asie' },
    { pays: "l'Indonésie", court: 'Indonésie', cap: 'Jakarta', cont: 'Asie' },
    { pays: "l'Arabie saoudite", court: 'Arabie saoudite', cap: 'Riyad', cont: 'Asie' },
    // Afrique
    { pays: 'le Maroc', court: 'Maroc', cap: 'Rabat', cont: 'Afrique' },
    { pays: "l'Égypte", court: 'Égypte', cap: 'Le Caire', cont: 'Afrique' },
    { pays: "l'Afrique du Sud", court: 'Afrique du Sud', cap: 'Pretoria', cont: 'Afrique' },
    { pays: 'le Sénégal', court: 'Sénégal', cap: 'Dakar', cont: 'Afrique' },
    { pays: 'le Kenya', court: 'Kenya', cap: 'Nairobi', cont: 'Afrique' },
    { pays: "l'Algérie", court: 'Algérie', cap: 'Alger', cont: 'Afrique' },
    { pays: 'la Tunisie', court: 'Tunisie', cap: 'Tunis', cont: 'Afrique' },
    { pays: 'le Nigeria', court: 'Nigeria', cap: 'Abuja', cont: 'Afrique' },
    // Amérique
    { pays: 'les États-Unis', court: 'États-Unis', cap: 'Washington', cont: 'Amérique' },
    { pays: 'le Canada', court: 'Canada', cap: 'Ottawa', cont: 'Amérique' },
    { pays: 'le Mexique', court: 'Mexique', cap: 'Mexico', cont: 'Amérique' },
    { pays: 'le Brésil', court: 'Brésil', cap: 'Brasília', cont: 'Amérique' },
    { pays: "l'Argentine", court: 'Argentine', cap: 'Buenos Aires', cont: 'Amérique' },
    { pays: 'le Chili', court: 'Chili', cap: 'Santiago', cont: 'Amérique' },
    { pays: 'le Pérou', court: 'Pérou', cap: 'Lima', cont: 'Amérique' },
    // Océanie
    { pays: "l'Australie", court: 'Australie', cap: 'Canberra', cont: 'Océanie' },
    { pays: 'la Nouvelle-Zélande', court: 'Nouvelle-Zélande', cap: 'Wellington', cont: 'Océanie' },
];
const CAP_BANK = PAYS.map(p => ({ name: p.cap, group: p.cont }));
const PAYS_BANK = PAYS.map(p => ({ name: p.court, group: p.cont }));
function makeCapitale() {
    const p = PAYS[randInt(0, PAYS.length - 1)];
    if (Math.random() < 0.6) {
        // Sens normal : pays → capitale
        return {
            prompt: `Quelle est la capitale de ${p.pays} ?`,
            visual: `<div class="shape-sym">🌍</div>`,
            choices: questionFrom(CAP_BANK, { name: p.cap, group: p.cont }, true),
        };
    }
    // Sens inversé : capitale → pays
    return {
        prompt: `${p.cap} est la capitale de quel pays ?`,
        visual: `<div class="shape-sym">🏙️</div>`,
        choices: questionFrom(PAYS_BANK, { name: p.court, group: p.cont }, true),
    };
}

// minLevel = classe à partir de laquelle le jeu apparaît dans le menu (0 = GS).
export const THEMES = [
    { id: 'calcul', name: 'Le calcul', emoji: '🔢', color: '#ff6b6b', minLevel: 0, make: makeCalcul },
    { id: 'compter', name: 'Compter', emoji: '🍎', color: '#4dabf7', minLevel: 0, make: makeCompter },
    { id: 'couleurs', name: 'Les couleurs', emoji: '🎨', color: '#cc5de8', minLevel: 0, make: makeCouleur },
    { id: 'formes', name: 'Les formes', emoji: '🔺', color: '#20c997', minLevel: 0, make: makeForme },
    { id: 'lettres', name: "L'alphabet", emoji: '🔤', color: '#ffa94d', minLevel: 0, make: makeLettre },
    { id: 'conjugaison', name: 'Conjugaison', emoji: '✍️', color: '#5c7cfa', minLevel: 5, make: makeConjugaison },
    { id: 'nombres', name: 'Nombres en lettres', emoji: '🔠', color: '#e8590c', minLevel: 5, make: makeNombreLettres },
    { id: 'fractions', name: 'Les fractions', emoji: '🍕', color: '#f06595', minLevel: 5, make: makeFraction },
    { id: 'mesures', name: 'Les mesures', emoji: '📏', color: '#0ca678', minLevel: 5, make: makeMesure },
    { id: 'capitales', name: 'Les capitales', emoji: '🌍', color: '#9c36b5', minLevel: 5, make: makeCapitale },
];
