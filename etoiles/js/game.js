// Attrape les étoiles — le personnage de Sophie (celui du jeu d'habillage) se
// promène et ramasse des étoiles. Déplacement au doigt (ou à la souris) et aux
// flèches du clavier.

import { loadAvatar, buildAvatarSVG } from '../../shared/avatar.js';

const terrain = document.getElementById('terrain');
const joueur = document.getElementById('joueur');
const scoreEl = document.getElementById('score');
const consigne = document.getElementById('consigne');

// Le personnage = l'avatar sauvegardé, sans fond (sprite transparent)
joueur.innerHTML = buildAvatarSVG(loadAvatar(), { background: false });

const PW = 66, PH = Math.round(PW * 290 / 200);   // dimensions du sprite
const TOP = 76;                                    // bande réservée au HUD

let W = window.innerWidth, H = window.innerHeight;
function resize() { W = window.innerWidth; H = window.innerHeight; clampPos(); }
window.addEventListener('resize', resize);

// centre du joueur
let px = W / 2, py = (H + TOP) / 2;

function clampPos() {
    px = Math.max(PW / 2, Math.min(W - PW / 2, px));
    py = Math.max(TOP + PH / 2, Math.min(H - PH / 2, py));
}

// ---- Étoiles ----
const STAR_COUNT = 6;
const stars = [];
const rand = (min, max) => min + Math.random() * (max - min);

const STAR_LIFE = 5000;   // une étoile non ramassée bouge au bout de 5 secondes

function placeStar(star) {
    star.x = rand(46, W - 46);
    star.y = rand(TOP + 46, H - 46);
    star.el.style.transform = `translate(${star.x - 22}px, ${star.y - 22}px)`;
    star.placedAt = performance.now();
}
for (let i = 0; i < STAR_COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'star';
    const inner = document.createElement('span');
    inner.className = 'star-in';
    inner.textContent = '⭐';
    inner.style.animationDelay = (i * 0.2) + 's';
    el.appendChild(inner);
    terrain.appendChild(el);
    const star = { el, x: 0, y: 0, placedAt: 0, fading: false };
    placeStar(star);
    stars.push(star);
}

// Fait disparaître l'étoile en douceur puis la replace ailleurs
function deplaceEtoile(star) {
    star.fading = true;
    star.el.style.opacity = '0';
    setTimeout(() => {
        placeStar(star);
        star.el.style.opacity = '1';
        star.fading = false;
    }, 200);
}

// ---- Score ----
let score = 0;
function ramasse(star) {
    score++;
    scoreEl.textContent = '⭐ ' + score;
    const p = document.createElement('div');
    p.className = 'plus1';
    p.textContent = '+1';
    p.style.left = star.x + 'px';
    p.style.top = star.y + 'px';
    terrain.appendChild(p);
    setTimeout(() => p.remove(), 800);
    placeStar(star);
    if (consigne) { consigne.style.display = 'none'; }
}

// ---- Contrôles ----
let pointerActive = false, tx = px, ty = py;
const keys = {};

function setTarget(e) { tx = e.clientX; ty = e.clientY; }
terrain.addEventListener('pointerdown', (e) => { pointerActive = true; setTarget(e); });
terrain.addEventListener('pointermove', (e) => { if (pointerActive) setTarget(e); });
window.addEventListener('pointerup', () => { pointerActive = false; });
window.addEventListener('pointercancel', () => { pointerActive = false; });

window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// ---- Boucle ----
const SPEED = 320;   // px/s
let last = performance.now();
let bob = 0;

function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    let dx = 0, dy = 0;
    if (keys['ArrowLeft']) dx -= 1;
    if (keys['ArrowRight']) dx += 1;
    if (keys['ArrowUp']) dy -= 1;
    if (keys['ArrowDown']) dy += 1;

    let moving = false;
    if (dx || dy) {
        const len = Math.hypot(dx, dy);
        px += (dx / len) * SPEED * dt;
        py += (dy / len) * SPEED * dt;
        moving = true;
    } else if (pointerActive) {
        const ddx = tx - px, ddy = ty - py, dist = Math.hypot(ddx, ddy);
        if (dist > 4) {
            const step = Math.min(dist, SPEED * dt);
            px += (ddx / dist) * step;
            py += (ddy / dist) * step;
            moving = true;
        }
    }

    clampPos();

    if (moving) bob += dt * 12;
    const bobY = moving ? Math.sin(bob) * 3 : 0;
    joueur.style.transform = `translate(${px - PW / 2}px, ${py - PH / 2 + bobY}px)`;

    for (const star of stars) {
        if (star.fading) continue;
        if (Math.hypot(px - star.x, py - star.y) < 46) { ramasse(star); continue; }
        if (now - star.placedAt > STAR_LIFE) deplaceEtoile(star);
    }

    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
