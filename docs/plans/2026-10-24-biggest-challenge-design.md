# The Biggest Challenge — design

Date : 2026-10-24. Demandé par Sophie (6ème) : « un jeu comme The Big Challenge »
(concours d'anglais en QCM), avec **classement**, **grande variété de jeux**,
**avatar** et **compte à créer**.

## Ce que Sophie a dit / choisi

- Jeu d'entraînement à l'anglais, **niveau 6ème**, inspiré de l'appli *The Big Challenge PLAY*.
- **Classement contre des joueurs inventés** (pas de famille, pas de réseau).
- **Nouvel avatar** créé dans ce jeu (pas le personnage de `habille/`) :
  **2D, façon figurine Pop** — grosse tête ronde, petit corps, yeux noirs brillants ;
  beaucoup de couleurs de peau et de cheveux ; **12 coiffures basiques, 6 filles + 6 garçons**.
  Prototype validé : `pop.html` (scratchpad) ; seule remarque : la coiffure « pics »
  laisse un front trop grand → baisser la ligne des cheveux.
- **Récompense : uniquement des points** (pas de pièces, boutique ni badges).
- **6 jeux** : grand quiz, image et mot, j'écoute, phrases en morceaux, course contre la montre, culture.
- Nom : **The Biggest Challenge**.

## Hypothèses (non dites par Sophie)

- Un seul compte par navigateur (pseudo + avatar), modifiable plus tard depuis l'accueil.
- Joué sur **ordinateur** (souris + touches 1-4), mise en page responsive conservée.
- Pas de Three.js : DOM + SVG, comme `apprendre/`.
- Tout en anglais britannique pour les mots (consignes en français).

## Critères de réussite

- Sophie crée son compte et son avatar en moins de 2 minutes.
- Les 6 jeux sont jouables et rapportent des points visibles dans le classement.
- Elle peut monter dans le classement en jouant quelques parties par jour, sans que ce soit
  gagné d'avance (les joueurs inventés progressent aussi).
- Marche hors ligne depuis le Pi (`http://jeux.local/challenge/`), aucune dépendance CDN.

## Parcours

1. **Premier lancement** → écran *Créer mon compte* : pseudo (1-16 caractères), puis éditeur
   d'avatar (aperçu en direct) : peau, coiffure (onglet Filles / Garçons), couleur des cheveux,
   couleur du haut, couleur du bas, couleur de fond.
2. **Accueil** : avatar, pseudo, total de points, rang (« 12ᵉ sur 31 »), bouton ✏️ avatar,
   bouton 🥇 classement, grille des 6 jeux (meilleur score de chaque jeu affiché).
3. **Partie** → écran de résultat : bonnes réponses, points gagnés, ancien/nouveau rang
   (animation « Tu as dépassé Lucas ! »).
4. **Classement** : liste des 31 joueurs (avatars miniatures, pseudo, points), ligne de Sophie
   surlignée et centrée à l'ouverture.

## Les 6 jeux

| Jeu | Contenu | Format |
|---|---|---|
| ❓ Grand quiz | mélange vocabulaire + grammaire + culture | 15 QCM, 4 choix, chrono 20 s/question |
| 🖼️ Image et mot | emoji → mot anglais | 10 QCM, 4 choix |
| 🎧 J'écoute | mot prononcé → bonne image (emoji) | 10 QCM, 4 choix, bouton 🔊 réécouter |
| 🧩 Phrases en morceaux | étiquettes mélangées → phrase dans l'ordre | 8 phrases, clic pour placer, clic pour retirer |
| ⚡ Course contre la montre | QCM vocabulaire + grammaire | 60 s, autant que possible, erreur = pas de point |
| 🎡 Culture | pays anglophones, fêtes, Londres, drapeaux… | 10 QCM, 4 choix |

Sans chrono par question hors grand quiz (le bonus de vitesse compte quand même).
Une mauvaise réponse révèle la bonne (comme `apprendre/`).

## Points

`points(question) = 10 + bonusVitesse + bonusSérie` pour une bonne réponse, 0 sinon.
- `bonusVitesse` : 5 si réponse < 3 s, puis décroît linéairement jusqu'à 0 à 10 s.
- `bonusSérie` : +2 à partir de la 3ᵉ bonne réponse d'affilée (plafond +10).
- Phrases en morceaux : 10 par phrase juste du premier coup, 5 au second, 0 ensuite.
- Le total de Sophie = somme de toutes les parties (jamais décroissant).

## Classement (joueurs inventés)

- **30 joueurs** générés de façon **déterministe** à partir d'une graine fixe : pseudo
  (liste de prénoms + suffixes type « Lucas_78 », « EmmaStar »), avatar aléatoire, points de
  départ répartis de ~50 à ~4000 (Sophie commence vers le bas du classement).
- **Progression quotidienne** : chaque joueur a un rythme (0 à ~180 pts/jour) ; ses points
  = départ + Σ gains journaliers pseudo-aléatoires (graine = id joueur + jour) depuis la date
  de création du compte. Calcul pur, mêmes résultats à chaque ouverture, pas besoin de sauver.
- Rang = position de Sophie dans le tri par points décroissants (à égalité, Sophie devant).

## Avatar figurine Pop

- `avatarSVG(look, {size})` → chaîne SVG (pure, testable). `look = { peau, coiffure,
  cheveux, haut, bas, fond }`.
- Palettes : **10 peaux**, **12 couleurs de cheveux** (naturelles + fantaisie), **12 couleurs**
  de vêtements, **8 fonds**.
- **12 coiffures** : filles — longs, queue de cheval, couettes, carré, chignon, tresse ;
  garçons — court, pics, afro, mèche sur le côté, bouclés, rasé. Chaque coiffure = calque
  arrière (derrière la tête) + calque avant (frange), comme le prototype.

## Contenu (banques de questions, fichiers de données pures)

- `vocab` : ~150 mots `{ en, fr, emoji, theme }` (animaux, nourriture, couleurs, nombres,
  corps, vêtements, école, maison, famille, jours/mois, météo, sports, transports).
  Seuls les mots dont l'emoji est sans ambiguïté servent à *Image et mot* / *J'écoute*.
- `grammaire` : ~60 QCM écrits à la main, programme 6ème (be/have got, pronoms, possessifs,
  a/an, pluriels irréguliers, this/these, there is/are, can, présent simple 3ᵉ pers.,
  présent en -ing, prépositions, mots interrogatifs, l'heure).
- `culture` : ~50 QCM (UK, USA, Irlande, Australie, Canada ; fêtes ; Londres ; drapeaux ;
  royauté ; nourriture).
- `phrases` : ~40 phrases de 3 à 7 mots avec traduction française en consigne.
- Les leurres viennent du même thème que la bonne réponse ; jamais deux fois le même choix.

## Son

- Effets (bon, faux, clic, fin) en Web Audio, repris de `apprendre/js/audio.js`, bouton muet.
- **Prononciation** : fichiers audio **pré-générés** hors ligne (`challenge/audio/<mot>.ogg`)
  par un script Docker (synthèse vocale *piper*, voix anglaise britannique) — la tablette
  ou l'ordinateur n'a pas forcément de voix anglaise installée. Repli sur
  `speechSynthesis` (`en-GB`) si le fichier manque.

## Architecture

```
challenge/
  index.html            # écran unique, charge js/main.js
  css/style.css
  js/main.js            # routeur d'écrans (compte, accueil, jeu, résultat, classement)
  js/save.js            # clé localStorage `biggest_save` : profil, total, meilleurs scores
  js/avatar.js          # PUR : palettes, COIFFURES, avatarSVG(), lookAleatoire(rng)
  js/editeur-avatar.js  # UI de création / modification
  js/rng.js             # PUR : PRNG à graine (mulberry32), shuffle, pick
  js/points.js          # PUR : calcul des points
  js/classement.js      # PUR : bots(), pointsBot(bot, jour), classement(profil, aujourdHui)
  js/jeux.js            # PUR : JEUX (méta) + genererPartie(idJeu, rng) → liste de questions
  js/donnees/{vocab,grammaire,culture,phrases}.js   # banques de questions
  js/ui-qcm.js          # écran QCM générique (quiz, image, écoute, course, culture)
  js/ui-phrases.js      # écran Phrases en morceaux
  js/audio.js           # effets + prononcer(mot)
  audio/*.ogg           # prononciations pré-générées
  tools/gen-audio.sh    # génération des .ogg (Docker)
  tools/lint.sh, eslint.config.js
  test/*.test.mjs       # node --test challenge/test/
```

Modèle de question QCM : `{ consigne, visuel?, audio?, choix: [{ texte, juste }], theme }`.
Modèle phrase : `{ consigne, mots: [...] }` (ordre juste = ordre du tableau).

Sauvegarde `biggest_save` : `{ v: 1, profil: { pseudo, look, creeLe }, total, meilleurs:
{ [idJeu]: points }, parties, muet }`. Lecture tolérante (JSON invalide → nouveau compte).

## Tests et qualité

- Tests Node (`node --test challenge/test/`) des modules purs : points, classement
  (déterminisme, progression, rang), génération des parties (4 choix distincts, une seule
  bonne réponse, pas de doublon dans une partie), intégrité des banques (champs requis,
  mots audio présents dans `vocab`), avatar (12 coiffures, 6/6, SVG bien formé), sauvegarde.
- ESLint 9 via Docker (`challenge/tools/lint.sh`).
- Vérification visuelle par capture Chrome headless de chaque écran avant de montrer à Sophie.
- Ajout d'une carte dans `index.html` racine, section « 📚 Pour apprendre ».

## Hors périmètre

Pièces, boutique, badges, classement en réseau, plusieurs comptes, niveaux autres que 6ème.
