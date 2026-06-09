// Habille ton personnage — personnage SVG entièrement personnalisable.
// Tout est tactile + souris. Sauvegarde automatique dans localStorage.

const app = document.getElementById('app');
const SAVE_KEY = 'habille_save';

// --- Palettes ---
const SKINS = ['#ffe0bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
const HAIR_COLORS = ['#2b1b0e', '#5b3a1a', '#a0522d', '#e6b800', '#d9d9d9', '#ff5fa2', '#6a4fb5'];
const OUTFIT_COLORS = ['#e84aa0', '#4dabf7', '#51cf66', '#ffd43b', '#ff6b6b', '#cc5de8', '#20c997', '#ffffff'];
const BG_COLORS = ['#ffe0ec', '#dff3ff', '#e6ffe0', '#fff6d6', '#f0e6ff', '#ffe9d6'];

// --- État (avec valeurs par défaut) ---
const DEFAULT = {
    skin: '#f1c27d',
    hairStyle: 'longs', hairColor: '#5b3a1a',
    outfit: 'robe', outfitColor: '#e84aa0',
    hat: 'aucun',
    glasses: 'aucune',
    bg: '#ffe0ec',
};
let state = load();

function load() {
    try { return Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); }
    catch { return Object.assign({}, DEFAULT); }
}
function save() {
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
    boucles: [84, 84, 102],
};
function hairBack(style, color) {
    const b = HAIR_BACK[style];
    if (!b) return '';
    const [rx, ry, cy] = b;
    let s = `<ellipse cx="100" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}"/>`;
    if (style === 'couettes') s += `<circle cx="30" cy="132" r="26" fill="${color}"/><circle cx="170" cy="132" r="26" fill="${color}"/>`;
    if (style === 'boucles') for (const cx of [40, 64, 100, 136, 160]) s += `<circle cx="${cx}" cy="58" r="20" fill="${color}"/>`;
    return s;
}
function hairFront(style, color) {
    if (style === 'aucun') return '';
    return `<path d="M40,96 Q44,44 100,44 Q156,44 160,96 Q150,64 100,62 Q50,64 40,96 Z" fill="${color}"/>`;
}

function outfit(style, color) {
    if (style === 'robe')
        return `<path d="M70,172 L130,172 L154,244 L46,244 Z" fill="${color}"/>`
            + `<ellipse cx="64" cy="178" rx="12" ry="14" fill="${color}"/><ellipse cx="136" cy="178" rx="12" ry="14" fill="${color}"/>`;
    if (style === 'tshirt')
        return `<rect x="68" y="170" width="64" height="56" rx="12" fill="${color}"/>`
            + `<ellipse cx="62" cy="178" rx="13" ry="15" fill="${color}"/><ellipse cx="138" cy="178" rx="13" ry="15" fill="${color}"/>`;
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
    return '';
}

function buildSVG(s) {
    return `<svg viewBox="0 0 200 290" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="200" height="290" rx="24" fill="${s.bg}"/>
        ${hairBack(s.hairStyle, s.hairColor)}
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
        ${hairFront(s.hairStyle, s.hairColor)}
        <!-- visage -->
        <circle cx="78" cy="100" r="8" fill="#3a2e2e"/><circle cx="122" cy="100" r="8" fill="#3a2e2e"/>
        <circle cx="80" cy="97" r="3" fill="#fff"/><circle cx="124" cy="97" r="3" fill="#fff"/>
        <circle cx="64" cy="120" r="9" fill="#ff9aa2" opacity="0.6"/><circle cx="136" cy="120" r="9" fill="#ff9aa2" opacity="0.6"/>
        <path d="M82,124 Q100,140 118,124" stroke="#c1442e" stroke-width="4" fill="none" stroke-linecap="round"/>
        ${glasses(s.glasses)}
        ${hat(s.hat)}
    </svg>`;
}

// ===========================================================================
//  Panneau de personnalisation
// ===========================================================================
const LABELS = {
    aucun: 'Aucun', aucune: 'Aucunes',
    courts: 'Courts', longs: 'Longs', couettes: 'Couettes', boucles: 'Bouclés',
    robe: 'Robe 👗', tshirt: 'T-shirt 👕', salopette: 'Salopette',
    couronne: 'Couronne 👑', chapeau: 'Chapeau 🎩', casquette: 'Casquette 🧢', noeud: 'Nœud 🎀',
    rondes: 'Rondes 👓', soleil: 'Soleil 🕶️', coeur: 'Cœur 😍',
};

const CATS = [
    { id: 'skin', tab: '👤 Peau', colorKey: 'skin', colors: SKINS },
    { id: 'hair', tab: '💇 Cheveux', styleKey: 'hairStyle', styles: ['aucun', 'courts', 'longs', 'couettes', 'boucles'], colorKey: 'hairColor', colors: HAIR_COLORS },
    { id: 'outfit', tab: '👗 Tenue', styleKey: 'outfit', styles: ['robe', 'tshirt', 'salopette'], colorKey: 'outfitColor', colors: OUTFIT_COLORS },
    { id: 'hat', tab: '👑 Chapeau', styleKey: 'hat', styles: ['aucun', 'couronne', 'chapeau', 'casquette', 'noeud'] },
    { id: 'glasses', tab: '👓 Lunettes', styleKey: 'glasses', styles: ['aucune', 'rondes', 'soleil', 'coeur'] },
    { id: 'bg', tab: '🎨 Fond', colorKey: 'bg', colors: BG_COLORS },
];

let activeCat = 'hair';
let stageEl, optsEl, tabEls = {};

function refreshCharacter() { stageEl.innerHTML = buildSVG(state); save(); }

function renderOptions() {
    optsEl.innerHTML = '';
    const cat = CATS.find(c => c.id === activeCat);

    if (cat.styles) {
        for (const st of cat.styles) {
            const b = document.createElement('button');
            b.className = 'opt' + (state[cat.styleKey] === st ? ' active' : '');
            b.textContent = LABELS[st] || st;
            b.addEventListener('click', () => { state[cat.styleKey] = st; refreshCharacter(); renderOptions(); });
            optsEl.appendChild(b);
        }
    }
    if (cat.colors) {
        for (const col of cat.colors) {
            const b = document.createElement('button');
            b.className = 'swatch' + (state[cat.colorKey] === col ? ' active' : '');
            b.style.background = col;
            b.addEventListener('click', () => { state[cat.colorKey] = col; refreshCharacter(); renderOptions(); });
            optsEl.appendChild(b);
        }
    }
}

function selectCat(id) {
    activeCat = id;
    for (const [cid, el] of Object.entries(tabEls)) el.classList.toggle('active', cid === id);
    renderOptions();
}

function surprise() {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    state.skin = pick(SKINS);
    state.hairStyle = pick(['courts', 'longs', 'couettes', 'boucles']);
    state.hairColor = pick(HAIR_COLORS);
    state.outfit = pick(['robe', 'tshirt', 'salopette']);
    state.outfitColor = pick(OUTFIT_COLORS);
    state.hat = pick(['aucun', 'couronne', 'chapeau', 'casquette', 'noeud']);
    state.glasses = pick(['aucune', 'rondes', 'soleil', 'coeur']);
    state.bg = pick(BG_COLORS);
    refreshCharacter();
    renderOptions();
}

function render() {
    app.innerHTML = '';

    const topbar = document.createElement('div');
    topbar.className = 'topbar';
    const home = document.createElement('a');
    home.className = 'icon-btn';
    home.href = '../';
    home.textContent = '🏠';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = 'Habille ton personnage';
    const dice = document.createElement('button');
    dice.className = 'icon-btn';
    dice.textContent = '🎲';
    dice.title = 'Surprise !';
    dice.addEventListener('click', surprise);
    topbar.append(home, title, dice);

    const main = document.createElement('div');
    main.className = 'main';
    stageEl = document.createElement('div');
    stageEl.className = 'stage';

    const controls = document.createElement('div');
    controls.className = 'controls';
    const tabs = document.createElement('div');
    tabs.className = 'tabs';
    tabEls = {};
    for (const cat of CATS) {
        const t = document.createElement('button');
        t.className = 'tab' + (cat.id === activeCat ? ' active' : '');
        t.textContent = cat.tab;
        t.addEventListener('click', () => selectCat(cat.id));
        tabEls[cat.id] = t;
        tabs.appendChild(t);
    }
    optsEl = document.createElement('div');
    optsEl.className = 'options';
    controls.append(tabs, optsEl);

    main.append(stageEl, controls);
    app.append(topbar, main);

    refreshCharacter();
    renderOptions();
}

render();
