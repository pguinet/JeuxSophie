# Mon Chat — Plan d'implémentation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Créer un tamagotchi 3D où Sophie s'occupe d'un chat dans une maison avec jardin.

**Architecture:** Jeu web HTML5/JS avec Three.js (CDN). Un fichier par module : scène, chat, jauges, actions, boutique, sauvegarde. Caméra orbitale autour de la scène. Tout tactile.

**Tech Stack:** Three.js 0.170.0 via CDN, ES modules, localStorage, HTML5/CSS3

---

### Task 1 : Structure + scène de base

**Files:**
- Create: `chat/index.html`
- Create: `chat/css/style.css`
- Create: `chat/js/main.js`
- Create: `chat/js/scene.js`

**Step 1: Créer index.html**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Mon Chat</title>
    <link rel="stylesheet" href="css/style.css">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
</head>
<body>
    <div id="game-container">
        <canvas id="game-canvas"></canvas>
    </div>
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"
        }
    }
    </script>
    <script type="module" src="js/main.js"></script>
</body>
</html>
```

**Step 2: Créer style.css** (même base que aventure)

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; touch-action: none; }
#game-container { width: 100%; height: 100%; position: relative; }
#game-canvas { width: 100%; height: 100%; display: block; }
```

**Step 3: Créer scene.js** — sol vert (jardin) + sol beige (maison), murs, lumière

- Sol : plane 20x20 divisé en 2 zones (intérieur beige 10x20, extérieur vert 10x20)
- Murs de la maison : 3 murs (arrière + 2 côtés), pas de mur devant pour voir l'intérieur
- Lumière directionnelle + ambiante
- Ciel bleu clair en background

**Step 4: Créer main.js** — renderer, caméra orbitale tactile, boucle d'animation

- Caméra en perspective, positionnée en surplomb
- Rotation orbitale : swipe pour tourner autour de la scène
- Pas de zoom (garder simple)

**Step 5: Tester** — ouvrir dans le navigateur, vérifier la scène avec sol + murs

**Step 6: Commit** — `feat(chat): scène de base avec maison et jardin`

---

### Task 2 : Modèle 3D du chat

**Files:**
- Create: `chat/js/cat.js`
- Modify: `chat/js/main.js`

**Step 1: Créer cat.js** — classe Cat avec modèle 3D bloc

Géométrie du chat (tous des Box/Sphere) :
- Corps : box allongé (0.8 x 0.5 x 0.4)
- Tête : box (0.4 x 0.35 x 0.35) devant le corps
- Oreilles : 2 petits triangles (ConeGeometry) sur la tête
- Yeux : 2 petites sphères noires
- Nez : petite sphère rose
- Queue : cylindre courbé (3 segments)
- 4 pattes : petits cylindres sous le corps
- Couleur paramétrable via constructeur (orange par défaut)

Propriétés :
- `this.group` : THREE.Group contenant tout le modèle
- `this.color` : couleur du pelage
- `this.targetPos` : position vers laquelle le chat marche
- `this.state` : 'idle', 'walking', 'sleeping', 'eating', 'drinking', 'playing', 'washing'

**Step 2: Méthode update(delta)** — déplacement vers targetPos, animation des pattes en marchant

**Step 3: Méthode setColor(hex)** — change la couleur du corps/tête/queue/oreilles

**Step 4: Intégrer dans main.js** — instancier le chat, l'ajouter à la scène

**Step 5: Tester** — le chat apparaît dans la scène, statique

**Step 6: Commit** — `feat(chat): modèle 3D du chat avec couleur paramétrable`

---

### Task 3 : Écran de choix de couleur

**Files:**
- Create: `chat/js/color-picker.js`
- Modify: `chat/js/main.js`

**Step 1: Créer color-picker.js** — overlay HTML avec 5 ronds de couleur

Couleurs : orange (#e87e24), noir/blanc (#333333), gris (#7a8b99), blanc (#f0ede6), roux (#c45e2c)
- Titre : "Choisis la couleur de ton chat !"
- 5 cercles cliquables avec bordure
- Callback onSelect(colorHex)

**Step 2: Intégrer dans main.js** — afficher le picker au lancement si pas de sauvegarde, cacher après choix, créer le chat avec la couleur choisie

**Step 3: Tester** — l'écran de choix s'affiche, on choisit une couleur, le chat apparaît

**Step 4: Commit** — `feat(chat): choix de couleur du chat au démarrage`

---

### Task 4 : Jauges (HUD)

**Files:**
- Create: `chat/js/hud.js`
- Modify: `chat/js/main.js`

**Step 1: Créer hud.js** — classe HUD avec 5 jauges

Jauges (toutes de 0 à 100, commencent à 80) :
- 🍖 Faim
- 💧 Soif
- 😸 Bonheur
- 🧼 Propreté
- 😴 Fatigue (inversée : 0 = pas fatigué, 100 = épuisé)

Affichage : barre horizontale en haut de l'écran, icône + barre colorée + valeur
- Vert > 60, orange 30-60, rouge < 30
- Fatigue : vert < 40, orange 40-70, rouge > 70

Méthodes :
- `update(delta)` : baisser les jauges lentement (faim -1/min, soif -1.5/min, bonheur -0.8/min, propreté -0.5/min, fatigue +0.7/min)
- `feed()`, `drink()`, `pet()`, `wash()`, `sleep()` : remonter la jauge correspondante

**Step 2: Intégrer dans main.js** — appeler hud.update(delta) dans la boucle

**Step 3: Tester** — les jauges s'affichent et baissent lentement

**Step 4: Commit** — `feat(chat): 5 jauges de besoins avec décroissance`

---

### Task 5 : Boutons d'action

**Files:**
- Create: `chat/js/actions.js`
- Modify: `chat/js/main.js`
- Modify: `chat/js/cat.js`

**Step 1: Créer actions.js** — barre de 5 boutons tactiles en bas de l'écran

Boutons avec icône + label :
- 🍖 Nourrir
- 💧 Boire
- 🤚 Caresser
- 🧼 Laver
- 😴 Dormir

Style : fond semi-transparent, bordure blanche, flex horizontal, pointer-events auto

**Step 2: Ajouter les animations dans cat.js**

- `eat()` : le chat va à la gamelle, baisse la tête, revient
- `drink()` : le chat va au bol d'eau, baisse la tête
- `pet()` : le chat s'assoit, la queue bouge, petit saut de joie
- `wash()` : le chat s'assoit, rotation sur lui-même
- `sleep()` : le chat va au coussin, se couche (corps au sol, yeux fermés)

**Step 3: Connecter dans main.js** — chaque bouton appelle hud.feed()/drink()/etc + cat.eat()/drink()/etc

**Step 4: Cooldown de 3s sur chaque bouton** (grisé pendant le cooldown)

**Step 5: Tester** — chaque bouton déclenche l'animation + remonte la jauge

**Step 6: Commit** — `feat(chat): boutons d'action avec animations du chat`

---

### Task 6 : Comportement autonome du chat

**Files:**
- Modify: `chat/js/cat.js`
- Modify: `chat/js/main.js`

**Step 1: AI simple** — le chat choisit aléatoirement une destination et y marche

- Toutes les 5-10s, choisir un nouveau point aléatoire dans la scène
- Le chat marche vers ce point avec animation des pattes
- Arrivé au point, il s'arrête et attend

**Step 2: Comportement basé sur les jauges**

- Faim < 20 : le chat va vers la gamelle et miaule (texte "Miaou!" flottant)
- Soif < 20 : le chat va vers le bol d'eau
- Fatigue > 80 : le chat va au coussin et se couche
- Bonheur < 20 : le chat s'assoit et a l'air triste (oreilles baissées)

**Step 3: Tester** — le chat se balade tout seul, change de comportement selon les jauges

**Step 4: Commit** — `feat(chat): comportement autonome du chat selon les jauges`

---

### Task 7 : Meubles et objets de la maison

**Files:**
- Create: `chat/js/furniture.js`
- Modify: `chat/js/scene.js`

**Step 1: Créer furniture.js** — objets 3D bloc

- Gamelle (cylindre plat rouge) — position fixe dans la cuisine
- Bol d'eau (cylindre plat bleu) — à côté de la gamelle
- Coussin (box plat arrondi, rouge/violet) — coin de la pièce
- Litière (box ouverte, gris) — autre coin
- Arbre à chat (cylindres empilés + plateformes) — dans le jardin

**Step 2: Ajouter dans scene.js** — placer les meubles dans la scène, exporter leurs positions

**Step 3: Tester** — les meubles sont visibles dans la scène

**Step 4: Commit** — `feat(chat): meubles et objets dans la maison`

---

### Task 8 : Sauvegarde localStorage

**Files:**
- Create: `chat/js/save.js`
- Modify: `chat/js/main.js`

**Step 1: Créer save.js** — sauvegarder/charger l'état du jeu

Données sauvegardées :
- Couleur du chat
- 5 jauges
- Pièces
- Objets achetés
- Timestamp de dernière session

Méthodes :
- `save(state)` : écrire dans localStorage('monchat_save')
- `load()` : lire et parser, retourner null si pas de sauvegarde
- `hasSave()` : retourner true si sauvegarde existe

**Step 2: Intégrer dans main.js**

- Au lancement : charger la sauvegarde si elle existe (skip color picker)
- Auto-save toutes les 30s
- Save à la fermeture (beforeunload)

**Step 3: Tester** — recharger la page, les jauges sont conservées

**Step 4: Commit** — `feat(chat): sauvegarde automatique localStorage`

---

### Task 9 : Boutique

**Files:**
- Create: `chat/js/shop.js`
- Modify: `chat/js/hud.js`
- Modify: `chat/js/main.js`

**Step 1: Créer shop.js** — overlay boutique

- Bouton "🛒" en haut à droite pour ouvrir
- Overlay avec grille d'objets à acheter
- Chaque objet : icône + nom + prix + bouton acheter
- Objets : balle (10🪙), souris jouet (15🪙), coussin luxe (30🪙), poisson (5🪙), collier (20🪙), noeud (10🪙)
- Bouton fermer

**Step 2: Compteur de pièces dans le HUD** — +1 pièce par minute de jeu, affiché en haut à droite

**Step 3: Intégrer dans main.js** — timer pièces, ouverture/fermeture boutique

**Step 4: Effet des objets achetés**

- Balle/souris : le chat joue avec (augmente bonheur +15)
- Coussin luxe : remplace le coussin, fatigue baisse plus vite
- Poisson : nourrir avec poisson (faim +40 au lieu de +25)
- Collier/noeud : accessoire visible sur le chat

**Step 5: Tester** — acheter un objet, vérifier l'effet

**Step 6: Commit** — `feat(chat): boutique avec objets et pièces`

---

### Task 10 : Polish final

**Files:**
- Modify: `chat/js/cat.js`
- Modify: `chat/js/main.js`
- Modify: `chat/js/scene.js`

**Step 1: Sons/vibrations** — vibration tactile quand le chat ronronne (navigator.vibrate)

**Step 2: Texte flottant "Miaou!"** — quand le chat a faim/soif, texte 3D qui monte et disparaît

**Step 3: Particules** — petits cœurs quand on caresse, bulles quand on lave

**Step 4: Tester l'ensemble** sur mobile

**Step 5: Commit** — `feat(chat): polish animations et effets`
