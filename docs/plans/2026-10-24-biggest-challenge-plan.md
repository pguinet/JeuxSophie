# The Biggest Challenge — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un nouveau jeu `challenge/` d'entraînement à l'anglais niveau 6ème façon *The Big Challenge* : compte + avatar figurine Pop 2D, 6 mini-jeux, points et classement contre 30 joueurs inventés.

**Architecture:** Page statique, ES modules vanilla, DOM + SVG (pas de Three.js). Toute la logique (hasard à graine, points, avatar SVG, classement, génération des parties, sauvegarde, banques de questions) vit dans des modules **purs** testés sous Node ; les écrans (`main.js`, `ecran-*.js`, `ui-*.js`) les assemblent. Prononciations pré-générées en `.ogg` par un script Docker.

**Tech Stack:** HTML5/CSS3/JS (ES2023 modules), `node --test` (Node 20), ESLint 9 via Docker `node:20`, synthèse vocale *piper* + ffmpeg via Docker, Chrome headless pour les captures.

**Spec:** `docs/plans/2026-10-24-biggest-challenge-design.md`

## Global Constraints

- Dossier du jeu : `challenge/`. URL Pi : `http://jeux.local/challenge/`. Titre affiché : **The Biggest Challenge**.
- Pas de bundler, pas de npm dans le dépôt, aucune dépendance CDN ; imports relatifs uniquement.
- Clé localStorage : `biggest_save`, format `{ v: 1, profil: { pseudo, look, creeLe } | null, total, meilleurs, parties, muet }`.
- `look = { peau, coiffure, cheveux, haut, bas, fond }` — valeurs = **identifiants** (`'p3'`, `'longs'`…), jamais des couleurs brutes.
- Avatar : viewBox `0 0 200 270`, tête = cercle `cx=100 cy=95 r=72`, yeux noirs ovales avec reflet blanc, petit corps (cf. prototype validé).
- 12 coiffures exactement : 6 `genre: 'fille'`, 6 `genre: 'garcon'`.
- 30 joueurs inventés, graine fixe `20261024`, pseudos uniques.
- Points : `10 + bonusVitesse + bonusSérie` ; phrases 10/5/0.
- Textes à l'écran en français pour Sophie (consignes), mots/phrases en anglais britannique.
- Tout texte venant de l'utilisatrice (pseudo) est inséré avec `textContent`, jamais `innerHTML`.
- Commentaires et noms en français, comme `apprendre/` ; indentation 4 espaces ; tests en `challenge/test/*.test.js`.
- Contrôles ordinateur : souris + touches `1`-`4` ; mise en page qui tient de 360 px à 1920 px de large.

**User decisions (already made):**
- « b » → classement contre des joueurs inventés uniquement.
- « b » → nouvel avatar créé dans ce jeu (pas celui de `habille/`).
- « c est en 2d une tete ronde un petit corp […] comme une figurine pop […] 12 coiffure dont six pour garcons et 6 pour fille ».
- « juste le front sur la derniere coiffure est trop grand sinon cb » → coiffure `pics` : ligne des cheveux plus basse.
- « a » → récompense = points uniquement (pas de pièces/boutique/badges).
- Jeux retenus : « 1 2 3 5 7 8 » → grand quiz, image et mot, j'écoute, phrases en morceaux, course contre la montre, culture.
- Nom : « the biggest challenge ».
- Morceaux 1 (parcours) et 2 (détail des jeux + points) validés (« cb », « oui »).

## Review Focus

1. **Sauvegarde abîmée ou d'un autre format** (JSON invalide, `v` absent, champs manquants) → le jeu repart sur « Créer mon compte » sans planter. Test : Task 5.
2. **`look` avec un identifiant inconnu** (palette modifiée plus tard) → l'avatar s'affiche avec les valeurs par défaut au lieu d'un SVG cassé. Test : Task 3.
3. **Date de création dans le futur / horloge changée** → les joueurs inventés ne « perdent » pas de points et rien ne casse (jours bornés à 0). Test : Task 4.
4. **Double-clic / touche pendant la transition** entre deux questions → une seule réponse comptée. Test : Task 10 (verrou `repondre()` dans le contrôleur pur `partie.js`).
5. **Pas de fichier audio ni de voix anglaise** → *J'écoute* reste jouable (repli `speechSynthesis`, sinon le mot écrit s'affiche après 1 s). Test : Task 9 (choix de la source dans `choisirSource`).

---

## Structure des fichiers

```
challenge/
  index.html                 # Task 1
  css/style.css              # Task 1 puis Task 11-13
  eslint.config.js           # Task 1
  tools/lint.sh              # Task 1
  js/rng.js                  # Task 1  PUR — mulberry32, hashString, pick, shuffle, sample
  js/points.js               # Task 2  PUR — calcul des points
  js/avatar.js               # Task 3  PUR — palettes, COIFFURES, avatarSVG, lookAleatoire, lookValide
  js/classement.js           # Task 4  PUR — bots, pointsBot, classement, jourIndex
  js/save.js                 # Task 5  PUR (storage injecté) — charger, sauver, enregistrerPartie, validerPseudo
  js/donnees/vocab.js        # Task 6  données
  js/donnees/grammaire.js    # Task 6  données
  js/donnees/culture.js      # Task 7  données
  js/donnees/phrases.js      # Task 7  données
  js/jeux.js                 # Task 8  PUR — JEUX, genererPartie, slugAudio
  js/audio.js                # Task 9  effets Web Audio + prononcer()
  tools/liste-audio.mjs      # Task 9
  tools/gen-audio.sh         # Task 9
  audio/*.ogg                # Task 9  (générés)
  js/partie.js               # Task 10 PUR — contrôleur de partie QCM et phrases (verrou, série, chrono)
  js/ui-qcm.js               # Task 11
  js/ui-phrases.js           # Task 11
  js/ecran-compte.js         # Task 12 — pseudo + éditeur d'avatar
  js/ecran-classement.js     # Task 13
  js/main.js                 # Task 12 puis 13 — routeur, accueil, résultat
  test/*.test.js
index.html (racine)          # Task 14 — carte du jeu
CLAUDE.md                    # Task 14 — section chat/… + liste des jeux
```

Tests : `node --test challenge/test/` · Lint : `challenge/tools/lint.sh`.

---

### Task 1: Squelette, outils et hasard à graine

**Goal:** Créer `challenge/` (page vide qui charge `main.js`), la config ESLint, le script de lint et le module pur `rng.js` testé.

**Files:**
- Create: `challenge/index.html`, `challenge/css/style.css`, `challenge/js/main.js`, `challenge/eslint.config.js`, `challenge/tools/lint.sh`, `challenge/js/rng.js`
- Test: `challenge/test/rng.test.js`

**Acceptance Criteria:**
- [ ] `mulberry32(42)` produit deux fois la même suite ; valeurs dans `[0, 1)`.
- [ ] `shuffle` ne modifie pas le tableau d'entrée et garde les mêmes éléments ; `sample(arr, n)` rend `n` éléments distincts.
- [ ] `hashString('a') !== hashString('b')`, résultat entier 32 bits non signé.
- [ ] `challenge/tools/lint.sh` passe sans erreur.

**Verify:** `node --test challenge/test/ && challenge/tools/lint.sh` → `# fail 0`, aucune erreur ESLint

**Steps:**

- [ ] **Step 1: Écrire le test**

```js
// challenge/test/rng.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, hashString, pick, shuffle, sample } from '../js/rng.js';

test('mulberry32 est déterministe et dans [0, 1)', () => {
    const a = mulberry32(42), b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
        const x = a();
        assert.equal(x, b());
        assert.ok(x >= 0 && x < 1);
    }
});

test('hashString distingue les chaînes et rend un entier non signé', () => {
    assert.notEqual(hashString('a'), hashString('b'));
    const h = hashString('Sophie');
    assert.ok(Number.isInteger(h) && h >= 0 && h < 2 ** 32);
});

test('shuffle garde les éléments sans toucher l\'entrée', () => {
    const src = [1, 2, 3, 4, 5, 6];
    const out = shuffle(src, mulberry32(1));
    assert.deepEqual(src, [1, 2, 3, 4, 5, 6]);
    assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5, 6]);
});

test('sample rend n éléments distincts, pick un élément du tableau', () => {
    const rng = mulberry32(7);
    const s = sample([...'abcdefgh'], 4, rng);
    assert.equal(s.length, 4);
    assert.equal(new Set(s).size, 4);
    assert.ok('abc'.includes(pick(['a', 'b', 'c'], rng)));
});
```

- [ ] **Step 2: Lancer le test** — `node --test challenge/test/rng.test.js` → FAIL (module introuvable).

- [ ] **Step 3: Implémenter**

```js
// challenge/js/rng.js
// Hasard à graine : mêmes tirages à chaque fois pour une même graine
// (classement des joueurs inventés, tests).

export function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// FNV-1a 32 bits.
export function hashString(s) {
    let h = 2166136261;
    for (const c of s) {
        h ^= c.codePointAt(0);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

export function pick(arr, rng = Math.random) {
    return arr[Math.floor(rng() * arr.length)];
}

export function shuffle(arr, rng = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function sample(arr, n, rng = Math.random) {
    return shuffle(arr, rng).slice(0, n);
}
```

```html
<!-- challenge/index.html -->
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Biggest Challenge</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="js/main.js"></script>
</body>
</html>
```

```css
/* challenge/css/style.css — complété par les tâches d'interface */
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body {
    font-family: "Trebuchet MS", "Segoe UI", sans-serif;
    background: linear-gradient(135deg, #dbeafe, #fce7f3);
    color: #1e293b;
}
#app { max-width: 1100px; margin: 0 auto; padding: 16px; }
```

```js
// challenge/js/main.js — point d'entrée (remplacé en Task 12)
document.getElementById('app').textContent = 'The Biggest Challenge';
```

`challenge/eslint.config.js` : copier `chat2/eslint.config.js` en remplaçant les motifs de fichiers par `challenge/js/**/*.js` (navigateur, + globales `speechSynthesis: 'readonly'`, `SpeechSynthesisUtterance: 'readonly'`, `Audio: 'readonly'`) et `challenge/tools/**/*.mjs`, `challenge/test/**/*.js`, `challenge/eslint.config.js` (Node).

```bash
#!/usr/bin/env bash
# challenge/tools/lint.sh — ESLint 9 via Docker (node:20), même cache npm que chat2.
set -euo pipefail
cd "$(dirname "$0")/../.."
docker run --rm -v "$PWD":/app -w /app -v chat2-npm-cache:/root/.npm node:20 \
  npx -y eslint@9 -c challenge/eslint.config.js challenge/js challenge/tools challenge/test "$@"
```

`chmod +x challenge/tools/lint.sh`.

- [ ] **Step 4: Vérifier** — `node --test challenge/test/ && challenge/tools/lint.sh` → PASS.

- [ ] **Step 5: Commit** — `git add challenge && git commit -m "feat(challenge): squelette, lint et hasard à graine"`

---

### Task 2: Calcul des points

**Goal:** Module pur `points.js` : points d'une réponse QCM (base + vitesse + série) et d'une phrase.

**Files:**
- Create: `challenge/js/points.js`
- Test: `challenge/test/points.test.js`

**Acceptance Criteria:**
- [ ] Mauvaise réponse → 0.
- [ ] Bonne réponse en ≤ 3 s, série 1 → 15 ; en ≥ 10 s, série 1 → 10 ; à 6,5 s → 13 (arrondi).
- [ ] Bonus de série : séries 1-2 → 0, 3 → 2, 4 → 4, 7 et plus → 10.
- [ ] Phrase : 1er essai 10, 2e essai 5, ensuite 0.

**Verify:** `node --test challenge/test/points.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Écrire le test**

```js
// challenge/test/points.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bonusVitesse, bonusSerie, pointsQuestion, pointsPhrase } from '../js/points.js';

test('bonus de vitesse : 5 jusqu\'à 3 s, 0 à partir de 10 s, linéaire entre', () => {
    assert.equal(bonusVitesse(0), 5);
    assert.equal(bonusVitesse(3000), 5);
    assert.equal(bonusVitesse(6500), 3);
    assert.equal(bonusVitesse(10000), 0);
    assert.equal(bonusVitesse(60000), 0);
});

test('bonus de série : +2 dès la 3e bonne réponse, plafonné à 10', () => {
    assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 20].map(bonusSerie), [0, 0, 2, 4, 6, 8, 10, 10]);
});

test('points d\'une question', () => {
    assert.equal(pointsQuestion({ juste: false, ms: 1000, serie: 5 }), 0);
    assert.equal(pointsQuestion({ juste: true, ms: 2000, serie: 1 }), 15);
    assert.equal(pointsQuestion({ juste: true, ms: 12000, serie: 1 }), 10);
    assert.equal(pointsQuestion({ juste: true, ms: 6500, serie: 1 }), 13);
    assert.equal(pointsQuestion({ juste: true, ms: 1000, serie: 4 }), 19);
});

test('points d\'une phrase selon l\'essai', () => {
    assert.deepEqual([1, 2, 3, 4].map(pointsPhrase), [10, 5, 0, 0]);
});
```

- [ ] **Step 2:** `node --test challenge/test/points.test.js` → FAIL.

- [ ] **Step 3: Implémenter**

```js
// challenge/js/points.js
// Points gagnés : 10 par bonne réponse, + bonus si on répond vite,
// + bonus quand on enchaîne les bonnes réponses.

export const POINTS_BASE = 10;

// ms = temps de réponse. 5 points jusqu'à 3 s, puis baisse jusqu'à 0 à 10 s.
export function bonusVitesse(ms) {
    const s = ms / 1000;
    if (s <= 3) return 5;
    if (s >= 10) return 0;
    return Math.round(5 * (10 - s) / 7);
}

// serie = nombre de bonnes réponses d'affilée, celle-ci comprise.
export function bonusSerie(serie) {
    return serie >= 3 ? Math.min(10, 2 * (serie - 2)) : 0;
}

export function pointsQuestion({ juste, ms, serie }) {
    if (!juste) return 0;
    return POINTS_BASE + bonusVitesse(ms) + bonusSerie(serie);
}

// essai = numéro de la tentative pour remettre la phrase dans l'ordre.
export function pointsPhrase(essai) {
    if (essai === 1) return 10;
    if (essai === 2) return 5;
    return 0;
}
```

- [ ] **Step 4:** test → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(challenge): calcul des points"`

---

### Task 3: Avatar figurine Pop

**Goal:** Module pur `avatar.js` : palettes, 12 coiffures (6 filles, 6 garçons), `avatarSVG(look)` qui dessine la figurine, `lookAleatoire(rng)`, `lookValide(look)` qui remplace les identifiants inconnus.

**Files:**
- Create: `challenge/js/avatar.js`
- Test: `challenge/test/avatar.test.js`
- Scratch (non committé) : `challenge/_test-avatars.html` pour la capture, supprimé avant commit.

**Acceptance Criteria:**
- [ ] `COIFFURES.length === 12`, 6 `fille` + 6 `garcon`, ids uniques ; `PEAUX` ≥ 10, `CHEVEUX` ≥ 12, `HABITS` ≥ 12, `FONDS` ≥ 8 (objets `{ id, couleur }`, couleurs `#rrggbb`).
- [ ] `avatarSVG(look)` commence par `<svg`, finit par `</svg>`, contient la couleur de peau choisie et `viewBox="0 0 200 270"`.
- [ ] `avatarSVG({ peau: 'inconnu', coiffure: 'zzz' })` ne lève pas d'erreur et utilise la peau/coiffure par défaut (Review Focus 2).
- [ ] `lookAleatoire(mulberry32(3))` renvoie un look dont tous les ids existent ; même graine → même look.
- [ ] Capture headless des 12 coiffures relue : coiffure `pics` avec front moins haut que le prototype, aucune coiffure qui déborde du cadre.

**Verify:** `node --test challenge/test/avatar.test.js` → `# fail 0` ; capture `scratchpad/coiffures.png` relue avec l'outil Read

**Steps:**

- [ ] **Step 1: Écrire le test**

```js
// challenge/test/avatar.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COIFFURES, PEAUX, CHEVEUX, HABITS, FONDS, LOOK_DEFAUT,
    avatarSVG, lookAleatoire, lookValide } from '../js/avatar.js';
import { mulberry32 } from '../js/rng.js';

const HEX = /^#[0-9a-f]{6}$/i;

test('12 coiffures : 6 filles et 6 garçons, ids uniques', () => {
    assert.equal(COIFFURES.length, 12);
    assert.equal(COIFFURES.filter(c => c.genre === 'fille').length, 6);
    assert.equal(COIFFURES.filter(c => c.genre === 'garcon').length, 6);
    assert.equal(new Set(COIFFURES.map(c => c.id)).size, 12);
    for (const c of COIFFURES) assert.ok(c.nom && typeof c.arriere === 'string' && typeof c.avant === 'string');
});

test('palettes assez fournies, couleurs hexadécimales', () => {
    for (const [pal, min] of [[PEAUX, 10], [CHEVEUX, 12], [HABITS, 12], [FONDS, 8]]) {
        assert.ok(pal.length >= min);
        assert.equal(new Set(pal.map(p => p.id)).size, pal.length);
        for (const p of pal) assert.match(p.couleur, HEX);
    }
});

test('avatarSVG dessine un SVG avec la peau choisie', () => {
    const peau = PEAUX[3];
    const svg = avatarSVG({ ...LOOK_DEFAUT, peau: peau.id });
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.trim().endsWith('</svg>'));
    assert.ok(svg.includes('viewBox="0 0 200 270"'));
    assert.ok(svg.includes(peau.couleur));
});

test('ids inconnus : valeurs par défaut, pas d\'erreur', () => {
    const v = lookValide({ peau: 'inconnu', coiffure: 'zzz' });
    assert.deepEqual(v, LOOK_DEFAUT);
    const svg = avatarSVG({ peau: 'inconnu', coiffure: 'zzz' });
    assert.ok(svg.includes(PEAUX.find(p => p.id === LOOK_DEFAUT.peau).couleur));
    assert.doesNotThrow(() => avatarSVG(null));
});

test('lookAleatoire : ids existants et déterministe', () => {
    const a = lookAleatoire(mulberry32(3)), b = lookAleatoire(mulberry32(3));
    assert.deepEqual(a, b);
    assert.deepEqual(lookValide(a), a);
});

test('la taille demandée est reportée sur le SVG', () => {
    assert.ok(avatarSVG(LOOK_DEFAUT, { taille: 48 }).includes('height="48"'));
});
```

- [ ] **Step 2:** test → FAIL.

- [ ] **Step 3: Implémenter** — repartir du prototype validé (`/tmp/claude-1000/-home-pascal-github-JeuxSophie/0ac47d34-2e50-4718-aebd-221ea08bdc81/scratchpad/pop.html`) :

```js
// challenge/js/avatar.js
// Avatar « figurine Pop » en 2D : grosse tête ronde, petit corps, yeux noirs brillants.
// Tout est en SVG (chaîne de caractères) pour s'afficher partout sans image.
import { pick } from './rng.js';

export const PEAUX = [
    { id: 'p1', couleur: '#ffe0c7' }, { id: 'p2', couleur: '#fbd5b5' }, { id: 'p3', couleur: '#f1c27d' },
    { id: 'p4', couleur: '#e0ac69' }, { id: 'p5', couleur: '#c68654' }, { id: 'p6', couleur: '#a86b45' },
    { id: 'p7', couleur: '#8d5524' }, { id: 'p8', couleur: '#6b4226' }, { id: 'p9', couleur: '#5c3a21' },
    { id: 'p10', couleur: '#3d2616' },
];
export const CHEVEUX = [
    { id: 'noir', couleur: '#1b1b1b' }, { id: 'brun', couleur: '#4a2c17' }, { id: 'chatain', couleur: '#7c3f1d' },
    { id: 'roux', couleur: '#e2583e' }, { id: 'blond', couleur: '#f5d06b' }, { id: 'platine', couleur: '#f3ead2' },
    { id: 'gris', couleur: '#9ca3af' }, { id: 'rose', couleur: '#f472b6' }, { id: 'violet', couleur: '#8b5cf6' },
    { id: 'bleu', couleur: '#3b82f6' }, { id: 'vert', couleur: '#22c55e' }, { id: 'turquoise', couleur: '#14b8a6' },
];
export const HABITS = [
    { id: 'rose', couleur: '#ec4899' }, { id: 'rouge', couleur: '#ef4444' }, { id: 'orange', couleur: '#f59e0b' },
    { id: 'jaune', couleur: '#facc15' }, { id: 'vert', couleur: '#22c55e' }, { id: 'turquoise', couleur: '#14b8a6' },
    { id: 'bleu', couleur: '#2563eb' }, { id: 'marine', couleur: '#1e3a8a' }, { id: 'violet', couleur: '#a855f7' },
    { id: 'blanc', couleur: '#f8fafc' }, { id: 'gris', couleur: '#475569' }, { id: 'noir', couleur: '#111827' },
];
export const FONDS = [
    { id: 'creme', couleur: '#fef3c7' }, { id: 'menthe', couleur: '#dcfce7' }, { id: 'lavande', couleur: '#e0e7ff' },
    { id: 'peche', couleur: '#fee2e2' }, { id: 'ciel', couleur: '#cffafe' }, { id: 'lilas', couleur: '#fae8ff' },
    { id: 'citron', couleur: '#fef9c3' }, { id: 'nuage', couleur: '#f1f5f9' },
];

// Chaque coiffure : calque `arriere` (derrière la tête) + calque `avant` (frange),
// dans le repère du SVG (tête : cercle cx=100 cy=95 r=72).
export const COIFFURES = [
    // Filles
    { id: 'longs', nom: 'Longs', genre: 'fille',
        arriere: '<path d="M30 95 Q28 20 100 18 Q172 20 170 95 L174 175 Q150 160 148 110 L52 110 Q50 160 26 175Z"/>',
        avant: '<path d="M38 88 Q50 30 100 32 Q150 30 162 88 Q130 60 100 66 Q70 60 38 88Z"/>' },
    { id: 'queue', nom: 'Queue de cheval', genre: 'fille',
        arriere: '<circle cx="100" cy="22" r="22"/><path d="M98 10 Q150 0 160 60 Q150 40 130 30Z"/><path d="M162 50 Q190 100 170 150 Q172 95 150 70Z"/>',
        avant: '<path d="M36 90 Q40 25 100 26 Q160 25 164 90 Q140 55 100 58 Q60 55 36 90Z"/>' },
    { id: 'couettes', nom: 'Couettes', genre: 'fille',
        arriere: '<circle cx="28" cy="80" r="26"/><circle cx="172" cy="80" r="26"/>',
        avant: '<path d="M36 92 Q40 25 100 26 Q160 25 164 92 Q150 58 100 52 Q50 58 36 92Z"/>' },
    // + 'carre' (Carré), 'chignon' (Chignon), 'tresse' (Tresse) — à dessiner dans le même repère.
    // Garçons
    { id: 'court', nom: 'Court', genre: 'garcon', arriere: '',
        avant: '<path d="M34 86 Q36 22 100 22 Q164 22 166 86 Q150 56 120 60 Q100 46 80 60 Q50 56 34 86Z"/>' },
    { id: 'afro', nom: 'Afro', genre: 'garcon', arriere: '<circle cx="100" cy="80" r="80"/>', avant: '' },
    // Front baissé (remarque de Sophie) : la base des pics descend de y≈62 à y≈74.
    { id: 'pics', nom: 'En pics', genre: 'garcon', arriere: '',
        avant: '<path d="M32 92 L40 30 L60 46 L72 14 L90 38 L104 8 L118 38 L134 14 L142 46 L162 30 L168 92 Q140 70 100 74 Q60 70 32 92Z"/>' },
    // + 'meche' (Mèche sur le côté), 'boucles' (Bouclés), 'rase' (Rasé) — à dessiner.
];

export const LOOK_DEFAUT = { peau: 'p2', coiffure: 'longs', cheveux: 'chatain', haut: 'rose', bas: 'marine', fond: 'creme' };

const PALETTES = { peau: PEAUX, coiffure: COIFFURES, cheveux: CHEVEUX, haut: HABITS, bas: HABITS, fond: FONDS };

// Remplace tout identifiant inconnu par la valeur par défaut.
export function lookValide(look) {
    const l = look && typeof look === 'object' ? look : {};
    const out = {};
    for (const [cle, pal] of Object.entries(PALETTES)) {
        out[cle] = pal.some(p => p.id === l[cle]) ? l[cle] : LOOK_DEFAUT[cle];
    }
    return out;
}

export function lookAleatoire(rng = Math.random) {
    const out = {};
    for (const [cle, pal] of Object.entries(PALETTES)) out[cle] = pick(pal, rng).id;
    return out;
}

const couleur = (pal, id) => pal.find(p => p.id === id).couleur;

export function avatarSVG(look, { taille = 200 } = {}) {
    const l = lookValide(look);
    const peau = couleur(PEAUX, l.peau), cheveux = couleur(CHEVEUX, l.cheveux);
    const haut = couleur(HABITS, l.haut), bas = couleur(HABITS, l.bas), fond = couleur(FONDS, l.fond);
    const c = COIFFURES.find(x => x.id === l.coiffure);
    const h = Math.round(taille * 270 / 200);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${h}" viewBox="0 0 200 270">
<rect width="200" height="270" rx="18" fill="${fond}"/>
<ellipse cx="100" cy="258" rx="50" ry="7" fill="#0002"/>
<g fill="${cheveux}">${c.arriere}</g>
<rect x="78" y="215" width="19" height="38" rx="6" fill="${bas}"/><rect x="103" y="215" width="19" height="38" rx="6" fill="${bas}"/>
<rect x="74" y="246" width="25" height="11" rx="5" fill="#333"/><rect x="101" y="246" width="25" height="11" rx="5" fill="#333"/>
<rect x="70" y="165" width="60" height="58" rx="16" fill="${haut}"/>
<rect x="52" y="170" width="20" height="44" rx="10" fill="${haut}"/><rect x="128" y="170" width="20" height="44" rx="10" fill="${haut}"/>
<circle cx="62" cy="214" r="9" fill="${peau}"/><circle cx="138" cy="214" r="9" fill="${peau}"/>
<circle cx="100" cy="95" r="72" fill="${peau}"/>
<g fill="${cheveux}">${c.avant}</g>
<ellipse cx="74" cy="112" rx="10" ry="12" fill="#111"/><ellipse cx="126" cy="112" rx="10" ry="12" fill="#111"/>
<circle cx="77" cy="107" r="3.5" fill="#fff"/><circle cx="129" cy="107" r="3.5" fill="#fff"/>
<ellipse cx="60" cy="132" rx="9" ry="6" fill="#f87171" opacity=".35"/><ellipse cx="140" cy="132" rx="9" ry="6" fill="#f87171" opacity=".35"/>
<path d="M90 140 Q100 148 110 140" stroke="#7a3b2e" stroke-width="3.5" fill="none" stroke-linecap="round"/>
</svg>`;
}
```

Dessiner les 6 coiffures manquantes dans le même repère, style « basique » (formes pleines, 1 à 4 primitives) :
- `carre` : arrière = rectangle arrondi qui s'arrête au menton (y≈150) ; avant = frange droite (y≈70).
- `chignon` : arrière = cercle `cx=100 cy=18 r=26` ; avant = calotte lisse comme `queue`.
- `tresse` : arrière = 4 ellipses en chaîne descendant à droite jusqu'à y≈190 ; avant = calotte avec raie sur le côté.
- `meche` : avant = calotte courte avec une mèche qui tombe sur le côté gauche du front (jusqu'à y≈80).
- `boucles` : avant = 8-10 cercles r≈16 répartis sur le haut du crâne.
- `rase` : avant = calotte très fine (épaisseur ≈ 8 px), sans frange.

- [ ] **Step 4:** test → PASS.

- [ ] **Step 5: Capture de contrôle.** Créer `challenge/_test-avatars.html` (module qui importe `avatarSVG`, `COIFFURES`, et affiche une grille des 12 coiffures avec des couleurs variées), servir le dépôt (`python3 -m http.server 8765` depuis la racine, en arrière-plan), puis :
  `google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars --screenshot=<scratchpad>/coiffures.png --window-size=1400,640 --virtual-time-budget=2000 http://localhost:8765/challenge/_test-avatars.html`
  Relire l'image ; corriger les coiffures qui débordent ou sont peu lisibles. **Supprimer `_test-avatars.html`** et arrêter le serveur.

- [ ] **Step 6: Commit** — `git add challenge/js/avatar.js challenge/test/avatar.test.js && git commit -m "feat(challenge): avatar figurine Pop et 12 coiffures"`

---

### Task 4: Classement et joueurs inventés

**Goal:** Module pur `classement.js` : 30 joueurs inventés déterministes qui progressent chaque jour, et le classement avec Sophie dedans.

**Files:**
- Create: `challenge/js/classement.js`
- Test: `challenge/test/classement.test.js`

**Acceptance Criteria:**
- [ ] `bots()` rend 30 joueurs, pseudos uniques, `look` valides, toujours identiques d'un appel à l'autre.
- [ ] Points de départ entre 50 et 4000, le plus faible ≥ 50 (Sophie, à 0, est 31ᵉ le premier jour).
- [ ] `pointsBot(bot, j)` croît avec `j` (jamais décroissant), `pointsBot(bot, 0) === bot.depart`.
- [ ] `classement(profil, total, date)` : 31 lignes triées par points décroissants, rangs 1..31, une seule ligne `moi` ; à égalité Sophie passe devant.
- [ ] `creeLe` dans le futur → même résultat qu'à 0 jour (Review Focus 3).

**Verify:** `node --test challenge/test/classement.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Écrire le test**

```js
// challenge/test/classement.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bots, pointsBot, classement, jourIndex, NB_BOTS } from '../js/classement.js';
import { lookValide } from '../js/avatar.js';

const profil = { pseudo: 'Sophie', look: {}, creeLe: '2026-10-24T10:00:00' };

test('30 joueurs inventés, uniques et stables', () => {
    const a = bots(), b = bots();
    assert.equal(a.length, NB_BOTS);
    assert.equal(NB_BOTS, 30);
    assert.equal(new Set(a.map(x => x.pseudo)).size, 30);
    assert.deepEqual(a, b);
    for (const x of a) {
        assert.deepEqual(lookValide(x.look), x.look);
        assert.ok(x.depart >= 50 && x.depart <= 4000);
    }
});

test('les points d\'un joueur inventé ne baissent jamais', () => {
    const bot = bots()[5];
    assert.equal(pointsBot(bot, 0), bot.depart);
    let avant = bot.depart;
    for (let j = 1; j <= 30; j++) {
        const p = pointsBot(bot, j);
        assert.ok(p >= avant);
        avant = p;
    }
    assert.ok(pointsBot(bot, 30) > bot.depart);
});

test('premier jour : Sophie à 0 point est dernière', () => {
    const lignes = classement(profil, 0, new Date('2026-10-24T18:00:00'));
    assert.equal(lignes.length, 31);
    assert.deepEqual(lignes.map(l => l.rang), Array.from({ length: 31 }, (_, i) => i + 1));
    assert.equal(lignes.filter(l => l.moi).length, 1);
    assert.equal(lignes.at(-1).moi, true);
    for (let i = 1; i < lignes.length; i++) assert.ok(lignes[i - 1].points >= lignes[i].points);
});

test('à égalité, Sophie passe devant', () => {
    const lignes = classement(profil, 0, new Date('2026-10-24T18:00:00'));
    const cible = lignes[10].points;
    const l2 = classement(profil, cible, new Date('2026-10-24T18:00:00'));
    const moi = l2.find(l => l.moi);
    const egal = l2.find(l => !l.moi && l.points === cible);
    assert.ok(moi.rang < egal.rang);
});

test('date de création dans le futur : comme le jour 0', () => {
    const futur = { ...profil, creeLe: '2030-01-01T00:00:00' };
    const a = classement(futur, 100, new Date('2026-10-24T18:00:00'));
    const b = classement(profil, 100, new Date('2026-10-24T18:00:00'));
    assert.deepEqual(a.map(l => l.points), b.map(l => l.points));
});

test('jourIndex change à minuit (heure locale)', () => {
    assert.equal(jourIndex(new Date(2026, 9, 25, 0, 1)) - jourIndex(new Date(2026, 9, 24, 23, 59)), 1);
});
```

- [ ] **Step 2:** test → FAIL.

- [ ] **Step 3: Implémenter**

```js
// challenge/js/classement.js
// Classement contre 30 joueurs inventés. Tout est calculé à partir d'une graine fixe :
// rien à sauvegarder, mêmes joueurs et mêmes points à chaque ouverture.
import { mulberry32, hashString, pick, shuffle } from './rng.js';
import { lookAleatoire } from './avatar.js';

export const NB_BOTS = 30;
const GRAINE = 20261024;

const PRENOMS = ['Lucas', 'Emma', 'Léo', 'Jade', 'Hugo', 'Louise', 'Gabriel', 'Alice', 'Nathan', 'Chloé',
    'Arthur', 'Lina', 'Jules', 'Mia', 'Tom', 'Rose', 'Noah', 'Léna', 'Adam', 'Zoé', 'Ethan', 'Inès',
    'Sacha', 'Manon', 'Liam', 'Camille', 'Paul', 'Anna', 'Raphaël', 'Lou', 'Maël', 'Nina', 'Oscar', 'Eva'];
const SUFFIXES = ['', '_78', 'Star', '2014', '_UK', 'Cool', '_9', 'Pro', '42', 'Smile', '_London', 'Wow'];

const DEPART_MIN = 50, DEPART_MAX = 4000;

export function bots() {
    const rng = mulberry32(GRAINE);
    const noms = shuffle(PRENOMS, rng);
    return Array.from({ length: NB_BOTS }, (_, i) => ({
        id: i,
        pseudo: noms[i] + pick(SUFFIXES, rng),
        look: lookAleatoire(rng),
        // Répartition en courbe : beaucoup de joueurs modestes, quelques champions.
        depart: Math.round(DEPART_MIN + (DEPART_MAX - DEPART_MIN) * Math.pow(i / (NB_BOTS - 1), 1.6)),
        rythme: Math.round(20 + rng() * 160), // points max gagnés par jour
    }));
}

// Points d'un joueur inventé `jours` jours après la création du compte de Sophie.
export function pointsBot(bot, jours) {
    let p = bot.depart;
    for (let j = 1; j <= jours; j++) {
        p += Math.round(bot.rythme * mulberry32(hashString(`${bot.id}:${j}`))());
    }
    return p;
}

// Numéro du jour (heure locale) : change à minuit.
export function jourIndex(date) {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

export function classement(profil, total, aujourdhui = new Date()) {
    const jours = Math.max(0, jourIndex(aujourdhui) - jourIndex(new Date(profil.creeLe)));
    const lignes = bots().map(b => ({ pseudo: b.pseudo, look: b.look, points: pointsBot(b, jours), moi: false }));
    lignes.push({ pseudo: profil.pseudo, look: profil.look, points: total, moi: true });
    lignes.sort((a, b) => b.points - a.points || Number(b.moi) - Number(a.moi));
    return lignes.map((l, i) => ({ ...l, rang: i + 1 }));
}
```

Note : les pseudos sont uniques car les 30 prénoms tirés sont distincts (34 prénoms dans la liste).

- [ ] **Step 4:** test → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(challenge): classement et joueurs inventés"`

---

### Task 5: Sauvegarde

**Goal:** Module `save.js` (stockage injectable pour les tests) : charger/sauver `biggest_save`, enregistrer une partie, valider le pseudo.

**Files:**
- Create: `challenge/js/save.js`
- Test: `challenge/test/save.test.js`

**Acceptance Criteria:**
- [ ] Rien en stockage, JSON invalide, `v` ≠ 1, ou `getItem` qui lève → `nouvelleSauvegarde()` (`profil: null`) (Review Focus 1).
- [ ] Sauvegarde partielle `{ v: 1, total: 50 }` → champs manquants complétés.
- [ ] `profil` sans `pseudo` valide → `profil: null` (retour à la création de compte).
- [ ] `enregistrerPartie(etat, 'quiz', 120)` ajoute 120 au total, incrémente `parties`, garde le meilleur score par jeu ; ne modifie pas `etat`.
- [ ] `validerPseudo('  Sophie  ') === 'Sophie'` ; `''`, `'   '` et 17 caractères → `null`.
- [ ] `sauver` puis `charger` sur le même stockage rend un état égal ; `setItem` qui lève ne fait pas planter.

**Verify:** `node --test challenge/test/save.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Écrire le test**

```js
// challenge/test/save.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLE, charger, sauver, nouvelleSauvegarde, enregistrerPartie, validerPseudo } from '../js/save.js';

function memoire(init = {}) {
    const m = new Map(Object.entries(init));
    return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

test('sauvegardes absentes ou abîmées → nouveau compte', () => {
    assert.deepEqual(charger(memoire()), nouvelleSauvegarde());
    assert.deepEqual(charger(memoire({ [CLE]: '{pas du json' })), nouvelleSauvegarde());
    assert.deepEqual(charger(memoire({ [CLE]: '{"v":7}' })), nouvelleSauvegarde());
    assert.deepEqual(charger(memoire({ [CLE]: 'null' })), nouvelleSauvegarde());
    assert.deepEqual(charger({ getItem() { throw new Error('bloqué'); } }), nouvelleSauvegarde());
});

test('sauvegarde partielle complétée, profil invalide écarté', () => {
    const e = charger(memoire({ [CLE]: '{"v":1,"total":50,"profil":{"look":{}}}' }));
    assert.equal(e.total, 50);
    assert.deepEqual(e.meilleurs, {});
    assert.equal(e.profil, null);
});

test('aller-retour sauver/charger', () => {
    const s = memoire();
    const e = { ...nouvelleSauvegarde(), profil: { pseudo: 'Sophie', look: { peau: 'p3' }, creeLe: '2026-10-24T10:00:00.000Z' }, total: 42 };
    sauver(e, s);
    assert.deepEqual(charger(s), e);
    assert.doesNotThrow(() => sauver(e, { setItem() { throw new Error('plein'); } }));
});

test('enregistrerPartie cumule et garde le meilleur score', () => {
    const e0 = nouvelleSauvegarde();
    const e1 = enregistrerPartie(e0, 'quiz', 120);
    const e2 = enregistrerPartie(e1, 'quiz', 80);
    assert.equal(e0.total, 0);
    assert.equal(e2.total, 200);
    assert.equal(e2.parties, 2);
    assert.equal(e2.meilleurs.quiz, 120);
});

test('validerPseudo', () => {
    assert.equal(validerPseudo('  Sophie  '), 'Sophie');
    assert.equal(validerPseudo(''), null);
    assert.equal(validerPseudo('   '), null);
    assert.equal(validerPseudo('a'.repeat(16)), 'a'.repeat(16));
    assert.equal(validerPseudo('a'.repeat(17)), null);
});
```

- [ ] **Step 2:** test → FAIL.

- [ ] **Step 3: Implémenter**

```js
// challenge/js/save.js
// Sauvegarde locale du compte, des points et des meilleurs scores.
export const CLE = 'biggest_save';
export const PSEUDO_MAX = 16;

export function nouvelleSauvegarde() {
    return { v: 1, profil: null, total: 0, meilleurs: {}, parties: 0, muet: false };
}

function profilValide(p) {
    return p && typeof p === 'object' && typeof p.pseudo === 'string' && validerPseudo(p.pseudo)
        && typeof p.creeLe === 'string' ? p : null;
}

export function charger(storage = globalThis.localStorage) {
    try {
        const d = JSON.parse(storage.getItem(CLE));
        if (!d || typeof d !== 'object' || d.v !== 1) return nouvelleSauvegarde();
        const e = { ...nouvelleSauvegarde(), ...d };
        e.profil = profilValide(e.profil);
        if (!Number.isFinite(e.total)) e.total = 0;
        if (!e.meilleurs || typeof e.meilleurs !== 'object') e.meilleurs = {};
        return e;
    } catch {
        return nouvelleSauvegarde();
    }
}

export function sauver(etat, storage = globalThis.localStorage) {
    try {
        storage.setItem(CLE, JSON.stringify(etat));
    } catch {
        // Stockage plein ou bloqué : on continue à jouer sans sauvegarder.
    }
}

export function enregistrerPartie(etat, idJeu, points) {
    return {
        ...etat,
        total: etat.total + points,
        parties: etat.parties + 1,
        meilleurs: { ...etat.meilleurs, [idJeu]: Math.max(etat.meilleurs[idJeu] ?? 0, points) },
    };
}

export function validerPseudo(s) {
    const p = String(s ?? '').trim();
    return p.length >= 1 && p.length <= PSEUDO_MAX ? p : null;
}
```

- [ ] **Step 4:** test → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(challenge): sauvegarde locale"`

---

### Task 6: Banques vocabulaire et grammaire

**Goal:** Écrire les données `vocab.js` (~150 mots) et `grammaire.js` (~60 QCM) niveau 6ème, avec un test d'intégrité.

**Files:**
- Create: `challenge/js/donnees/vocab.js`, `challenge/js/donnees/grammaire.js`
- Test: `challenge/test/donnees.test.js` (créé ici, complété en Task 7)

**Acceptance Criteria:**
- [ ] `VOCAB.length >= 150`, chaque mot `{ en, fr, emoji, theme, image }` ; `en` unique (insensible à la casse) ; `fr` non vide.
- [ ] Thèmes : `animaux`, `nourriture`, `couleurs`, `nombres`, `corps`, `vetements`, `ecole`, `maison`, `famille`, `temps` (jours/mois), `meteo`, `sports`, `transports` ; chaque thème a ≥ 4 mots `image: true`.
- [ ] Parmi les mots `image: true`, emojis uniques et non vides (pour que les 4 images d'une question soient différentes).
- [ ] `GRAMMAIRE.length >= 60`, chaque item `{ question, bonne, leurres: [3], theme }`, les 4 réponses distinctes ; ≥ 10 thèmes de grammaire couverts.
- [ ] Orthographe britannique (`colour`, `favourite`, `mum`), relue.

**Verify:** `node --test challenge/test/donnees.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Écrire le test**

```js
// challenge/test/donnees.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VOCAB, THEMES_VOCAB } from '../js/donnees/vocab.js';
import { GRAMMAIRE } from '../js/donnees/grammaire.js';

function verifierQcm(items, min, nbThemes) {
    assert.ok(items.length >= min, `au moins ${min} questions (${items.length})`);
    for (const q of items) {
        assert.ok(q.question && q.bonne && q.theme, JSON.stringify(q));
        assert.equal(q.leurres.length, 3, q.question);
        const toutes = [q.bonne, ...q.leurres].map(s => s.toLowerCase());
        assert.equal(new Set(toutes).size, 4, `réponses distinctes : ${q.question}`);
    }
    assert.ok(new Set(items.map(q => q.theme)).size >= nbThemes);
}

test('vocabulaire : 150 mots, uniques, thèmes connus', () => {
    assert.ok(VOCAB.length >= 150, `${VOCAB.length} mots`);
    assert.equal(new Set(VOCAB.map(m => m.en.toLowerCase())).size, VOCAB.length);
    for (const m of VOCAB) {
        assert.ok(m.en && m.fr && m.emoji, JSON.stringify(m));
        assert.ok(THEMES_VOCAB.includes(m.theme), m.theme);
        assert.equal(typeof m.image, 'boolean');
    }
});

test('vocabulaire : ≥ 4 images par thème, emojis d\'image uniques', () => {
    const images = VOCAB.filter(m => m.image);
    assert.equal(new Set(images.map(m => m.emoji)).size, images.length);
    for (const t of THEMES_VOCAB) {
        assert.ok(images.filter(m => m.theme === t).length >= 4, `thème ${t}`);
    }
});

test('grammaire : 60 QCM bien formés sur 10 thèmes', () => {
    verifierQcm(GRAMMAIRE, 60, 10);
});
```

- [ ] **Step 2:** test → FAIL.

- [ ] **Step 3: Écrire les données.** Format :

```js
// challenge/js/donnees/vocab.js
// Vocabulaire de 6ème. `image: true` = l'emoji suffit à reconnaître le mot sans
// ambiguïté (sert aux jeux Image et mot / J'écoute).
export const THEMES_VOCAB = ['animaux', 'nourriture', 'couleurs', 'nombres', 'corps', 'vetements',
    'ecole', 'maison', 'famille', 'temps', 'meteo', 'sports', 'transports'];

export const VOCAB = [
    { en: 'cat', fr: 'chat', emoji: '🐱', theme: 'animaux', image: true },
    { en: 'dog', fr: 'chien', emoji: '🐶', theme: 'animaux', image: true },
    { en: 'red', fr: 'rouge', emoji: '🟥', theme: 'couleurs', image: true },
    { en: 'three', fr: 'trois', emoji: '3️⃣', theme: 'nombres', image: true },
    { en: 'Monday', fr: 'lundi', emoji: '📅', theme: 'temps', image: false },
    { en: 'grandmother', fr: 'grand-mère', emoji: '👵', theme: 'famille', image: true },
    // … ≥ 150 mots au total, ~10-14 par thème.
];
```

Pour `temps` (jours/mois), seules des images non ambiguës (`🌞` *summer*, `❄️`… ne conviennent pas : saisons ici, météo ailleurs) : prévoir ≥ 4 mots image du type *clock* ⏰, *calendar* 📅 (alors *Monday* passe en `image: false` avec un autre emoji), *birthday* 🎂, *night* 🌙, *morning* 🌅. Un emoji ne peut servir qu'à un seul mot image.

```js
// challenge/js/donnees/grammaire.js
// QCM de grammaire, programme d'anglais de 6ème. `_` marque le trou à compléter.
export const GRAMMAIRE = [
    { theme: 'be', question: 'I _ eleven years old.', bonne: 'am', leurres: ['is', 'are', 'be'] },
    { theme: 'have got', question: 'She _ got a cat.', bonne: 'has', leurres: ['have', 'is', 'are'] },
    { theme: 'a/an', question: 'It is _ apple.', bonne: 'an', leurres: ['a', 'the', 'some'] },
    { theme: 'pluriels', question: 'One child, two _.', bonne: 'children', leurres: ['childs', 'childrens', 'childes'] },
    { theme: 'possessifs', question: 'This is Tom. _ dog is brown.', bonne: 'His', leurres: ['Her', 'He', 'Its'] },
    { theme: 'present simple', question: 'My brother _ football every Saturday.', bonne: 'plays', leurres: ['play', 'playing', 'is play'] },
    // … ≥ 60 items, ~5-6 par thème : be, have got, pronoms, possessifs, a/an, pluriels,
    // this/these, there is/are, can, present simple, present continuous, prépositions,
    // mots interrogatifs, l'heure.
];
```

- [ ] **Step 4:** test → PASS ; relire les données (orthographe, une seule réponse possible par question).
- [ ] **Step 5: Commit** — `git commit -m "feat(challenge): banques vocabulaire et grammaire"`

---

### Task 7: Banques culture et phrases

**Goal:** Écrire `culture.js` (~50 QCM) et `phrases.js` (~40 phrases), et compléter le test d'intégrité.

**Files:**
- Create: `challenge/js/donnees/culture.js`, `challenge/js/donnees/phrases.js`
- Modify: `challenge/test/donnees.test.js`

**Acceptance Criteria:**
- [ ] `CULTURE.length >= 50`, même format que `GRAMMAIRE` (question en français, réponses courtes) ; ≥ 6 thèmes (`uk`, `usa`, `londres`, `fetes`, `drapeaux`, `royaute`, `nourriture`, `pays`).
- [ ] `PHRASES.length >= 40`, chaque phrase `{ fr, en }`, `en` de 3 à 7 mots séparés par un espace, sans mot répété dans une même phrase (sinon l'ordre est ambigu).
- [ ] Les faits de culture sont vérifiables et à jour en 2026 (roi : Charles III ; capitale de l'Australie : Canberra…).

**Verify:** `node --test challenge/test/donnees.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Compléter le test** (ajouter à `donnees.test.js`)

```js
import { CULTURE } from '../js/donnees/culture.js';
import { PHRASES } from '../js/donnees/phrases.js';

test('culture : 50 QCM bien formés sur 6 thèmes', () => {
    verifierQcm(CULTURE, 50, 6);
});

test('phrases : 40 phrases de 3 à 7 mots sans mot répété', () => {
    assert.ok(PHRASES.length >= 40, `${PHRASES.length} phrases`);
    for (const p of PHRASES) {
        assert.ok(p.fr, JSON.stringify(p));
        const mots = p.en.split(' ');
        assert.ok(mots.length >= 3 && mots.length <= 7, p.en);
        assert.equal(new Set(mots.map(m => m.toLowerCase())).size, mots.length, `mot répété : ${p.en}`);
    }
});
```

- [ ] **Step 2:** test → FAIL.

- [ ] **Step 3: Écrire les données**

```js
// challenge/js/donnees/culture.js
// Culture des pays anglophones (questions en français, réponses courtes).
export const CULTURE = [
    { theme: 'londres', question: 'Comment s\'appelle la grande horloge de Londres ?', bonne: 'Big Ben', leurres: ['Big Bob', 'London Eye', 'Tower Bell'] },
    { theme: 'royaute', question: 'Qui est le roi du Royaume-Uni ?', bonne: 'Charles III', leurres: ['William V', 'George VII', 'Henry IX'] },
    { theme: 'fetes', question: 'Quel jour fête-t-on Halloween ?', bonne: '31 octobre', leurres: ['1er novembre', '25 décembre', '14 février'] },
    { theme: 'pays', question: 'Quelle est la capitale de l\'Australie ?', bonne: 'Canberra', leurres: ['Sydney', 'Melbourne', 'Perth'] },
    // … ≥ 50 items.
];
```

```js
// challenge/js/donnees/phrases.js
// Phrases à remettre dans l'ordre. `fr` sert de consigne, `en` est la phrase juste.
export const PHRASES = [
    { fr: 'Mon chat est noir.', en: 'My cat is black.' },
    { fr: 'J\'ai onze ans.', en: 'I am eleven years old.' },
    { fr: 'Elle aime les pommes.', en: 'She likes apples.' },
    // … ≥ 40 phrases.
];
```

- [ ] **Step 4:** test → PASS ; relire les faits.
- [ ] **Step 5: Commit** — `git commit -m "feat(challenge): banques culture et phrases"`

---

### Task 8: Génération des parties

**Goal:** Module pur `jeux.js` : la liste `JEUX` (méta des 6 jeux) et `genererPartie(idJeu, rng)` qui fabrique les questions de chaque jeu.

**Files:**
- Create: `challenge/js/jeux.js`
- Test: `challenge/test/jeux.test.js`

**Acceptance Criteria:**
- [ ] `JEUX` contient exactement les ids `quiz`, `image`, `ecoute`, `phrases`, `course`, `culture` avec `nom`, `emoji`, `couleur`, `type` (`qcm`|`phrases`).
- [ ] Pour chaque jeu et 50 graines : bon nombre de questions (quiz 15, image/ecoute/culture 10, phrases 8, course 60) ; chaque QCM a 4 choix de textes distincts et exactement 1 juste.
- [ ] `image` : `visuel` = emoji du mot juste ; leurres du même thème ; mots tous `image: true`.
- [ ] `ecoute` : `audio` = mot anglais juste ; les 4 choix sont des emojis distincts.
- [ ] Pas deux fois le même mot/la même question dans une partie (hors `course` si la banque est épuisée).
- [ ] `phrases` : `melange` est une permutation de `mots` différente de l'ordre juste.
- [ ] `slugAudio("ice cream") === 'ice-cream'`, `slugAudio("T-shirt") === 't-shirt'`.

**Verify:** `node --test challenge/test/jeux.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Écrire le test**

```js
// challenge/test/jeux.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JEUX, genererPartie, slugAudio } from '../js/jeux.js';
import { VOCAB } from '../js/donnees/vocab.js';
import { mulberry32 } from '../js/rng.js';

const ATTENDU = { quiz: 15, image: 10, ecoute: 10, phrases: 8, course: 60, culture: 10 };

test('les 6 jeux', () => {
    assert.deepEqual(JEUX.map(j => j.id).sort(), Object.keys(ATTENDU).sort());
    for (const j of JEUX) assert.ok(j.nom && j.emoji && j.couleur && ['qcm', 'phrases'].includes(j.type));
});

test('QCM : bon nombre, 4 choix distincts, une seule bonne réponse', () => {
    for (const j of JEUX.filter(x => x.type === 'qcm')) {
        for (let g = 1; g <= 50; g++) {
            const qs = genererPartie(j.id, mulberry32(g));
            assert.equal(qs.length, ATTENDU[j.id], j.id);
            for (const q of qs) {
                assert.ok(q.consigne);
                assert.equal(q.choix.length, 4);
                assert.equal(new Set(q.choix.map(c => c.texte)).size, 4, JSON.stringify(q));
                assert.equal(q.choix.filter(c => c.juste).length, 1);
            }
        }
    }
});

test('pas de doublon dans une partie (hors course)', () => {
    for (const id of ['quiz', 'image', 'ecoute', 'culture']) {
        for (let g = 1; g <= 50; g++) {
            const qs = genererPartie(id, mulberry32(g));
            const cles = qs.map(q => q.cle);
            assert.equal(new Set(cles).size, cles.length, id);
        }
    }
});

test('image et mot : emoji du mot juste, leurres du même thème', () => {
    const qs = genererPartie('image', mulberry32(9));
    for (const q of qs) {
        const juste = VOCAB.find(m => m.en === q.choix.find(c => c.juste).texte);
        assert.equal(q.visuel, juste.emoji);
        assert.ok(juste.image);
        for (const c of q.choix) assert.equal(VOCAB.find(m => m.en === c.texte).theme, juste.theme);
    }
});

test('j\'écoute : audio = mot juste, choix = emojis', () => {
    const qs = genererPartie('ecoute', mulberry32(4));
    for (const q of qs) {
        const juste = VOCAB.find(m => m.en === q.audio);
        assert.equal(q.choix.find(c => c.juste).texte, juste.emoji);
    }
});

test('phrases : 8 phrases mélangées', () => {
    for (let g = 1; g <= 50; g++) {
        const ps = genererPartie('phrases', mulberry32(g));
        assert.equal(ps.length, 8);
        for (const p of ps) {
            assert.deepEqual([...p.melange].sort(), [...p.mots].sort());
            assert.notDeepEqual(p.melange, p.mots);
        }
    }
});

test('slugAudio', () => {
    assert.equal(slugAudio('ice cream'), 'ice-cream');
    assert.equal(slugAudio('T-shirt'), 't-shirt');
    assert.equal(slugAudio("Mum's"), 'mum-s');
});
```

- [ ] **Step 2:** test → FAIL.

- [ ] **Step 3: Implémenter**

```js
// challenge/js/jeux.js
// Les 6 jeux et la fabrication des questions d'une partie.
import { shuffle, sample } from './rng.js';
import { VOCAB } from './donnees/vocab.js';
import { GRAMMAIRE } from './donnees/grammaire.js';
import { CULTURE } from './donnees/culture.js';
import { PHRASES } from './donnees/phrases.js';

export const JEUX = [
    { id: 'quiz', nom: 'Le grand quiz', emoji: '❓', couleur: '#2563eb', type: 'qcm', chrono: 20,
        aide: '15 questions, 20 secondes chacune' },
    { id: 'image', nom: 'Image et mot', emoji: '🖼️', couleur: '#16a34a', type: 'qcm',
        aide: 'Trouve le mot anglais de l\'image' },
    { id: 'ecoute', nom: 'J\'écoute', emoji: '🎧', couleur: '#9333ea', type: 'qcm',
        aide: 'Écoute le mot et clique sur la bonne image' },
    { id: 'phrases', nom: 'Phrases en morceaux', emoji: '🧩', couleur: '#ea580c', type: 'phrases',
        aide: 'Remets les mots dans l\'ordre' },
    { id: 'course', nom: 'Course contre la montre', emoji: '⚡', couleur: '#dc2626', type: 'qcm', duree: 60,
        aide: 'Un maximum de bonnes réponses en 1 minute' },
    { id: 'culture', nom: 'Culture', emoji: '🎡', couleur: '#0891b2', type: 'qcm',
        aide: 'Londres, les fêtes, les pays anglophones…' },
];

export function slugAudio(en) {
    return en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const IMAGES = VOCAB.filter(m => m.image);

function choix(bonne, leurres, rng) {
    return shuffle([{ texte: bonne, juste: true }, ...leurres.map(t => ({ texte: t, juste: false }))], rng);
}

// 3 leurres du même thème que `mot`, pris dans `banque`.
function leurresMemeTheme(mot, banque, rng) {
    return sample(banque.filter(m => m.theme === mot.theme && m.en !== mot.en), 3, rng);
}

function qImage(mot, rng) {
    return { cle: `v:${mot.en}`, consigne: 'Comment dit-on en anglais ?', visuel: mot.emoji,
        choix: choix(mot.en, leurresMemeTheme(mot, IMAGES, rng).map(m => m.en), rng) };
}

function qEcoute(mot, rng) {
    return { cle: `v:${mot.en}`, consigne: 'Écoute et clique sur la bonne image', audio: mot.en,
        grandsChoix: true,
        choix: choix(mot.emoji, leurresMemeTheme(mot, IMAGES, rng).map(m => m.emoji), rng) };
}

function qTraduction(mot, rng) {
    return { cle: `v:${mot.en}`, consigne: `Comment dit-on « ${mot.fr} » en anglais ?`,
        choix: choix(mot.en, leurresMemeTheme(mot, VOCAB, rng).map(m => m.en), rng) };
}

function qFixe(q, prefixe, rng) {
    return { cle: `${prefixe}:${q.question}`, consigne: q.question, choix: choix(q.bonne, q.leurres, rng) };
}

function qPhrase(p, rng) {
    const mots = p.en.split(' ');
    let melange = shuffle(mots, rng);
    while (melange.every((m, i) => m === mots[i])) melange = shuffle(mots, rng);
    return { cle: `p:${p.en}`, consigne: p.fr, mots, melange };
}

export function genererPartie(idJeu, rng = Math.random) {
    switch (idJeu) {
    case 'image': return sample(IMAGES, 10, rng).map(m => qImage(m, rng));
    case 'ecoute': return sample(IMAGES, 10, rng).map(m => qEcoute(m, rng));
    case 'culture': return sample(CULTURE, 10, rng).map(q => qFixe(q, 'c', rng));
    case 'phrases': return sample(PHRASES, 8, rng).map(p => qPhrase(p, rng));
    case 'quiz': return shuffle([
        ...sample(VOCAB, 5, rng).map(m => qTraduction(m, rng)),
        ...sample(GRAMMAIRE, 6, rng).map(q => qFixe(q, 'g', rng)),
        ...sample(CULTURE, 4, rng).map(q => qFixe(q, 'c', rng)),
    ], rng);
    case 'course': {
        // Alterne vocabulaire et grammaire ; 60 questions suffisent largement pour 1 minute.
        const v = shuffle(VOCAB, rng), g = shuffle(GRAMMAIRE, rng);
        return Array.from({ length: 60 }, (_, i) => (i % 2 === 0
            ? qTraduction(v[(i / 2) % v.length], rng)
            : qFixe(g[((i - 1) / 2) % g.length], 'g', rng)));
    }
    default: throw new Error(`Jeu inconnu : ${idJeu}`);
    }
}
```

Note : `qTraduction` exige ≥ 4 mots par thème dans `VOCAB` (garanti par Task 6 puisque chaque thème a ≥ 4 mots image).

- [ ] **Step 4:** test → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(challenge): génération des parties des 6 jeux"`

---

### Task 9: Sons et prononciation

**Goal:** `audio.js` (effets Web Audio + `prononcer(mot)`), script de génération des `.ogg` par Docker (piper, voix britannique), fichiers générés pour tous les mots `image: true`.

**Files:**
- Create: `challenge/js/audio.js`, `challenge/tools/liste-audio.mjs`, `challenge/tools/gen-audio.sh`, `challenge/audio/*.ogg`
- Test: `challenge/test/audio.test.js`

**Acceptance Criteria:**
- [ ] `choisirSource({ fichierOk, voixAnglaise })` (pur, exporté) : fichier présent → `'fichier'` ; sinon voix anglaise → `'voix'` ; sinon `'texte'` (Review Focus 5).
- [ ] Un `.ogg` par mot `image: true` de `VOCAB` (`challenge/audio/<slugAudio(en)>.ogg`), mono, ≤ 30 Ko chacun, taille totale ≤ 3 Mo.
- [ ] `gen-audio.sh` est idempotent (ne régénère pas un fichier existant sauf `--force`).
- [ ] Effets `sfxClic`, `sfxBon`, `sfxFaux`, `sfxFin` + `setMuet`/`estMuet`, repris de `apprendre/js/audio.js`.
- [ ] Écoute de contrôle : 3 fichiers pris au hasard sont compréhensibles (lecture via `ffprobe` : durée 0,3-2 s).

**Verify:** `node --test challenge/test/audio.test.js && ls challenge/audio/*.ogg | wc -l && du -sh challenge/audio` → `# fail 0`, autant de fichiers que de mots image, ≤ 3 Mo

**Steps:**

- [ ] **Step 1: Écrire le test**

```js
// challenge/test/audio.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choisirSource } from '../js/audio.js';

test('choix de la source de prononciation', () => {
    assert.equal(choisirSource({ fichierOk: true, voixAnglaise: false }), 'fichier');
    assert.equal(choisirSource({ fichierOk: false, voixAnglaise: true }), 'voix');
    assert.equal(choisirSource({ fichierOk: false, voixAnglaise: false }), 'texte');
});
```

`audio.js` ne doit toucher `window`/`document` qu'à l'intérieur des fonctions (import sans erreur sous Node).

- [ ] **Step 2:** test → FAIL.

- [ ] **Step 3: Implémenter `audio.js`** — copier `note()`, `initAudio()` et les effets de `apprendre/js/audio.js` (renommés `sfxClic`, `sfxBon`, `sfxFaux`, `sfxFin`, `setMuet`, `estMuet`), puis ajouter :

```js
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
// ('fichier' | 'voix' | 'texte') ; 'texte' = l'écran doit afficher le mot écrit.
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
```

(adapter le nom de la variable de sourdine à celle reprise d'`apprendre`).

- [ ] **Step 4: Liste des mots**

```js
// challenge/tools/liste-audio.mjs — écrit « slug<TAB>mot » pour chaque mot image.
import { VOCAB } from '../js/donnees/vocab.js';
import { slugAudio } from '../js/jeux.js';
for (const m of VOCAB.filter(x => x.image)) console.log(`${slugAudio(m.en)}\t${m.en}`);
```

- [ ] **Step 5: Script de génération**

```bash
#!/usr/bin/env bash
# challenge/tools/gen-audio.sh — prononciations anglaises (piper, voix en_GB) en .ogg.
# Usage : challenge/tools/gen-audio.sh [--force]
set -euo pipefail
cd "$(dirname "$0")/../.."
FORCE=${1:-}
LISTE=$(mktemp)
node challenge/tools/liste-audio.mjs > "$LISTE"
docker run --rm -i -v "$PWD/challenge/audio":/out -v piper-voices:/voices -v "$LISTE":/liste.tsv:ro \
  -e FORCE="$FORCE" python:3.12-slim bash -euo pipefail -c '
    apt-get update -qq && apt-get install -y -qq ffmpeg curl >/dev/null
    pip install -q piper-tts
    V=/voices/en_GB-alba-medium.onnx
    BASE=https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alba/medium
    [ -f "$V" ] || curl -sSL -o "$V" "$BASE/en_GB-alba-medium.onnx"
    [ -f "$V.json" ] || curl -sSL -o "$V.json" "$BASE/en_GB-alba-medium.onnx.json"
    while IFS=$'"'"'\t'"'"' read -r slug mot; do
      [ -f "/out/$slug.ogg" ] && [ "$FORCE" != "--force" ] && continue
      echo "$mot" | piper -m "$V" -f /tmp/w.wav
      ffmpeg -loglevel error -y -i /tmp/w.wav -ac 1 -c:a libopus -b:a 24k "/out/$slug.ogg"
    done < /liste.tsv
    chown -R '"$(id -u):$(id -g)"' /out'
rm -f "$LISTE"
```

`mkdir -p challenge/audio && chmod +x challenge/tools/gen-audio.sh && challenge/tools/gen-audio.sh`. Si `piper` (pip) ne s'installe pas dans l'image, utiliser l'image `rhasspy/piper` ou la version binaire publiée sur GitHub (`piper_linux_x86_64.tar.gz`) — le reste du script ne change pas.

- [ ] **Step 6: Contrôle** — compter les fichiers, `du -sh`, et `docker run --rm -v $PWD/challenge/audio:/a linuxserver/ffmpeg ...` (ou l'image python ci-dessus) pour un `ffprobe` de 3 fichiers (durée 0,3-2 s).
- [ ] **Step 7:** tests + lint → PASS.
- [ ] **Step 8: Commit** — `git add challenge/js/audio.js challenge/tools challenge/audio challenge/test/audio.test.js && git commit -m "feat(challenge): sons et prononciations anglaises"`

---

### Task 10: Contrôleur de partie

**Goal:** Module pur `partie.js` qui tient l'état d'une partie (question courante, verrou anti double-réponse, série, points, chrono global) indépendamment de l'affichage.

**Files:**
- Create: `challenge/js/partie.js`
- Test: `challenge/test/partie.test.js`

**Acceptance Criteria:**
- [ ] `creerPartieQcm(questions, { duree? })` puis `repondre(etat, indexChoix, ms)` → `{ juste, points, bonneIndex }` ; un 2ᵉ appel avant `suivante()` renvoie `null` et ne change rien (Review Focus 4).
- [ ] Série et points conformes à `points.js` (3 bonnes réponses rapides → 15 + 15 + 17).
- [ ] `tempsEcoule(etat, msDepuisDebut)` vrai quand `duree` est dépassée ; `terminee` vrai après la dernière question ou le temps écoulé.
- [ ] Phrases : `creerPartiePhrases(phrases)`, `placer(etat, i)` / `retirer(etat, i)` / `valider(etat)` → juste au 1er essai 10 pts, au 2e 5 pts, ensuite 0 et passage à la suivante avec la solution révélée.
- [ ] `resultat(etat)` → `{ bonnes, repondues, points }`.

**Verify:** `node --test challenge/test/partie.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Écrire le test**

```js
// challenge/test/partie.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creerPartieQcm, repondre, suivante, tempsEcoule, resultat,
    creerPartiePhrases, placer, retirer, valider } from '../js/partie.js';

const q = (bonne) => ({ consigne: '?', choix: [0, 1, 2, 3].map(i => ({ texte: `r${i}`, juste: i === bonne })) });

test('une seule réponse comptée par question', () => {
    const e = creerPartieQcm([q(0), q(1)]);
    const r = repondre(e, 0, 1000);
    assert.equal(r.juste, true);
    assert.equal(repondre(e, 0, 1000), null);
    assert.equal(e.points, 15);
    suivante(e);
    assert.equal(e.index, 1);
});

test('série et points', () => {
    const e = creerPartieQcm([q(0), q(0), q(0), q(2)]);
    for (let i = 0; i < 3; i++) { repondre(e, 0, 1000); suivante(e); }
    assert.equal(e.points, 15 + 15 + 17);
    const r = repondre(e, 0, 1000);
    assert.equal(r.juste, false);
    assert.equal(r.bonneIndex, 2);
    assert.equal(e.serie, 0);
    suivante(e);
    assert.equal(e.terminee, true);
    assert.deepEqual(resultat(e), { bonnes: 3, repondues: 4, points: 47 });
});

test('chrono global', () => {
    const e = creerPartieQcm([q(0), q(0)], { duree: 60 });
    assert.equal(tempsEcoule(e, 59000), false);
    assert.equal(tempsEcoule(e, 60000), true);
    assert.equal(e.terminee, true);
});

test('phrases : placer, retirer, valider', () => {
    const e = creerPartiePhrases([{ consigne: 'x', mots: ['I', 'am', 'here'], melange: ['am', 'here', 'I'] }]);
    placer(e, 2); placer(e, 1);              // I here
    assert.deepEqual(e.reponse, ['I', 'here']);
    retirer(e, 1);                             // I
    placer(e, 0); placer(e, 1);              // I am here
    assert.deepEqual(valider(e), { juste: true, points: 10 });
    assert.equal(e.points, 10);
});

test('phrases : 2e essai 5 points, 3e essai révèle la solution', () => {
    const p = { consigne: 'x', mots: ['a', 'b', 'c'], melange: ['c', 'b', 'a'] };
    const e = creerPartiePhrases([p, p]);
    placer(e, 0); placer(e, 1); placer(e, 2);
    assert.equal(valider(e).juste, false);
    assert.deepEqual(e.reponse, []);          // on recommence
    placer(e, 2); placer(e, 1); placer(e, 0);
    assert.deepEqual(valider(e), { juste: true, points: 5 });
    suivante(e);
    placer(e, 0); placer(e, 1); placer(e, 2);
    valider(e);
    placer(e, 0); placer(e, 1); placer(e, 2);
    assert.deepEqual(valider(e), { juste: false, points: 0, solution: ['a', 'b', 'c'] });
});
```

- [ ] **Step 2:** test → FAIL.

- [ ] **Step 3: Implémenter**

```js
// challenge/js/partie.js
// État d'une partie, sans affichage : l'écran appelle repondre()/suivante()
// et lit l'état. Le verrou `attente` empêche de compter deux réponses.
import { pointsQuestion, pointsPhrase } from './points.js';

export function creerPartieQcm(questions, { duree = null } = {}) {
    return { questions, index: 0, points: 0, bonnes: 0, repondues: 0, serie: 0,
        attente: false, terminee: questions.length === 0, duree };
}

export function repondre(e, indexChoix, ms) {
    if (e.attente || e.terminee) return null;
    const q = e.questions[e.index];
    const juste = Boolean(q.choix[indexChoix]?.juste);
    e.serie = juste ? e.serie + 1 : 0;
    const points = pointsQuestion({ juste, ms, serie: e.serie });
    e.points += points;
    e.repondues++;
    if (juste) e.bonnes++;
    e.attente = true;
    return { juste, points, bonneIndex: q.choix.findIndex(c => c.juste) };
}

// Sert aux deux types de partie : remet aussi à zéro l'essai en cours des phrases.
export function suivante(e) {
    e.attente = false;
    e.index++;
    if ('essai' in e) { e.essai = 1; e.reponse = []; e.utilises = []; }
    if (e.index >= e.questions.length) e.terminee = true;
}

export function tempsEcoule(e, msDepuisDebut) {
    if (e.duree != null && msDepuisDebut >= e.duree * 1000) e.terminee = true;
    return e.terminee;
}

export function resultat(e) {
    return { bonnes: e.bonnes, repondues: e.repondues, points: e.points };
}

// --- Phrases en morceaux ---

export function creerPartiePhrases(phrases) {
    return { questions: phrases, index: 0, points: 0, bonnes: 0, repondues: 0, essai: 1,
        reponse: [], utilises: [], attente: false, terminee: phrases.length === 0 };
}

// i = index de l'étiquette dans `melange`.
export function placer(e, i) {
    if (e.attente || e.utilises.includes(i)) return;
    e.utilises.push(i);
    e.reponse.push(e.questions[e.index].melange[i]);
}

// i = position dans la réponse en cours.
export function retirer(e, i) {
    if (e.attente) return;
    e.utilises.splice(i, 1);
    e.reponse.splice(i, 1);
}

export function valider(e) {
    const p = e.questions[e.index];
    if (e.attente || e.reponse.length !== p.mots.length) return null;
    const juste = e.reponse.every((m, i) => m === p.mots[i]);
    if (juste) {
        const points = pointsPhrase(e.essai);
        e.points += points;
        e.bonnes++;
        e.repondues++;
        e.attente = true;
        return { juste, points };
    }
    e.essai++;
    e.reponse = [];
    e.utilises = [];
    if (e.essai > 2) {
        e.repondues++;
        e.attente = true;
        return { juste: false, points: 0, solution: p.mots };
    }
    return { juste: false };
}
```

Le 3ᵉ test attend `{ juste: false }` au 1er échec (pas de `points`) : `assert.equal(valider(e).juste, false)` le vérifie.

- [ ] **Step 4:** test → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(challenge): contrôleur de partie (QCM et phrases)"`

---

### Task 11: Écrans de jeu (QCM et phrases)

**Goal:** `ui-qcm.js` et `ui-phrases.js` qui affichent une partie à partir de `partie.js`, avec sons, chrono, clavier 1-4 et bouton 🔊.

**Files:**
- Create: `challenge/js/ui-qcm.js`, `challenge/js/ui-phrases.js`
- Modify: `challenge/css/style.css`

**Acceptance Criteria:**
- [ ] `lancerQcm(app, jeu, questions, { onFin(resultat), onQuitter })` : en-tête (🏠, progression « 3/10 », points, chrono), consigne, visuel (emoji géant) ou bouton 🔊, 4 boutons de réponse (touches 1-4).
- [ ] Bonne réponse : bouton vert + son + « +15 » qui s'envole ; mauvaise : rouge + bonne réponse en vert ; 0,9 s / 1,4 s avant la suivante.
- [ ] Grand quiz : barre de chrono 20 s par question, à 0 la question compte fausse. Course : chrono global 60 s, la partie s'arrête net à 0.
- [ ] *J'écoute* : prononciation automatique à l'affichage + bouton 🔊 ; si `prononcer` rend `'texte'`, le mot écrit apparaît après 1 s.
- [ ] `lancerPhrases(app, questions, { onFin, onQuitter })` : consigne française, zone réponse, étiquettes ; clic étiquette = placer, clic mot placé = retirer, bouton « Vérifier » actif quand tous les mots sont placés ; message « Essaie encore ! » au 1er échec, solution affichée au 2e.
- [ ] Tous les minuteurs et écouteurs clavier sont nettoyés en quittant (🏠) ou en fin de partie.

**Verify:** Capture headless (`?jeu=quiz` etc., voir Task 12 Step 5) + partie complète jouée à la main via Chrome (extension) ou headless avec un petit script de clics ; `challenge/tools/lint.sh` sans erreur.

**Steps:**

- [ ] **Step 1:** Écrire `ui-qcm.js` sur le modèle de `apprendre/js/quiz.js` (création DOM, `textContent` pour tout texte), en déléguant l'état à `partie.js` :

```js
// challenge/js/ui-qcm.js
// Écran de jeu pour les QCM (grand quiz, image et mot, j'écoute, course, culture).
import { creerPartieQcm, repondre, suivante, tempsEcoule, resultat } from './partie.js';
import { slugAudio } from './jeux.js';
import * as audio from './audio.js';

export function lancerQcm(app, jeu, questions, { onFin, onQuitter }) {
    const etat = creerPartieQcm(questions, { duree: jeu.duree ?? null });
    const debutPartie = performance.now();
    let debutQuestion = 0;
    let minuteur = null;      // setInterval du chrono
    let attente = null;       // setTimeout avant la question suivante
    // … construction DOM : .jeu > .jeu-entete(🏠, .progression, .score, .chrono) ,
    //   .consigne, .visuel, .choix (4 boutons .choix-btn avec <span class="touche">1</span>),
    //   .bonus-vol
    function fermer() {
        clearInterval(minuteur);
        clearTimeout(attente);
        document.removeEventListener('keydown', surTouche);
    }
    function surTouche(ev) {
        const n = Number(ev.key);
        if (n >= 1 && n <= 4) choisir(n - 1);
    }
    function choisir(i) {
        const r = repondre(etat, i, performance.now() - debutQuestion);
        if (!r) return;                       // déjà répondu (double clic, touche)
        // … colorer, son, bonus volant
        attente = setTimeout(() => { suivante(etat); afficher(); }, r.juste ? 900 : 1400);
    }
    function afficher() {
        if (etat.terminee) { fermer(); onFin(resultat(etat)); return; }
        // … remplir l'écran avec etat.questions[etat.index] ; si q.audio : audio.prononcer(q.audio, slugAudio(q.audio))
        //   puis si 'texte', setTimeout 1 s → afficher le mot sous le bouton 🔊
        debutQuestion = performance.now();
    }
    minuteur = setInterval(() => {
        // Course : chrono global.  Grand quiz : jeu.chrono par question → choisir(-1) à 0.
        if (jeu.duree && tempsEcoule(etat, performance.now() - debutPartie)) { fermer(); onFin(resultat(etat)); }
        if (jeu.chrono && !etat.attente && performance.now() - debutQuestion >= jeu.chrono * 1000) choisir(-1);
        // … mettre à jour la barre de chrono
    }, 100);
    document.addEventListener('keydown', surTouche);
    afficher();
}
```

`repondre(etat, -1, ms)` compte faux (`q.choix[-1]` indéfini) : c'est le cas « temps écoulé » du grand quiz.

- [ ] **Step 2:** Écrire `ui-phrases.js` de la même façon avec `creerPartiePhrases/placer/retirer/valider/suivante/resultat` (étiquettes = boutons `.etiquette`, réponse = `.ligne-reponse`).
- [ ] **Step 3:** Styles dans `style.css` : boutons de réponse grands (≥ 64 px de haut, 2 colonnes, 1 colonne sous 520 px), `.correct` vert `#22c55e`, `.faux` rouge `#ef4444`, emoji visuel `font-size: 120px`, choix emoji (`grandsChoix`) `font-size: 64px`, barre de chrono qui passe du vert au rouge, animation `@keyframes envol` pour le bonus, étiquettes de phrase arrondies.
- [ ] **Step 4:** `challenge/tools/lint.sh` → OK. Vérification visuelle faite en Task 12 (les écrans ont besoin du routeur).
- [ ] **Step 5: Commit** — `git commit -m "feat(challenge): écrans de jeu QCM et phrases"`

---

### Task 12: Compte, avatar, accueil et résultat

**Goal:** `main.js` (routeur + accueil + résultat) et `ecran-compte.js` (pseudo + éditeur d'avatar) : le jeu complet est jouable de la création du compte au résultat.

**Files:**
- Create: `challenge/js/ecran-compte.js`
- Modify: `challenge/js/main.js`, `challenge/css/style.css`

**Acceptance Criteria:**
- [ ] Sans sauvegarde : écran « Créer mon compte » (titre The Biggest Challenge, champ pseudo `maxlength=16`, bouton « Suivant » inactif si `validerPseudo` → `null`).
- [ ] Éditeur d'avatar : aperçu grand format en direct ; onglets Peau / Coiffure (sous-onglets Filles · Garçons, vignettes de chaque coiffure sur l'avatar courant) / Cheveux / Haut / Bas / Fond ; pastilles de couleur ; bouton 🎲 (look aléatoire) ; bouton « C'est moi ! » qui sauve `profil = { pseudo, look, creeLe: new Date().toISOString() }`.
- [ ] Accueil : avatar, pseudo, ⭐ total, « 🥇 12ᵉ sur 31 » (cliquable → classement), ✏️ modifier l'avatar (même éditeur, pseudo conservé, `creeLe` inchangé), 🔇/🔊, grille des 6 jeux (emoji, nom, aide, « Record : 120 »).
- [ ] Résultat : bonnes réponses, « +135 points », ancien → nouveau rang, et pour chaque joueur dépassé « Tu as dépassé Lucas_78 ! » (max 3 noms + « et 2 autres ») ; boutons « Rejouer » et « Accueil ».
- [ ] Pseudo affiché via `textContent` (un pseudo `<b>x</b>` s'affiche tel quel).
- [ ] Paramètres de test : `?jeu=<id>` lance directement un jeu si un profil existe ; `?ecran=compte|accueil|classement`.
- [ ] Captures headless relues : création de compte, éditeur (onglet coiffures), accueil, une question de chaque jeu, résultat — à 1280×800 et 390×844, sans débordement horizontal.

**Verify:** captures headless relues avec Read ; `node --test challenge/test/ && challenge/tools/lint.sh` → OK

**Steps:**

- [ ] **Step 1:** `ecran-compte.js` : `afficherCompte(app, { pseudo?, look?, onValider(pseudo, look) })`. Les vignettes et l'aperçu utilisent `avatarSVG()` injecté en `innerHTML` (SVG généré par nous, pas de texte utilisateur dedans).
- [ ] **Step 2:** `main.js` :

```js
// challenge/js/main.js — point d'entrée : écrans compte, accueil, jeu, résultat, classement.
import { charger, sauver, enregistrerPartie } from './save.js';
import { JEUX, genererPartie } from './jeux.js';
import { classement } from './classement.js';
import { avatarSVG } from './avatar.js';
import { lancerQcm } from './ui-qcm.js';
import { lancerPhrases } from './ui-phrases.js';
import { afficherCompte } from './ecran-compte.js';
import { afficherClassement } from './ecran-classement.js';
import * as audio from './audio.js';

const app = document.getElementById('app');
let etat = charger();
audio.setMuet(etat.muet);

function jouer(jeu) {
    const avant = classement(etat.profil, etat.total);
    const questions = genererPartie(jeu.id);
    const fin = (res) => {
        etat = enregistrerPartie(etat, jeu.id, res.points);
        sauver(etat);
        afficherResultat(jeu, res, avant);
    };
    const opts = { onFin: fin, onQuitter: accueil };
    if (jeu.type === 'phrases') lancerPhrases(app, questions, opts);
    else lancerQcm(app, jeu, questions, opts);
}
// … accueil(), afficherResultat(jeu, res, avant) (dépassés = joueurs `avant` devant Sophie
//   et derrière elle dans le nouveau classement), compte(), lecture des paramètres d'URL.
```

`ecran-classement.js` n'existe qu'en Task 13 : en attendant, créer un module minimal `export function afficherClassement(app, lignes, { onRetour }) { onRetour(); }` remplacé en Task 13.

- [ ] **Step 3:** CSS : cartes de jeux colorées (couleur de `JEUX`), en-tête d'accueil avec avatar 120 px, grille `repeat(auto-fill, minmax(220px, 1fr))`, éditeur en 2 colonnes (aperçu | onglets) qui passe en 1 colonne sous 720 px.
- [ ] **Step 4:** Initialisation `audio.initAudio()` au premier clic (politique d'autoplay).
- [ ] **Step 5: Captures.** Créer `challenge/_test.html?save=<json url-encodé>&then=<url>` qui écrit `biggest_save` puis redirige ; servir le dépôt (`python3 -m http.server 8765`) et capturer chaque écran avec
  `google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars --screenshot=<scratchpad>/<nom>.png --window-size=1280,800 --virtual-time-budget=3000 "<url>"` puis en `390,844`. Relire chaque image ; corriger. **Supprimer `_test.html`** avant le commit.
- [ ] **Step 6:** tests + lint → OK.
- [ ] **Step 7: Commit** — `git commit -m "feat(challenge): compte, avatar, accueil et résultat"`

---

### Task 13: Écran du classement

**Goal:** `ecran-classement.js` : la liste des 31 joueurs avec avatars miniatures, Sophie surlignée et centrée.

**Files:**
- Modify: `challenge/js/ecran-classement.js`, `challenge/css/style.css`

**Acceptance Criteria:**
- [ ] `afficherClassement(app, lignes, { onRetour })` : titre « 🥇 Classement », 31 lignes (rang, médaille 🥇🥈🥉 pour le podium, avatar 40 px, pseudo via `textContent`, points).
- [ ] Ligne de Sophie surlignée (fond doré, « (toi) ») et amenée au centre à l'ouverture (`scrollIntoView({ block: 'center' })`).
- [ ] Bouton ← Accueil ; touche Échap = retour.
- [ ] Capture headless relue (Sophie 31ᵉ, puis avec un total qui la place 5ᵉ).

**Verify:** captures relues ; `challenge/tools/lint.sh` → OK

**Steps:**

- [ ] **Step 1:** Implémenter l'écran (DOM, `textContent` pour pseudo/points, `avatarSVG(look, { taille: 40 })` en `innerHTML` d'un conteneur dédié).
- [ ] **Step 2:** CSS (lignes en cartes arrondies, podium coloré).
- [ ] **Step 3:** Captures (même méthode que Task 12) ; supprimer les fichiers `_test*`.
- [ ] **Step 4: Commit** — `git commit -m "feat(challenge): écran du classement"`

---

### Task 14: Menu principal, documentation, validation par Sophie et déploiement

**Goal:** Ajouter le jeu au menu racine, documenter, faire valider par Sophie, déployer sur le Pi.

**Files:**
- Modify: `index.html` (racine), `CLAUDE.md`
- Memory: `~/.claude/projects/-home-pascal-github-JeuxSophie/memory/project_challenge_etat.md` + ligne dans `MEMORY.md`

**Acceptance Criteria:**
- [ ] Carte dans la section « 📚 Pour apprendre » de `index.html` : `<a class="card" href="challenge/" style="background:#1d4ed8"><span class="emoji">🇬🇧</span><span class="name">The Biggest Challenge</span></a>`.
- [ ] `CLAUDE.md` : `challenge/` dans la présentation + section « Spécificités *challenge/* » (modules purs, tests `node --test challenge/test/`, lint, `gen-audio.sh`, clé `biggest_save`, paramètres `?jeu=`/`?ecran=`).
- [ ] Aucun fichier `_test*` dans `challenge/` (`git ls-files challenge | grep _test` vide).
- [ ] Tous les tests et le lint passent.
- [ ] Sophie a essayé le jeu (création de compte + au moins 2 jeux) et dit que ça lui plaît, ou ses retours sont corrigés.
- [ ] `./deploy/deploy.sh` exécuté ; `curl -sI http://jeux.local/challenge/` → `200` ; `curl -sI http://jeux.local/challenge/audio/cat.ogg` → `200`.

**Verify:** `node --test challenge/test/ && challenge/tools/lint.sh && curl -sI http://jeux.local/challenge/ | head -1` → tests OK, `HTTP/1.1 200 OK`

**Steps:**

- [ ] **Step 1:** Modifier `index.html` et `CLAUDE.md` ; écrire la mémoire du projet.
- [ ] **Step 2:** tests + lint.
- [ ] **Step 3:** Commit — `git commit -m "feat(challenge): The Biggest Challenge dans le menu + doc"`
- [ ] **Step 4:** `./deploy/deploy.sh --dry-run` puis `./deploy/deploy.sh` ; vérifier avec `curl -sI`.
- [ ] **Step 5:** Donner à Sophie l'adresse `http://jeux.local/challenge/` et recueillir ses retours ; corriger, recommencer Steps 2-4.
