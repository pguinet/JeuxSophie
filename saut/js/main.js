// Monte tout en haut ! — petit jeu de plateforme vertical pour Sophie.
// Canvas 2D pur. Joystick à gauche pour bouger, bouton SAUT à droite.
// Le personnage grimpe de plateforme en plateforme pour attraper des pièces ;
// s'il tombe sous l'écran, c'est fini.

import * as audio from './audio.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const controls = document.getElementById('controls');

// --- Dimensions logiques (pixels CSS) ---
let W = 0, H = 0;
function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// --- Réglages du jeu ---
const GRAVITY = 2000;        // px/s²
const JUMP_BASE = -780;      // vitesse de saut de base (vers le haut)
const JUMP_PER_LEVEL = -75;  // bonus de saut par niveau acheté
const MOVE_SPEED = 330;      // vitesse horizontale
const PLAYER_W = 40;
const PLAYER_H = 48;
const PLAT_H = 18;
const COIN_R = 14;
const PX_PER_M = 52;         // pixels par mètre

// --- Parcours disponibles ---
// Le parcours difficile est plus haut, ses plateformes sont plus petites et
// plus espacées, et il rapporte plus de pièces.
const LEVELS = {
    easy: { key: 'easy', name: 'Parcours facile',    icon: '🌳', totalM: 100, coins: 50,  platW: 92, gapMin: 62, gapMax: 112 },
    hard: { key: 'hard', name: 'Parcours difficile', icon: '🔥', totalM: 160, coins: 100, platW: 62, gapMin: 78, gapMax: 120 },
};
const HARD_UNLOCK = 500;     // pièces nécessaires pour débloquer le parcours difficile
let cfg = LEVELS.easy;       // parcours en cours

// --- Magasin ---
// Améliorations de saut : coût pour passer au niveau suivant (index = niveau actuel).
const JUMP_COSTS = [40, 90, 160, 260];
// Accessoires cosmétiques dessinés sur le personnage.
const ACCESSORIES = [
    { id: 'glasses', name: 'Lunettes', icon: '👓', price: 50 },
    { id: 'hat',     name: 'Chapeau',  icon: '🎩', price: 80 },
    { id: 'bow',     name: 'Nœud',     icon: '🎀', price: 60 },
    { id: 'crown',   name: 'Couronne', icon: '👑', price: 150 },
];

// --- Sauvegarde (pièces accumulées, niveau de saut, accessoires) ---
const SAVE_KEY = 'saut_save';
let save = loadSave();
function loadSave() {
    const def = { coins: 0, jumpLevel: 0, owned: {}, equipped: {}, hardUnlocked: false, muted: false };
    try {
        const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
        return raw ? Object.assign(def, raw) : def;
    } catch {
        return def;
    }
}
function persist() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
function jumpVelocity() {
    return JUMP_BASE + save.jumpLevel * JUMP_PER_LEVEL;
}
// Débloque (définitivement) le parcours difficile dès qu'on a atteint le seuil.
function checkHardUnlock() {
    if (!save.hardUnlocked && save.coins >= HARD_UNLOCK) {
        save.hardUnlocked = true;
        persist();
    }
}

// --- État du jeu ---
let player, platforms, coins, particles, floatTexts, camY, score, best = 0;
let dead, jumpBuffer, groundY, finishY, started = false;

function reset() {
    player = { x: W / 2 - PLAYER_W / 2, y: 0, vx: 0, vy: 0, onGround: false, face: 1 };
    platforms = [];
    coins = [];
    particles = [];
    floatTexts = [];
    score = 0;
    dead = false;
    jumpBuffer = 0;

    // Plateforme de départ, large, au bas de l'écran.
    groundY = H - 90;
    platforms.push({ x: 0, y: groundY, w: W, h: PLAT_H, ground: true });
    player.y = groundY - PLAYER_H;
    player.onGround = true;

    camY = 0;

    // Génère le parcours par sauts toujours réalisables, du bas vers le haut.
    const topTarget = groundY - cfg.totalM * PX_PER_M;
    let lastX = W / 2 - cfg.platW / 2;
    let y = groundY;
    while (y - cfg.gapMax > topTarget) {
        y -= rand(cfg.gapMin, cfg.gapMax);
        lastX = nextPlatformX(lastX);
        platforms.push({ x: lastX, y, w: cfg.platW, h: PLAT_H, ground: false });
    }

    // L'arrivée est posée à un dernier saut réalisable au-dessus de la dernière plateforme.
    finishY = y - rand(cfg.gapMin, cfg.gapMax);
    const finishW = cfg.platW * 1.6;
    const finishX = clamp(lastX - 30, 0, W - finishW);
    platforms.push({ x: finishX, y: finishY, w: finishW, h: PLAT_H, ground: false, finish: true });

    // Toutes les pièces sont regroupées en un gros tas juste au-dessus de l'arrivée.
    const cols = 10, spacing = 30;
    const centerX = finishX + finishW / 2;
    for (let i = 0; i < cfg.coins; i++) {
        const col = i % cols, row = Math.floor(i / cols);
        const cx = clamp(centerX + (col - (cols - 1) / 2) * spacing, COIN_R, W - COIN_R);
        const cy = finishY - 34 - row * spacing;
        coins.push({ x: cx, y: cy, taken: false });
    }

    hideEnd();
    updateHud();
}

// --- Petites aides ---
function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function nextPlatformX(prevX) {
    // L'écart horizontal reste dans la portée d'un saut (sinon plateforme inatteignable).
    const min = clamp(prevX - 125, 0, W - cfg.platW);
    const max = clamp(prevX + 125, 0, W - cfg.platW);
    return rand(min, max);
}

// ---------------------------------------------------------------------------
// Joystick (gauche) — ne sert qu'à l'axe horizontal ici.
// ---------------------------------------------------------------------------
class Joystick {
    constructor() {
        this.x = 0;
        this.id = null;
        const R = 70;
        this.R = R;

        this.base = document.createElement('div');
        Object.assign(this.base.style, {
            position: 'absolute', left: '22px', bottom: '26px',
            width: R * 2 + 'px', height: R * 2 + 'px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.28)', border: '4px solid rgba(255,255,255,0.6)',
            touchAction: 'none', zIndex: '10',
        });
        this.knob = document.createElement('div');
        Object.assign(this.knob.style, {
            position: 'absolute', left: '50%', top: '50%',
            width: '64px', height: '64px', marginLeft: '-32px', marginTop: '-32px',
            borderRadius: '50%', background: 'rgba(255,255,255,0.85)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        });
        this.base.appendChild(this.knob);
        controls.appendChild(this.base);

        this.base.addEventListener('pointerdown', (e) => this.start(e));
        window.addEventListener('pointermove', (e) => this.move(e));
        window.addEventListener('pointerup', (e) => this.end(e));
        window.addEventListener('pointercancel', (e) => this.end(e));
    }
    center() {
        const r = this.base.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    }
    start(e) {
        if (this.id !== null) return;
        this.id = e.pointerId;
        this.move(e);
    }
    move(e) {
        if (e.pointerId !== this.id) return;
        const { cx } = this.center();
        const dx = clamp(e.clientX - cx, -this.R, this.R);
        this.x = dx / this.R;
        this.knob.style.transform = `translate(${dx}px, 0px)`;
    }
    end(e) {
        if (e.pointerId !== this.id) return;
        this.id = null;
        this.x = 0;
        this.knob.style.transform = 'translate(0px, 0px)';
    }
}

// ---------------------------------------------------------------------------
// Bouton SAUT (droite)
// ---------------------------------------------------------------------------
function makeJumpButton() {
    const btn = document.createElement('div');
    Object.assign(btn.style, {
        position: 'absolute', right: '26px', bottom: '34px',
        width: '110px', height: '110px', borderRadius: '50%',
        background: 'rgba(255,193,77,0.9)', border: '5px solid #fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '40px', color: '#fff', fontWeight: 'bold',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)', touchAction: 'none', zIndex: '10',
        userSelect: 'none',
    });
    btn.textContent = '⬆️';
    btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        jumpBuffer = 0.16; // petite fenêtre : on peut appuyer juste avant d'atterrir
        btn.style.transform = 'scale(0.92)';
    });
    const release = () => { btn.style.transform = 'scale(1)'; };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    controls.appendChild(btn);
}

// ---------------------------------------------------------------------------
// HUD (compteur de pièces)
// ---------------------------------------------------------------------------
let coinLabel;
function makeHud() {
    coinLabel = document.createElement('div');
    Object.assign(coinLabel.style, {
        position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)',
        padding: '8px 18px', borderRadius: '20px',
        background: 'rgba(255,255,255,0.85)', color: '#5d4037',
        fontSize: '26px', fontWeight: 'bold', zIndex: '10',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
    });
    hud.appendChild(coinLabel);
}
function currentMeters() {
    const m = (groundY - (player.y + PLAYER_H)) / PX_PER_M;
    return clamp(Math.round(m), 0, cfg.totalM);
}
function updateHud() {
    if (coinLabel) coinLabel.textContent = `🏔️ ${currentMeters()} m   🪙 ${score}/${cfg.coins}`;
}

// ---------------------------------------------------------------------------
// Menu d'accueil
// ---------------------------------------------------------------------------
let menuEl = null;
function bigButton(label, color = '#ffb74d') {
    const b = document.createElement('button');
    b.textContent = label;
    Object.assign(b.style, {
        fontSize: '32px', padding: '16px 44px', borderRadius: '20px', border: 'none',
        background: color, color: '#fff', fontWeight: 'bold', cursor: 'pointer',
        fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    });
    return b;
}
function showMenu() {
    menuEl = document.createElement('div');
    Object.assign(menuEl.style, {
        position: 'absolute', inset: '0', zIndex: '40',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '18px', textAlign: 'center', padding: '24px',
        background: 'linear-gradient(#9ad7ff, #d6f0ff)', color: '#3e2723',
    });

    const title = document.createElement('div');
    title.textContent = '🏔️ Monte tout en haut !';
    Object.assign(title.style, { fontSize: '40px', fontWeight: 'bold' });

    const sub = document.createElement('div');
    sub.textContent = 'Grimpe jusqu’au sommet et gagne le trésor de 50 pièces 🪙';
    Object.assign(sub.style, { fontSize: '22px', maxWidth: '420px' });

    const purse = document.createElement('div');
    purse.textContent = `💰 ${save.coins} pièces`;
    Object.assign(purse.style, {
        fontSize: '26px', fontWeight: 'bold', background: 'rgba(255,255,255,0.7)',
        padding: '6px 20px', borderRadius: '18px',
    });

    // Parcours facile (toujours disponible)
    const easyBtn = bigButton('🌳 Parcours facile', '#66bb6a');
    easyBtn.addEventListener('click', () => startLevel('easy'));

    // Parcours difficile : débloqué (définitivement) à partir de HARD_UNLOCK pièces
    checkHardUnlock();
    const unlocked = save.hardUnlocked;
    const hardBtn = bigButton(
        unlocked ? '🔥 Parcours difficile' : `🔒 Difficile (${HARD_UNLOCK} 🪙)`,
        unlocked ? '#ef5350' : '#bdbdbd');
    if (unlocked) {
        hardBtn.addEventListener('click', () => startLevel('hard'));
    } else {
        hardBtn.disabled = true;
        hardBtn.style.cursor = 'default';
        hardBtn.style.opacity = '0.8';
    }

    const shopBtn = bigButton('🛒 Magasin', '#ab47bc');
    shopBtn.addEventListener('click', () => { hideMenu(); showShop(); });

    // Bouton son (couper / activer la musique et les bruitages)
    const soundBtn = bigButton(save.muted ? '🔇 Son coupé' : '🔊 Son', '#78909c');
    soundBtn.addEventListener('click', () => {
        save.muted = !save.muted;
        persist();
        ensureAudio();                 // au cas où l'audio n'était pas encore démarré
        audio.setMuted(save.muted);
        if (!save.muted) audio.startMusic();
        soundBtn.textContent = save.muted ? '🔇 Son coupé' : '🔊 Son';
    });

    const hint = document.createElement('div');
    hint.textContent = '🕹️ Joystick / flèches pour bouger · ⬆️ ou Espace pour sauter';
    Object.assign(hint.style, { fontSize: '16px', opacity: '0.8', marginTop: '8px' });

    menuEl.appendChild(title);
    menuEl.appendChild(sub);
    menuEl.appendChild(purse);
    menuEl.appendChild(easyBtn);
    menuEl.appendChild(hardBtn);
    menuEl.appendChild(shopBtn);
    menuEl.appendChild(soundBtn);
    menuEl.appendChild(hint);
    hud.appendChild(menuEl);
}
function startLevel(key) {
    cfg = LEVELS[key];
    hideMenu();
    reset();
    started = true;
}
function hideMenu() {
    if (menuEl) { menuEl.remove(); menuEl = null; }
}

// ---------------------------------------------------------------------------
// Magasin (acheter de la puissance de saut et des accessoires)
// ---------------------------------------------------------------------------
let shopEl = null;
function smallBtn(label, color, enabled = true) {
    const b = document.createElement('button');
    b.textContent = label;
    Object.assign(b.style, {
        fontSize: '20px', padding: '10px 18px', borderRadius: '14px', border: 'none',
        background: enabled ? color : '#bdbdbd', color: '#fff', fontWeight: 'bold',
        cursor: enabled ? 'pointer' : 'default', fontFamily: 'inherit',
        opacity: enabled ? '1' : '0.7',
    });
    b.disabled = !enabled;
    return b;
}
function shopCard() {
    const c = document.createElement('div');
    Object.assign(c.style, {
        background: 'rgba(255,255,255,0.85)', borderRadius: '16px', padding: '14px 18px',
        width: 'min(92vw, 440px)', display: 'flex', alignItems: 'center', gap: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    });
    return c;
}
function showShop() {
    shopEl = document.createElement('div');
    Object.assign(shopEl.style, {
        position: 'absolute', inset: '0', zIndex: '40', overflowY: 'auto',
        background: 'linear-gradient(#d1c4e9, #ede7f6)', color: '#3e2723',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        padding: '22px 12px 40px',
    });
    renderShop();
    hud.appendChild(shopEl);
}
function hideShop() {
    if (shopEl) { shopEl.remove(); shopEl = null; }
}
function renderShop() {
    while (shopEl.firstChild) shopEl.removeChild(shopEl.firstChild);

    // Croix pour quitter, en haut à gauche (reste fixe même si on fait défiler)
    const close = document.createElement('button');
    close.textContent = '✕';
    Object.assign(close.style, {
        position: 'fixed', top: '12px', left: '12px', zIndex: '41',
        width: '50px', height: '50px', borderRadius: '50%', border: 'none',
        background: 'rgba(255,255,255,0.85)', color: '#5d4037', fontSize: '26px',
        fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)', lineHeight: '1',
    });
    close.addEventListener('click', () => { hideShop(); showMenu(); });
    shopEl.appendChild(close);

    const title = document.createElement('div');
    title.textContent = '🛒 Magasin';
    Object.assign(title.style, { fontSize: '36px', fontWeight: 'bold' });
    shopEl.appendChild(title);

    const purse = document.createElement('div');
    purse.textContent = `💰 ${save.coins} pièces`;
    Object.assign(purse.style, {
        fontSize: '26px', fontWeight: 'bold', background: 'rgba(255,255,255,0.7)',
        padding: '6px 20px', borderRadius: '18px', marginBottom: '4px',
    });
    shopEl.appendChild(purse);

    // --- Puissance de saut ---
    const jumpCard = shopCard();
    const jIcon = document.createElement('div');
    jIcon.textContent = '🦘';
    jIcon.style.fontSize = '40px';
    const jInfo = document.createElement('div');
    jInfo.style.flex = '1';
    const lvl = save.jumpLevel, maxLvl = JUMP_COSTS.length;
    const jName = document.createElement('div');
    jName.textContent = 'Puissance de saut';
    Object.assign(jName.style, { fontSize: '22px', fontWeight: 'bold' });
    const jLvl = document.createElement('div');
    jLvl.textContent = `Niveau ${lvl} / ${maxLvl}`;
    Object.assign(jLvl.style, { fontSize: '18px', opacity: '0.8' });
    jInfo.appendChild(jName);
    jInfo.appendChild(jLvl);
    jumpCard.appendChild(jIcon);
    jumpCard.appendChild(jInfo);

    if (lvl < maxLvl) {
        const cost = JUMP_COSTS[lvl];
        const canBuy = save.coins >= cost;
        const b = smallBtn(`⬆️ ${cost} 🪙`, '#7e57c2', canBuy);
        if (canBuy) b.addEventListener('click', () => {
            save.coins -= cost;
            save.jumpLevel++;
            persist();
            audio.sfxBuy();
            renderShop();
        });
        jumpCard.appendChild(b);
    } else {
        const max = document.createElement('div');
        max.textContent = 'MAX 💪';
        Object.assign(max.style, { fontSize: '20px', fontWeight: 'bold', color: '#7e57c2' });
        jumpCard.appendChild(max);
    }
    shopEl.appendChild(jumpCard);

    // --- Accessoires ---
    const accTitle = document.createElement('div');
    accTitle.textContent = '✨ Accessoires';
    Object.assign(accTitle.style, { fontSize: '24px', fontWeight: 'bold', marginTop: '8px' });
    shopEl.appendChild(accTitle);

    for (const a of ACCESSORIES) {
        const card = shopCard();
        const icon = document.createElement('div');
        icon.textContent = a.icon;
        icon.style.fontSize = '40px';
        const name = document.createElement('div');
        name.textContent = a.name;
        Object.assign(name.style, { flex: '1', fontSize: '22px', fontWeight: 'bold' });
        card.appendChild(icon);
        card.appendChild(name);

        const owned = !!save.owned[a.id];
        if (!owned) {
            const canBuy = save.coins >= a.price;
            const b = smallBtn(`Acheter ${a.price} 🪙`, '#26a69a', canBuy);
            if (canBuy) b.addEventListener('click', () => {
                save.coins -= a.price;
                save.owned[a.id] = true;
                save.equipped[a.id] = true; // équipé automatiquement à l'achat
                persist();
                audio.sfxBuy();
                renderShop();
            });
            card.appendChild(b);
        } else {
            const equipped = !!save.equipped[a.id];
            const b = smallBtn(equipped ? 'Porté ✓' : 'Mettre', equipped ? '#66bb6a' : '#90a4ae');
            b.addEventListener('click', () => {
                save.equipped[a.id] = !save.equipped[a.id];
                persist();
                renderShop();
            });
            card.appendChild(b);
        }
        shopEl.appendChild(card);
    }

    const back = bigButton('🏠 Retour', '#90a4ae');
    back.style.marginTop = '10px';
    back.addEventListener('click', () => { hideShop(); showMenu(); });
    shopEl.appendChild(back);
}

// ---------------------------------------------------------------------------
// Écran de fin (victoire à l'arrivée, ou chute)
// ---------------------------------------------------------------------------
let endEl = null;
function showEnd(victory) {
    best = Math.max(best, score);
    // On garde les pièces gagnées : elles s'ajoutent au trésor accumulé.
    save.coins += score;
    persist();
    checkHardUnlock();
    endEl = document.createElement('div');
    Object.assign(endEl.style, {
        position: 'absolute', inset: '0', zIndex: '30',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: victory ? 'rgba(46,125,50,0.55)' : 'rgba(0,0,0,0.45)',
        color: '#fff', textAlign: 'center', gap: '14px', padding: '20px',
    });

    const title = document.createElement('div');
    Object.assign(title.style, { fontSize: '40px', fontWeight: 'bold' });

    const sc = document.createElement('div');
    Object.assign(sc.style, { fontSize: '28px' });

    if (victory) {
        const allCoins = score >= cfg.coins;
        title.textContent = allCoins ? '🏆 PARFAIT ! 🏆' : '🏁 Arrivée ! 🎉';
        sc.textContent = `Tu as fini les ${cfg.totalM} m !`;
        const line2 = document.createElement('div');
        Object.assign(line2.style, { fontSize: '26px', marginTop: '6px' });
        line2.textContent = allCoins
            ? `🪙 TOUTES les pièces : ${score}/${cfg.coins} ! ⭐`
            : `🪙 Pièces attrapées : ${score}/${cfg.coins}`;
        sc.appendChild(line2);
    } else {
        title.textContent = 'Oups, tombé ! 😅';
        sc.textContent = `🪙 Pièces attrapées : ${score}/${cfg.coins}`;
        const rec = document.createElement('div');
        Object.assign(rec.style, { fontSize: '22px', marginTop: '4px' });
        rec.textContent = `Tu étais à ${currentMeters()} m`;
        sc.appendChild(rec);
    }

    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', gap: '14px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' });

    const again = bigButton('🔄 Rejouer');
    again.addEventListener('click', () => { hideEnd(); reset(); started = true; });

    const menu = bigButton('🏠 Menu', '#90a4ae');
    menu.addEventListener('click', () => { hideEnd(); reset(); started = false; showMenu(); });

    row.appendChild(again);
    row.appendChild(menu);

    const total = document.createElement('div');
    Object.assign(total.style, { fontSize: '24px', marginTop: '6px' });
    total.textContent = `💰 Ton trésor : ${save.coins} pièces`;

    endEl.appendChild(title);
    endEl.appendChild(sc);
    endEl.appendChild(total);
    endEl.appendChild(row);
    hud.appendChild(endEl);
}
function hideEnd() {
    if (endEl) { endEl.remove(); endEl = null; }
}

// ---------------------------------------------------------------------------
// Mise à jour du jeu
// ---------------------------------------------------------------------------
function update(dt) {
    if (!started || dead) return;

    // Déplacement horizontal (joystick OU flèches du clavier)
    let axis = joystick.x;
    if (keys.left && !keys.right) axis = -1;
    else if (keys.right && !keys.left) axis = 1;
    player.vx = axis * MOVE_SPEED;
    if (player.vx > 5) player.face = 1;
    else if (player.vx < -5) player.face = -1;
    player.x += player.vx * dt;
    player.x = clamp(player.x, 0, W - PLAYER_W);

    // Saut (si on est posé et qu'on a appuyé récemment)
    if (jumpBuffer > 0) jumpBuffer -= dt;
    if (player.onGround && jumpBuffer > 0) {
        player.vy = jumpVelocity();
        player.onGround = false;
        jumpBuffer = 0;
        audio.sfxJump();
    }

    // Gravité
    player.vy += GRAVITY * dt;
    const prevFeet = player.y + PLAYER_H;
    player.y += player.vy * dt;
    const feet = player.y + PLAYER_H;

    // Collision avec les plateformes (uniquement en tombant, traversables par en-dessous)
    player.onGround = false;
    if (player.vy >= 0) {
        for (const p of platforms) {
            if (prevFeet <= p.y + 1 && feet >= p.y &&
                player.x + PLAYER_W > p.x + 4 && player.x < p.x + p.w - 4) {
                player.y = p.y - PLAYER_H;
                player.vy = 0;
                player.onGround = true;
                // Atterri sur l'arrivée → on rafle les 50 pièces d'un coup, puis victoire !
                if (p.finish) {
                    for (const c of coins) {
                        if (!c.taken) {
                            c.taken = true;
                            // gerbe d'étincelles dorées depuis chaque pièce
                            for (let k = 0; k < 3; k++) {
                                particles.push({
                                    x: c.x, y: c.y,
                                    vx: rand(-160, 160), vy: rand(-220, -40),
                                    life: rand(0.5, 1.0), color: '#ffd54f',
                                });
                            }
                        }
                    }
                    score = cfg.coins;
                    updateHud();
                    dead = true;
                    audio.sfxWin();
                    showEnd(true);
                    return;
                }
                break;
            }
        }
    }

    // Caméra : ne monte jamais redescendre (le bas devient mortel)
    const target = player.y - H * 0.45;
    if (target < camY) camY = target;

    // Pièces attrapées
    const pcx = player.x + PLAYER_W / 2;
    const pcy = player.y + PLAYER_H / 2;
    for (const c of coins) {
        if (c.taken) continue;
        if (Math.hypot(c.x - pcx, c.y - pcy) < COIN_R + 24) {
            c.taken = true;
            score++;
            updateHud();
            audio.sfxCoin();
            floatTexts.push({ x: c.x, y: c.y, life: 1, text: '+1' });
            for (let i = 0; i < 8; i++) {
                particles.push({
                    x: c.x, y: c.y,
                    vx: rand(-120, 120), vy: rand(-180, -40),
                    life: rand(0.4, 0.8), color: '#ffd54f',
                });
            }
        }
    }

    // Mort : tombé sous l'écran
    if (player.y - camY > H + 20) {
        dead = true;
        audio.sfxFall();
        showEnd(false);
        return;
    }

    // Met à jour l'altitude affichée
    updateHud();

    // Particules & textes flottants
    for (const pt of particles) {
        pt.vy += 600 * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
    }
    particles = particles.filter(p => p.life > 0);
    for (const t of floatTexts) { t.y -= 40 * dt; t.life -= dt; }
    floatTexts = floatTexts.filter(t => t.life > 0);
}

// ---------------------------------------------------------------------------
// Rendu
// ---------------------------------------------------------------------------
function draw() {
    // Ciel dégradé
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#9ad7ff');
    sky.addColorStop(1, '#d6f0ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Nuages (parallaxe douce selon la hauteur)
    drawClouds();

    ctx.save();
    ctx.translate(0, -camY);

    // Plateformes
    for (const p of platforms) {
        drawPlatform(p);
    }
    // Pièces
    for (const c of coins) {
        if (!c.taken) drawCoin(c);
    }
    // Particules
    for (const pt of particles) {
        ctx.globalAlpha = clamp(pt.life * 1.5, 0, 1);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Personnage
    drawPlayer();

    // Textes flottants
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px "Comic Sans MS", sans-serif';
    for (const t of floatTexts) {
        ctx.globalAlpha = clamp(t.life, 0, 1);
        ctx.fillStyle = '#ff8f00';
        ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
}

function drawClouds() {
    // Quelques nuages fixes en parallaxe (se répètent quand on monte).
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const off = (-camY * 0.3) % 260;
    for (let i = -1; i < H / 260 + 2; i++) {
        const y = i * 260 + off;
        cloud(W * 0.2, y + 40, 1);
        cloud(W * 0.75, y + 150, 0.8);
    }
}
function cloud(x, y, s) {
    ctx.beginPath();
    ctx.arc(x, y, 26 * s, 0, Math.PI * 2);
    ctx.arc(x + 28 * s, y + 6 * s, 20 * s, 0, Math.PI * 2);
    ctx.arc(x - 26 * s, y + 8 * s, 18 * s, 0, Math.PI * 2);
    ctx.fill();
}

function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function drawPlatform(p) {
    // Terre
    ctx.fillStyle = p.ground ? '#8d6e63' : '#a1887f';
    roundRect(p.x, p.y, p.w, p.h, 6);
    ctx.fill();
    // Herbe sur le dessus
    ctx.fillStyle = p.finish ? '#ffd54f' : '#7cb342';
    roundRect(p.x, p.y - 4, p.w, 10, 5);
    ctx.fill();

    if (p.finish) {
        // Mât + drapeau à damier de l'arrivée
        const mastX = p.x + p.w - 18;
        const topY = p.y - 64;
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(mastX, p.y - 2);
        ctx.lineTo(mastX, topY);
        ctx.stroke();
        // Damier
        const fw = 40, fh = 28, cells = 4, cs = fw / cells;
        for (let r = 0; r < cells; r++) {
            for (let cidx = 0; cidx < cells; cidx++) {
                ctx.fillStyle = (r + cidx) % 2 ? '#fff' : '#222';
                ctx.fillRect(mastX - fw + cidx * cs, topY + r * (fh / cells), cs, fh / cells);
            }
        }
        // Petit texte ARRIVÉE
        ctx.fillStyle = '#5d4037';
        ctx.font = 'bold 16px "Comic Sans MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ARRIVÉE', p.x + p.w / 2, p.y + 16);
        ctx.textAlign = 'left';
    }
}

function drawCoin(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = '#ffca28';
    ctx.beginPath();
    ctx.arc(0, 0, COIN_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f9a825';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 1);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
}

function drawPlayer() {
    const x = player.x, y = player.y, w = PLAYER_W, h = PLAYER_H;
    // Corps
    ctx.fillStyle = '#ff7043';
    roundRect(x, y, w, h, 12);
    ctx.fill();
    // Ventre plus clair
    ctx.fillStyle = '#ffab91';
    roundRect(x + 8, y + 18, w - 16, h - 24, 8);
    ctx.fill();
    // Yeux
    const ex = x + w / 2 + player.face * 5;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex - 8, y + 16, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 8, y + 16, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3e2723';
    ctx.beginPath(); ctx.arc(ex - 8 + player.face * 2, y + 16, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 8 + player.face * 2, y + 16, 3, 0, Math.PI * 2); ctx.fill();
    // Sourire
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 26, 5, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // Accessoires achetés au magasin
    drawAccessories(x, y, w, ex);
}

function drawAccessories(x, y, w, ex) {
    const cx = x + w / 2;
    // Lunettes : deux verres autour des yeux + pont
    if (save.equipped.glasses) {
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(ex - 8, y + 16, 8, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(ex + 8, y + 16, 8, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex - 1, y + 16); ctx.lineTo(ex + 1, y + 16); ctx.stroke();
    }
    // Nœud sur le côté de la tête
    if (save.equipped.bow) {
        ctx.fillStyle = '#ec407a';
        const bx = x + w - 4, by = y + 6;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 10, by - 7); ctx.lineTo(bx + 10, by + 7); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 10, by - 7); ctx.lineTo(bx - 10, by + 7); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fill();
    }
    // Chapeau haut de forme posé sur la tête
    if (save.equipped.hat) {
        ctx.fillStyle = '#37474f';
        ctx.fillRect(cx - 18, y - 4, 36, 6);      // bord
        ctx.fillRect(cx - 11, y - 22, 22, 20);    // haut
    }
    // Couronne dorée
    if (save.equipped.crown) {
        ctx.fillStyle = '#ffca28';
        ctx.beginPath();
        ctx.moveTo(cx - 16, y + 2);
        ctx.lineTo(cx - 16, y - 12);
        ctx.lineTo(cx - 8, y - 4);
        ctx.lineTo(cx, y - 14);
        ctx.lineTo(cx + 8, y - 4);
        ctx.lineTo(cx + 16, y - 12);
        ctx.lineTo(cx + 16, y + 2);
        ctx.closePath();
        ctx.fill();
    }
}

// ---------------------------------------------------------------------------
// Boucle
// ---------------------------------------------------------------------------
let last = null;
function loop(ts) {
    if (last === null) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    dt = Math.min(dt, 0.05); // évite les gros sauts si l'onglet a laggé
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Clavier (pour jouer sur ordinateur) : ⬅️ ➡️ pour bouger, Espace / ⬆️ pour sauter.
// On gère aussi Q/D (claviers AZERTY) et A/D (QWERTY).
// ---------------------------------------------------------------------------
const keys = { left: false, right: false };
window.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'ArrowLeft': case 'KeyQ': case 'KeyA':
            keys.left = true; e.preventDefault(); break;
        case 'ArrowRight': case 'KeyD':
            keys.right = true; e.preventDefault(); break;
        case 'Space': case 'ArrowUp': case 'KeyW': case 'KeyZ':
            if (!e.repeat) jumpBuffer = 0.16; // un appui = un saut
            e.preventDefault(); break;
    }
});
window.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'ArrowLeft': case 'KeyQ': case 'KeyA': keys.left = false; break;
        case 'ArrowRight': case 'KeyD': keys.right = false; break;
    }
});

// --- Audio : démarre au tout premier geste (clic ou touche), exigé par les navigateurs.
let audioReady = false;
function ensureAudio() {
    if (audioReady) return;
    audioReady = true;
    audio.initAudio();
    audio.setMuted(save.muted);
    if (!save.muted) audio.startMusic();
}
window.addEventListener('pointerdown', ensureAudio);
window.addEventListener('keydown', ensureAudio);

// --- Démarrage ---
const joystick = new Joystick();
makeJumpButton();
makeHud();
reset();          // prépare le parcours
started = false;  // ... mais on attend que Sophie clique sur JOUER
showMenu();
requestAnimationFrame(loop);
