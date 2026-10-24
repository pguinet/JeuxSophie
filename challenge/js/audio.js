// Effets sonores (Web Audio, aucun fichier) et prononciation anglaise.
// Repris de apprendre/js/audio.js. Rien ne touche window/document au chargement.

let ctx = null;
let busSfx = null;
let muet = false;

const VOL_SFX = 0.3;

export function initAudio() {
    if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;               // navigateur sans Web Audio : on joue sans son
        ctx = new AC();
        busSfx = ctx.createGain();
        busSfx.gain.value = muet ? 0 : VOL_SFX;
        busSfx.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
}

export function setMuet(m) {
    muet = m;
    if (busSfx) busSfx.gain.value = m ? 0 : VOL_SFX;
    if (m && typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}
export function estMuet() { return muet; }

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

export function sfxClic() {
    if (!ctx) return;
    note(660, ctx.currentTime, 0.08, 'square', 0.4);
}

export function sfxBon() {
    if (!ctx) return;
    const t = ctx.currentTime;
    note(784, t, 0.10, 'triangle', 0.5);
    note(1046, t + 0.08, 0.14, 'triangle', 0.5);
}

export function sfxFaux() {
    if (!ctx) return;
    const t = ctx.currentTime;
    note(300, t, 0.18, 'sawtooth', 0.32);
    note(220, t + 0.1, 0.22, 'sawtooth', 0.32);
}

export function sfxFin() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1046, 1319].forEach((f, i) => note(f, t + i * 0.11, 0.22, 'triangle', 0.5));
}

// Source de prononciation : fichier .ogg, sinon voix du navigateur, sinon texte.
export function choisirSource({ fichierOk, voixAnglaise }) {
    if (fichierOk) return 'fichier';
    if (voixAnglaise) return 'voix';
    return 'texte';
}

function voixAnglaise() {
    if (typeof speechSynthesis === 'undefined') return null;
    return speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('en-GB'))
        ?? speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('en')) ?? null;
}

function direAvecVoix(mot) {
    const u = new SpeechSynthesisUtterance(mot);
    u.lang = 'en-GB';
    const v = voixAnglaise();
    if (v) u.voice = v;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
}

// Prononce `mot`. Renvoie une promesse résolue avec la source utilisée
// ('fichier' | 'voix' | 'texte' | 'muet') ; 'texte' = l'écran doit afficher le mot écrit.
export function prononcer(mot, slug) {
    if (muet) return Promise.resolve('muet');
    return new Promise(resolve => {
        const a = new Audio(`audio/${slug}.ogg`);
        a.addEventListener('playing', () => resolve('fichier'), { once: true });
        a.addEventListener('error', () => {
            const source = choisirSource({ fichierOk: false, voixAnglaise: Boolean(voixAnglaise()) });
            if (source === 'voix') direAvecVoix(mot);
            resolve(source);
        }, { once: true });
        a.play().catch(() => {});
    });
}
