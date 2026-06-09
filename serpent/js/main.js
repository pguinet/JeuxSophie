// Le Serpent (Snake) — canvas, clavier (flèches/ZQSD) + tactile (glisser ou croix).

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const pad = document.getElementById('pad');

const CELLS = 17;           // grille CELLS × CELLS
let cell = 20;              // taille d'une case en pixels (calculée au redimensionnement)

let snake, dir, nextDir, food, score, alive, tickTimer;

function resize() {
    // Canvas carré, au plus 92vw et laissant la place à la barre + la croix.
    const side = Math.min(window.innerWidth * 0.92, window.innerHeight * 0.62, 560);
    cell = Math.floor(side / CELLS);
    canvas.width = canvas.height = cell * CELLS;
    draw();
}
window.addEventListener('resize', resize);

function randCell() { return Math.floor(Math.random() * CELLS); }

function placeFood() {
    do {
        food = { x: randCell(), y: randCell() };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function start() {
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const mid = Math.floor(CELLS / 2);
    snake = [{ x: mid, y: mid }, { x: mid - 1, y: mid }, { x: mid - 2, y: mid }];
    dir = { x: 1, y: 0 };
    nextDir = dir;
    score = 0;
    alive = true;
    scoreEl.textContent = '0';
    placeFood();
    resize();
    clearInterval(tickTimer);
    tickTimer = setInterval(tick, 130);
}

function setDir(x, y) {
    // Interdit le demi-tour direct.
    if (x === -dir.x && y === -dir.y) return;
    nextDir = { x, y };
}

function tick() {
    if (!alive) return;
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Collision mur ou corps → fin
    if (head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS ||
        snake.some(s => s.x === head.x && s.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = String(score);
        placeFood();
    } else {
        snake.pop();
    }
    draw();
}

function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!food) return;

    // Pomme
    ctx.font = `${cell}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍎', food.x * cell + cell / 2, food.y * cell + cell / 2 + 1);

    // Serpent
    snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? '#2f9e44' : '#40c057';
        roundRect(s.x * cell + 1, s.y * cell + 1, cell - 2, cell - 2, cell * 0.3);
    });
}

function gameOver() {
    alive = false;
    clearInterval(tickTimer);
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const h2 = document.createElement('h2');
    h2.textContent = 'Perdu ! 🐍';
    const p = document.createElement('p');
    p.textContent = `Tu as mangé ${score} pomme${score > 1 ? 's' : ''} !`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Rejouer 🔁';
    btn.addEventListener('click', start);
    overlay.append(h2, p, btn);
    document.body.appendChild(overlay);
}

// --- Contrôles clavier ---
const KEYS = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    z: [0, -1], s: [0, 1], q: [-1, 0], d: [1, 0],
    w: [0, -1], a: [-1, 0],
};
window.addEventListener('keydown', e => {
    const k = KEYS[e.key];
    if (k) { setDir(k[0], k[1]); e.preventDefault(); }
});

// --- Croix directionnelle tactile ---
[['up', 0, -1, '⬆️'], ['left', -1, 0, '⬅️'], ['right', 1, 0, '➡️'], ['down', 0, 1, '⬇️']]
    .forEach(([cls, x, y, label]) => {
        const b = document.createElement('button');
        b.className = 'pad-' + cls;
        b.textContent = label;
        b.addEventListener('click', () => setDir(x, y));
        pad.appendChild(b);
    });

// --- Glissement du doigt sur le canvas ---
let touchStart = null;
canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });
canvas.addEventListener('touchmove', e => {
    if (!touchStart) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
    else setDir(0, dy > 0 ? 1 : -1);
    touchStart = null;
}, { passive: true });

start();
