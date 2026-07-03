# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Présentation

Collection de petits jeux web 3D faits pour Sophie (la fille de Pascal), jouables sur mobile/tablette. Chaque jeu vit dans son propre sous-dossier à la racine (`aventure/`, `chat/`) et est totalement autonome.

- **`aventure/`** — *Aventure Jungle* : jeu d'action 3D à la troisième personne (personnage visible, caméra derrière/au-dessus). Le joueur explore une jungle, combat des monstres (serpent, araignée, crocodile, singe) à l'épée et au projectile, gagne des pièces et progresse via un système de quêtes.
- **`chat/`** — *Mon Chat* : tamagotchi 3D. Sophie s'occupe d'un chat dans une maison avec jardin (5 jauges : faim, soif, bonheur, propreté, fatigue), avec boutique de meubles et sauvegarde locale.

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

Il n'y a **aucun test automatisé ni outil de lint** dans ce dépôt — la vérification se fait en jouant dans le navigateur. Comme les jeux utilisent des ES modules, ils doivent être servis par HTTP (pas d'ouverture `file://`).

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

### Spécificités *chat/*
- `cat.js` (le plus gros module) : modèle 3D du chat, fourrure, animations (marche, dort, mange, ronronne, joue, se lave) et comportement autonome piloté par les jauges.
- `hud.js` définit les 5 jauges et leurs taux de décroissance (`rate`, par seconde) ainsi que les pièces. `actions.js` la barre d'actions, `shop.js` la boutique, `furniture.js` les meubles, `scene.js` la maison/jardin, `color-picker.js` le choix de couleur au démarrage, `save.js` la sauvegarde.

## Documentation de conception

`docs/plans/` contient les plans de conception et d'implémentation datés (design + plan task-by-task) de chaque jeu. Les consulter pour comprendre l'intention d'origine avant une grosse évolution.
