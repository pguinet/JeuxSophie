# The Biggest Challenge v2 — design

Date : 2026-10-24 (après une première session de jeu de Sophie sur la v1).
Base : v1 décrite dans `docs/plans/2026-10-24-biggest-challenge-design.md` (architecture,
avatar, classement, sauvegarde inchangés sauf mention contraire).

## Ce que Sophie a dit / choisi

> « met beaucoup plus de jeu et les jeux doivent etre plus compliquer car la c est trop simple
> pas besoin de racoursir le temps juste rendre les questions plus difficile et le jeu the
> biggest challenge je voudrais que on y accede sur un site apars »

- **Site à part** : « a » → sa propre adresse **`http://challenge.local/`** ; « b » → **retiré du
  menu** de `jeux.local`. « a » → **on repart de zéro** (pas d'export de compte ; le
  localStorage est propre à chaque adresse).
- **Plus difficile** : « 1 2 3 » → **mots plus durs**, **grammaire de grands**, **réponses
  pièges**. Refusés : écrire la réponse, textes à lire, choix de niveau. Les temps
  (20 s/question au grand quiz, 60 s à la course) **ne changent pas**.
- **Nouveaux jeux** : « 2 3 4 5 6 7 8 9 10 11 » → relier, vrai ou faux, l'intrus, les
  contraires, what time is it?, le pendu, lettres mélangées, j'écoute des phrases, survie,
  le vrai concours. (Memory refusé.) → **16 jeux** au total.
- Morceaux 1 (difficulté) et 2 (10 jeux) validés (« oui », « oui »).

## Hypothèses (non dites par Sophie)

- « Plus difficile » s'applique aux jeux existants : chaque item de banque reçoit un `niveau`
  (1 = base 6ème, 2 = difficile, 3 = expert) et les jeux tirent **majoritairement 2 et 3**
  (≈ 20 % / 45 % / 35 %). La Survie monte de 1 à 3 au fil de la partie.
- Les points, le classement (30 joueurs inventés) et l'avatar ne changent pas.
- Niveau visé : fin de 6ème / début de 5ème, comme les sujets Big Challenge 6ème les plus durs.

## Critères de réussite

- Sophie trouve les questions « pas trop simples » (elle doit se tromper de temps en temps).
- 16 jeux jouables, tous rapportent des points.
- `http://challenge.local/` ouvre directement le jeu ; la carte a disparu de `jeux.local`.

## 1. Contenu plus difficile

Toutes les banques gagnent un champ `niveau` (1, 2, 3). Items v1 : niveau 1 par défaut,
sauf ceux que la relecture juge plus durs.

| Banque | v1 | v2 visé | Ajouts |
|---|---|---|---|
| `vocab` | 216 mots, 13 thèmes | ≥ 450 mots, ≥ 20 thèmes | thèmes `metiers`, `sentiments`, `ville`, `nature`, `verbes`, `adjectifs`, `cuisine`, + mots durs dans les thèmes existants (*cupboard, dishwasher, ceiling, neighbour, library, bakery, firefighter, proud, scared, to borrow, to climb…*) |
| `grammaire` | 97 QCM | ≥ 220 QCM | passé simple (be, réguliers, irréguliers, *did*), comparatifs/superlatifs, *going to*, *must/mustn't*, *some/any*, *much/many*, présent simple vs *-ing*, *there was/were*, *can/could*, pronoms compléments, *whose*, prépositions de temps |
| `pieges` (nouveau) | — | ≥ 80 QCM | homophones et faux amis : *their/there/they're, its/it's, where/were/wear, quiet/quite, than/then, to/too/two, your/you're, buy/by/bye, lose/loose, hear/here, whose/who's, actually ≠ actuellement, library ≠ librairie…* (format QCM, phrase à trou) |
| `culture` | 51 QCM | ≥ 110 QCM | plus de pays, d'histoire, de fêtes, de symboles, de littérature jeunesse, de sport |
| `phrases` | 44 | ≥ 100 | phrases plus longues (5-9 mots), passé, questions |

Règles de qualité (inchangées et renforcées) : une seule bonne réponse, leurres plausibles du
même type, anglais britannique, faits exacts en 2026. **Réponses pièges** : pour les QCM de
grammaire et `pieges`, les leurres sont des formes proches (même verbe à un autre temps, mot
homophone…) ; pour le vocabulaire, les leurres sont tirés **en priorité parmi les mots du même
thème et du même niveau, ou d'orthographe proche** (distance d'édition ≤ 3).

Tirage : `tirerParNiveau(banque, n, rng, poids = { 1: .2, 2: .45, 3: .35 })`.

## 2. Les 10 nouveaux jeux

| id | Nom | Type d'écran | Contenu | Format |
|---|---|---|---|---|
| `relier` | 🔗 Relier | nouveau `ui-relier` | vocab | 3 manches de 5 paires EN ↔ FR ; clic gauche puis droite ; erreur = secousse |
| `vraifaux` | ✅ Vrai ou faux | QCM (2 choix) | nouvelle banque `vraifaux` (≥ 120 affirmations en anglais, pièges) | 15 affirmations |
| `intrus` | 🕵️ L'intrus | QCM | généré : 3 mots d'un thème + 1 d'un thème « voisin » | 10 questions |
| `contraires` | ↔️ Les contraires | QCM | nouvelle banque `contraires` (≥ 70 paires) | 12 questions, leurres = autres adjectifs du même registre |
| `heure` | 🕒 What time is it? | QCM avec horloge SVG | généré (heures britanniques : *o'clock, half past, quarter past/to, five past, twenty to…*) | 10 questions, leurres = confusion past/to, heure ±1, minutes voisines |
| `pendu` | 🎈 Le pendu | nouveau `ui-pendu` | vocab niveau ≥ 2, indice en français + emoji si `image` | 5 mots, 7 erreurs max par mot, clavier physique + lettres cliquables |
| `lettres` | 🔤 Lettres mélangées | nouveau `ui-lettres` | vocab niveau ≥ 2 (4 à 11 lettres) | 8 mots, indice en français, clic sur les lettres, retour arrière |
| `ecoutephrases` | 🎧 J'écoute des phrases | QCM avec audio | `phrases` (audio pré-généré) | 10 questions, choix = 4 traductions françaises |
| `survie` | ❤️ Survie | QCM avec vies | mélange de toutes les banques QCM, niveau qui monte tous les 5 bons | 3 vies ; fin à 0 vie ; record = nombre de bonnes réponses |
| `concours` | 🏆 Le vrai concours | QCM | 45 questions mélangées (vocab, grammaire, pièges, culture, heure, contraires, vrai/faux) | pas de chrono par question ; score « x / 45 » + points |

Points : mêmes règles que la v1 (`10 + bonusVitesse + bonusSérie` pour les QCM). Nouveaux
écrans : relier 10 pts par paire juste du premier coup (5 sinon) ; pendu 10 + 2 × vies
restantes par mot trouvé ; lettres 10 pts par mot sans erreur, 5 avec erreurs.

Accueil : 16 cartes groupées en 4 familles (champ `famille` de `JEUX`) —
**📚 Les mots** : `image`, `relier`, `intrus`, `contraires`, `pendu`, `lettres` ;
**✏️ Phrases et grammaire** : `phrases`, `vraifaux`, `heure` ;
**🎧 L'écoute** : `ecoute`, `ecoutephrases` ;
**🏆 Les défis** : `quiz`, `course`, `culture`, `survie`, `concours`.
La banque `pieges` alimente le grand quiz, la course, la survie et le concours (et la
grammaire de ces jeux mélange `grammaire` et `pieges`).

## 3. Adresse à part

- Le Pi publie un **deuxième nom mDNS** `challenge.local` (service systemd
  `avahi-alias-challenge` qui lance `avahi-publish -a -R challenge.local <IP courante>`,
  l'IP étant lue au démarrage, car elle vient du DHCP).
- lighttpd : `$HTTP["host"] =~ "^challenge\.local(:[0-9]+)?$" { server.document-root =
  "/var/www/jeux/challenge" }` dans `deploy/50-jeux.conf` (versionné).
- `challenge/` n'utilise que des chemins relatifs : il fonctionne tel quel à la racine.
- Carte 🇬🇧 retirée de `index.html` racine ; `jeux.local/challenge/` reste accessible
  (pas de redirection) mais n'est plus annoncé.
- Procédure : tester la conf (`lighttpd -tt`), sauvegarder l'ancienne, redémarrer, vérifier
  `curl -sI http://challenge.local/` → 200 et `jeux.local` toujours OK. Documenté dans
  `deploy/README.md`.

## Architecture (ajouts à la v1)

```
challenge/js/donnees/{pieges,vraifaux,contraires}.js   # nouvelles banques
challenge/js/heure.js        # PUR : heureEnAnglais(h, m), qHeure(rng), horlogeSVG(h, m)
challenge/js/tirage.js       # PUR : tirerParNiveau, leurresProches (distance d'édition)
challenge/js/jeux.js         # + 10 entrées JEUX (famille, type), générateurs
challenge/js/partie.js       # + mode vies (survie), contrôleurs relier/pendu/lettres
challenge/js/ui-qcm.js       # + visuel SVG (horloge), affichage des vies
challenge/js/ui-relier.js, ui-pendu.js, ui-lettres.js
challenge/audio/phrases/*.ogg   # prononciation des phrases (gen-audio étendu)
deploy/50-jeux.conf, deploy/avahi-alias-challenge.service, deploy/README.md
```

## Tests et qualité

Comme la v1 : tests Node des modules purs (niveaux présents, tirage pondéré, leurres
proches distincts, heures britanniques exactes pour les 144 combinaisons utilisées, intrus
sans ambiguïté, contraires symétriques, vies de la survie, contrôleurs relier/pendu/lettres),
intégrité des banques, lint Docker, captures headless de chaque nouvel écran, relecture du
contenu par un relecteur dédié (exactitude, une seule bonne réponse).

## Hors périmètre

Saisie libre de réponses, textes de lecture, choix du niveau, Memory, export de compte,
classement en réseau.
