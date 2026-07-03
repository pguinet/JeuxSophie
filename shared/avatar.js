// Avatar de Sophie — dessin SVG du personnage, partagé entre le jeu d'habillage
// et les mini-jeux où le personnage est jouable.
// Le personnage est composé couche par couche. Le même état (sauvegardé dans
// localStorage sous 'habille_save') sert partout.

export const SAVE_KEY = 'habille_save';

// --- Palettes ---
export const SKINS = ['#ffe0bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
export const HAIR_COLORS = ['#2b1b0e', '#5b3a1a', '#a0522d', '#e6b800', '#d9d9d9', '#ff5fa2', '#6a4fb5'];
export const OUTFIT_COLORS = ['#e84aa0', '#4dabf7', '#51cf66', '#ffd43b', '#ff6b6b', '#cc5de8', '#20c997', '#ffffff'];
export const BG_COLORS = ['#ffe0ec', '#dff3ff', '#e6ffe0', '#fff6d6', '#f0e6ff', '#ffe9d6'];

// Cheveux et tenues proposés selon fille / garçon
export const HAIR_BY_GENDER = {
    fille: ['longs', 'couettes', 'chignon', 'boucles'],
    garcon: ['courts', 'crete', 'boucles'],
};
export const OUTFIT_BY_GENDER = {
    fille: ['robe', 'jupe', 'pantalon', 'tshirt', 'pull'],
    garcon: ['tshirt', 'pull', 'pantalon', 'salopette', 'costume'],
};

// --- État par défaut ---
export const DEFAULT_AVATAR = {
    gender: 'fille',
    skin: '#f1c27d',
    hairStyle: 'longs', hairColor: '#5b3a1a',
    outfit: 'robe', outfitColor: '#e84aa0',
    hat: 'aucun',
    glasses: 'aucune',
    accessoire: 'aucun',
    bg: '#ffe0ec',
};

// Libellés lisibles pour les boutons
export const LABELS = {
    aucun: 'Aucun', aucune: 'Aucunes',
    fille: 'Fille 👧', garcon: 'Garçon 👦',
    courts: 'Courts', longs: 'Longs', couettes: 'Couettes', boucles: 'Bouclés', chignon: 'Chignon', crete: 'Crête',
    robe: 'Robe 👗', tshirt: 'T-shirt 👕', salopette: 'Salopette', pull: 'Pull 🧶', jupe: 'Jupe', pantalon: 'Pantalon 👖', costume: 'Costume 🤵',
    couronne: 'Couronne 👑', chapeau: 'Chapeau 🎩', casquette: 'Casquette 🧢', noeud: 'Nœud 🎀', bonnet: 'Bonnet', fleur: 'Fleur 🌸',
    rondes: 'Rondes 👓', soleil: 'Soleil 🕶️', coeur: 'Cœur 😍', etoile: 'Étoiles ⭐',
    cape: 'Cape 🦸', ailes: 'Ailes 🧚', baguette: 'Baguette 🪄', collier: 'Collier 📿',
};

// --- Sauvegarde / chargement ---
export function loadAvatar() {
    try { return Object.assign({}, DEFAULT_AVATAR, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); }
    catch { return Object.assign({}, DEFAULT_AVATAR); }
}
export function saveAvatar(state) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* indisponible */ }
}

// ===========================================================================
//  Dessin du personnage (SVG), composé couche par couche
// ===========================================================================
const HAIR_BACK = {
    aucun: null,
    courts: [70, 70, 92],
    longs: [80, 100, 128],
    couettes: [70, 72, 95],
    boucles: null,          // dessiné à part (petites boucles), différent fille/garçon
    chignon: [66, 66, 90],
    crete: null,
};

// Dessine une grappe de petites boucles (chaque boucle = un rond avec un léger contour)
function curls(list, color) {
    return list.map(([cx, cy, r]) =>
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="rgba(0,0,0,0.12)" stroke-width="2"/>`
    ).join('');
}

// Boucles derrière la tête
const BOUCLES_BACK_FILLE = [
    [56, 58, 20], [80, 44, 21], [100, 40, 22], [120, 44, 21], [144, 58, 20],
    [38, 86, 20], [162, 86, 20], [34, 118, 19], [166, 118, 19],
    [42, 148, 19], [158, 148, 19], [54, 172, 17], [146, 172, 17],
    [70, 154, 15], [130, 154, 15],
];
const BOUCLES_BACK_GARCON = [
    [58, 54, 15], [78, 46, 15], [100, 43, 16], [122, 46, 15], [142, 54, 15],
    [44, 74, 15], [156, 74, 15],
];
// Boucles sur le dessus de la tête (elles pavent tout le crâne, sans trou)
const BOUCLES_FRONT_FILLE = [
    [100, 30, 15],
    [74, 42, 15], [100, 38, 16], [126, 42, 15],
    [58, 58, 15], [80, 52, 16], [100, 50, 16], [120, 52, 16], [142, 58, 15],
];
const BOUCLES_FRONT_GARCON = [
    [100, 28, 13],
    [76, 38, 13], [100, 34, 14], [124, 38, 13],
    [60, 54, 13], [80, 48, 13], [100, 46, 14], [120, 48, 13], [140, 54, 13],
    [50, 66, 11], [150, 66, 11],
];

function hairBack(style, color, gender) {
    const b = HAIR_BACK[style];
    let s = '';
    if (b) {
        const [rx, ry, cy] = b;
        s += `<ellipse cx="100" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}"/>`;
    }
    if (style === 'couettes') s += `<circle cx="30" cy="132" r="26" fill="${color}"/><circle cx="170" cy="132" r="26" fill="${color}"/>`;
    if (style === 'boucles') {
        if (gender === 'garcon') {
            s += curls(BOUCLES_BACK_GARCON, color);
        } else {
            // masse volumineuse + boucles sur le pourtour
            s += `<ellipse cx="100" cy="112" rx="80" ry="78" fill="${color}"/>`;
            s += curls(BOUCLES_BACK_FILLE, color);
        }
    }
    if (style === 'chignon') s += `<circle cx="100" cy="40" r="22" fill="${color}"/>`;
    return s;
}
function hairFront(style, color, gender) {
    if (style === 'aucun') return '';
    if (style === 'crete')
        return `<path d="M82,46 L86,14 L94,44 L100,10 L106,44 L114,14 L118,46 Z" fill="${color}"/>`;
    if (style === 'boucles')
        return curls(gender === 'garcon' ? BOUCLES_FRONT_GARCON : BOUCLES_FRONT_FILLE, color);
    return `<path d="M40,96 Q44,44 100,44 Q156,44 160,96 Q150,64 100,62 Q50,64 40,96 Z" fill="${color}"/>`;
}

// Calotte : remplit tout le crâne pour qu'on ne voie jamais la peau à travers les cheveux
function hairCap(style, color) {
    if (style === 'aucun') return '';
    return `<path d="M35,102 C33,56 60,26 100,26 C140,26 167,56 165,102 C150,78 128,74 100,74 C72,74 50,78 35,102 Z" fill="${color}"/>`;
}

// Mèches fines pour la texture (cheveux lisses uniquement)
function hairStrands(style) {
    if (['boucles', 'crete', 'aucun'].includes(style)) return '';
    return `<g stroke="rgba(0,0,0,0.10)" stroke-width="2.5" fill="none" stroke-linecap="round">`
        + `<path d="M100,30 Q76,50 68,74"/>`
        + `<path d="M100,30 Q100,50 100,72"/>`
        + `<path d="M100,30 Q124,50 132,74"/>`
        + `</g>`;
}

// Reflet lumineux pour donner du volume
function hairShine(style) {
    if (style === 'aucun') return '';
    return `<path d="M58,52 Q80,38 108,44 Q86,50 70,76 Q60,66 58,52 Z" fill="rgba(255,255,255,0.20)"/>`;
}

function outfit(style, color) {
    // épaules (communes à plusieurs tenues)
    const shoulders = `<ellipse cx="64" cy="178" rx="12" ry="14" fill="${color}"/><ellipse cx="136" cy="178" rx="12" ry="14" fill="${color}"/>`;
    if (style === 'robe')
        return `<path d="M70,172 L130,172 L154,244 L46,244 Z" fill="${color}"/>` + shoulders;
    if (style === 'tshirt')
        return `<rect x="68" y="170" width="64" height="56" rx="12" fill="${color}"/>` + shoulders;
    if (style === 'pull')
        // manches longues qui recouvrent les bras
        return `<rect x="66" y="168" width="68" height="62" rx="14" fill="${color}"/>`
            + `<rect x="51" y="176" width="17" height="56" rx="8" fill="${color}"/>`
            + `<rect x="132" y="176" width="17" height="56" rx="8" fill="${color}"/>`
            + `<path d="M86,168 Q100,182 114,168" stroke="rgba(0,0,0,.12)" stroke-width="3" fill="none"/>`;
    if (style === 'jupe')
        return `<rect x="68" y="168" width="64" height="36" rx="10" fill="${color}"/>`
            + `<path d="M68,202 L132,202 L150,242 L50,242 Z" fill="${color}"/>` + shoulders;
    if (style === 'pantalon')
        // haut + deux jambes de pantalon qui recouvrent les jambes
        return `<rect x="68" y="170" width="64" height="44" rx="12" fill="${color}"/>`
            + `<rect x="80" y="204" width="18" height="62" rx="7" fill="${color}"/>`
            + `<rect x="102" y="204" width="18" height="62" rx="7" fill="${color}"/>`
            + shoulders;
    if (style === 'costume')
        return `<rect x="68" y="168" width="64" height="64" rx="10" fill="${color}"/>`
            + `<path d="M100,168 L86,168 L100,196 L114,168 Z" fill="#ffffff"/>`
            + `<path d="M97,178 L103,178 L107,208 L100,216 L93,208 Z" fill="#c0392b"/>`
            + shoulders;
    // salopette
    return `<rect x="72" y="168" width="56" height="64" rx="10" fill="${color}"/>`
        + `<rect x="80" y="156" width="9" height="20" rx="4" fill="${color}"/><rect x="111" y="156" width="9" height="20" rx="4" fill="${color}"/>`;
}

function hat(type) {
    switch (type) {
        case 'couronne':
            return `<path d="M60,52 L74,28 L88,48 L100,22 L112,48 L126,28 L140,52 Z" fill="#ffd43b" stroke="#f0a500" stroke-width="2"/>`
                + `<circle cx="74" cy="30" r="4" fill="#ff6b6b"/><circle cx="100" cy="24" r="4" fill="#4dabf7"/><circle cx="126" cy="30" r="4" fill="#51cf66"/>`;
        case 'chapeau':
            return `<ellipse cx="100" cy="50" rx="62" ry="14" fill="#c0392b"/><path d="M68,52 Q100,4 132,52 Z" fill="#e74c3c"/><rect x="70" y="40" width="60" height="8" fill="#922b21"/>`;
        case 'casquette':
            return `<path d="M44,54 Q100,8 156,54 Z" fill="#1d72c4"/><ellipse cx="118" cy="56" rx="46" ry="9" fill="#155a9c"/>`;
        case 'noeud':
            return `<path d="M150,52 L168,40 L168,64 Z" fill="#ff5fa2"/><path d="M150,52 L132,40 L132,64 Z" fill="#ff5fa2"/><circle cx="150" cy="52" r="7" fill="#e84aa0"/>`;
        case 'bonnet':
            return `<path d="M56,58 Q100,6 144,58 Z" fill="#8e44ad"/>`
                + `<rect x="54" y="52" width="92" height="14" rx="7" fill="#7d3c98"/>`
                + `<circle cx="100" cy="12" r="9" fill="#ffffff"/>`;
        case 'fleur':
            return `<text x="150" y="70" font-size="34" text-anchor="middle">🌸</text>`;
        default: return '';
    }
}

function glasses(type) {
    if (type === 'rondes')
        return `<circle cx="78" cy="100" r="17" fill="none" stroke="#333" stroke-width="3"/><circle cx="122" cy="100" r="17" fill="none" stroke="#333" stroke-width="3"/><line x1="95" y1="100" x2="105" y2="100" stroke="#333" stroke-width="3"/>`;
    if (type === 'soleil')
        return `<circle cx="78" cy="100" r="17" fill="#222"/><circle cx="122" cy="100" r="17" fill="#222"/><line x1="95" y1="100" x2="105" y2="100" stroke="#222" stroke-width="4"/>`;
    if (type === 'coeur')
        return `<text x="78" y="108" font-size="30" text-anchor="middle">💗</text><text x="122" y="108" font-size="30" text-anchor="middle">💗</text>`;
    if (type === 'etoile')
        return `<text x="78" y="110" font-size="30" text-anchor="middle">⭐</text><text x="122" y="110" font-size="30" text-anchor="middle">⭐</text>`;
    return '';
}

// Petits détails du visage selon fille / garçon
function faceExtras(gender) {
    if (gender === 'garcon')
        return `<path d="M68,86 Q78,82 88,86" stroke="#3a2e2e" stroke-width="4" fill="none" stroke-linecap="round"/>`
            + `<path d="M112,86 Q122,82 132,86" stroke="#3a2e2e" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    // fille : des cils
    return `<path d="M69,94 L64,90 M75,92 L72,87 M81,93 L80,88" stroke="#3a2e2e" stroke-width="2" fill="none" stroke-linecap="round"/>`
        + `<path d="M131,94 L136,90 M125,92 L128,87 M119,93 L120,88" stroke="#3a2e2e" stroke-width="2" fill="none" stroke-linecap="round"/>`;
}

// Accessoires DERRIÈRE le corps (cape, ailes)
function accessoryBack(type) {
    if (type === 'cape')
        return `<path d="M62,168 L138,168 L154,258 L46,258 Z" fill="#c0392b"/>`;
    if (type === 'ailes')
        return `<ellipse cx="54" cy="198" rx="24" ry="40" fill="#ffffff" opacity="0.92" transform="rotate(-18 54 198)"/>`
            + `<ellipse cx="146" cy="198" rx="24" ry="40" fill="#ffffff" opacity="0.92" transform="rotate(18 146 198)"/>`;
    return '';
}

// Accessoires DEVANT le corps (collier, baguette)
function accessoryFront(type) {
    if (type === 'collier')
        return `<path d="M86,170 Q100,186 114,170" stroke="#ffd43b" stroke-width="3" fill="none"/>`
            + `<circle cx="100" cy="184" r="5" fill="#ff6b6b"/>`;
    if (type === 'baguette')
        return `<line x1="146" y1="220" x2="172" y2="180" stroke="#deb887" stroke-width="5" stroke-linecap="round"/>`
            + `<text x="176" y="182" font-size="26" text-anchor="middle">⭐</text>`;
    return '';
}

// Construit le SVG du personnage.
// opts.background : true (défaut) dessine la carte de fond ; false = fond transparent
// (pour utiliser le personnage comme sprite dans un jeu).
export function buildAvatarSVG(s, opts = {}) {
    const background = opts.background !== false;
    const bg = background ? `<rect x="0" y="0" width="200" height="290" rx="24" fill="${s.bg}"/>` : '';
    return `<svg viewBox="0 0 200 290" xmlns="http://www.w3.org/2000/svg">
        ${bg}
        ${accessoryBack(s.accessoire)}
        ${hairBack(s.hairStyle, s.hairColor, s.gender)}
        <!-- jambes + chaussures -->
        <rect x="84" y="226" width="13" height="46" rx="6" fill="${s.skin}"/>
        <rect x="103" y="226" width="13" height="46" rx="6" fill="${s.skin}"/>
        <ellipse cx="90" cy="274" rx="13" ry="8" fill="#5b3a1a"/>
        <ellipse cx="110" cy="274" rx="13" ry="8" fill="#5b3a1a"/>
        <!-- bras -->
        <rect x="54" y="178" width="13" height="52" rx="6" fill="${s.skin}"/>
        <rect x="133" y="178" width="13" height="52" rx="6" fill="${s.skin}"/>
        <!-- cou -->
        <rect x="88" y="150" width="24" height="30" fill="${s.skin}"/>
        ${outfit(s.outfit, s.outfitColor)}
        <!-- tête -->
        <circle cx="40" cy="104" r="11" fill="${s.skin}"/>
        <circle cx="160" cy="104" r="11" fill="${s.skin}"/>
        <ellipse cx="100" cy="100" rx="62" ry="64" fill="${s.skin}"/>
        ${hairCap(s.hairStyle, s.hairColor)}
        ${hairFront(s.hairStyle, s.hairColor, s.gender)}
        ${hairStrands(s.hairStyle)}
        ${hairShine(s.hairStyle)}
        <!-- visage -->
        <circle cx="78" cy="100" r="8" fill="#3a2e2e"/><circle cx="122" cy="100" r="8" fill="#3a2e2e"/>
        <circle cx="80" cy="97" r="3" fill="#fff"/><circle cx="124" cy="97" r="3" fill="#fff"/>
        ${faceExtras(s.gender)}
        <circle cx="64" cy="120" r="9" fill="#ff9aa2" opacity="0.6"/><circle cx="136" cy="120" r="9" fill="#ff9aa2" opacity="0.6"/>
        <path d="M82,124 Q100,140 118,124" stroke="#c1442e" stroke-width="4" fill="none" stroke-linecap="round"/>
        ${glasses(s.glasses)}
        ${accessoryFront(s.accessoire)}
        ${hat(s.hat)}
    </svg>`;
}
