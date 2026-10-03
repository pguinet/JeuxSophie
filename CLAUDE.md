# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Présentation

Collection de petits jeux web 3D faits pour Sophie (la fille de Pascal), jouables sur mobile/tablette. Chaque jeu vit dans son propre sous-dossier à la racine (`aventure/`, `chat/`) et est totalement autonome.

- **`aventure/`** — *Aventure Jungle* : jeu d'action 3D à la troisième personne (personnage visible, caméra derrière/au-dessus). Le joueur explore une jungle, combat des monstres (serpent, araignée, crocodile, singe) à l'épée et au projectile, gagne des pièces et progresse via un système de quêtes.
- **`chat/`** — *Mon Chat* : tamagotchi 3D. Sophie s'occupe d'un chat dans une maison avec jardin (5 jauges : faim, soif, bonheur, propreté, fatigue), avec boutique de meubles et sauvegarde locale.
- **`chat2/`** — *Mon Chat 2* : version 2 **réaliste** du tamagotchi (même principe de jeu, `chat/` reste intact). Chat procédural (SDF → marching cubes → skinning → fourrure en couches), environnement PBR Poly Haven (textures, HDRI, modèles glTF), cycle jour/nuit, post-traitement. Design : `docs/plans/2026-09-02-chat2-design.md`.

## À qui tu parles

**Par défaut, sans indication contraire, considère que c'est Sophie (une enfant) qui te prompte, pas Pascal.** Adapte-toi en conséquence :

- **En tout début de session, la première chose à faire est de dire bonjour à Sophie et de lui demander ce qu'elle a envie de faire aujourd'hui** — avant toute autre action. Un message court, chaleureux et accueillant. 👋
- **Messages simples, gentils et encourageants.** Phrases courtes, vocabulaire d'enfant, pas de jargon technique (ni « rsync », « importmap », « localStorage »…). On peut mettre des emojis. 😊
- **Ne jamais publier d'URL de dev local** (`pascal.local:8000`, `localhost`, une IP…) : ce sont des adresses pour Pascal. Pour jouer, donne **toujours** l'adresse du Raspberry Pi : `http://jeux.local/` (ou le jeu précis, ex. `http://jeux.local/chat/`).
- **Git en autonomie** (pas besoin de demander à Sophie) : tu peux **committer** dès qu'une étape est **terminée et validée** (par exemple quand Sophie confirme qu'un jeu ou une fonctionnalité lui plaît). Quand elle **annonce la fin de la session**, tu peux **push**. Fais ça discrètement, sans en parler en jargon à Sophie.
- Si une demande est clairement technique (déploiement, refactor, config, git…), c'est Pascal — tu peux repasser en mode développeur normal.

## Stack & contraintes

- **Pas de bundler, pas de npm, pas d'étape de build.** Ce sont des pages statiques pures.
- **Three.js 0.170.0 hébergé en local** dans `vendor/three@0.170.0/three.module.js`, référencé via un `<script type="importmap">` (`"three"` → `/vendor/…`) dans les `index.html` qui en ont besoin (`aventure/`, `chat/`). Aucune dépendance CDN — les jeux marchent hors ligne.
- **ES modules vanilla** (`import`/`export`), HTML5, CSS3. Aucun framework.
- Persistance via `localStorage` (voir `chat/js/save.js`, clé `monchat_save`).

## Lancer / tester

Il n'y a **aucun test automatisé ni outil de lint** pour les jeux historiques — la vérification se fait en jouant dans le navigateur. **Exception : le personnage 3D partagé (`shared/`)** : tests `node --import ./shared/test/register.mjs --test shared/test/*.test.mjs` (le crochet fait pointer `three` vers `vendor/`) et ESLint via Docker (`shared/tools/lint.sh`, couvre aussi `habille/`, `etoiles3d/`, `defile/`). **Autre exception : `chat2/`** dispose de tests unitaires (`node --test chat2/test/`), d'ESLint via Docker (`chat2/tools/lint.sh`) et d'un outil de capture headless (`chat2/tools/screenshot.sh <url> <out.png> [w h budget_ms]`, variable `CHROME_LOG=<fichier>` pour récupérer la console JS). Voir la section *Spécificités chat2/* plus bas. Comme les jeux utilisent des ES modules, ils doivent être servis par HTTP (pas d'ouverture `file://`).

```bash
# Servir tout le dépôt à la racine
python3 -m http.server 8000
```

Puis ouvrir, sur le réseau local, `http://pascal.local:8000/aventure/` ou `http://pascal.local:8000/chat/`.
**En dev, toujours utiliser `pascal.local` (mDNS) dans les URLs**, jamais `localhost` ni une IP. ⚠️ `pascal.local:8000` est le serveur de dev de Pascal ; **Sophie, elle, joue sur le Pi (`http://jeux.local/`)** — ne jamais lui donner d'URL `pascal.local` (voir « À qui tu parles »).

Sur le Pi, lighttpd renvoie `Cache-Control: no-cache` sur le code des jeux (revalidation à chaque requête) : un simple rafraîchissement suffit à voir un déploiement. Les assets figés de `vendor/` (Three.js) sont eux mis en cache long (`immutable`), donc téléchargés une seule fois. En dev via `python3 -m http.server`, aucun de ces en-têtes n'est envoyé ; un rafraîchissement suffit tout de même.

## Déployer sur le Raspberry Pi

**Les jeux sont hébergés sur un Raspberry Pi** (modèle 1, ARMv6) qui sert les pages statiques via `lighttpd` sur le réseau local. Le Pi n'est qu'un serveur de fichiers ; le rendu 3D Three.js tourne sur la tablette de Sophie. Three.js est hébergé en local (`vendor/three@0.170.0/three.module.js`, référencé par les `importmap`) — aucune dépendance CDN.

**Une fois une évolution terminée et validée, déployer vers le Pi** avec :

```bash
./deploy/deploy.sh            # défaut : rsync vers sophie@jeux.local:/var/www/jeux
PI_HOST=192.168.1.42 ./deploy/deploy.sh   # forcer l'IP si le mDNS jeux.local ne répond pas
./deploy/deploy.sh --dry-run  # simuler sans rien copier
```

Le script utilise `rsync -az --delete` (fichiers modifiés uniquement, suppressions répercutées) et exclut `.git/`, `.claude/`, `docs/`, `deploy/`, `croquis.pdf`, `CLAUDE.md`. Sophie joue ensuite sur `http://jeux.local/`. Tout est détaillé dans `deploy/README.md` (install du Pi, config lighttpd, dépannage).

> Note : `jeux.local` est le hostname du Pi. `pascal.local` reste l'adresse du serveur de dev local lancé à la main.

### Accès direct au Pi (SSH)

Depuis le poste de dev, **on peut agir directement sur le Pi** — pas seulement via `deploy.sh` :

- Accès : `ssh sophie@jeux.local` (clé SSH configurée, sans mot de passe).
- `sudo` est **sans mot de passe** sur le Pi → possible de gérer lighttpd (`sudo systemctl restart lighttpd`), copier une conf, etc.
- Binaire lighttpd : `/usr/sbin/lighttpd` (hors PATH d'un shell SSH non-login — l'appeler par chemin complet). Version : lighttpd 1.4.79. Docroot : `/var/www/jeux`.

**Précautions avant toute action qui touche le service :**
- Toujours tester la syntaxe **avant** de redémarrer : `sudo /usr/sbin/lighttpd -tt -f /etc/lighttpd/lighttpd.conf` (une conf invalide empêche le redémarrage → plus de jeux pour Sophie).
- Sauvegarder la conf existante avant de l'écraser, et ne redémarrer que si le test passe.
- Une connexion SSH peut tomber en cours de route : **vérifier l'état réel** (`systemctl is-active`, `curl -sI`) au lieu de se fier au code de retour.

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

### Spécificités *chat2/*
- **Addons Three.js vendorisés** dans `vendor/three@0.170.0/examples/jsm/` (importmap `three/addons/` → ce dossier). Script : `node chat2/tools/vendor-addons.mjs` (idempotent, résout les imports relatifs).
- **Assets Poly Haven (CC0)** dans `chat2/assets/` (textures 1K `diff/nor_gl/arm`, HDRI jour 2K / nuit 1K, modèles glTF 1K), listés dans `assets/manifest.json`, téléchargés par `node chat2/tools/fetch-assets.mjs`, crédités dans `assets/CREDITS.md`. Budget ~44 Mo.
- **Le chat** (`js/cat/`) : `sdf.js` (anatomie = union lisse de capsules/ellipsoïdes, articulations partagées `LEG_JOINTS`/`TAIL_JOINTS`), `marching-cubes.js` (tables dans `mc-tables.js`), `skin-weights.js` (poids automatiques), `skeleton-def.js`/`skeleton.js` (26 os), `fur-material.js` (shells via `onBeforeCompile`, robes dans `coats.js`), `eyes.js`, `details.js`, `animator.js` (poses par état, marche IK via `ik.js`), `behavior.js` (machine d'états pure), `cat.js` (entité). Les modules purs sont testés sous Node.
- **Monde** : `world-layout.js` (dimensions, emplacements, définition de navigation), `house.js`, `garden.js`, `nav.js` (zones/obstacles/porte), `lighting.js` + `sky.js` (cycle jour/nuit ~12 min, HDRI mélangés), `quality-presets.js`/`quality.js` (Faible/Moyen/Élevé, détection + baisse automatique), `assets.js`.
- **Interface** : `hud.js`, `actions.js`, `shop.js` (UI) + `shop-logic.js` (pur), `needs.js` (pur), `save.js` (clé `monchat2_save`, migration depuis `monchat_save` v1), `color-picker.js`, `effects.js`, `camera.js`.
- **Paramètres d'URL utiles** : `?debug=1` (FPS/état), `?q=low|medium|high`, `?nofx=1` (sans ombres ni bloom, pour les captures headless), `?time=0.62&pause=1` (heure du cycle figée), `?cam=x,y,z&look=x,y,z`, `?coat=tabby|black|grey|white|ginger`. Visionneuse du chat seul : `chat2/viewer.html?view=3q|side|face&state=sit|sleep|walk|eat&shells=N`.
- Les captures headless (SwiftShader) sont **lentes** (1 à 3 min par image avec fourrure et ombres) : utiliser `q=low&nofx=1` pour vérifier la mise en page, réserver la qualité moyenne aux vérifications finales.

### Spécificités *chat/*
- `cat.js` (le plus gros module) : modèle 3D du chat, fourrure, animations (marche, dort, mange, ronronne, joue, se lave) et comportement autonome piloté par les jauges.
- `hud.js` définit les 5 jauges et leurs taux de décroissance (`rate`, par seconde) ainsi que les pièces. `actions.js` la barre d'actions, `shop.js` la boutique, `furniture.js` les meubles, `scene.js` la maison/jardin, `color-picker.js` le choix de couleur au démarrage, `save.js` la sauvegarde.

### Personnage partagé (*shared/*, *habille/*)
- Le personnage de Sophie est **jouable dans tous les jeux**. État sauvegardé sous `habille_save` (`shared/avatar.js` : palettes, `loadAvatar`/`saveAvatar`, dessin SVG 2D pour `etoiles/`, et `lookDepuisTenueSimple()` qui traduit la tenue simple en habits de la grande garde-robe).
- **3D, façon Roblox classique, tout en cubes** (demande de Sophie, 2026-10-03) : `shared/corps3d.js` (proportions R6 en studs `STUD`, repères `D`/`BLOCS`, blocs `boiteRonde`, squelette épaule/hanche, `corps.peindre('torse'|'bras'|'jambes', matière)`, tête en **cylindre arrondi** façon Roblox (`distanceCube`, `rayonTete`, `geoTeteCube` — noms historiques) + `projeterSurCube` qui plaque dessus ce qui a été fait pour une tête ronde (coque arrondie `distanceCoque` pour cheveux et chapeaux)), `visage3d.js` (visages Roblox dessinés à plat sur la face avant, liste `FACES` dans `avatar.js`, version yeux fermés pour cligner, `YEUX` pour les lunettes), `avatar3d.js` (`buildAvatar3D`, `animerMarche` bras/jambes raides, `animerVie`), `garderobe3d.js` (les habits **peignent les blocs** + pièces par-dessus : jupes `geoJupe`, bandes, coques de chaussures…), `cheveux3d.js` (forme par coiffure + shader de mèches et reflet anisotrope ; les coiffures **lisses** n'ont qu'une surface, seuls bouclés/ondulés/crête gardent des **couches de brins** comme la fourrure de `chat2/` ; `finirCheveux` calcule volume `aVolume` et sens `aFlux` après projection). Sophie veut des cheveux lisses, sans bosse, frange courte d'un seul morceau. Cheveux, chapeaux et lunettes sont construits dans le repère de l'**ancienne tête ronde** (rayon 0.42, centre y = 1.5) puis projetés sur le cube (demi-côté 0.36).
- `habille/` (« Mon personnage ») affiche ce personnage en 3D sur un podium qu'on fait tourner au doigt ; la caméra zoome sur le visage pour les onglets de la tête.

### Atelier de création (*monde/atelier/*)
- Menu Mon monde → 🚀 Projet (`monde/projet.html`) → « Créer mes habits » (l'atelier) ; « Créer mes mini-jeux » = étape suivante (verrouillée).
- `shared/createur.js` (pur, testé) : `comprendre(texte, creation)` = petit assistant **hors ligne** par mots-clés (habits `TYPES`, `COULEURS`, `MOTIFS`, accords), collection `mes_creations` (localStorage), chapeaux compris, `porter(etat, c)` → `etat.porte = { haut, bas, chapeau }` (une robe va dans `haut`), stocké dans `habille_save`.
- `shared/creation3d.js` : textures canevas (tissu + motif `peindreTissu`, + dessin de Sophie) posées sur les blocs (face avant du torse, des jambes, quart avant de la jupe) ; `habillerCreation(corps, c)` ; `avatar.userData.recomposer()` pour le dessin en direct. Les fonctions `construireHaut/Bas/Robe` acceptent une matière `matPerso`.
- L'onglet 👗 Tenue de `habille/` liste « Mes créations » ; choisir une tenue simple enlève les créations portées.

## Documentation de conception

`docs/plans/` contient les plans de conception et d'implémentation datés (design + plan task-by-task) de chaque jeu. Les consulter pour comprendre l'intention d'origine avant une grosse évolution.
