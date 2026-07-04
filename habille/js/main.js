// Habille ton personnage — atelier d'habillage.
// Le dessin du personnage vit dans le module partagé shared/avatar.js
// (réutilisé par les mini-jeux). Ici : uniquement le panneau de personnalisation.

import {
    SKINS, HAIR_COLORS, OUTFIT_COLORS, BG_COLORS,
    HAIR_BY_GENDER, OUTFIT_BY_GENDER, LABELS,
    loadAvatar, saveAvatar, buildAvatarSVG,
} from '../../shared/avatar.js';

const app = document.getElementById('app');

let state = loadAvatar();
function refreshCharacter() { stageEl.innerHTML = buildAvatarSVG(state); saveAvatar(state); }

// ===========================================================================
//  Panneau de personnalisation
// ===========================================================================
const CATS = [
    { id: 'gender', tab: '🧒 Qui ?', styleKey: 'gender', styles: ['fille', 'garcon'] },
    { id: 'skin', tab: '👤 Peau', colorKey: 'skin', colors: SKINS },
    { id: 'hair', tab: '💇 Cheveux', styleKey: 'hairStyle', stylesByGender: HAIR_BY_GENDER, colorKey: 'hairColor', colors: HAIR_COLORS },
    { id: 'outfit', tab: '👗 Tenue', styleKey: 'outfit', stylesByGender: OUTFIT_BY_GENDER, colorKey: 'outfitColor', colors: OUTFIT_COLORS },
    { id: 'hat', tab: '👑 Chapeau', styleKey: 'hat', styles: ['aucun', 'couronne', 'chapeau', 'casquette', 'bonnet', 'noeud', 'fleur'] },
    { id: 'glasses', tab: '👓 Lunettes', styleKey: 'glasses', styles: ['aucune', 'rondes', 'soleil', 'coeur', 'etoile'] },
    { id: 'accessoire', tab: '✨ Accessoire', styleKey: 'accessoire', styles: ['aucun', 'cape', 'ailes', 'baguette', 'collier'] },
    { id: 'bg', tab: '🎨 Fond', colorKey: 'bg', colors: BG_COLORS },
];

let activeCat = 'gender';
let stageEl, optsEl, tabEls = {};

// Choisir fille/garçon recale la coiffure et la tenue sur une option de ce genre
function applyGender(g) {
    state.gender = g;
    if (!HAIR_BY_GENDER[g].includes(state.hairStyle)) state.hairStyle = HAIR_BY_GENDER[g][0];
    if (!OUTFIT_BY_GENDER[g].includes(state.outfit)) state.outfit = OUTFIT_BY_GENDER[g][0];
}

function renderOptions() {
    optsEl.innerHTML = '';
    const cat = CATS.find(c => c.id === activeCat);
    const styleList = cat.stylesByGender ? cat.stylesByGender[state.gender] : cat.styles;

    if (styleList) {
        for (const st of styleList) {
            const b = document.createElement('button');
            b.className = 'opt' + (state[cat.styleKey] === st ? ' active' : '');
            b.textContent = LABELS[st] || st;
            b.addEventListener('click', () => {
                if (cat.id === 'gender') applyGender(st);
                else state[cat.styleKey] = st;
                refreshCharacter();
                renderOptions();
            });
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
    state.gender = pick(['fille', 'garcon']);
    state.skin = pick(SKINS);
    state.hairStyle = pick(HAIR_BY_GENDER[state.gender]);
    state.hairColor = pick(HAIR_COLORS);
    state.outfit = pick(OUTFIT_BY_GENDER[state.gender]);
    state.outfitColor = pick(OUTFIT_COLORS);
    state.hat = pick(['aucun', 'couronne', 'chapeau', 'casquette', 'bonnet', 'noeud', 'fleur']);
    state.glasses = pick(['aucune', 'rondes', 'soleil', 'coeur', 'etoile']);
    state.accessoire = pick(['aucun', 'cape', 'ailes', 'baguette', 'collier']);
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
    // La maison ramène toujours au menu « Mon monde ».
    home.href = '../monde/';
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
