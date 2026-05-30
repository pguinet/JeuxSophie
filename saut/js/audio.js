// Audio du jeu — sons et musique fabriqués par synthèse (Web Audio API).
// Aucun fichier externe : tout est généré à la volée.
// Les navigateurs bloquent le son tant que l'utilisateur n'a pas interagi :
// initAudio() doit donc être appelé suite à un clic / appui (voir main.js).

let ctx = null;
let busMusic = null;   // volume de la musique de fond
let busSfx = null;     // volume des effets sonores
let muted = false;
let musicOn = false;
let loopTimer = null;

const MUSIC_VOL = 0.06;
const SFX_VOL = 0.28;

export function initAudio() {
    if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;            // navigateur sans Web Audio : on joue sans son
        ctx = new AC();
        busMusic = ctx.createGain();
        busMusic.gain.value = muted ? 0 : MUSIC_VOL;
        busMusic.connect(ctx.destination);
        busSfx = ctx.createGain();
        busSfx.gain.value = muted ? 0 : SFX_VOL;
        busSfx.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
}

export function setMuted(m) {
    muted = m;
    if (busMusic) busMusic.gain.value = m ? 0 : MUSIC_VOL;
    if (busSfx) busSfx.gain.value = m ? 0 : SFX_VOL;
}
export function isMuted() { return muted; }

// Une note simple avec une petite enveloppe (montée rapide puis extinction).
function note(bus, freq, t0, dur, type = 'triangle', peak = 0.5) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(bus);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
}

// --- Effets sonores ---
export function sfxJump() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(680, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g);
    g.connect(busSfx);
    o.start(t);
    o.stop(t + 0.2);
}

export function sfxCoin() {
    if (!ctx) return;
    const t = ctx.currentTime;
    note(busSfx, 988, t, 0.09, 'triangle', 0.5);
    note(busSfx, 1319, t + 0.05, 0.12, 'triangle', 0.5);
}

export function sfxWin() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1046, 1319].forEach((f, i) => {
        note(busSfx, f, t + i * 0.11, 0.22, 'triangle', 0.5);
    });
}

export function sfxFall() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(110, t + 0.45);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g);
    g.connect(busSfx);
    o.start(t);
    o.stop(t + 0.55);
}

export function sfxBuy() {
    if (!ctx) return;
    const t = ctx.currentTime;
    note(busSfx, 660, t, 0.08, 'square', 0.45);
    note(busSfx, 990, t + 0.07, 0.14, 'square', 0.45);
}

// --- Musique de fond : boucle originale "style jeu vidéo rétro" (chiptune 8-bit) ---
const BEAT = 0.16;          // tempo vif et bondissant
// 0 = silence ; sinon fréquence de la note.
const MELODY = [
    523, 659, 784, 1046,  784, 659, 523, 0,   // arpège Do qui monte puis descend
    587, 698, 880, 1175,  880, 698, 587, 0,   // arpège Ré
    659, 784, 1046, 1319, 1046, 784, 659, 0,  // arpège Mi (plus haut)
    784, 784, 698, 659,   587, 523,   0, 0,   // petite descente finale
];
const BASS = [
    131, 0, 131, 0, 196, 0, 131, 0,
    147, 0, 147, 0, 110, 0, 147, 0,
    165, 0, 165, 0, 131, 0, 165, 0,
    196, 0, 196, 0, 131, 0, 131, 0,
];

function scheduleLoop() {
    if (!musicOn || !ctx) return;
    const start = ctx.currentTime + 0.06;
    for (let i = 0; i < MELODY.length; i++) {
        const t = start + i * BEAT;
        if (MELODY[i]) note(busMusic, MELODY[i], t, BEAT * 0.9, 'square', 0.42);
        if (BASS[i]) note(busMusic, BASS[i], t, BEAT * 1.6, 'triangle', 0.6);
    }
    const loopDur = MELODY.length * BEAT;
    loopTimer = setTimeout(scheduleLoop, loopDur * 1000 - 40);
}

export function startMusic() {
    if (musicOn || !ctx) return;
    musicOn = true;
    scheduleLoop();
}
export function stopMusic() {
    musicOn = false;
    if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
}
