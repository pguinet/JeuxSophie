// Petits effets sonores en Web Audio (aucun fichier à charger).
// Inspiré de saut/js/audio.js.

let ctx = null;
let busSfx = null;
let muted = false;

const SFX_VOL = 0.3;

export function initAudio() {
    if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;               // navigateur sans Web Audio : on joue sans son
        ctx = new AC();
        busSfx = ctx.createGain();
        busSfx.gain.value = muted ? 0 : SFX_VOL;
        busSfx.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
}

export function setMuted(m) {
    muted = m;
    if (busSfx) busSfx.gain.value = m ? 0 : SFX_VOL;
}
export function isMuted() { return muted; }

function note(freq, t0, dur, type = 'triangle', peak = 0.5) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(busSfx);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
}

export function sfxClick() {
    if (!ctx) return;
    note(660, ctx.currentTime, 0.08, 'square', 0.4);
}

export function sfxCorrect() {
    if (!ctx) return;
    const t = ctx.currentTime;
    note(784, t, 0.10, 'triangle', 0.5);
    note(1046, t + 0.08, 0.14, 'triangle', 0.5);
}

export function sfxWrong() {
    if (!ctx) return;
    const t = ctx.currentTime;
    note(300, t, 0.18, 'sawtooth', 0.32);
    note(220, t + 0.1, 0.22, 'sawtooth', 0.32);
}

export function sfxWin() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1046, 1319].forEach((f, i) => note(f, t + i * 0.11, 0.22, 'triangle', 0.5));
}
