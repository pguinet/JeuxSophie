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

// Les cheveux de devant partent toujours d'un arc un peu plus grand que la tête
// (rayon 74 contre 72) : aucun bord de peau ne dépasse au-dessus des cheveux.
// `ligne` décrit la limite cheveux/front, de la tempe droite (174,95) à la gauche.
const casque = ligne => `<path d="M26 95 A74 74 0 0 1 174 95 ${ligne} Z"/>`;

// Calotte lisse, frange arrondie assez basse (front court).
const CALOTTE = casque('Q154 70 100 72 Q46 70 26 95');

// Chaque coiffure : calque `arriere` (derrière la tête) + calque `avant` (frange),
// dans le repère du SVG (tête : cercle cx=100 cy=95 r=72, haut du crâne à y=23 ;
// yeux à y≈100-124).
export const COIFFURES = [
    // Filles
    { id: 'longs', nom: 'Longs', genre: 'fille',
        arriere: '<path d="M30 95 Q28 20 100 18 Q172 20 170 95 L174 175 Q150 160 148 110 L52 110 Q50 160 26 175Z"/>',
        avant: casque('L172 112 Q164 80 140 74 Q114 72 100 62 Q86 72 60 74 Q36 80 28 112') },
    { id: 'queue', nom: 'Queue de cheval', genre: 'fille',
        arriere: '<circle cx="100" cy="22" r="20"/><path d="M98 8 Q150 0 160 60 Q150 40 130 28Z"/><path d="M162 50 Q190 100 170 150 Q172 95 150 70Z"/>',
        avant: CALOTTE },
    { id: 'couettes', nom: 'Couettes', genre: 'fille',
        arriere: '<circle cx="26" cy="82" r="26"/><circle cx="174" cy="82" r="26"/>',
        avant: CALOTTE },
    { id: 'carre', nom: 'Carré', genre: 'fille',
        arriere: '<path d="M24 95 Q24 18 100 18 Q176 18 176 95 L176 138 Q176 156 158 156 L42 156 Q24 156 24 138Z"/>',
        avant: casque('L172 106 L158 106 Q156 80 148 78 L52 78 Q44 80 42 106 L28 106') },
    { id: 'chignon', nom: 'Chignon', genre: 'fille',
        arriere: '<circle cx="100" cy="22" r="20"/>',
        avant: CALOTTE },
    { id: 'tresse', nom: 'Tresse', genre: 'fille',
        arriere: '<ellipse cx="160" cy="120" rx="15" ry="19"/><ellipse cx="166" cy="148" rx="14" ry="17"/>'
            + '<ellipse cx="169" cy="174" rx="12" ry="15"/><ellipse cx="170" cy="196" rx="9" ry="11"/>',
        avant: casque('Q164 66 124 64 Q84 66 50 86 Q36 92 26 95') },
    // Garçons
    { id: 'court', nom: 'Court', genre: 'garcon', arriere: '',
        avant: casque('Q162 74 144 76 Q130 70 118 78 Q106 70 94 78 Q82 70 70 78 Q56 72 46 78 Q34 80 26 95') },
    { id: 'afro', nom: 'Afro', genre: 'garcon', arriere: '<circle cx="100" cy="82" r="78"/>',
        avant: casque('Q156 66 100 68 Q44 66 26 95') },
    // Pics au-dessus d'un casque, frange en dents de scie (front court).
    { id: 'pics', nom: 'En pics', genre: 'garcon', arriere: '',
        avant: '<path d="M36 64 L42 16 L60 34 L74 6 L90 28 L104 2 L118 28 L134 6 L144 34 L160 16 L166 64Z"/>'
            + casque('L168 96 L158 74 L146 86 L132 72 L118 84 L100 72 L82 84 L68 72 L54 86 L42 74 L32 96') },
    { id: 'meche', nom: 'Mèche sur le côté', genre: 'garcon', arriere: '',
        avant: casque('Q166 72 132 68 Q102 66 70 84 Q50 94 26 95') },
    { id: 'boucles', nom: 'Bouclés', genre: 'garcon', arriere: '',
        avant: casque('Q156 70 100 72 Q44 70 26 95')
            + '<circle cx="34" cy="80" r="14"/><circle cx="40" cy="54" r="16"/><circle cx="60" cy="32" r="16"/>'
            + '<circle cx="86" cy="20" r="16"/><circle cx="114" cy="20" r="16"/><circle cx="140" cy="32" r="16"/>'
            + '<circle cx="160" cy="54" r="16"/><circle cx="166" cy="80" r="14"/>'
            + '<circle cx="58" cy="72" r="11"/><circle cx="80" cy="74" r="11"/><circle cx="100" cy="75" r="11"/>'
            + '<circle cx="120" cy="74" r="11"/><circle cx="142" cy="72" r="11"/>' },
    { id: 'rase', nom: 'Rasé', genre: 'garcon', arriere: '',
        avant: casque('Q162 60 100 60 Q38 60 26 95') },
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
