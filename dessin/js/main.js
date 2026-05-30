// Mon Dessin — feuille de dessin libre pour Sophie.
// Canvas 2D pur (pas de Three.js). Tout tactile + souris via les Pointer Events.

const canvas = document.getElementById('draw-canvas');
const ctx = canvas.getContext('2d');
const toolbar = document.getElementById('toolbar');

// --- Couleurs : une palette riche en nuances, générée par teinte ---
// Chaque teinte décline plusieurs luminosités (du clair au foncé).
const HUES = [0, 18, 38, 55, 90, 140, 175, 200, 225, 260, 290, 320];
const LIGHTS = [82, 66, 50, 36, 24];

function buildPalette() {
    const list = [];
    // Une rangée de gris (du blanc au noir) en tête.
    const GREYS = ['#ffffff', '#cfcfcf', '#9e9e9e', '#5e5e5e', '#000000'];
    list.push(...GREYS);
    // Puis toutes les teintes × nuances.
    for (const h of HUES) {
        for (const l of LIGHTS) {
            list.push(`hsl(${h}, 75%, ${l}%)`);
        }
    }
    return list;
}
const COLORS = buildPalette();

// --- Tailles de crayon : réglette coulissante (du plus fin au plus gros) ---
const MIN_SIZE = 2;
const MAX_SIZE = 50;

// --- Stickers tout faits (collés en touchant la feuille) ---
const STICKERS = [
    // Rigolos / émojis
    '💩', '😀', '😂', '😍', '🤩', '😎', '🥳', '😜',
    '🤪', '😺', '👻', '👽', '🤖', '🤡', '💀', '👑',
    // Cœurs & étoiles
    '❤️', '💛', '💚', '💙', '💜', '🧡', '💖', '💕',
    '⭐', '🌟', '✨', '💫', '🌈', '☀️', '☁️', '🌙',
    // Fleurs & nature
    '🌸', '🌺', '🌼', '🌷', '🌻', '🌹', '🌴', '🌵',
    '🍀', '🍄', '🌿', '🔥', '❄️', '⚡', '💧', '🌊',
    // Animaux
    '🐱', '🐶', '🐰', '🦄', '🐠', '🐧', '🐢', '🦊',
    '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐷', '🐵',
    '🦋', '🐝', '🐞', '🦕', '🦖', '🐙', '🦀', '🐬',
    // Gourmandises
    '🍓', '🍒', '🍌', '🍉', '🍦', '🍩', '🧁', '🍪',
    '🍕', '🍔', '🍟', '🍭', '🍬', '🍰', '🎂', '🍫',
    // Fêtes & objets
    '🎈', '🎀', '💎', '👑', '🎁', '🎉', '🎊', '🏆',
    '⚽', '🏀', '🎨', '🎵', '🚀', '🌍', '🦷', '🦴',
];

const state = {
    color: '#000000',
    size: 16,
    erasing: false,
    sticker: null,
    drawing: false,
    lastX: 0,
    lastY: 0,
};

// ---------------------------------------------------------------------------
// Canvas : dimensionnement net (devicePixelRatio) en préservant le dessin.
// ---------------------------------------------------------------------------
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // On sauvegarde le dessin actuel avant de redimensionner.
    let snapshot = null;
    if (canvas.width > 0 && canvas.height > 0) {
        snapshot = document.createElement('canvas');
        snapshot.width = canvas.width;
        snapshot.height = canvas.height;
        snapshot.getContext('2d').drawImage(canvas, 0, 0);
    }

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    // Repère en pixels CSS : on dessine en coordonnées d'écran.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fond blanc puis on restaure l'ancien dessin (étiré à la nouvelle taille).
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (snapshot) {
        ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height,
                                0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
}

window.addEventListener('resize', resizeCanvas);

// ---------------------------------------------------------------------------
// Dessin
// ---------------------------------------------------------------------------
function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function startStroke(e) {
    const p = pointerPos(e);
    // En mode sticker, un appui colle le sticker (pas de trait).
    if (state.sticker) {
        placeSticker(p.x, p.y);
        return;
    }
    state.drawing = true;
    state.lastX = p.x;
    state.lastY = p.y;
    // Un simple appui dépose un point.
    drawLine(p.x, p.y, p.x, p.y);
}

function placeSticker(x, y) {
    // La taille du sticker suit la réglette (jamais minuscule).
    const size = 30 + state.size * 1.5;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = size + 'px serif';
    ctx.fillText(state.sticker, x, y);
    ctx.restore();
}

function moveStroke(e) {
    if (!state.drawing) return;
    const p = pointerPos(e);
    drawLine(state.lastX, state.lastY, p.x, p.y);
    state.lastX = p.x;
    state.lastY = p.y;
}

function endStroke() {
    state.drawing = false;
}

function drawLine(x1, y1, x2, y2) {
    ctx.strokeStyle = state.erasing ? '#ffffff' : state.color;
    ctx.lineWidth = state.size;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    startStroke(e);
});
canvas.addEventListener('pointermove', moveStroke);
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', endStroke);

// ---------------------------------------------------------------------------
// Barre d'outils (générée en JS, gros boutons tactiles)
// ---------------------------------------------------------------------------
const swatchEls = [];
let eraserBtn = null;
let sizePreview = null;
let stickerBtn = null;
let colorBtn = null;

function makeBtn(extraStyle = {}) {
    const b = document.createElement('button');
    Object.assign(b.style, {
        flex: '0 0 auto',
        border: '3px solid transparent',
        borderRadius: '50%',
        cursor: 'pointer',
        padding: '0',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }, extraStyle);
    return b;
}

function refreshSelection() {
    swatchEls.forEach(({ el, color }) => {
        const active = !state.erasing && color === state.color;
        el.style.borderColor = active ? '#333' : (color === '#ffffff' ? '#ccc' : 'transparent');
        el.style.transform = active ? 'scale(1.15)' : 'scale(1)';
    });
    if (eraserBtn) {
        eraserBtn.style.borderColor = state.erasing ? '#333' : 'transparent';
        eraserBtn.style.transform = state.erasing ? 'scale(1.15)' : 'scale(1)';
    }
    if (stickerBtn) {
        const active = state.sticker !== null;
        stickerBtn.style.borderColor = active ? '#333' : '#ddd';
        stickerBtn.style.background = active ? '#fff3c4' : '#fff';
        // Le bouton affiche le sticker choisi (ou l'étoile par défaut).
        stickerBtn.textContent = active ? state.sticker : '✨';
    }
    if (sizePreview) {
        const d = state.size;
        sizePreview.style.width = d + 'px';
        sizePreview.style.height = d + 'px';
        // Le rond d'aperçu prend la couleur courante (ou gris clair pour la gomme).
        sizePreview.style.background = state.erasing ? '#bbb' : state.color;
        sizePreview.style.borderColor = (!state.erasing && state.color === '#ffffff') ? '#ccc' : 'transparent';
    }
    if (colorBtn) {
        // La grosse pastille de gauche montre la couleur du moment.
        colorBtn.style.background = state.color;
    }
}

// Choix de couleur : grosse pastille (couleur courante) + panneau de nuances
colorBtn = makeBtn({
    width: '48px', height: '48px',
    border: '3px solid #333', background: '#000000',
});
colorBtn.addEventListener('click', () => toggleColorPanel());
toolbar.appendChild(colorBtn);

function pickColor(color) {
    state.color = color;
    state.erasing = false;
    state.sticker = null;
    toggleColorPanel(false);
    refreshSelection();
}

// Le panneau de couleurs (caché par défaut), flottant au-dessus de la barre.
const colorPanel = document.createElement('div');
Object.assign(colorPanel.style, {
    position: 'fixed',
    left: '50%',
    bottom: '80px',
    transform: 'translateX(-50%)',
    width: 'min(92vw, 380px)',
    maxHeight: '50vh',
    overflowY: 'auto',
    background: '#fff',
    border: '4px solid #ffb74d',
    borderRadius: '18px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    padding: '12px',
    display: 'none',
    gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
    gap: '6px',
    zIndex: '20',
});

// Une roue arc-en-ciel pour choisir VRAIMENT n'importe quelle couleur.
const rainbowLabel = document.createElement('label');
Object.assign(rainbowLabel.style, {
    gridColumn: '1 / -1',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontSize: '20px', cursor: 'pointer', padding: '4px 0 8px',
    borderBottom: '2px solid #ffe0b2', marginBottom: '4px',
});
rainbowLabel.textContent = '🌈 Couleur magique';
const rainbowInput = document.createElement('input');
rainbowInput.type = 'color';
rainbowInput.value = '#ff0000';
Object.assign(rainbowInput.style, {
    width: '46px', height: '34px', border: 'none',
    background: 'none', cursor: 'pointer',
});
rainbowInput.addEventListener('input', () => pickColor(rainbowInput.value));
rainbowLabel.appendChild(rainbowInput);
colorPanel.appendChild(rainbowLabel);

// Toutes les pastilles de nuances.
COLORS.forEach((color) => {
    const b = makeBtn({ width: '40px', height: '40px', background: color });
    if (color === '#ffffff') b.style.borderColor = '#ccc';
    b.addEventListener('click', () => pickColor(color));
    swatchEls.push({ el: b, color });
    colorPanel.appendChild(b);
});
document.getElementById('game-container').appendChild(colorPanel);

function toggleColorPanel(force) {
    const show = force !== undefined ? force : colorPanel.style.display === 'none';
    colorPanel.style.display = show ? 'grid' : 'none';
    if (show && typeof stickerPanel !== 'undefined') stickerPanel.style.display = 'none';
}

// Séparateur
function separator() {
    const s = document.createElement('div');
    Object.assign(s.style, {
        flex: '0 0 auto',
        width: '3px',
        height: '40px',
        background: '#ffb74d',
        borderRadius: '2px',
        margin: '0 4px',
    });
    toolbar.appendChild(s);
}
separator();

// Taille de crayon : réglette coulissante + rond d'aperçu
const sizeBox = document.createElement('div');
Object.assign(sizeBox.style, {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 6px',
});

// Zone d'aperçu (le rond change de taille en direct), centrée dans un carré fixe.
const previewBox = document.createElement('div');
Object.assign(previewBox.style, {
    flex: '0 0 auto',
    width: '54px', height: '54px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
});
sizePreview = document.createElement('div');
Object.assign(sizePreview.style, {
    borderRadius: '50%',
    border: '2px solid transparent',
    background: '#333',
});
previewBox.appendChild(sizePreview);
sizeBox.appendChild(previewBox);

// La réglette elle-même.
const slider = document.createElement('input');
slider.type = 'range';
slider.min = String(MIN_SIZE);
slider.max = String(MAX_SIZE);
slider.value = String(state.size);
Object.assign(slider.style, {
    flex: '0 0 auto',
    width: '160px',
    height: '36px',
    cursor: 'pointer',
    accentColor: '#fb8c00',
});
slider.addEventListener('input', () => {
    state.size = Number(slider.value);
    refreshSelection();
});
sizeBox.appendChild(slider);

toolbar.appendChild(sizeBox);

separator();

// Gomme
eraserBtn = makeBtn({
    width: '48px', height: '48px', borderRadius: '14px',
    background: '#fff', border: '3px solid #ddd', fontSize: '26px',
});
eraserBtn.textContent = '🧽';
eraserBtn.addEventListener('click', () => {
    state.erasing = true;
    state.sticker = null;
    refreshSelection();
});
toolbar.appendChild(eraserBtn);

// Stickers : bouton + panneau déroulant
stickerBtn = makeBtn({
    width: '48px', height: '48px', borderRadius: '14px',
    background: '#fff', border: '3px solid #ddd', fontSize: '26px',
});
stickerBtn.textContent = '✨';
stickerBtn.addEventListener('click', () => toggleStickerPanel());
toolbar.appendChild(stickerBtn);

// Le panneau de stickers (caché par défaut), flottant au-dessus de la barre.
const stickerPanel = document.createElement('div');
Object.assign(stickerPanel.style, {
    position: 'fixed',
    left: '50%',
    bottom: '80px',
    transform: 'translateX(-50%)',
    width: 'min(92vw, 360px)',
    maxHeight: '50vh',
    overflowY: 'auto',
    background: '#fff',
    border: '4px solid #ffb74d',
    borderRadius: '18px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    padding: '12px',
    display: 'none',
    gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
    gap: '6px',
    zIndex: '20',
});
STICKERS.forEach((emoji) => {
    const s = document.createElement('button');
    Object.assign(s.style, {
        fontSize: '32px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        borderRadius: '12px',
        padding: '6px 0',
    });
    s.textContent = emoji;
    s.addEventListener('click', () => {
        state.sticker = emoji;
        state.erasing = false;
        toggleStickerPanel(false);
        refreshSelection();
    });
    stickerPanel.appendChild(s);
});
document.getElementById('game-container').appendChild(stickerPanel);

function toggleStickerPanel(force) {
    const show = force !== undefined ? force : stickerPanel.style.display === 'none';
    stickerPanel.style.display = show ? 'grid' : 'none';
    if (show && typeof colorPanel !== 'undefined') colorPanel.style.display = 'none';
}

// Tout effacer
const clearBtn = makeBtn({
    width: '48px', height: '48px', borderRadius: '14px',
    background: '#ffcdd2', border: '3px solid #ef9a9a', fontSize: '26px',
});
clearBtn.textContent = '🗑️';
clearBtn.addEventListener('click', () => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
});
toolbar.appendChild(clearBtn);

// ---------------------------------------------------------------------------
// Démarrage
// ---------------------------------------------------------------------------
resizeCanvas();
refreshSelection();
