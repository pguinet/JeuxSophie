# The Biggest Challenge v2 — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre `challenge/` plus difficile (niveaux, mots durs, grammaire de grands, réponses pièges), ajouter 10 jeux (16 au total) et servir le jeu sur sa propre adresse `http://challenge.local/`.

**Architecture:** Même architecture que la v1 (modules purs testés sous Node + écrans DOM). Nouveaux modules purs `tirage.js` (tirage pondéré par niveau, leurres proches) et `heure.js` ; `partie.js` gagne un mode « vies » et trois contrôleurs (relier, pendu, lettres) ; `jeux.js` gagne 10 générateurs ; trois nouveaux écrans `ui-relier.js`, `ui-pendu.js`, `ui-lettres.js`. Côté Pi : vhost lighttpd + alias mDNS.

**Tech Stack:** ES modules vanilla, SVG, `node --test` (Node 20), ESLint 9 via Docker, piper (Docker) pour l'audio, lighttpd + avahi sur le Pi.

**Spec:** `docs/plans/2026-10-24-biggest-challenge-v2-design.md` (et la v1 `docs/plans/2026-10-24-biggest-challenge-design.md` pour tout ce qui ne change pas).

## Global Constraints

- Tout ce qui est dans la v1 reste vrai : ES modules vanilla, imports relatifs, aucun CDN, commentaires/noms en français, indentation 4 espaces, tests `challenge/test/*.test.js`, lint `challenge/tools/lint.sh`, `textContent` pour tout texte de l'utilisatrice, clé `biggest_save` (format inchangé), avatar et classement inchangés.
- Chaque item de banque (`VOCAB`, `GRAMMAIRE`, `PIEGES`, `CULTURE`, `PHRASES`, `VRAIFAUX`, `CONTRAIRES`) a un champ `niveau` ∈ {1, 2, 3}.
- Poids de tirage par défaut : `{ 1: 0.2, 2: 0.45, 3: 0.35 }`.
- Temps inchangés : grand quiz 20 s par question, course 60 s ; aucun autre jeu chronométré.
- Volumes minimum : VOCAB ≥ 450 mots sur ≥ 20 thèmes ; GRAMMAIRE ≥ 220 ; PIEGES ≥ 80 ; CULTURE ≥ 110 ; PHRASES ≥ 100 ; VRAIFAUX ≥ 120 ; CONTRAIRES ≥ 70.
- `JEUX` : 16 jeux, ids `quiz, image, ecoute, phrases, course, culture, relier, vraifaux, intrus, contraires, heure, pendu, lettres, ecoutephrases, survie, concours`, champ `famille` ∈ `mots | grammaire | ecoute | defis` :
  `mots` = image, relier, intrus, contraires, pendu, lettres ; `grammaire` = phrases, vraifaux, heure ; `ecoute` = ecoute, ecoutephrases ; `defis` = quiz, course, culture, survie, concours.
- Points : QCM `10 + bonusVitesse + bonusSérie` (v1) ; relier 10/5 par paire ; pendu `10 + 2 × (7 − erreurs)` par mot trouvé ; lettres 10 sans erreur / 5 avec erreurs / 0 si révélé.
- Heures en anglais britannique : `o'clock`, `quarter past/to`, `half past`, `five/ten/twenty/twenty-five past/to`.
- Prononciation des phrases : `challenge/audio/phrases/<slugAudio(en)>.ogg`, mêmes réglages piper que les mots (voix `en_GB-alba-medium`, `--length_scale 1.35`, 0,3 s de silence avant/après — choix de Sophie).
- Adresse à part : `challenge.local` → docroot `/var/www/jeux/challenge` ; carte 🇬🇧 retirée de `index.html` racine.
- Contenu : anglais britannique, une seule bonne réponse, faits exacts en octobre 2026, niveau fin de 6ème / début de 5ème.

**User decisions (already made):**
- Site à part : « a » (propre adresse `challenge.local`), « b » (retiré du menu `jeux.local`), « a » (repartir de zéro, pas d'export de compte).
- Difficulté : « 1 2 3 » → mots plus durs, grammaire de grands, réponses pièges ; « pas besoin de racoursir le temps ».
- Nouveaux jeux : « 2 3 4 5 6 7 8 9 10 11 » → relier, vrai ou faux, intrus, contraires, heure, pendu, lettres mélangées, écoute de phrases, survie, vrai concours (pas Memory).
- Morceaux 1 et 2 du design validés (« oui », « oui ») ; plan de construction validé (« oui »).

## Review Focus

1. **Mot à double famille dans L'intrus** (*orange* couleur/fruit, *chicken* animal/plat) → jamais proposé dans un intrus (champ `polyvalent: true` exclu). Test : Task 7 (« aucun mot polyvalent dans un intrus »).
2. **Pendu avec espace, tiret, majuscule ou touche non-lettre** (*ice cream*, *T-shirt*, touche `é` ou `3`) → espaces/tirets affichés d'office, casse ignorée, touches non a-z ignorées sans compter d'erreur. Test : Task 4.
3. **Lettres mélangées avec lettres répétées** (*apple*, *coffee*) → n'importe laquelle des deux tuiles « p » convient. Test : Task 4.
4. **Relier avec deux mots de même traduction dans une manche** → jamais (traductions et mots uniques par manche). Test : Task 7.
5. **12 h 45 / 11 h 55** → « quarter to one », « five to twelve » (passage d'heure). Test : Task 2.

---

## Structure des fichiers

```
challenge/js/tirage.js                 # Task 1  PUR
challenge/js/heure.js                  # Task 2  PUR
challenge/js/partie.js                 # Task 3 (vies) + Task 4 (relier, pendu, lettres)
challenge/js/donnees/vocab.js          # Task 5
challenge/js/donnees/grammaire.js      # Task 6a ; pieges.js (nouveau)
challenge/js/donnees/culture.js        # Task 6b ; phrases.js
challenge/js/donnees/vraifaux.js       # Task 6c (nouveau) ; contraires.js (nouveau)
challenge/js/jeux.js                   # Task 7
challenge/tools/liste-audio.mjs, gen-audio.sh, audio/phrases/*.ogg   # Task 8
challenge/js/ui-qcm.js                 # Task 9
challenge/js/ui-relier.js, ui-pendu.js, ui-lettres.js, css/style.css  # Task 10
challenge/js/main.js                   # Task 11
deploy/50-jeux.conf, deploy/avahi-alias-challenge.service, deploy/README.md, index.html, CLAUDE.md  # Task 12
(Pi : installation + déploiement + validation Sophie)  # Task 13
```

---

### Task 1: Tirage par niveau et leurres proches

**Goal:** Module pur `tirage.js` : `tirerParNiveau`, `distanceEdition`, `leurresProches`.

**Files:**
- Create: `challenge/js/tirage.js`
- Test: `challenge/test/tirage.test.js`

**Acceptance Criteria:**
- [ ] `tirerParNiveau(banque, n, rng, poids)` rend `min(n, banque.length)` éléments distincts ; sur 2000 tirages de 10 parmi une banque équilibrée, la part de niveau 1 est < 30 % et celle de niveau 2+3 > 70 % avec les poids par défaut.
- [ ] Si un niveau manque dans la banque, le tirage se fait sur les niveaux présents (pas d'erreur).
- [ ] `distanceEdition('bread','beard') === 2`, `('cat','cat') === 0`, `('', 'abc') === 3`.
- [ ] `leurresProches(mot, banque, 3, rng)` rend 3 mots distincts, jamais le mot lui-même, jamais un mot de même `en`, `fr` ou `emoji` (insensible à la casse) ; si ≥ 3 candidats existent dans le même thème, au moins 2 des 3 leurres sont du même thème.
- [ ] Déterministe avec un `rng` à graine.

**Verify:** `node --test challenge/test/tirage.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Test**

```js
// challenge/test/tirage.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tirerParNiveau, distanceEdition, leurresProches, POIDS_DEFAUT } from '../js/tirage.js';
import { mulberry32 } from '../js/rng.js';

const banque = Array.from({ length: 90 }, (_, i) => ({ id: i, niveau: 1 + (i % 3) }));

test('tirerParNiveau : distincts, bonne taille, favorise les niveaux 2 et 3', () => {
    const rng = mulberry32(5);
    let n1 = 0, total = 0;
    for (let k = 0; k < 2000; k++) {
        const t = tirerParNiveau(banque, 10, rng);
        assert.equal(t.length, 10);
        assert.equal(new Set(t.map(x => x.id)).size, 10);
        n1 += t.filter(x => x.niveau === 1).length;
        total += t.length;
    }
    assert.ok(n1 / total < 0.3, `part niveau 1 = ${n1 / total}`);
    assert.deepEqual(POIDS_DEFAUT, { 1: 0.2, 2: 0.45, 3: 0.35 });
});

test('tirerParNiveau : n > taille, niveau absent', () => {
    const petite = [{ id: 1, niveau: 1 }, { id: 2, niveau: 1 }];
    assert.equal(tirerParNiveau(petite, 5, mulberry32(1)).length, 2);
    assert.equal(tirerParNiveau(petite, 2, mulberry32(1)).length, 2);
    assert.deepEqual(tirerParNiveau([], 3, mulberry32(1)), []);
});

test('tirerParNiveau : déterministe', () => {
    assert.deepEqual(tirerParNiveau(banque, 8, mulberry32(3)), tirerParNiveau(banque, 8, mulberry32(3)));
});

test('distanceEdition', () => {
    assert.equal(distanceEdition('bread', 'beard'), 2);
    assert.equal(distanceEdition('cat', 'cat'), 0);
    assert.equal(distanceEdition('', 'abc'), 3);
    assert.equal(distanceEdition('kitten', 'sitting'), 3);
});

const vocab = [
    { en: 'bread', fr: 'pain', emoji: '🍞', theme: 'nourriture', niveau: 1 },
    { en: 'beard', fr: 'barbe', emoji: '🧔', theme: 'corps', niveau: 2 },
    { en: 'cheese', fr: 'fromage', emoji: '🧀', theme: 'nourriture', niveau: 1 },
    { en: 'butter', fr: 'beurre', emoji: '🧈', theme: 'nourriture', niveau: 2 },
    { en: 'flour', fr: 'farine', emoji: '🌾', theme: 'nourriture', niveau: 3 },
    { en: 'Bread', fr: 'pain de mie', emoji: '🥪', theme: 'nourriture', niveau: 2 },
    { en: 'toast', fr: 'pain', emoji: '🍞', theme: 'nourriture', niveau: 2 },
    { en: 'dog', fr: 'chien', emoji: '🐶', theme: 'animaux', niveau: 1 },
];

test('leurresProches : 3 leurres distincts, jamais une autre « bonne réponse »', () => {
    for (let g = 1; g <= 50; g++) {
        const l = leurresProches(vocab[0], vocab, 3, mulberry32(g));
        assert.equal(l.length, 3);
        assert.equal(new Set(l.map(m => m.en.toLowerCase())).size, 3);
        for (const m of l) {
            assert.notEqual(m.en.toLowerCase(), 'bread');
            assert.notEqual(m.fr, 'pain');
            assert.notEqual(m.emoji, '🍞');
        }
        assert.ok(l.filter(m => m.theme === 'nourriture').length >= 2);
    }
});
```

- [ ] **Step 2:** `node --test challenge/test/tirage.test.js` → FAIL.

- [ ] **Step 3: Implémenter**

```js
// challenge/js/tirage.js
// Tirages « plus difficiles » : on favorise les niveaux 2 et 3, et on choisit
// des leurres qui ressemblent à la bonne réponse (même thème, orthographe proche).
import { shuffle } from './rng.js';

export const POIDS_DEFAUT = { 1: 0.2, 2: 0.45, 3: 0.35 };

// n éléments distincts ; le niveau de chaque tirage suit `poids`, renormalisé
// sur les niveaux qui ont encore des éléments.
export function tirerParNiveau(banque, n, rng = Math.random, poids = POIDS_DEFAUT) {
    const restes = new Map();
    for (const item of shuffle(banque, rng)) {
        const niv = item.niveau ?? 1;
        if (!restes.has(niv)) restes.set(niv, []);
        restes.get(niv).push(item);
    }
    const res = [];
    while (res.length < n) {
        const dispo = [...restes.keys()].filter(k => restes.get(k).length > 0);
        if (dispo.length === 0) break;
        const total = dispo.reduce((s, k) => s + (poids[k] ?? 0.1), 0);
        let r = rng() * total;
        let choisi = dispo[dispo.length - 1];
        for (const k of dispo) {
            r -= poids[k] ?? 0.1;
            if (r < 0) { choisi = k; break; }
        }
        res.push(restes.get(choisi).pop());
    }
    return res;
}

// Distance de Levenshtein (insertions, suppressions, substitutions).
export function distanceEdition(a, b) {
    const prec = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        let diag = prec[0];
        prec[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = prec[j];
            prec[j] = Math.min(prec[j] + 1, prec[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
            diag = tmp;
        }
    }
    return prec[b.length];
}

const norm = t => String(t ?? '').trim().toLowerCase();

// `n` leurres pour `mot`, pris dans `banque`, par ordre de priorité :
// même thème et (même niveau ou orthographe proche), puis même thème,
// puis orthographe proche, puis le reste. Jamais un mot qui aurait le même
// anglais, le même français ou le même emoji que le bon mot ou qu'un autre leurre.
export function leurresProches(mot, banque, n, rng = Math.random) {
    const proche = m => distanceEdition(norm(m.en), norm(mot.en)) <= 3;
    const rang = m => {
        if (m.theme === mot.theme && (m.niveau === mot.niveau || proche(m))) return 0;
        if (m.theme === mot.theme) return 1;
        if (proche(m)) return 2;
        return 3;
    };
    const tries = shuffle(banque, rng).map(m => [rang(m), m]).sort((x, y) => x[0] - y[0]);
    const vus = new Set([norm(mot.en), norm(mot.fr), mot.emoji]);
    const res = [];
    for (const [, m] of tries) {
        if (res.length === n) break;
        if (vus.has(norm(m.en)) || vus.has(norm(m.fr)) || (m.emoji && vus.has(m.emoji))) continue;
        vus.add(norm(m.en)); vus.add(norm(m.fr)); if (m.emoji) vus.add(m.emoji);
        res.push(m);
    }
    return res;
}
```

- [ ] **Step 4:** test → PASS ; suite + lint.
- [ ] **Step 5: Commit** — `feat(challenge): tirage par niveau et leurres proches`

---

### Task 2: L'heure en anglais

**Goal:** Module pur `heure.js` : `heureEnAnglais(h, m)`, `qHeure(rng)` (QCM avec 3 leurres pièges), `horlogeSVG(h, m)`.

**Files:**
- Create: `challenge/js/heure.js`
- Test: `challenge/test/heure.test.js`

**Acceptance Criteria:**
- [ ] `heureEnAnglais` : (3,0) « It's three o'clock. » ; (7,15) « It's quarter past seven. » ; (6,30) « It's half past six. » ; (7,40) « It's twenty to eight. » ; (12,45) « It's quarter to one. » ; (11,55) « It's five to twelve. » ; (9,25) « It's twenty-five past nine. » ; (4,35) « It's twenty-five to five. ».
- [ ] Les 144 combinaisons (h 1-12, m multiple de 5) donnent 144 phrases distinctes.
- [ ] `qHeure(rng)` : 4 choix distincts, un seul juste (= `heureEnAnglais(h, m)`), `visuelSVG` commence par `<svg`, `cle` = `h:<h>:<m>`, consigne « What time is it? ».
- [ ] `horlogeSVG(3, 0)` : aiguille des minutes vers 12 (angle 0), des heures vers 3 (angle 90°) ; `horlogeSVG(6, 30)` : heures à 195°.

**Verify:** `node --test challenge/test/heure.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Test**

```js
// challenge/test/heure.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heureEnAnglais, qHeure, horlogeSVG, anglesAiguilles } from '../js/heure.js';
import { mulberry32 } from '../js/rng.js';

test('expressions britanniques', () => {
    assert.equal(heureEnAnglais(3, 0), "It's three o'clock.");
    assert.equal(heureEnAnglais(7, 15), "It's quarter past seven.");
    assert.equal(heureEnAnglais(6, 30), "It's half past six.");
    assert.equal(heureEnAnglais(7, 40), "It's twenty to eight.");
    assert.equal(heureEnAnglais(12, 45), "It's quarter to one.");
    assert.equal(heureEnAnglais(11, 55), "It's five to twelve.");
    assert.equal(heureEnAnglais(9, 25), "It's twenty-five past nine.");
    assert.equal(heureEnAnglais(4, 35), "It's twenty-five to five.");
    assert.equal(heureEnAnglais(1, 5), "It's five past one.");
});

test('144 heures, 144 phrases différentes', () => {
    const s = new Set();
    for (let h = 1; h <= 12; h++) for (let m = 0; m < 60; m += 5) s.add(heureEnAnglais(h, m));
    assert.equal(s.size, 144);
});

test('qHeure : 4 choix distincts, un seul juste', () => {
    for (let g = 1; g <= 300; g++) {
        const q = qHeure(mulberry32(g));
        const [, h, m] = q.cle.split(':').map(Number);
        assert.equal(q.consigne, 'What time is it?');
        assert.ok(q.visuelSVG.startsWith('<svg'));
        assert.equal(q.choix.length, 4);
        assert.equal(new Set(q.choix.map(c => c.texte)).size, 4);
        assert.equal(q.choix.filter(c => c.juste).length, 1);
        assert.equal(q.choix.find(c => c.juste).texte, heureEnAnglais(h, m));
    }
});

test('angles des aiguilles', () => {
    assert.deepEqual(anglesAiguilles(3, 0), { heures: 90, minutes: 0 });
    assert.deepEqual(anglesAiguilles(6, 30), { heures: 195, minutes: 180 });
    assert.deepEqual(anglesAiguilles(12, 45), { heures: 22.5, minutes: 270 });
    assert.ok(horlogeSVG(3, 0).includes('rotate(90'));
});
```

- [ ] **Step 2:** test → FAIL.

- [ ] **Step 3: Implémenter**

```js
// challenge/js/heure.js
// « What time is it? » : l'heure à l'anglaise (o'clock, quarter past, twenty to…)
// et une horloge dessinée en SVG.
import { shuffle, pick } from './rng.js';

const NOMBRES = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve'];
const MINUTES = { 5: 'five', 10: 'ten', 15: 'quarter', 20: 'twenty', 25: 'twenty-five', 30: 'half' };

const heureSuivante = h => (h === 12 ? 1 : h + 1);
const heurePrecedente = h => (h === 1 ? 12 : h - 1);

// h de 1 à 12, m multiple de 5 entre 0 et 55.
export function heureEnAnglais(h, m) {
    if (m === 0) return `It's ${NOMBRES[h]} o'clock.`;
    if (m <= 30) return `It's ${MINUTES[m]} past ${NOMBRES[h]}.`;
    return `It's ${MINUTES[60 - m]} to ${NOMBRES[heureSuivante(h)]}.`;
}

// Leurres pièges : past/to inversés, heure d'à côté, minutes en miroir ou voisines.
function leurresHeure(h, m, rng) {
    const juste = heureEnAnglais(h, m);
    const candidats = [];
    if (m > 0 && m < 30) candidats.push(`It's ${MINUTES[m]} to ${NOMBRES[h]}.`);
    if (m > 30) candidats.push(`It's ${MINUTES[60 - m]} past ${NOMBRES[h]}.`);
    candidats.push(heureEnAnglais(heureSuivante(h), m), heureEnAnglais(heurePrecedente(h), m));
    if (m !== 0 && m !== 30) candidats.push(heureEnAnglais(h, 60 - m));
    for (const d of [5, 10, -5, -10]) {
        const m2 = m + d;
        if (m2 >= 0 && m2 < 60) candidats.push(heureEnAnglais(h, m2));
    }
    const vus = new Set([juste]);
    return shuffle(candidats, rng).filter(t => !vus.has(t) && vus.add(t)).slice(0, 3);
}

export function anglesAiguilles(h, m) {
    return { heures: (h % 12) * 30 + m * 0.5, minutes: m * 6 };
}

export function horlogeSVG(h, m) {
    const { heures, minutes } = anglesAiguilles(h, m);
    const graduations = Array.from({ length: 12 }, (_, i) => {
        const a = i * 30;
        return `<line x1="100" y1="18" x2="100" y2="${i % 3 === 0 ? 34 : 28}" stroke="#334155" stroke-width="${i % 3 === 0 ? 4 : 2}" transform="rotate(${a} 100 100)"/>`;
    }).join('');
    const chiffres = Array.from({ length: 12 }, (_, i) => {
        const n = i + 1, a = (n * 30 - 90) * Math.PI / 180;
        return `<text x="${(100 + 62 * Math.cos(a)).toFixed(1)}" y="${(100 + 62 * Math.sin(a) + 7).toFixed(1)}" text-anchor="middle" font-size="20" font-family="sans-serif" font-weight="bold" fill="#1e293b">${n}</text>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="horloge">
<circle cx="100" cy="100" r="92" fill="#fff" stroke="#1e3a8a" stroke-width="8"/>
${graduations}${chiffres}
<line x1="100" y1="100" x2="100" y2="52" stroke="#1e293b" stroke-width="8" stroke-linecap="round" transform="rotate(${heures} 100 100)"/>
<line x1="100" y1="100" x2="100" y2="28" stroke="#dc2626" stroke-width="5" stroke-linecap="round" transform="rotate(${minutes} 100 100)"/>
<circle cx="100" cy="100" r="7" fill="#1e293b"/>
</svg>`;
}

export function qHeure(rng = Math.random) {
    const h = 1 + Math.floor(rng() * 12);
    const m = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], rng);
    const juste = heureEnAnglais(h, m);
    const choix = shuffle([{ texte: juste, juste: true },
        ...leurresHeure(h, m, rng).map(t => ({ texte: t, juste: false }))], rng);
    return { cle: `h:${h}:${m}`, consigne: 'What time is it?', visuelSVG: horlogeSVG(h, m), choix };
}
```

Note : les graduations utilisent `rotate(` pour les angles multiples de 30 ; le test `includes('rotate(90')` vise l'aiguille des heures à 90° (et la graduation de 3 h, ce qui est cohérent).

- [ ] **Step 4:** test → PASS ; suite + lint.
- [ ] **Step 5: Commit** — `feat(challenge): l'heure en anglais et l'horloge`

---

### Task 3: Mode « vies » (Survie)

**Goal:** `creerPartieQcm(questions, { duree, vies })` : avec `vies`, chaque mauvaise réponse retire une vie et la partie se termine à 0 vie (après `suivante()`).

**Files:**
- Modify: `challenge/js/partie.js`
- Test: `challenge/test/partie.test.js` (ajouts)

**Acceptance Criteria:**
- [ ] Sans `vies`, comportement v1 inchangé (`e.vies === null`).
- [ ] Avec `vies: 3` : 3 mauvaises réponses → `e.vies === 0`, `suivante()` → `terminee === true` même s'il reste des questions.
- [ ] Une bonne réponse ne change pas `vies` ; `repondre` renvoie aussi `vies` (restantes).
- [ ] Questions épuisées avant 0 vie → `terminee` comme en v1.

**Verify:** `node --test challenge/test/partie.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Test (ajouter)**
> Note : `partie.test.js` importe déjà des fonctions de `partie.js` en tête de fichier ; **fusionner** les nouveaux noms dans l'import existant (deux imports du même nom = erreur de syntaxe).

```js
import { creerPartieQcm, repondre, suivante } from '../js/partie.js';
const qv = (bonne) => ({ consigne: '?', choix: [0, 1, 2, 3].map(i => ({ texte: `r${i}`, juste: i === bonne })) });

test('survie : 3 vies, fin à 0', () => {
    const e = creerPartieQcm(Array.from({ length: 20 }, () => qv(0)), { vies: 3 });
    assert.equal(e.vies, 3);
    assert.equal(repondre(e, 0, 1000).vies, 3); suivante(e);
    for (let i = 0; i < 3; i++) { repondre(e, 1, 1000); if (i < 2) suivante(e); }
    assert.equal(e.vies, 0);
    assert.equal(e.terminee, false);
    suivante(e);
    assert.equal(e.terminee, true);
    assert.equal(e.bonnes, 1);
});

test('sans vies : comportement v1', () => {
    const e = creerPartieQcm([qv(0), qv(0)]);
    assert.equal(e.vies, null);
    repondre(e, 1, 1000); suivante(e);
    assert.equal(e.terminee, false);
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implémenter** — dans `creerPartieQcm`, ajouter `vies` (défaut `null`) à l'état ; dans `repondre`, `if (!juste && e.vies != null) e.vies = Math.max(0, e.vies - 1);` et renvoyer `vies: e.vies` ; dans `suivante`, après l'incrément : `if (e.vies === 0) e.terminee = true;`.
- [ ] **Step 4:** PASS ; suite + lint.
- [ ] **Step 5: Commit** — `feat(challenge): mode vies pour la survie`

---

### Task 4: Contrôleurs relier, pendu, lettres

**Goal:** Trois contrôleurs purs dans `partie.js` (même forme que les phrases : `points`, `bonnes`, `repondues`, `attente`, `terminee`, `index`, `questions`, et `suivante()` partagée), compatibles avec `resultat(e)`.

**Files:**
- Modify: `challenge/js/partie.js`
- Test: `challenge/test/partie.test.js` (ajouts)

**Acceptance Criteria:**
- [ ] **Relier** : `creerPartieRelier(manches)` (manche = `{ paires: [{ en, fr }], gauche: [en…], droite: [fr…] }`) ; `choisirGauche(e, i)` puis `choisirDroite(e, j)` → `{ juste, points }` ; paire juste : 10 pts si cette ligne n'a jamais été ratée, 5 sinon ; erreur → sélection annulée, `{ juste: false }` ; manche complète → `attente = true` ; `bonnes` = paires justes du 1er coup ; `repondues` = paires.
- [ ] **Pendu** : `creerPartiePendu(mots)` (mot = `{ en, fr, emoji? }`) ; `proposer(e, touche)` → `'ignoree' | 'deja' | 'bonne' | 'mauvaise'` ; casse ignorée ; seules a-z comptent (accents, chiffres, espace → `'ignoree'`, pas d'erreur) ; `masque(e)` → tableau des caractères affichés (`_` pour une lettre cachée, espaces/tirets/apostrophes visibles d'office) ; mot trouvé → `10 + 2 × (7 − erreurs)` ; 7 erreurs → perdu, 0 pt ; dans les deux cas `attente = true`.
- [ ] **Lettres** : `creerPartieLettres(mots)` (mot = `{ en, fr, melange: [lettres…] }`) ; `taper(e, i)` (i = tuile), `effacer(e)` ; quand la réponse a la longueur du mot, vérification automatique : juste (comparaison des LETTRES, pas des tuiles) → 10 pts sans erreur, 5 sinon ; faux → `erreurs++`, réponse vidée, `{ juste: false }` ; 3ᵉ erreur → solution révélée, 0 pt.
- [ ] `suivante()` remet à zéro l'état propre à chaque contrôleur.

**Verify:** `node --test challenge/test/partie.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Tests (ajouter)**
> Note : `partie.test.js` importe déjà des fonctions de `partie.js` en tête de fichier ; **fusionner** les nouveaux noms dans l'import existant (deux imports du même nom = erreur de syntaxe).

```js
import { creerPartieRelier, choisirGauche, choisirDroite,
    creerPartiePendu, proposer, masque,
    creerPartieLettres, taper, effacer, suivante as suivanteP, resultat } from '../js/partie.js';

test('relier : 10 au 1er coup, 5 après une erreur, manche finie', () => {
    const manche = { paires: [{ en: 'dog', fr: 'chien' }, { en: 'cat', fr: 'chat' }],
        gauche: ['dog', 'cat'], droite: ['chat', 'chien'] };
    const e = creerPartieRelier([manche]);
    choisirGauche(e, 0);
    assert.deepEqual(choisirDroite(e, 0), { juste: false });   // dog-chat
    choisirGauche(e, 0);
    assert.deepEqual(choisirDroite(e, 1), { juste: true, points: 5 });
    choisirGauche(e, 1);
    assert.deepEqual(choisirDroite(e, 0), { juste: true, points: 10 });
    assert.equal(e.attente, true);
    assert.deepEqual(resultat(e), { bonnes: 1, repondues: 2, points: 15 });
    suivanteP(e);
    assert.equal(e.terminee, true);
});

test('pendu : casse, touches ignorées, espace et tiret visibles', () => {
    const e = creerPartiePendu([{ en: 'T-shirt', fr: 't-shirt' }, { en: 'ice cream', fr: 'glace' }]);
    assert.deepEqual(masque(e), ['_', '-', '_', '_', '_', '_', '_']);
    assert.equal(proposer(e, 'é'), 'ignoree');
    assert.equal(proposer(e, '3'), 'ignoree');
    assert.equal(proposer(e, 'T'), 'bonne');
    assert.equal(proposer(e, 't'), 'deja');
    assert.equal(e.erreurs, 0);
    for (const l of 'shir') proposer(e, l);
    assert.equal(e.attente, true);
    assert.equal(e.points, 10 + 2 * 7);
    suivanteP(e);
    assert.deepEqual(masque(e), ['_', '_', '_', ' ', '_', '_', '_', '_', '_']);
});

test('pendu : 7 erreurs = perdu', () => {
    const e = creerPartiePendu([{ en: 'cat', fr: 'chat' }]);
    for (const l of 'bdefghi') proposer(e, l);
    assert.equal(e.erreurs, 7);
    assert.equal(e.attente, true);
    assert.equal(e.points, 0);
    assert.equal(proposer(e, 'c'), 'ignoree');
});

test('lettres : lettres répétées interchangeables, erreurs', () => {
    const e = creerPartieLettres([{ en: 'apple', fr: 'pomme', melange: ['p', 'l', 'a', 'p', 'e'] }]);
    for (const i of [2, 3, 0, 1, 4]) taper(e, i);        // a p p l e (tuiles p échangées)
    assert.equal(e.points, 10);
    assert.equal(e.attente, true);
    const f = creerPartieLettres([{ en: 'cat', fr: 'chat', melange: ['t', 'a', 'c'] }]);
    taper(f, 0); taper(f, 1);
    effacer(f);
    assert.deepEqual(f.reponse, ['t']);
    assert.deepEqual(taper(f, 2), null);                 // 't','c' : pas encore complet ? (2 lettres sur 3)
    assert.deepEqual(taper(f, 1), { juste: false });     // t c a
    for (const i of [2, 1, 0]) taper(f, i);              // c a t
    assert.equal(f.points, 5);
});
```

(`taper` renvoie `null` tant que la réponse n'est pas complète, `{ juste: false }` sur un essai faux, `{ juste: true, points }` sur un essai juste, `{ juste: false, points: 0, solution }` au 3ᵉ échec. Une tuile déjà utilisée renvoie `null` sans effet.)

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implémenter** (à la suite de `partie.js`)

```js
// --- Relier ---

export function creerPartieRelier(manches) {
    return { questions: manches, index: 0, points: 0, bonnes: 0, repondues: 0,
        gaucheChoisie: null, faites: [], ratees: [], attente: false, terminee: manches.length === 0 };
}

export function choisirGauche(e, i) {
    if (e.attente || e.faites.includes(i)) return;
    e.gaucheChoisie = i;
}

export function choisirDroite(e, j) {
    if (e.attente || e.gaucheChoisie == null) return null;
    const m = e.questions[e.index];
    const i = e.gaucheChoisie;
    e.gaucheChoisie = null;
    const paire = m.paires.find(p => p.en === m.gauche[i]);
    if (paire.fr !== m.droite[j]) {
        if (!e.ratees.includes(i)) e.ratees.push(i);
        return { juste: false };
    }
    const points = e.ratees.includes(i) ? 5 : 10;
    e.faites.push(i);
    e.points += points;
    e.repondues++;
    if (!e.ratees.includes(i)) e.bonnes++;
    if (e.faites.length === m.paires.length) e.attente = true;
    return { juste: true, points };
}

// --- Pendu ---

export const ERREURS_MAX = 7;
const estLettre = c => /^[a-z]$/.test(c);

export function creerPartiePendu(mots) {
    return { questions: mots, index: 0, points: 0, bonnes: 0, repondues: 0,
        trouvees: [], ratees: [], erreurs: 0, attente: false, terminee: mots.length === 0 };
}

export function masque(e) {
    return [...e.questions[e.index].en].map(c => {
        const l = c.toLowerCase();
        if (!estLettre(l)) return c;
        return e.trouvees.includes(l) ? c : '_';
    });
}

export function proposer(e, touche) {
    if (e.attente || e.terminee) return 'ignoree';
    const l = String(touche).toLowerCase();
    if (!estLettre(l)) return 'ignoree';
    if (e.trouvees.includes(l) || e.ratees.includes(l)) return 'deja';
    const mot = e.questions[e.index].en.toLowerCase();
    if (mot.includes(l)) {
        e.trouvees.push(l);
        if (!masque(e).includes('_')) {
            const points = 10 + 2 * (ERREURS_MAX - e.erreurs);
            e.points += points;
            e.bonnes++;
            e.repondues++;
            e.attente = true;
        }
        return 'bonne';
    }
    e.ratees.push(l);
    e.erreurs++;
    if (e.erreurs >= ERREURS_MAX) {
        e.repondues++;
        e.attente = true;
    }
    return 'mauvaise';
}

// --- Lettres mélangées ---

export const ESSAIS_LETTRES = 3;

export function creerPartieLettres(mots) {
    return { questions: mots, index: 0, points: 0, bonnes: 0, repondues: 0,
        reponse: [], tuiles: [], erreursMot: 0, attente: false, terminee: mots.length === 0 };
}

export function taper(e, i) {
    if (e.attente || e.tuiles.includes(i)) return null;
    const mot = e.questions[e.index];
    e.tuiles.push(i);
    e.reponse.push(mot.melange[i]);
    if (e.reponse.length < mot.en.length) return null;
    if (e.reponse.join('').toLowerCase() === mot.en.toLowerCase()) {
        const points = e.erreursMot === 0 ? 10 : 5;
        e.points += points;
        if (e.erreursMot === 0) e.bonnes++;
        e.repondues++;
        e.attente = true;
        return { juste: true, points };
    }
    e.erreursMot++;
    e.reponse = [];
    e.tuiles = [];
    if (e.erreursMot >= ESSAIS_LETTRES) {
        e.repondues++;
        e.attente = true;
        return { juste: false, points: 0, solution: mot.en };
    }
    return { juste: false };
}

export function effacer(e) {
    if (e.attente) return;
    e.tuiles.pop();
    e.reponse.pop();
}
```

Et remplacer `suivante` pour remettre à zéro l'état de chaque contrôleur :

```js
// Sert à tous les types de partie : remet à zéro l'état propre à la question.
export function suivante(e) {
    e.attente = false;
    e.index++;
    if ('essai' in e) { e.essai = 1; e.reponse = []; e.utilises = []; }
    if ('faites' in e) { e.faites = []; e.ratees = []; e.gaucheChoisie = null; }
    if ('trouvees' in e) { e.trouvees = []; e.ratees = []; e.erreurs = 0; }
    if ('tuiles' in e) { e.reponse = []; e.tuiles = []; e.erreursMot = 0; }
    if (e.index >= e.questions.length || e.vies === 0) e.terminee = true;
}
```

Attention : `bonnes` de Lettres compte les mots trouvés sans erreur ; le test « 5 points » le reflète.

- [ ] **Step 4:** PASS ; suite + lint.
- [ ] **Step 5: Commit** — `feat(challenge): contrôleurs relier, pendu et lettres`

---

### Task 5: Vocabulaire v2 (niveaux, mots durs, nouveaux thèmes)

**Goal:** `vocab.js` : champ `niveau` sur tous les mots, ≥ 450 mots, ≥ 20 thèmes, champ `polyvalent` pour les mots à double sens de famille.

**Files:**
- Modify: `challenge/js/donnees/vocab.js`, `challenge/test/donnees.test.js`
- Regénérer ensuite l'audio des nouveaux mots image (Task 8 s'en charge ; ne pas lancer ici).

**Acceptance Criteria:**
- [ ] `VOCAB.length >= 450`, `THEMES_VOCAB.length >= 20` ; nouveaux thèmes au moins : `metiers`, `sentiments`, `ville`, `nature`, `verbes`, `adjectifs`, `cuisine` (en plus des 13 existants).
- [ ] Chaque mot : `{ en, fr, emoji, theme, image, niveau }` (+ `polyvalent: true` optionnel) ; `en` unique (casse ignorée) ; au sein d'un thème, `fr` unique.
- [ ] Répartition : ≥ 30 % de niveau 3, ≥ 35 % de niveau 2.
- [ ] Toujours ≥ 4 mots `image: true` par thème… sauf `verbes` et `adjectifs` (pas d'image requise) ; emojis d'image uniques.
- [ ] Verbes à l'infinitif sans « to » dans `en` (`borrow`), `fr` à l'infinitif (`emprunter`).
- [ ] `polyvalent: true` sur tout mot qui appartient naturellement à deux familles (*orange*, *chicken*, *watch*, *glasses*, *bat*, *fan*…).
- [ ] Les items v1 gardent leur `en` (les sauvegardes n'en dépendent pas, mais les fichiers audio si).

**Verify:** `node --test challenge/test/` → `# fail 0`

**Steps:**

- [ ] **Step 1: Test (remplacer les tests vocab de `donnees.test.js`)**

```js
test('vocabulaire v2 : volume, thèmes, niveaux', () => {
    assert.ok(VOCAB.length >= 450, `${VOCAB.length} mots`);
    assert.ok(THEMES_VOCAB.length >= 20);
    for (const t of ['metiers', 'sentiments', 'ville', 'nature', 'verbes', 'adjectifs', 'cuisine']) {
        assert.ok(THEMES_VOCAB.includes(t), t);
    }
    assert.equal(new Set(VOCAB.map(m => m.en.toLowerCase())).size, VOCAB.length);
    for (const m of VOCAB) {
        assert.ok(m.en && m.fr && m.emoji && THEMES_VOCAB.includes(m.theme), JSON.stringify(m));
        assert.ok([1, 2, 3].includes(m.niveau), JSON.stringify(m));
        assert.equal(typeof m.image, 'boolean');
        assert.ok(!/^to /.test(m.en), m.en);
    }
    const part = n => VOCAB.filter(m => m.niveau === n).length / VOCAB.length;
    assert.ok(part(3) >= 0.3 && part(2) >= 0.35, `${part(2)} / ${part(3)}`);
    for (const t of THEMES_VOCAB) {
        const fr = VOCAB.filter(m => m.theme === t).map(m => m.fr.toLowerCase());
        assert.equal(new Set(fr).size, fr.length, `fr en double dans ${t}`);
    }
});

test('vocabulaire v2 : images', () => {
    const images = VOCAB.filter(m => m.image);
    assert.equal(new Set(images.map(m => m.emoji)).size, images.length);
    for (const t of THEMES_VOCAB.filter(x => !['verbes', 'adjectifs'].includes(x))) {
        assert.ok(images.filter(m => m.theme === t).length >= 4, `thème ${t}`);
    }
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Écrire les données.** Ajouter `niveau` aux mots v1 (1 pour les mots de base, 2 pour les moins courants comme *lorry, scarf, umbrella*…). Ajouter ≥ 234 mots : thèmes v1 complétés (maison : *cupboard, dishwasher, ceiling, stairs, fridge, cooker, sink, pillow, curtains…* ; animaux : *squirrel, hedgehog, owl, whale, bee…* ; école : *timetable, rubber, pencil case, homework…*), et nouveaux thèmes (`metiers` : *firefighter, nurse, baker, farmer, vet…* ; `sentiments` : *proud, scared, bored, angry, worried, jealous…* ; `ville` : *neighbour, library, bakery, butcher's, chemist's, town hall, roundabout…* ; `nature` : *forest, river, mountain, leaf, beach, cliff, field…* ; `verbes` : *borrow, climb, forget, wake up, look for, laugh, build…* ; `adjectifs` : *expensive, cheap, noisy, quiet, dangerous, empty, full, wide…* ; `cuisine` : *spoon, fork, knife, plate, bowl, saucepan, oven…*). Emojis : uniquement des emojis Unicode ≤ 13 pour les `image: true` ; pour les mots sans image fiable, un emoji approximatif et `image: false`.
- [ ] **Step 4:** PASS ; relire (orthographe britannique, traductions, unicité des emojis d'image, `polyvalent`).
- [ ] **Step 5: Commit** — `feat(challenge): vocabulaire v2 (niveaux, mots durs, 7 nouveaux thèmes)`

---

### Task 6a: Grammaire v2 et pièges

**Goal:** `grammaire.js` avec `niveau` et ≥ 220 QCM (grammaire de grands) ; nouvelle banque `pieges.js` (≥ 80 QCM).

**Files:**
- Modify: `challenge/js/donnees/grammaire.js`, `challenge/test/donnees.test.js`
- Create: `challenge/js/donnees/pieges.js`

**Acceptance Criteria:**
- [ ] `GRAMMAIRE.length >= 220`, chaque item `{ theme, question, bonne, leurres: [3], niveau }`, exactement un `_` dans `question`, 4 réponses distinctes ; ≥ 24 thèmes.
- [ ] Nouveaux thèmes au moins : `passé be`, `passé réguliers`, `passé irréguliers`, `did`, `comparatifs`, `superlatifs`, `going to`, `must`, `some/any`, `much/many`, `présent ou -ing`, `there was/were`, `could`, `pronoms compléments`, `whose`, `prépositions de temps`.
- [ ] Leurres de grammaire « pièges » : formes proches du même mot (*went / goed / go / gone*, *bigger / more big / biggest / big*).
- [ ] `PIEGES.length >= 80`, même format (thème = la paire piégée, ex. `their/there/they're`), ≥ 15 thèmes de pièges (homophones et faux amis : *library ≠ librairie*, *actually ≠ actuellement*, *sensible ≠ sensible*…). Pour les faux amis, la question est en français (« Comment dit-on « bibliothèque » ? ») ou une phrase à trou en anglais.
- [ ] ≥ 35 % de niveau 3 dans chacune des deux banques.

**Verify:** `node --test challenge/test/donnees.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Test**

```js
import { PIEGES } from '../js/donnees/pieges.js';

function verifierNiveaux(items, nom) {
    for (const q of items) assert.ok([1, 2, 3].includes(q.niveau), `${nom} : ${q.question}`);
    assert.ok(items.filter(q => q.niveau === 3).length / items.length >= 0.35, `${nom} : niveau 3`);
}

test('grammaire v2 : 220 QCM, 24 thèmes, niveaux, un seul trou', () => {
    verifierQcm(GRAMMAIRE, 220, 24);
    verifierNiveaux(GRAMMAIRE, 'grammaire');
    for (const t of ['passé be', 'passé réguliers', 'passé irréguliers', 'did', 'comparatifs', 'superlatifs',
        'going to', 'must', 'some/any', 'much/many', 'présent ou -ing', 'there was/were', 'could',
        'pronoms compléments', 'whose', 'prépositions de temps']) {
        assert.ok(GRAMMAIRE.some(q => q.theme === t), t);
    }
    for (const q of GRAMMAIRE) assert.equal(q.question.split('_').length - 1, 1, q.question);
});

test('pièges : 80 QCM, 15 thèmes, niveaux', () => {
    verifierQcm(PIEGES, 80, 15);
    verifierNiveaux(PIEGES, 'pièges');
});
```

(`verifierQcm` existe déjà dans ce fichier.)

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Écrire les données** (garder les 97 items v1 en leur ajoutant un `niveau`).
- [ ] **Step 4:** PASS ; relire chaque item (une seule réponse possible, leurres réellement faux, anglais britannique).
- [ ] **Step 5: Commit** — `feat(challenge): grammaire de grands et réponses pièges`

---

### Task 6b: Culture et phrases v2

**Goal:** `culture.js` (niveau, ≥ 110) et `phrases.js` (niveau, ≥ 100, phrases plus longues).

**Files:**
- Modify: `challenge/js/donnees/culture.js`, `challenge/js/donnees/phrases.js`, `challenge/test/donnees.test.js`

**Acceptance Criteria:**
- [ ] `CULTURE.length >= 110`, `niveau` partout, ≥ 35 % de niveau 3, thèmes ⊂ `uk, usa, londres, fetes, drapeaux, royaute, nourriture, pays, histoire, litterature, sport, symboles` (≥ 10 utilisés) ; réponses ≤ 28 caractères.
- [ ] `PHRASES.length >= 100`, `niveau` partout, 3 à 9 mots, sans mot répété (casse ignorée), majuscule initiale et ponctuation finale, un seul ordre correct ; ≥ 40 phrases de 6 mots ou plus ; passé, questions, comparatifs présents.
- [ ] Traductions françaises uniques (`fr` distinct pour chaque phrase — elles servent de choix dans « J'écoute des phrases »).

**Verify:** `node --test challenge/test/donnees.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Test** — adapter les tests v1 : `verifierQcm(CULTURE, 110, 10, THEMES_CULTURE)` + `verifierNiveaux` + longueur des réponses ≤ 28 ; phrases : 100, 3-9 mots, regex `^[A-Z].*[.?!]$`, mots uniques, `fr` uniques, ≥ 40 de 6 mots et plus, `niveau`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Données** (garder les items v1 + `niveau`).
- [ ] **Step 4:** PASS ; relire les faits et l'unicité de l'ordre.
- [ ] **Step 5: Commit** — `feat(challenge): culture et phrases plus difficiles`

---

### Task 6c: Vrai ou faux et contraires

**Goal:** Nouvelles banques `vraifaux.js` (≥ 120 affirmations) et `contraires.js` (≥ 70 paires).

**Files:**
- Create: `challenge/js/donnees/vraifaux.js`, `challenge/js/donnees/contraires.js`
- Modify: `challenge/test/donnees.test.js`

**Acceptance Criteria:**
- [ ] `VRAIFAUX` : `{ en, vrai, niveau, explication }` ; `en` = phrase anglaise (majuscule, point final) ; 40-60 % de vraies ; ≥ 35 % de niveau 3 ; `explication` en français courte (affichée après réponse) ; affirmations vérifiables, sans ambiguïté (pas d'opinion), pièges de vocabulaire (*A whale is a fish.* → faux).
- [ ] `CONTRAIRES` : `{ a, b, fr_a, fr_b, niveau }` ; aucun mot n'apparaît dans deux paires ; `a !== b` ; couverture adjectifs (*expensive/cheap*), verbes (*open/close*, *win/lose*), prépositions (*inside/outside*) ; ≥ 35 % de niveau 3.

**Verify:** `node --test challenge/test/donnees.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Test**

```js
import { VRAIFAUX } from '../js/donnees/vraifaux.js';
import { CONTRAIRES } from '../js/donnees/contraires.js';

test('vrai ou faux : 120, équilibré, explications', () => {
    assert.ok(VRAIFAUX.length >= 120);
    const vrais = VRAIFAUX.filter(v => v.vrai).length / VRAIFAUX.length;
    assert.ok(vrais >= 0.4 && vrais <= 0.6, `part de vrai ${vrais}`);
    assert.equal(new Set(VRAIFAUX.map(v => v.en)).size, VRAIFAUX.length);
    for (const v of VRAIFAUX) {
        assert.match(v.en, /^[A-Z].*[.!]$/, v.en);
        assert.equal(typeof v.vrai, 'boolean');
        assert.ok(v.explication && [1, 2, 3].includes(v.niveau), v.en);
    }
    assert.ok(VRAIFAUX.filter(v => v.niveau === 3).length / VRAIFAUX.length >= 0.35);
});

test('contraires : 70 paires, mots uniques', () => {
    assert.ok(CONTRAIRES.length >= 70);
    const mots = CONTRAIRES.flatMap(c => [c.a.toLowerCase(), c.b.toLowerCase()]);
    assert.equal(new Set(mots).size, mots.length);
    for (const c of CONTRAIRES) assert.ok(c.fr_a && c.fr_b && [1, 2, 3].includes(c.niveau), c.a);
    assert.ok(CONTRAIRES.filter(c => c.niveau === 3).length / CONTRAIRES.length >= 0.35);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** Données. **Step 4:** PASS ; relecture. **Step 5: Commit** — `feat(challenge): banques vrai ou faux et contraires`

---

### Task 7: Les 16 jeux (générateurs)

**Goal:** `jeux.js` v2 : `JEUX` (16 entrées avec `famille`), anciens jeux plus durs (tirage par niveau, leurres proches, pièges), 10 nouveaux générateurs.

**Files:**
- Modify: `challenge/js/jeux.js`, `challenge/test/jeux.test.js`

**Acceptance Criteria:**
- [ ] `JEUX` : 16 ids et familles exactement comme dans les Global Constraints ; nouveaux types : `qcm` (vraifaux, intrus, contraires, heure, ecoutephrases, survie avec `vies: 3`, concours), `relier`, `pendu`, `lettres` ; chaque jeu a `nom`, `emoji`, `couleur`, `aide`.
- [ ] Tailles : quiz 15, image 10, ecoute 10, phrases 8, course 60, culture 10, relier 3 manches × 5 paires, vraifaux 15, intrus 10, contraires 12, heure 10, pendu 5, lettres 8, ecoutephrases 10, survie ≥ 150, concours 45.
- [ ] Tous les QCM : choix de textes distincts, une seule bonne réponse (vraifaux : 2 choix `✅ Vrai` / `❌ Faux` dans cet ordre, `explication` reprise dans la question) ; sur 200 graines par jeu.
- [ ] Anciens jeux : tirage par `tirerParNiveau`, leurres de vocabulaire par `leurresProches` ; la grammaire du quiz/de la course mélange `GRAMMAIRE` et `PIEGES` (quiz : 5 vocabulaire + 4 grammaire + 2 pièges + 4 culture).
- [ ] Intrus : 3 mots d'un thème + 1 d'un autre, thèmes pris dans `THEMES_INTRUS` (thèmes de noms bien distincts), aucun mot `polyvalent`, 4 `fr` distincts ; la bonne réponse est l'intrus (Review Focus 1).
- [ ] Contraires : consigne `Quel est le contraire de « a » ?` (ou de `b`, au hasard), bonne = l'autre mot, leurres = mots d'autres paires du même niveau si possible, jamais `a`/`b`.
- [ ] Heure : 10 × `qHeure`, heures distinctes.
- [ ] Écoute de phrases : `audio` = phrase anglaise, `slug` = `phrases/<slugAudio(en)>`, choix = 4 `fr` distincts.
- [ ] Survie : niveau 1 pour les questions 0-9, 2 pour 10-24, 3 ensuite ; types mélangés (traduction, grammaire, pièges, culture, contraires, heure, vrai/faux) ; pas de doublon de `cle` sur les 150 premières.
- [ ] Concours : 45 = 12 vocabulaire + 10 grammaire + 6 pièges + 7 culture + 4 heure + 3 contraires + 3 vrai/faux, mélangés, `cle` uniques.
- [ ] Relier : 3 manches de 5 paires, `en` et `fr` uniques sur la partie, `gauche`/`droite` mélangés (Review Focus 4).
- [ ] Pendu : 5 mots de niveau ≥ 2, 4 à 12 caractères, uniquement lettres/espace/tiret, `fr` (indice) et `emoji` si `image`.
- [ ] Lettres : 8 mots de niveau ≥ 2, 4 à 11 lettres a-z uniquement, `melange` ≠ mot.

**Verify:** `node --test challenge/test/jeux.test.js` → `# fail 0`

**Steps:**

- [ ] **Step 1: Tests** — étendre `jeux.test.js` :

```js
const ATTENDU = { quiz: 15, image: 10, ecoute: 10, phrases: 8, course: 60, culture: 10, relier: 3,
    vraifaux: 15, intrus: 10, contraires: 12, heure: 10, pendu: 5, lettres: 8, ecoutephrases: 10, concours: 45 };
const FAMILLES = { mots: ['image', 'relier', 'intrus', 'contraires', 'pendu', 'lettres'],
    grammaire: ['phrases', 'vraifaux', 'heure'], ecoute: ['ecoute', 'ecoutephrases'],
    defis: ['quiz', 'course', 'culture', 'survie', 'concours'] };

test('16 jeux et leurs familles', () => {
    assert.equal(JEUX.length, 16);
    for (const [f, ids] of Object.entries(FAMILLES)) {
        assert.deepEqual(JEUX.filter(j => j.famille === f).map(j => j.id).sort(), [...ids].sort());
    }
    assert.equal(JEUX.find(j => j.id === 'survie').vies, 3);
});

test('tailles des parties', () => {
    for (const [id, n] of Object.entries(ATTENDU)) assert.equal(genererPartie(id, mulberry32(1)).length, n, id);
    assert.ok(genererPartie('survie', mulberry32(1)).length >= 150);
});

test('tous les QCM : choix distincts, une bonne réponse (200 graines)', () => {
    for (const j of JEUX.filter(x => x.type === 'qcm')) {
        for (let g = 1; g <= 200; g++) {
            for (const q of genererPartie(j.id, mulberry32(g))) {
                assert.ok(q.choix.length >= 2);
                assert.equal(new Set(q.choix.map(c => c.texte)).size, q.choix.length, `${j.id} ${q.cle}`);
                assert.equal(q.choix.filter(c => c.juste).length, 1, `${j.id} ${q.cle}`);
            }
        }
    }
});

test('intrus : pas de mot polyvalent, un intrus d\'un autre thème', () => {
    for (let g = 1; g <= 200; g++) {
        for (const q of genererPartie('intrus', mulberry32(g))) {
            const mots = q.choix.map(c => VOCAB.find(m => m.en === c.texte));
            assert.ok(mots.every(m => m && !m.polyvalent));
            const intrus = mots[q.choix.findIndex(c => c.juste)];
            const autres = mots.filter(m => m !== intrus);
            assert.ok(autres.every(m => m.theme === autres[0].theme) && intrus.theme !== autres[0].theme);
            assert.equal(new Set(mots.map(m => m.fr)).size, 4);
        }
    }
});

test('relier : 3 manches de 5, mots et traductions uniques', () => {
    for (let g = 1; g <= 100; g++) {
        const ms = genererPartie('relier', mulberry32(g));
        const en = ms.flatMap(m => m.paires.map(p => p.en.toLowerCase()));
        const fr = ms.flatMap(m => m.paires.map(p => p.fr.toLowerCase()));
        assert.equal(new Set(en).size, 15);
        assert.equal(new Set(fr).size, 15);
        for (const m of ms) {
            assert.deepEqual([...m.gauche].sort(), m.paires.map(p => p.en).sort());
            assert.deepEqual([...m.droite].sort(), m.paires.map(p => p.fr).sort());
        }
    }
});

test('pendu et lettres : mots jouables', () => {
    for (let g = 1; g <= 100; g++) {
        for (const m of genererPartie('pendu', mulberry32(g))) {
            assert.match(m.en, /^[A-Za-z][A-Za-z -]{2,10}[A-Za-z]$/);
            assert.ok(m.fr);
        }
        for (const m of genererPartie('lettres', mulberry32(g))) {
            assert.match(m.en, /^[a-z]{4,11}$/i);
            assert.deepEqual([...m.melange].sort(), [...m.en.toLowerCase()].sort());
            assert.notEqual(m.melange.join(''), m.en.toLowerCase());
        }
    }
});

test('survie : niveaux croissants, pas de doublon', () => {
    const qs = genererPartie('survie', mulberry32(7));
    assert.equal(new Set(qs.slice(0, 150).map(q => q.cle)).size, 150);
    assert.ok(qs.slice(0, 10).every(q => q.niveau === 1));
    assert.ok(qs.slice(25, 60).every(q => q.niveau === 3));
});

test('écoute de phrases : slug et traductions', () => {
    for (const q of genererPartie('ecoutephrases', mulberry32(3))) {
        assert.equal(q.slug, `phrases/${slugAudio(q.audio)}`);
        assert.equal(new Set(q.choix.map(c => c.texte)).size, 4);
    }
});
```

Garder les tests v1 encore valides (slugAudio, image : emoji du mot juste…) et adapter ceux qui ne le sont plus (tailles déjà couvertes ci-dessus).

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implémenter** — principes (le code complet est à écrire dans `jeux.js`) :
  - Chaque question QCM porte `niveau` (celui de l'item source ; heure = 2, intrus/contraires = niveau de la paire/thème).
  - `JEUX` : ajouter `famille` aux 6 jeux v1 ; nouvelles entrées :
    `relier` 🔗 `#0d9488` type `relier` ; `vraifaux` ✅ `#65a30d` qcm ; `intrus` 🕵️ `#7c3aed` qcm ; `contraires` ↔️ `#db2777` qcm ; `heure` 🕒 `#0284c7` qcm ; `pendu` 🎈 `#e11d48` type `pendu` ; `lettres` 🔤 `#ca8a04` type `lettres` ; `ecoutephrases` 🎧 `#6d28d9` qcm ; `survie` ❤️ `#b91c1c` qcm `vies: 3` ; `concours` 🏆 `#1e40af` qcm. Aides courtes en français.
  - `THEMES_INTRUS = ['animaux', 'nourriture', 'couleurs', 'vetements', 'ecole', 'maison', 'transports', 'sports', 'metiers', 'nature', 'cuisine', 'corps']`.
  - Survie : `for (let i = 0; i < 150; i++)` → niveau `i < 10 ? 1 : i < 25 ? 2 : 3` ; générateur choisi en tourniquet parmi les 7 types ; item pris dans la banque filtrée sur ce niveau, sans répétition (ensemble des `cle` déjà utilisées ; si une banque est épuisée pour ce niveau, passer au type suivant).
  - Vrai/faux : `{ cle: 'vf:'+en, consigne: en, sousConsigne: 'Vrai ou faux ?', choix: [{ texte: '✅ Vrai', juste: vrai }, { texte: '❌ Faux', juste: !vrai }], explication, niveau }`.
  - Lettres : `melange = shuffle([...en.toLowerCase()])`, remélanger tant que égal au mot.
- [ ] **Step 4:** PASS ; suite + lint.
- [ ] **Step 5: Commit** — `feat(challenge): 16 jeux, questions plus dures`

---

### Task 8: Audio des nouveaux mots et des phrases

**Goal:** `liste-audio.mjs` liste aussi les phrases (`phrases/<slug>`), `gen-audio.sh` crée `audio/phrases/`, génération des nouveaux fichiers, test de correspondance étendu.

**Files:**
- Modify: `challenge/tools/liste-audio.mjs`, `challenge/tools/gen-audio.sh`, `challenge/test/audio.test.js`
- Create: `challenge/audio/*.ogg` (nouveaux mots image), `challenge/audio/phrases/*.ogg`

**Acceptance Criteria:**
- [ ] Un `.ogg` par mot `image: true` (dans `audio/`) et par phrase (dans `audio/phrases/`), aucun fichier orphelin (test).
- [ ] Réglages identiques à la v1 corrigée (`--length_scale 1.35`, 0,3 s de silence) ; fichiers déjà présents non régénérés.
- [ ] Taille totale de `challenge/audio/` ≤ 6 Mo ; un fichier de phrase ≤ 60 Ko.

**Verify:** `node --test challenge/test/audio.test.js && du -sh challenge/audio` → `# fail 0`, ≤ 6 Mo

**Steps:**
- [ ] **Step 1:** Test : étendre le test de correspondance aux phrases (`fs.readdirSync('challenge/audio/phrases')` = `PHRASES.map(p => slugAudio(p.en) + '.ogg')`).
- [ ] **Step 2:** `liste-audio.mjs` : ajouter `for (const p of PHRASES) console.log(`phrases/${slugAudio(p.en)}\t${p.en}`)`. `gen-audio.sh` : `mkdir -p /out/phrases` dans le conteneur (et `mkdir -p challenge/audio/phrases` côté hôte). Attention : le script inline est entre apostrophes, aucune apostrophe dans les commentaires qui s'y trouvent.
- [ ] **Step 3:** `challenge/tools/gen-audio.sh` ; supprimer les orphelins (mots retirés ou passés en `image: false`).
- [ ] **Step 4:** tests + lint ; `du -sh`.
- [ ] **Step 5: Commit** — `feat(challenge): prononciation des nouveaux mots et des phrases`

---

### Task 9: Écran QCM v2

**Goal:** `ui-qcm.js` affiche l'horloge (`visuelSVG`), les vies, l'explication du vrai/faux, utilise `q.slug` pour l'audio, et gère 2 choix.

**Files:**
- Modify: `challenge/js/ui-qcm.js`, `challenge/css/style.css`

**Acceptance Criteria:**
- [ ] `q.visuelSVG` (SVG généré par nous) affiché dans `.visuel` (innerHTML autorisé : aucune donnée utilisateur) ; taille 200 px, 160 px sous 520 px.
- [ ] `jeu.vies` : en-tête affiche `❤️❤️❤️` puis `❤️❤️🖤`… mis à jour après chaque réponse ; progression « Question n » (sans total) pour la survie.
- [ ] `q.slug ?? slugAudio(q.audio)` passé à `prononcer` ; repli texte = la phrase complète.
- [ ] Après une réponse à un vrai/faux, `q.explication` s'affiche sous les boutons pendant la pause (pause allongée à 2,5 s si explication).
- [ ] 2 choix : boutons sur une ligne (2 colonnes) même sur mobile.
- [ ] Concours : progression « 12/45 ».
- [ ] Captures headless (1280×800 et 390×844) : heure, vraifaux (avec explication), survie (vies), ecoutephrases, intrus, contraires, concours — relues.

**Verify:** captures relues + `node --test challenge/test/ && challenge/tools/lint.sh`

**Steps:**
- [ ] **Step 1:** Implémenter dans `ui-qcm.js` (lire le module ; garder le cycle de vie existant : `fermer()`, jetons, verrou).
- [ ] **Step 2:** CSS (`.visuel-svg svg`, `.vies`, `.explication`).
- [ ] **Step 3:** Captures via une page `challenge/_test-jeu.html?jeu=<id>` (ignorée par git), supprimée ensuite.
- [ ] **Step 4: Commit** — `feat(challenge): écran QCM pour l'heure, la survie et le vrai ou faux`

---

### Task 10: Écrans Relier, Pendu, Lettres

**Goal:** `ui-relier.js`, `ui-pendu.js`, `ui-lettres.js` : `lancerX(app, jeu, questions, { onFin, onQuitter })`, sur le modèle de `ui-phrases.js`.

**Files:**
- Create: `challenge/js/ui-relier.js`, `challenge/js/ui-pendu.js`, `challenge/js/ui-lettres.js`
- Create (si utile pour éviter une 4ᵉ copie de `creer`) : `challenge/js/ui-commun.js` (`creer`, `creerEntete`, `bonusVolant`) — et y faire pointer `ui-qcm.js`/`ui-phrases.js`
- Modify: `challenge/css/style.css`

**Acceptance Criteria:**
- [ ] **Relier** : deux colonnes (anglais | français), clic à gauche (surligné) puis à droite ; paire juste → les deux cartes deviennent vertes et inactives, son bon ; erreur → secousse rouge 400 ms, son faux ; manche finie → pause 1 s, manche suivante ; progression « Manche 2/3 ».
- [ ] **Pendu** : mot masqué en grandes cases, indice `fr` (+ emoji si présent), dessin de la montgolfière 🎈 qui perd une « nacelle »/se dégonfle à chaque erreur (7 étapes, SVG simple), clavier à l'écran A-Z (lettres essayées grisées, vertes/rouges), clavier physique ; mot perdu → mot affiché en rouge 2 s.
- [ ] **Lettres** : indice `fr`, tuiles de lettres cliquables (et clavier physique : la touche choisit la première tuile libre de cette lettre), cases de réponse, Retour arrière = effacer ; essai faux → secousse + « Essaie encore ! » ; 3ᵉ échec → solution affichée 2 s.
- [ ] Les trois : 🏠 quitte proprement (minuteurs/écouteurs retirés), aucun texte en `innerHTML` sauf SVG généré, contrôles clavier ignorés pendant les pauses, `onFin(resultat(etat))` appelé une seule fois.
- [ ] Captures headless 1280×800 et 390×844 de chaque écran (début et un état de jeu avancé), relues.

**Verify:** captures relues + partie complète de chaque jeu jouée par script en headless + `node --test challenge/test/ && challenge/tools/lint.sh`

**Steps:**
- [ ] **Step 1:** `ui-commun.js` (si choisi) et mise à jour des imports de `ui-qcm.js`/`ui-phrases.js` sans autre changement.
- [ ] **Step 2:** Les trois écrans (contrôleurs de Task 4).
- [ ] **Step 3:** CSS.
- [ ] **Step 4:** Captures + parties scriptées ; supprimer les pages `_test*`.
- [ ] **Step 5: Commit** — `feat(challenge): écrans relier, pendu et lettres mélangées`

---

### Task 11: Accueil à 16 jeux

**Goal:** `main.js` : accueil groupé par familles, aiguillage des nouveaux types, résultat adapté (concours « x / 45 », survie « x bonnes réponses »).

**Files:**
- Modify: `challenge/js/main.js`, `challenge/css/style.css`

**Acceptance Criteria:**
- [ ] Accueil : 4 sections dans l'ordre 📚 Les mots, ✏️ Phrases et grammaire, 🎧 L'écoute, 🏆 Les défis ; titres de section ; cartes plus compactes pour que les 16 jeux tiennent sans trop défiler (≈ 2 écrans à 1280×800).
- [ ] `jouer(jeu)` aiguille `qcm` → `lancerQcm`, `phrases` → `lancerPhrases`, `relier` → `lancerRelier`, `pendu` → `lancerPendu`, `lettres` → `lancerLettres`.
- [ ] Résultat : concours « 🏆 32 / 45 » ; survie « ❤️ 27 bonnes réponses d'affilée… » (= `bonnes`) ; les autres comme en v1.
- [ ] `?jeu=<id>` fonctionne pour les 16 ids.
- [ ] Captures 1280×800 et 390×844 de l'accueil, relues ; pas de défilement horizontal.

**Verify:** captures relues ; `node --test challenge/test/ && challenge/tools/lint.sh`

**Steps:**
- [ ] **Step 1:** Implémenter. **Step 2:** CSS. **Step 3:** Captures. **Step 4: Commit** — `feat(challenge): accueil à 16 jeux`

---

### Task 12: Adresse à part (fichiers)

**Goal:** Versionner la configuration du Pi pour `challenge.local`, retirer la carte du menu, documenter.

**Files:**
- Modify: `deploy/50-jeux.conf`, `deploy/README.md`, `index.html`, `CLAUDE.md`
- Create: `deploy/avahi-alias-challenge.service`

**Acceptance Criteria:**
- [ ] `deploy/50-jeux.conf` gagne, en fin de fichier :

```
# challenge.local : The Biggest Challenge sur sa propre adresse (demande de Sophie).
# Le jeu n'utilise que des chemins relatifs, il fonctionne à la racine.
$HTTP["host"] =~ "^challenge\.local(:[0-9]+)?$" {
    server.document-root = "/var/www/jeux/challenge"
}
```

- [ ] `deploy/avahi-alias-challenge.service` :

```
[Unit]
Description=Alias mDNS challenge.local (The Biggest Challenge)
After=avahi-daemon.service network-online.target
Wants=network-online.target
Requires=avahi-daemon.service

[Service]
Type=simple
# L'adresse IP vient du DHCP : on la lit au démarrage.
ExecStart=/bin/sh -c 'exec /usr/bin/avahi-publish -a -R challenge.local "$(hostname -I | cut -d" " -f1)"'
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

- [ ] `deploy/README.md` : section « Adresse challenge.local » (installation : `sudo apt install avahi-utils` si `avahi-publish` absent, copie du service dans `/etc/systemd/system/`, `systemctl enable --now`, copie de la conf lighttpd, test `lighttpd -tt`, redémarrage, vérifications `curl -sI http://challenge.local/` et `http://jeux.local/`).
- [ ] `index.html` racine : carte `challenge/` retirée.
- [ ] `CLAUDE.md` : `challenge/` joué sur `http://challenge.local/` (plus dans le menu) ; section *Spécificités challenge/* mise à jour (16 jeux, niveaux, `tirage.js`, `heure.js`, nouvelles banques, nouveaux écrans, `audio/phrases/`).

**Verify:** `grep -c challenge index.html` → `0` ; `node --test challenge/test/` → `# fail 0`

**Steps:** écrire les fichiers ; commit — `feat(deploy): challenge.local, The Biggest Challenge sur sa propre adresse`

---

### Task 13: Installation sur le Pi, déploiement, validation (coordinateur)

**Goal:** Installer l'alias et le vhost sur le Pi en sécurité, déployer, faire valider par Sophie.

**Files:** aucun (actions sur le Pi `sophie@jeux.local`).

**Acceptance Criteria:**
- [ ] Conf lighttpd existante sauvegardée (`/etc/lighttpd/conf-available/50-jeux.conf.bak-<date>`), nouvelle conf testée par `sudo /usr/sbin/lighttpd -tt -f /etc/lighttpd/lighttpd.conf` AVANT redémarrage.
- [ ] `systemctl is-active lighttpd avahi-alias-challenge` → `active active`.
- [ ] Depuis le poste : `curl -sI http://challenge.local/` → 200 et le HTML contient « The Biggest Challenge » ; `curl -sI http://jeux.local/` → 200 sans carte challenge.
- [ ] `./deploy/deploy.sh` exécuté ; Sophie a joué et donné son avis ; retours corrigés.

**Verify:** `curl -s http://challenge.local/ | grep -c "The Biggest Challenge"` → ≥ 1

**Steps:**
- [ ] **Step 1:** `./deploy/deploy.sh` (envoie aussi `challenge/` à jour).
- [ ] **Step 2:** Sur le Pi : vérifier `avahi-publish` ; installer le service ; copier la conf ; `lighttpd -tt` ; redémarrer ; vérifier l'état réel (`systemctl is-active`, `curl`).
- [ ] **Step 3:** Donner l'adresse à Sophie, recueillir ses retours.
