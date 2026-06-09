// J'apprends en jouant — point d'entrée.
// Gère les trois écrans : menu → quiz → résultat.

import { THEMES, QUESTIONS_PER_GAME, LEVELS } from './questions.js';
import { runQuiz } from './quiz.js';
import * as audio from './audio.js';
import { getBest, setBest, getLevel, setLevel, isMutedSaved, setMutedSaved } from './save.js';

const app = document.getElementById('app');

// --- Bouton muet, toujours visible en haut à droite ---
const muteBtn = document.createElement('button');
muteBtn.className = 'mute-btn';
function refreshMute() { muteBtn.textContent = audio.isMuted() ? '🔇' : '🔊'; }
muteBtn.addEventListener('click', () => {
    audio.initAudio();
    const m = !audio.isMuted();
    audio.setMuted(m);
    setMutedSaved(m);
    refreshMute();
});
document.body.appendChild(muteBtn);
audio.setMuted(isMutedSaved());
refreshMute();

// --- Écran d'accueil : la grille des matières ---
function showMenu() {
    app.innerHTML = '';
    const screen = document.createElement('div');
    screen.className = 'screen menu';

    const h1 = document.createElement('h1');
    h1.className = 'title';
    h1.textContent = "J'apprends en jouant";
    const sub = document.createElement('p');
    sub.className = 'subtitle';
    sub.textContent = 'Choisis ta classe, puis ce que tu veux apprendre !';

    // Barre de choix de la classe (GS → CM2).
    const level = getLevel();
    const levelBar = document.createElement('div');
    levelBar.className = 'level-bar';
    const levelLabel = document.createElement('span');
    levelLabel.className = 'level-label';
    levelLabel.textContent = 'Ma classe :';
    levelBar.appendChild(levelLabel);
    LEVELS.forEach((lv, i) => {
        const b = document.createElement('button');
        b.className = 'level-btn' + (i === level ? ' active' : '');
        b.textContent = lv.name;
        b.addEventListener('click', () => {
            audio.initAudio();
            audio.sfxClick();
            setLevel(i);
            showMenu();
        });
        levelBar.appendChild(b);
    });

    const grid = document.createElement('div');
    grid.className = 'theme-grid';
    const available = THEMES.filter(t => (t.minLevel || 0) <= level);
    for (const theme of available) {
        const card = document.createElement('button');
        card.className = 'theme-card';
        card.style.background = theme.color;
        const best = getBest(theme.id, level);

        const emoji = document.createElement('span');
        emoji.className = 'theme-emoji';
        emoji.textContent = theme.emoji;
        const name = document.createElement('span');
        name.className = 'theme-name';
        name.textContent = theme.name;
        const bestEl = document.createElement('span');
        bestEl.className = 'theme-best';
        bestEl.textContent = best ? `⭐ ${best}/${QUESTIONS_PER_GAME}` : 'Nouveau !';
        card.append(emoji, name, bestEl);

        card.addEventListener('click', () => {
            audio.initAudio();
            audio.sfxClick();
            play(theme);
        });
        grid.appendChild(card);
    }

    // Grande image vers les jeux « pour s'amuser » (page d'accueil de tous les jeux).
    const fun = document.createElement('a');
    fun.className = 'fun-link';
    fun.href = '../';
    const funEmoji = document.createElement('span');
    funEmoji.className = 'fun-emoji';
    funEmoji.textContent = '🎮';
    const funText = document.createElement('span');
    funText.textContent = "Jeux pour s'amuser";
    fun.append(funEmoji, funText);

    screen.append(h1, sub, levelBar, grid, fun);
    app.appendChild(screen);
}

function play(theme) {
    const level = getLevel();
    runQuiz(app, theme, level, score => showResult(theme, level, score), showMenu);
}

// --- Écran de résultat : étoiles + encouragements ---
function showResult(theme, level, score) {
    app.innerHTML = '';
    const total = QUESTIONS_PER_GAME;
    setBest(theme.id, level, score);

    let stars = 0;
    if (score >= total) stars = 3;
    else if (score >= Math.ceil(total * 0.8)) stars = 2;
    else if (score >= Math.ceil(total * 0.5)) stars = 1;

    let msg;
    if (stars === 3) msg = 'Parfait ! 🏆';
    else if (stars === 2) msg = 'Super travail !';
    else if (stars === 1) msg = 'Bien joué !';
    else msg = 'Continue, tu vas y arriver !';

    const screen = document.createElement('div');
    screen.className = 'screen result';

    const starsEl = document.createElement('div');
    starsEl.className = 'result-stars';
    starsEl.textContent = '⭐'.repeat(stars) + '✩'.repeat(3 - stars);
    const msgEl = document.createElement('div');
    msgEl.className = 'result-msg';
    msgEl.textContent = msg;
    const scoreEl = document.createElement('div');
    scoreEl.className = 'result-score';
    scoreEl.textContent = `Tu as trouvé ${score} sur ${total} !`;

    const row = document.createElement('div');
    row.className = 'btn-row';
    const again = document.createElement('button');
    again.className = 'btn';
    again.textContent = 'Rejouer 🔁';
    again.addEventListener('click', () => { audio.sfxClick(); play(theme); });
    const menu = document.createElement('button');
    menu.className = 'btn secondary';
    menu.textContent = 'Menu 🏠';
    menu.addEventListener('click', () => { audio.sfxClick(); showMenu(); });
    row.append(again, menu);

    screen.append(starsEl, msgEl, scoreEl, row);
    app.appendChild(screen);

    if (stars > 0) audio.sfxWin();
}

showMenu();
