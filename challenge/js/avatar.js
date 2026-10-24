// Avatar « figurine Pop » en 2D : grosse tête ronde, petit corps, yeux noirs brillants.
// Tout est en SVG (chaîne de caractères) pour s'afficher partout sans image.
import { pick } from './rng.js';

export const PEAUX = [
    { id: 'p1', couleur: '#ffe0c7' }, { id: 'p2', couleur: '#fbd5b5' }, { id: 'p3', couleur: '#f1c27d' },
    { id: 'p4', couleur: '#e0ac69' }, { id: 'p5', couleur: '#c68654' }, { id: 'p6', couleur: '#a86b45' },
    { id: 'p7', couleur: '#8d5524' }, { id: 'p8', couleur: '#6b4226' }, { id: 'p9', couleur: '#5c3a21' },
    { id: 'p10', couleur: '#3d2616' },
];
export const CHEVEUX = [
    { id: 'noir', couleur: '#1b1b1b' }, { id: 'brun', couleur: '#4a2c17' }, { id: 'chatain', couleur: '#7c3f1d' },
    { id: 'roux', couleur: '#e2583e' }, { id: 'blond', couleur: '#f5d06b' }, { id: 'platine', couleur: '#f3ead2' },
    { id: 'gris', couleur: '#9ca3af' }, { id: 'rose', couleur: '#f472b6' }, { id: 'violet', couleur: '#8b5cf6' },
    { id: 'bleu', couleur: '#3b82f6' }, { id: 'vert', couleur: '#22c55e' }, { id: 'turquoise', couleur: '#14b8a6' },
];
export const HABITS = [
    { id: 'rose', couleur: '#ec4899' }, { id: 'rouge', couleur: '#ef4444' }, { id: 'orange', couleur: '#f59e0b' },
    { id: 'jaune', couleur: '#facc15' }, { id: 'vert', couleur: '#22c55e' }, { id: 'turquoise', couleur: '#14b8a6' },
    { id: 'bleu', couleur: '#2563eb' }, { id: 'marine', couleur: '#1e3a8a' }, { id: 'violet', couleur: '#a855f7' },
    { id: 'blanc', couleur: '#f8fafc' }, { id: 'gris', couleur: '#475569' }, { id: 'noir', couleur: '#111827' },
];
export const FONDS = [
    { id: 'creme', couleur: '#fef3c7' }, { id: 'menthe', couleur: '#dcfce7' }, { id: 'lavande', couleur: '#e0e7ff' },
    { id: 'peche', couleur: '#fee2e2' }, { id: 'ciel', couleur: '#cffafe' }, { id: 'lilas', couleur: '#fae8ff' },
    { id: 'citron', couleur: '#fef9c3' }, { id: 'nuage', couleur: '#f1f5f9' },
];

// Calotte lisse (dessus du crâne), partagée par plusieurs coiffures.
const CALOTTE = '<path d="M36 90 Q40 25 100 26 Q160 25 164 90 Q140 55 100 58 Q60 55 36 90Z"/>';

// Chaque coiffure : calque `arriere` (derrière la tête) + calque `avant` (frange),
// dans le repère du SVG (tête : cercle cx=100 cy=95 r=72, haut du crâne à y=23).
export const COIFFURES = [
    // Filles
    { id: 'longs', nom: 'Longs', genre: 'fille',
        arriere: '<path d="M30 95 Q28 20 100 18 Q172 20 170 95 L174 175 Q150 160 148 110 L52 110 Q50 160 26 175Z"/>',
        avant: '<path d="M38 88 Q44 20 100 21 Q156 20 162 88 Q130 60 100 66 Q70 60 38 88Z"/>' },
    { id: 'queue', nom: 'Queue de cheval', genre: 'fille',
        arriere: '<circle cx="100" cy="24" r="22"/><path d="M98 10 Q150 0 160 60 Q150 40 130 30Z"/><path d="M162 50 Q190 100 170 150 Q172 95 150 70Z"/>',
        avant: CALOTTE },
    { id: 'couettes', nom: 'Couettes', genre: 'fille',
        arriere: '<circle cx="28" cy="80" r="26"/><circle cx="172" cy="80" r="26"/>',
        avant: '<path d="M36 92 Q40 25 100 26 Q160 25 164 92 Q150 58 100 52 Q50 58 36 92Z"/>' },
    { id: 'carre', nom: 'Carré', genre: 'fille',
        arriere: '<path d="M24 95 Q24 18 100 18 Q176 18 176 95 L176 138 Q176 156 158 156 L42 156 Q24 156 24 138Z"/>',
        avant: '<path d="M28 104 Q28 20 100 20 Q172 20 172 104 L158 104 Q156 72 140 70 L60 70 Q44 72 42 104Z"/>' },
    { id: 'chignon', nom: 'Chignon', genre: 'fille',
        arriere: '<circle cx="100" cy="24" r="22"/>',
        avant: CALOTTE },
    { id: 'tresse', nom: 'Tresse', genre: 'fille',
        arriere: '<ellipse cx="160" cy="120" rx="15" ry="19"/><ellipse cx="166" cy="148" rx="14" ry="17"/>'
            + '<ellipse cx="169" cy="174" rx="12" ry="15"/><ellipse cx="170" cy="196" rx="9" ry="11"/>',
        avant: '<path d="M36 92 Q38 24 100 24 Q162 24 164 92 Q150 54 120 50 Q90 64 36 92Z"/>' },
    // Garçons
    { id: 'court', nom: 'Court', genre: 'garcon', arriere: '',
        avant: '<path d="M34 86 Q36 22 100 22 Q164 22 166 86 Q150 56 120 60 Q100 46 80 60 Q50 56 34 86Z"/>' },
    { id: 'afro', nom: 'Afro', genre: 'garcon', arriere: '<circle cx="100" cy="82" r="78"/>',
        avant: '<path d="M30 90 Q32 22 100 22 Q168 22 170 90 Q152 52 100 52 Q48 52 30 90Z"/>' },
    // Front baissé (remarque de Sophie) : la base des pics descend de y≈62 à y≈74.
    { id: 'pics', nom: 'En pics', genre: 'garcon', arriere: '',
        avant: '<path d="M32 92 L40 30 L60 46 L72 14 L90 38 L104 8 L118 38 L134 14 L142 46 L162 30 L168 92 Q140 70 100 74 Q60 70 32 92Z"/>' },
    { id: 'meche', nom: 'Mèche sur le côté', genre: 'garcon', arriere: '',
        avant: '<path d="M34 86 Q36 22 100 22 Q164 22 166 86 Q154 56 124 56 Q96 58 76 80 Q64 66 34 86Z"/>' },
    { id: 'boucles', nom: 'Bouclés', genre: 'garcon', arriere: '',
        avant: '<path d="M36 80 Q40 28 100 28 Q160 28 164 80 Q140 56 100 58 Q60 56 36 80Z"/>'
            + '<circle cx="40" cy="78" r="15"/><circle cx="46" cy="52" r="16"/><circle cx="64" cy="34" r="16"/>'
            + '<circle cx="88" cy="24" r="16"/><circle cx="112" cy="24" r="16"/><circle cx="136" cy="34" r="16"/>'
            + '<circle cx="154" cy="52" r="16"/><circle cx="160" cy="78" r="15"/>' },
    { id: 'rase', nom: 'Rasé', genre: 'garcon', arriere: '',
        avant: '<path d="M30 86 Q30 21 100 21 Q170 21 170 86 Q164 46 100 44 Q36 46 30 86Z"/>' },
];

export const LOOK_DEFAUT = { peau: 'p2', coiffure: 'longs', cheveux: 'chatain', haut: 'rose', bas: 'marine', fond: 'creme' };

const PALETTES = { peau: PEAUX, coiffure: COIFFURES, cheveux: CHEVEUX, haut: HABITS, bas: HABITS, fond: FONDS };

// Remplace tout identifiant inconnu par la valeur par défaut.
export function lookValide(look) {
    const l = look && typeof look === 'object' ? look : {};
    const out = {};
    for (const [cle, pal] of Object.entries(PALETTES)) {
        out[cle] = pal.some(p => p.id === l[cle]) ? l[cle] : LOOK_DEFAUT[cle];
    }
    return out;
}

export function lookAleatoire(rng = Math.random) {
    const out = {};
    for (const [cle, pal] of Object.entries(PALETTES)) out[cle] = pick(pal, rng).id;
    return out;
}

const couleur = (pal, id) => pal.find(p => p.id === id).couleur;

// `taille` = hauteur en pixels de l'image (la largeur suit le rapport 200/270).
export function avatarSVG(look, { taille = 270 } = {}) {
    const l = lookValide(look);
    const peau = couleur(PEAUX, l.peau), cheveux = couleur(CHEVEUX, l.cheveux);
    const haut = couleur(HABITS, l.haut), bas = couleur(HABITS, l.bas), fond = couleur(FONDS, l.fond);
    const c = COIFFURES.find(x => x.id === l.coiffure);
    const larg = Math.round(taille * 200 / 270);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${larg}" height="${taille}" viewBox="0 0 200 270">
<rect width="200" height="270" rx="18" fill="${fond}"/>
<ellipse cx="100" cy="258" rx="50" ry="7" fill="#0002"/>
<g fill="${cheveux}">${c.arriere}</g>
<rect x="78" y="215" width="19" height="38" rx="6" fill="${bas}"/><rect x="103" y="215" width="19" height="38" rx="6" fill="${bas}"/>
<rect x="74" y="246" width="25" height="11" rx="5" fill="#333"/><rect x="101" y="246" width="25" height="11" rx="5" fill="#333"/>
<rect x="70" y="165" width="60" height="58" rx="16" fill="${haut}"/>
<rect x="52" y="170" width="20" height="44" rx="10" fill="${haut}"/><rect x="128" y="170" width="20" height="44" rx="10" fill="${haut}"/>
<circle cx="62" cy="214" r="9" fill="${peau}"/><circle cx="138" cy="214" r="9" fill="${peau}"/>
<circle cx="100" cy="95" r="72" fill="${peau}"/>
<g fill="${cheveux}">${c.avant}</g>
<ellipse cx="74" cy="112" rx="10" ry="12" fill="#111"/><ellipse cx="126" cy="112" rx="10" ry="12" fill="#111"/>
<circle cx="77" cy="107" r="3.5" fill="#fff"/><circle cx="129" cy="107" r="3.5" fill="#fff"/>
<ellipse cx="60" cy="132" rx="9" ry="6" fill="#f87171" opacity=".35"/><ellipse cx="140" cy="132" rx="9" ry="6" fill="#f87171" opacity=".35"/>
<path d="M90 140 Q100 148 110 140" stroke="#7a3b2e" stroke-width="3.5" fill="none" stroke-linecap="round"/>
</svg>`;
}
