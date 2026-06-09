// Memory — retrouve les paires. DOM pur, tactile + souris.

const app = document.getElementById('app');

const EMOJIS = ['🐶', '🐱', '🦊', '🐼', '🦁', '🐸', '🐵', '🦄', '🐝', '🦋',
    '🍓', '🍌', '🍎', '🍉', '🍕', '🍦', '⭐', '🌈', '🚀', '⚽'];
const PAIRS = 8; // 8 paires = 16 cartes (grille 4×4)

let deck = [];
let flipped = [];
let matchedCount = 0;
let moves = 0;
let locked = false;

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function newGame() {
    const chosen = shuffle(EMOJIS).slice(0, PAIRS);
    deck = shuffle([...chosen, ...chosen]).map((emoji, i) => ({ emoji, id: i, matched: false }));
    flipped = [];
    matchedCount = 0;
    moves = 0;
    locked = false;
    render();
}

function render() {
    app.innerHTML = '';

    const topbar = document.createElement('div');
    topbar.className = 'topbar';
    const home = document.createElement('a');
    home.className = 'home-btn';
    home.href = '../';
    home.textContent = '🏠';
    const score = document.createElement('div');
    score.className = 'score-pill';
    score.id = 'score';
    score.textContent = `Coups : ${moves}`;
    topbar.append(home, score);

    const board = document.createElement('div');
    board.className = 'board';
    const cols = 4;
    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    const side = `min(${Math.floor(92 / cols)}vw, 150px)`;
    board.style.gridAutoRows = side;
    board.style.gridTemplateColumns = `repeat(${cols}, ${side})`;

    deck.forEach(card => {
        const btn = document.createElement('button');
        btn.className = 'card';
        btn.innerHTML = `<div class="card-inner">
            <div class="face back">❓</div>
            <div class="face front">${card.emoji}</div>
        </div>`;
        btn.addEventListener('click', () => flip(card, btn));
        card.el = btn;
        board.appendChild(btn);
    });

    app.append(topbar, board);
}

function flip(card, btn) {
    if (locked || card.matched || flipped.includes(card)) return;
    btn.classList.add('flipped');
    flipped.push(card);

    if (flipped.length === 2) {
        moves++;
        document.getElementById('score').textContent = `Coups : ${moves}`;
        locked = true;
        const [a, b] = flipped;
        if (a.emoji === b.emoji) {
            a.matched = b.matched = true;
            a.el.classList.add('matched');
            b.el.classList.add('matched');
            matchedCount++;
            flipped = [];
            locked = false;
            if (matchedCount === PAIRS) setTimeout(win, 500);
        } else {
            setTimeout(() => {
                a.el.classList.remove('flipped');
                b.el.classList.remove('flipped');
                flipped = [];
                locked = false;
            }, 800);
        }
    }
}

function win() {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const h2 = document.createElement('h2');
    h2.textContent = 'Bravo ! 🎉';
    const p = document.createElement('p');
    p.textContent = `Tu as gagné en ${moves} coups !`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Rejouer 🔁';
    btn.addEventListener('click', newGame);
    overlay.append(h2, p, btn);
    app.appendChild(overlay);
}

newGame();
