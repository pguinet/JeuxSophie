# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Présentation

Collection de petits jeux web 3D faits pour Sophie (la fille de Pascal), jouables sur mobile/tablette. Chaque jeu vit dans son propre sous-dossier à la racine (`aventure/`, `chat/`) et est totalement autonome.

- **`aventure/`** — *Aventure Jungle* : jeu d'action 3D à la première personne. Le joueur explore une jungle, combat des monstres (serpent, araignée, crocodile, singe) à l'épée et au projectile, gagne des pièces et progresse via un système de quêtes.
- **`chat/`** — *Mon Chat* : tamagotchi 3D. Sophie s'occupe d'un chat dans une maison avec jardin (5 jauges : faim, soif, bonheur, propreté, fatigue), avec boutique de meubles et sauvegarde locale.

## Stack & contraintes

- **Pas de bundler, pas de npm, pas d'étape de build.** Ce sont des pages statiques pures.
- **Three.js 0.170.0 chargé via CDN** (jsdelivr) à l'aide d'un `<script type="importmap">` dans chaque `index.html`. Aucune dépendance n'est versionnée localement.
- **ES modules vanilla** (`import`/`export`), HTML5, CSS3. Aucun framework.
- Persistance via `localStorage` (voir `chat/js/save.js`, clé `monchat_save`).

## Lancer / tester

Il n'y a **aucun test automatisé ni outil de lint** dans ce dépôt — la vérification se fait en jouant dans le navigateur. Comme les jeux utilisent des ES modules, ils doivent être servis par HTTP (pas d'ouverture `file://`).

```bash
# Servir tout le dépôt à la racine
python3 -m http.server 8000
```

Puis ouvrir, sur le réseau local, `http://pascal.local:8000/aventure/` ou `http://pascal.local:8000/chat/`.
**Toujours utiliser `pascal.local` (mDNS) dans les URLs**, jamais `localhost` ni une IP — c'est l'adresse depuis laquelle Sophie joue sur sa tablette.

Les `index.html` envoient des en-têtes `no-cache` : un simple rafraîchissement suffit à voir les changements, pas besoin de vider le cache.

## Architecture commune aux jeux

Chaque jeu suit le même squelette :

- `index.html` — canvas plein écran, `importmap` Three.js, charge `js/main.js` en module.
- `js/main.js` — point d'entrée : crée renderer/scène/caméra/lumières, instancie les modules, et contient **la boucle `animate()`** (`requestAnimationFrame`) qui appelle `update(delta)` sur chaque entité.
- `js/*.js` — un module par responsabilité.
- `css/style.css` — minimal ; **l'essentiel du HUD/UI est généré en JS** (création de `div` et `Object.assign(el.style, …)` dans les modules HUD), pas écrit en HTML/CSS statique.

**Convention des entités :** chaque acteur dynamique est une classe ES (`export class Snake`, `class Cat`, `class Monkey`, …) qui crée sa propre géométrie/mesh Three.js dans le constructeur, s'ajoute à la `scene`, et expose une méthode `update(delta, …)` appelée depuis la boucle de `main.js`. Les meshes sont du **3D procédural** (formes Three.js assemblées par code), il n'y a pas de modèles importés (`.gltf`, `.fbx`).

### Spécificités *aventure/*
- Monstres (`snake.js`, `spider.js`, `crocodile.js`, `monkey.js`) partagent une interface commune : propriétés `hp`/`maxHp`/`speed`/`damage`/`detectionRange`/`attackRange`/`dead`, IA de patrouille puis poursuite (`chasing`), et flash de dégâts.
- `terrain.js`/`vegetation.js` génèrent le sol et la végétation procédurale. `player.js` gère le joueur, `sword.js` l'arme, `camera-controls.js` + `joystick.js` les contrôles tactiles, `hud.js` l'overlay, `quests.js` la progression.

### Spécificités *chat/*
- `cat.js` (le plus gros module) : modèle 3D du chat, fourrure, animations (marche, dort, mange, ronronne, joue, se lave) et comportement autonome piloté par les jauges.
- `hud.js` définit les 5 jauges et leurs taux de décroissance (`rate`, par seconde) ainsi que les pièces. `actions.js` la barre d'actions, `shop.js` la boutique, `furniture.js` les meubles, `scene.js` la maison/jardin, `color-picker.js` le choix de couleur au démarrage, `save.js` la sauvegarde.

## Documentation de conception

`docs/plans/` contient les plans de conception et d'implémentation datés (design + plan task-by-task) de chaque jeu. Les consulter pour comprendre l'intention d'origine avant une grosse évolution.
