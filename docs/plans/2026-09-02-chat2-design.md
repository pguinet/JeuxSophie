# Mon Chat 2 — Design (version 2 réaliste du tamagotchi)

Date : 2026-09-02. Validé par Pascal.

## Objectif

Refaire le jeu *Mon Chat* dans un nouveau dossier `chat2/`, **sans toucher à `chat/`**, avec le même
principe de jeu mais une qualité graphique nettement supérieure. Direction artistique **réaliste et douce**.

## Décisions de cadrage

| Sujet | Décision |
|---|---|
| Machine cible | PC portable avec GPU intégré (Intel Iris / AMD APU), clavier + souris. Tactile conservé. |
| Ressources | Tout est permis : textures PBR, HDRI et modèles glTF libres (Poly Haven, CC0) vendorisés dans le dépôt. |
| Style | Réaliste : lumière naturelle HDRI, matières PBR, ombres douces, tone mapping ACES, bloom léger. |
| Le chat | **Procédural haute qualité** (pas de modèle importé) : maillage SDF + marching cubes, skinning automatique, fourrure en couches. |
| Périmètre gameplay | Identique à la v1 : 5 jauges, 5 actions, comportement autonome, boutique, pièces, sauvegarde locale. |
| Bonus visuel | Cycle jour/nuit lent (~12 min), purement visuel. |
| Déploiement | À la fin : commit, push, `deploy/deploy.sh` vers le Pi. |

## 1. Périmètre et emplacement

- Dossier `chat2/`, titre « Mon Chat 2 », carte ajoutée dans `index.html` racine.
- Sauvegarde `localStorage` clé `monchat2_save` (schéma versionné). Au premier lancement, si `monchat_save` (v1)
  existe, proposer de reprendre le chat (couleur, pièces, jauges).
- Contrôles : caméra orbitale souris (rotation, zoom bornés), flèches clavier, clic sur le chat = caresse.
  Tactile : un doigt = rotation, pincement = zoom.

## 2. Direction artistique

- **Éclairage** : HDRI Poly Haven (fin d'après-midi, nuages épars) en `scene.environment` + fond ; soleil
  `DirectionalLight` avec ombres PCF douces (2048 en Élevé, 1024 en Moyen, 512 en Faible) ; `ACESFilmicToneMapping`.
- **Post-traitement** : `EffectComposer` avec MSAA sur la cible de rendu (WebGL2), `UnrealBloomPass` léger.
  Pas de profondeur de champ ni d'occlusion ambiante (coût GPU).
- **Cycle jour/nuit** : période ~12 min. Position/couleur du soleil, intensité de l'environnement, teinte du ciel,
  lampe du salon qui s'allume le soir, lucioles au jardin la nuit. Aucun effet sur les jauges.
- **Maison** : salon avec parquet (texture PBR), murs plâtre, plafond, grande fenêtre (lumière du soleil entrante),
  porte ouverte vers le jardin. Meubles glTF Poly Haven : canapé/fauteuil, tapis (texture tissu), plante en pot,
  lampe, table basse. Objets du chat : panier, gamelles (bol bois), litière, arbre à chat (procédural).
- **Jardin** : herbe en brins instanciés (alpha texture) sur sol PBR, arbres et fleurs Poly Haven, clôture bois,
  allée de pierre, bassin avec `Water` (réflexions animées), rochers.

## 3. Le chat procédural

### Maillage
- Le corps est un **champ de distance signé** : union lissée (smooth-min) de capsules et d'ellipsoïdes (tronc,
  poitrail, cou, tête, museau, joues, front, 4 pattes en 3 segments, queue en 6 segments, oreilles en cônes).
- Extraction par **marching cubes** (~96³) au chargement, écran de chargement avec progression. Lissage laplacien
  léger, normales recalculées. Cible ~8–12 k triangles.
- Les oreilles, yeux, paupières, truffe, moustaches et coussinets sont des sous-maillages attachés aux os.

### Squelette et skinning
- Os : bassin, spine1, spine2, poitrail, cou, tête, oreille G/D, queue×6, pattes ×4 (haut, bas, pied).
- Poids automatiques : chaque primitive SDF appartient à un os ; poids d'un sommet = contribution normalisée
  `exp(-d_i / k)` des primitives proches, 4 os max, normalisés.
- Animations **procédurales** (machine d'états + blend par ressorts) : idle (respiration, queue, oreilles,
  clignement), marche 4 temps avec placement des pieds au sol (IK analytique 2 os), assis, couché en boule (dormir),
  manger/boire (tête baissée, mâchonnement), toilette (patte au visage), étirement, ronronnement (vibration),
  caresse (yeux plissés), tristesse (oreilles/queue basses).

### Fourrure et robe
- **Shells** : N copies `SkinnedMesh` partageant le squelette et la géométrie, uniform `shell` par copie ;
  `MeshStandardMaterial` étendu via `onBeforeCompile` : décalage le long de la normale après skinning,
  alpha par bruit 3D triplanaire avec seuil croissant par couche (`discard`), assombrissement à la racine.
  N = 6 (Faible), 12 (Moyen), 20 (Élevé).
- **Robes** (bruit 3D dans le shader, pas de textures) : tigré roux, noir, gris, blanc, roux uni ; ventre plus
  clair, chaussettes, masque.
- **Yeux** : iris procédural (canvas), pupille en fente dont la largeur dépend de la lumière ambiante, cornée
  brillante (`MeshPhysicalMaterial` clearcoat), paupières animées. Moustaches fines qui oscillent, truffe brillante.

## 4. Technique

- Statique, sans bundler ni npm au runtime. Addons Three.js 0.170.0 copiés dans
  `vendor/three@0.170.0/examples/jsm/` (GLTFLoader, RGBELoader, OrbitControls, EffectComposer + passes,
  Sky, Water, BufferGeometryUtils, et leurs dépendances internes). Importmap étendu (`three/addons/`).
- Assets : `chat2/tools/fetch-assets.mjs` télécharge depuis l'API Poly Haven (1K/2K) dans `chat2/assets/`
  (textures, hdri, models) + `chat2/assets/CREDITS.md`. Assets committés (budget ~30 Mo).
- **Qualité adaptative** : détection au démarrage (GPU, `devicePixelRatio`, mémoire) → préréglage ; mesure des
  FPS pendant 10 s → baisse automatique si < 40 FPS ; menu ⚙️ Faible / Moyen / Élevé (persisté).
- Modules `chat2/js/` : `main.js` (boucle, composer), `quality.js`, `lighting.js` (soleil, cycle), `house.js`,
  `garden.js`, `assets.js` (chargement glTF/textures/HDRI), `cat/sdf.js`, `cat/marching-cubes.js`,
  `cat/skeleton.js`, `cat/fur-material.js`, `cat/cat.js` (entité), `cat/animations.js`, `cat/eyes.js`,
  `needs.js` (jauges pures), `hud.js`, `actions.js`, `shop.js`, `save.js`, `color-picker.js`, `camera.js`.
- **Qualité de code** : `node --test chat2/test/` sur les modules purs (jauges, sauvegarde/migration v1,
  boutique, SDF, marching cubes, skinning, machine d'états) ; ESLint via Docker (`node:20`, config dans
  `chat2/eslint.config.js`) ; capture headless Chrome (`chat2/tools/screenshot.sh`) comme test visuel de fumée.

## 5. Approches écartées

- Modèle de chat importé (Sketchfab) : jeton d'API requis, une seule robe, rig inconnu, attribution.
- Fourrure par brins géométriques ou fins : trop coûteuse sur GPU intégré.
- Profondeur de champ, GTAO : hors périmètre pour tenir les FPS.
- Style cartoon / diorama : Pascal a choisi le réalisme.
