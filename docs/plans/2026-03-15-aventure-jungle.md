# Aventure Jungle v1 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Créer un jeu web 3D first-person dans une jungle où le joueur combat des serpents avec une épée, gagne des pièces, le tout jouable sur mobile avec contrôles tactiles.

**Architecture:** Single-page HTML5 app utilisant Three.js (via CDN) pour le rendu 3D. Pas de bundler, pas de npm — un seul dossier `aventure/` avec `index.html`, des fichiers JS modulaires, et un CSS. Le jeu utilise un terrain plat texturé, des arbres/plantes en 3D procédural, des serpents animés, et un HUD overlay en HTML/CSS.

**Tech Stack:** Three.js (CDN), HTML5, CSS3, JavaScript vanilla, Python http.server pour le dev local.

---

### Task 0: Scaffold du projet

**Files:**
- Create: `aventure/index.html`
- Create: `aventure/css/style.css`
- Create: `aventure/js/main.js`

**Step 1: Créer la structure de dossiers**

```bash
mkdir -p /home/pascal/github/JeuxSophie/aventure/{js,css,textures}
```

**Step 2: Créer index.html**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Aventure Jungle</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="game-container">
        <canvas id="game-canvas"></canvas>
        <div id="hud"></div>
        <div id="controls"></div>
    </div>
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
        }
    }
    </script>
    <script type="module" src="js/main.js"></script>
</body>
</html>
```

**Step 3: Créer style.css de base**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; touch-action: none; }
#game-container { width: 100%; height: 100%; position: relative; }
#game-canvas { width: 100%; height: 100%; display: block; }
#hud { position: absolute; top: 0; left: 0; width: 100%; pointer-events: none; }
#controls { position: absolute; bottom: 0; left: 0; width: 100%; pointer-events: none; }
```

**Step 4: Créer main.js minimal**

```javascript
import * as THREE from 'three';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
```

**Step 5: Tester dans le navigateur**

```bash
cd /home/pascal/github/JeuxSophie && python3 -m http.server 8080
```
Ouvrir `http://pascal.local:8080/aventure/` → on doit voir un écran bleu ciel.

**Step 6: Commit**

```bash
git add aventure/
git commit -m "feat(aventure): scaffold du projet avec Three.js"
```

---

### Task 1: Terrain de jungle

**Files:**
- Create: `aventure/js/terrain.js`
- Modify: `aventure/js/main.js`

**Step 1: Créer terrain.js**

Créer un sol plat texturé avec une texture d'herbe/terre générée procéduralement (canvas texture) puisqu'on n'a pas de fichiers texture.

```javascript
import * as THREE from 'three';

export function createTerrain(scene) {
    // Générer une texture d'herbe procédurale
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2d5a1e';
    ctx.fillRect(0, 0, 256, 256);
    // Ajouter du bruit pour le réalisme
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const green = Math.floor(30 + Math.random() * 40);
        ctx.fillStyle = `rgb(${20 + Math.floor(Math.random() * 20)}, ${green + 40}, ${10 + Math.floor(Math.random() * 15)})`;
        ctx.fillRect(x, y, 2, 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);

    const geometry = new THREE.PlaneGeometry(200, 200);
    const material = new THREE.MeshLambertMaterial({ map: texture });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    return ground;
}
```

**Step 2: Ajouter éclairage et terrain dans main.js**

Importer `createTerrain`, ajouter lumière directionnelle + ambiante, appeler `createTerrain(scene)`.

**Step 3: Tester** → on doit voir un sol vert avec un ciel bleu.

**Step 4: Commit**

```bash
git commit -m "feat(aventure): terrain de jungle avec texture procédurale"
```

---

### Task 2: Végétation (arbres et plantes)

**Files:**
- Create: `aventure/js/vegetation.js`
- Modify: `aventure/js/main.js`

**Step 1: Créer vegetation.js**

Générer des arbres procéduraux (tronc cylindrique marron + feuillage sphérique vert) et des buissons placés aléatoirement. Utiliser un tableau de positions pour éviter le centre (zone de spawn du joueur). Ajouter des palmiers (cylindre courbé + feuilles en cône aplati).

Fonctions à exporter :
- `createTree(x, z)` → Group avec tronc + feuillage
- `createPalm(x, z)` → Group avec tronc + feuilles
- `createBush(x, z)` → Mesh sphère verte aplatie
- `populateJungle(scene)` → Place ~40 arbres, ~15 palmiers, ~60 buissons

**Step 2: Importer et appeler dans main.js**

**Step 3: Tester** → on doit voir une jungle avec des arbres et buissons autour du joueur.

**Step 4: Commit**

```bash
git commit -m "feat(aventure): végétation procédurale (arbres, palmiers, buissons)"
```

---

### Task 3: Contrôles — Joystick virtuel

**Files:**
- Create: `aventure/js/joystick.js`
- Modify: `aventure/css/style.css`
- Modify: `aventure/js/main.js`

**Step 1: Créer joystick.js**

Implémenter un joystick tactile dans le coin bas-gauche :
- Un cercle extérieur semi-transparent (zone de touch)
- Un cercle intérieur (le stick) qui suit le doigt
- Exporter `getJoystickDirection()` → `{ x, y }` normalisé (-1 à 1)
- Gérer les events `touchstart`, `touchmove`, `touchend` sur la zone gauche de l'écran

```javascript
export class VirtualJoystick {
    constructor(container) { /* ... */ }
    getDirection() { return { x: this.dx, y: this.dy }; }
}
```

**Step 2: Ajouter le CSS pour le joystick**

Cercle extérieur 120px, cercle intérieur 50px, semi-transparent, `position: absolute; bottom: 30px; left: 30px;`

**Step 3: Intégrer dans main.js — déplacement du joueur**

Dans la boucle `animate()`, lire la direction du joystick et déplacer `camera.position` en fonction de `camera.rotation` (déplacement relatif à la direction regardée). Ajouter une détection de collision simple avec les arbres (distance minimale).

**Step 4: Tester sur mobile** → le joystick doit apparaître, le joueur doit se déplacer dans la jungle.

**Step 5: Commit**

```bash
git commit -m "feat(aventure): joystick virtuel tactile pour le déplacement"
```

---

### Task 4: Contrôles — Rotation caméra (glisser le doigt)

**Files:**
- Create: `aventure/js/camera-controls.js`
- Modify: `aventure/js/main.js`

**Step 1: Créer camera-controls.js**

Détecter les touch sur la moitié droite de l'écran (pour ne pas interférer avec le joystick). Sur `touchmove`, calculer le delta X/Y et appliquer une rotation yaw (gauche/droite) et pitch (haut/bas, limité à ±80°) à la caméra.

```javascript
export class CameraControls {
    constructor(camera, element) { /* ... */ }
    update() { /* appliquer yaw/pitch à camera.rotation */ }
}
```

**Step 2: Intégrer dans main.js**

**Step 3: Tester sur mobile** → glisser le doigt à droite doit tourner la vue.

**Step 4: Commit**

```bash
git commit -m "feat(aventure): rotation caméra tactile (glisser le doigt)"
```

---

### Task 5: Serpents (monstres)

**Files:**
- Create: `aventure/js/snake.js`
- Modify: `aventure/js/main.js`

**Step 1: Créer snake.js**

Modéliser un serpent procédural :
- Corps = plusieurs sphères/cylindres enchaînés formant une courbe sinusoïdale
- Tête un peu plus grosse avec 2 petits yeux (sphères)
- Couleur vert foncé / marron avec motifs
- Animation : mouvement ondulant (déplacer les segments avec une onde sinusoïdale basée sur le temps)

Comportement IA :
- Le serpent patrouille aléatoirement dans un rayon
- Quand le joueur est à moins de 10 unités, le serpent se dirige vers lui
- Quand le serpent touche le joueur (distance < 1.5), il inflige des dégâts

```javascript
export class Snake {
    constructor(scene, x, z) { /* créer le mesh, position */ }
    update(deltaTime, playerPosition) { /* IA + animation */ }
    takeDamage(amount) { /* réduire HP, mourir si 0 */ }
    isDead() { return this.hp <= 0; }
}
```

**Step 2: Spawner 5 serpents dans main.js**

Les placer à des positions aléatoires (pas trop près du joueur).

**Step 3: Tester** → on doit voir des serpents qui bougent et se dirigent vers nous.

**Step 4: Commit**

```bash
git commit -m "feat(aventure): serpents avec IA et animation ondulante"
```

---

### Task 6: Combat — Bouton épée et attaque

**Files:**
- Create: `aventure/js/sword.js`
- Modify: `aventure/css/style.css`
- Modify: `aventure/js/main.js`

**Step 1: Créer sword.js**

- Modéliser une épée simple en 3D (lame = BoxGeometry allongée grise, garde = BoxGeometry dorée, poignée = cylindre marron)
- L'attacher à la caméra (enfant de la caméra) en bas à droite du champ de vision
- Animation d'attaque : rotation rapide vers l'avant puis retour (0.3s)
- Pendant l'attaque, vérifier si un serpent est devant le joueur (raycasting ou distance + angle) → si oui, infliger des dégâts

```javascript
export class Sword {
    constructor(camera) { /* créer mesh, attacher à camera */ }
    attack(snakes) { /* animation + détection de hit */ }
    update(deltaTime) { /* mettre à jour l'animation */ }
    isAttacking() { return this.attacking; }
}
```

**Step 2: Ajouter le bouton d'attaque dans le HTML/CSS**

Bouton rond rouge/orange, `position: absolute; bottom: 40px; right: 40px;`, avec une icône d'épée (emoji ⚔️ ou SVG simple). `pointer-events: auto;`

**Step 3: Connecter le bouton à sword.attack() dans main.js**

Sur `touchstart` du bouton → déclencher l'attaque. Passer la liste des serpents pour la détection.

**Step 4: Tester** → appuyer sur le bouton doit animer l'épée et tuer les serpents proches.

**Step 5: Commit**

```bash
git commit -m "feat(aventure): épée avec attaque et détection de hit"
```

---

### Task 7: HUD (vie, pièces)

**Files:**
- Create: `aventure/js/hud.js`
- Modify: `aventure/css/style.css`
- Modify: `aventure/js/main.js`

**Step 1: Créer hud.js**

Gérer l'affichage HTML overlay :
- Barre de vie en haut à gauche (div avec background rouge/vert, largeur proportionnelle aux HP)
- Compteur de pièces en haut à droite (icône 🪙 + nombre)
- Quand un serpent meurt, le joueur gagne des pièces (ex: +5)
- Quand un serpent touche le joueur, la vie baisse

```javascript
export class HUD {
    constructor(container) { /* créer les éléments HTML */ }
    updateHealth(current, max) { /* mettre à jour la barre */ }
    updateCoins(amount) { /* mettre à jour le compteur */ }
    showDamage() { /* flash rouge sur l'écran */ }
}
```

**Step 2: Ajouter le CSS**

Barre de vie : `height: 20px; background: linear-gradient(green, limegreen); border: 2px solid white;`
Coins : `font-size: 24px; color: gold; text-shadow: 2px 2px black;`

**Step 3: Intégrer dans main.js**

Connecter les événements : mort de serpent → +pièces, contact serpent → -vie, vie à 0 → game over.

**Step 4: Tester** → tuer un serpent doit donner des pièces, se faire toucher doit réduire la vie.

**Step 5: Commit**

```bash
git commit -m "feat(aventure): HUD avec barre de vie et compteur de pièces"
```

---

### Task 8: Game Over et respawn

**Files:**
- Modify: `aventure/js/hud.js`
- Modify: `aventure/js/main.js`

**Step 1: Ajouter un écran Game Over**

Quand la vie tombe à 0 :
- Afficher un overlay semi-transparent avec "GAME OVER" en gros
- Afficher le nombre de pièces récoltées
- Bouton "Rejouer" qui reset la position du joueur, la vie, les pièces, et respawn les serpents

**Step 2: Ajouter le CSS pour l'écran game over**

Overlay centré, texte blanc sur fond noir semi-transparent, bouton "Rejouer" stylisé.

**Step 3: Tester le cycle complet** → jouer, mourir, game over, rejouer.

**Step 4: Commit**

```bash
git commit -m "feat(aventure): écran game over et système de respawn"
```

---

### Task 9: Brouillard et ambiance

**Files:**
- Modify: `aventure/js/main.js`
- Modify: `aventure/js/terrain.js`

**Step 1: Ajouter du brouillard**

```javascript
scene.fog = new THREE.FogExp2(0x4a7c59, 0.03);
```

Changer la couleur de fond pour matcher le brouillard. Cela donne un effet de profondeur et cache les bords du terrain.

**Step 2: Ajouter des sons d'ambiance (optionnel)**

Utiliser l'API Web Audio pour jouer un son de jungle en boucle (ou le reporter à une version future).

**Step 3: Ajouter des particules**

Petites particules vertes/jaunes flottantes pour simuler des insectes/pollen.

**Step 4: Tester** → l'atmosphère doit être immersive.

**Step 5: Commit**

```bash
git commit -m "feat(aventure): brouillard, ambiance jungle et particules"
```

---

### Task 10: Test final et polish

**Files:**
- Modify: tous les fichiers si nécessaire

**Step 1: Tester sur mobile via `http://pascal.local:8080/aventure/`**

Vérifier :
- [ ] Le joystick fonctionne bien au tactile
- [ ] La rotation caméra est fluide
- [ ] Les serpents se déplacent et attaquent
- [ ] L'épée fonctionne et tue les serpents
- [ ] Les pièces s'accumulent
- [ ] La barre de vie diminue
- [ ] Le game over s'affiche et le rejouer fonctionne
- [ ] Pas de problème de performance

**Step 2: Corriger les bugs trouvés**

**Step 3: Commit final**

```bash
git commit -m "feat(aventure): v1 complète — polish et corrections"
```
