// Moteur du quiz : enchaîne QUESTIONS_PER_GAME questions d'un thème,
// gère les réponses, le score et les petits retours (sons, animations).

import { QUESTIONS_PER_GAME } from './questions.js';
import * as audio from './audio.js';

const CHEERS = ['Bravo !', 'Super !', 'Génial !', 'Trop fort !', 'Bien joué !', 'Wahou !'];
const TRYAGAIN = ['Oups !', 'Presque !', 'Essaie encore !'];

function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// runQuiz(app, theme, level, onDone(score), onQuit()) — rend l'écran dans `app`.
export function runQuiz(app, theme, level, onDone, onQuit) {
    let index = 0;
    let score = 0;
    let locked = false;
    let choicesData = [];
    let choiceButtons = [];

    const screen = document.createElement('div');
    screen.className = 'screen quiz';

    const header = document.createElement('div');
    header.className = 'quiz-header';
    const homeBtn = document.createElement('button');
    homeBtn.className = 'home-btn';
    homeBtn.textContent = '🏠';
    const progress = document.createElement('div');
    progress.className = 'progress-pill';
    header.append(homeBtn, progress);

    const prompt = document.createElement('div');
    prompt.className = 'prompt';
    const visual = document.createElement('div');
    visual.className = 'visual';
    const choicesEl = document.createElement('div');
    choicesEl.className = 'choices';
    const feedback = document.createElement('div');
    feedback.className = 'feedback';

    screen.append(header, prompt, visual, choicesEl, feedback);
    app.innerHTML = '';
    app.appendChild(screen);

    function cleanup() { document.removeEventListener('keydown', onKey); }

    // Sur ordinateur : touches 1 à 4 pour choisir une réponse.
    function onKey(e) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= choiceButtons.length) choiceButtons[n - 1].click();
    }
    document.addEventListener('keydown', onKey);

    homeBtn.addEventListener('click', () => { audio.sfxClick(); cleanup(); onQuit(); });

    function answer(btn, choice) {
        if (locked) return;
        locked = true;
        if (choice.correct) {
            btn.classList.add('correct');
            score++;
            feedback.textContent = pickOne(CHEERS) + ' 🎉';
            audio.sfxCorrect();
        } else {
            btn.classList.add('wrong');
            feedback.textContent = pickOne(TRYAGAIN);
            audio.sfxWrong();
            // On révèle la bonne réponse.
            choiceButtons.forEach((b, i) => { if (choicesData[i].correct) b.classList.add('correct'); });
        }
        setTimeout(() => { index++; render(); }, choice.correct ? 850 : 1300);
    }

    function render() {
        if (index >= QUESTIONS_PER_GAME) { cleanup(); onDone(score); return; }
        locked = false;
        feedback.textContent = '';
        progress.textContent = `Question ${index + 1}/${QUESTIONS_PER_GAME}  ·  ⭐ ${score}`;

        const q = theme.make(level);
        choicesData = q.choices;
        prompt.textContent = q.prompt;
        visual.innerHTML = q.visual || '';
        choicesEl.innerHTML = '';
        choiceButtons = q.choices.map(choice => {
            const b = document.createElement('button');
            b.className = 'choice';
            b.textContent = choice.label;
            b.addEventListener('click', () => answer(b, choice));
            choicesEl.appendChild(b);
            return b;
        });
    }

    render();
}
