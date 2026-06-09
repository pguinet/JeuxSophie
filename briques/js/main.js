// Casse-briques (Breakout) — canvas. La raquette suit la souris / le doigt.
// Toucher l'écran (ou cliquer) lance la balle.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const hint = document.getElementById('hint');

const COLS = 8;
const ROWS = 5;
const BRICK_COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7'];

let W, H, paddle, ball, bricks, score, lives, running, launched, rafId;

function resize() {
    W = canvas.width = Math.min(window.innerWidth * 0.94, 520);
    H = canvas.height = Math.min(window.innerHeight * 0.66, 720);
    if (paddle) {
        paddle.w = W * 0.22;
        paddle.h = Math.max(12, H * 0.022);
        paddle.y = H - paddle.h - 12;
        paddle.x = Math.min(paddle.x, W - paddle.w);
    }
}
window.addEventListener('resize', () => { resize(); if (!running) draw(); });

function buildBricks() {
    bricks = [];
    const pad = 6;
    const top = H * 0.10;
    const bw = (W - pad * (COLS + 1)) / COLS;
    const bh = H * 0.04;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            bricks.push({
                x: pad + c * (bw + pad),
                y: top + r * (bh + pad),
                w: bw, h: bh,
                color: BRICK_COLORS[r % BRICK_COLORS.length],
                alive: true,
            });
        }
    }
}

function resetBall() {
    launched = false;
    ball = { x: paddle.x + paddle.w / 2, y: paddle.y - 12, r: Math.max(7, W * 0.02), vx: 0, vy: 0 };
    hint.textContent = "Touche l'écran pour lancer la balle !";
}

function launch() {
    if (launched || !running) return;
    launched = true;
    const speed = H * 0.011;
    ball.vx = speed * (Math.random() < 0.5 ? -1 : 1);
    ball.vy = -speed;
    hint.textContent = '';
}

function start() {
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    resize();
    paddle = { w: W * 0.22, h: Math.max(12, H * 0.022), x: W / 2 - W * 0.11, y: H - 24 };
    score = 0;
    lives = 3;
    running = true;
    scoreEl.textContent = '0';
    livesEl.textContent = '3';
    buildBricks();
    resetBall();
    cancelAnimationFrame(rafId);
    loop();
}

function update() {
    if (!launched) {
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - ball.r - 1;
        return;
    }
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Murs
    if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; }
    if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx *= -1; }
    if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -1; }

    // Raquette
    if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y + ball.r <= paddle.y + paddle.h + 12 &&
        ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
        ball.vy = -Math.abs(ball.vy);
        // L'angle dépend de l'endroit touché sur la raquette.
        const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        ball.vx = hit * H * 0.011;
    }

    // Briques
    for (const b of bricks) {
        if (!b.alive) continue;
        if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
            ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
            b.alive = false;
            score++;
            scoreEl.textContent = String(score);
            // Rebond vertical simple
            ball.vy *= -1;
            break;
        }
    }

    // Balle tombée
    if (ball.y - ball.r > H) {
        lives--;
        livesEl.textContent = String(lives);
        if (lives <= 0) { endGame(false); return; }
        resetBall();
    }

    if (bricks.every(b => !b.alive)) endGame(true);
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    // Briques
    for (const b of bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 5);
        ctx.fill();
    }
    // Raquette
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, paddle.h / 2);
    ctx.fill();
    // Balle
    ctx.fillStyle = '#ffd43b';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
}

function loop() {
    if (!running) return;
    update();
    if (!running) return;
    draw();
    rafId = requestAnimationFrame(loop);
}

function endGame(won) {
    running = false;
    cancelAnimationFrame(rafId);
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const h2 = document.createElement('h2');
    h2.textContent = won ? 'Gagné ! 🏆' : 'Perdu ! 💔';
    const p = document.createElement('p');
    p.textContent = `Tu as cassé ${score} brique${score > 1 ? 's' : ''} !`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Rejouer 🔁';
    btn.addEventListener('click', start);
    overlay.append(h2, p, btn);
    document.body.appendChild(overlay);
}

// --- Contrôles : la raquette suit le pointeur ; tap/clic lance la balle ---
function movePaddle(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (W / rect.width);
    paddle.x = Math.max(0, Math.min(W - paddle.w, x - paddle.w / 2));
}
canvas.addEventListener('mousemove', e => { if (running) movePaddle(e.clientX); });
canvas.addEventListener('touchmove', e => {
    if (running && e.touches[0]) { movePaddle(e.touches[0].clientX); e.preventDefault(); }
}, { passive: false });
canvas.addEventListener('mousedown', launch);
canvas.addEventListener('touchstart', e => {
    if (e.touches[0]) movePaddle(e.touches[0].clientX);
    launch();
}, { passive: true });
window.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'ArrowUp') launch(); });

start();
