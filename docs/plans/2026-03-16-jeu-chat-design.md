# Mon Chat — Design

## Concept
Tamagotchi 3D où Sophie s'occupe d'un chat dans sa maison avec jardin.

## Le chat
- Modèle 3D bloc (style personnage Aventure) : corps, tête, oreilles, queue, pattes
- Choix de couleur au lancement (orange, noir/blanc, gris, blanc, roux)
- Animations : marche, dort, mange, ronronne (vibration), joue, se lave
- Le chat se balade tout seul dans la maison/jardin quand on ne fait rien

## 5 jauges (baissent pendant le jeu)
- Faim, Soif, Bonheur, Propreté, Fatigue
- Affichées en haut de l'écran avec icônes
- Le chat change de comportement selon les jauges (triste si bonheur bas, dort si fatigue haute, etc.)

## Actions (boutons en bas)
- Nourrir (croquettes/poisson), Donner à boire, Caresser, Laver, Coucher
- Chaque action a une petite animation du chat

## Maison + jardin
- Scène 3D : pièce intérieure (coussin, gamelle, litière) + jardin extérieur (herbe, arbre)
- Le chat se déplace entre les deux zones
- Caméra fixe qu'on peut tourner autour de la scène

## Boutique
- Pièces gagnées avec le temps (1 pièce/minute de jeu)
- Acheter : jouets (balle, souris), coussins, types de nourriture, accessoires (collier, noeud)

## Sauvegarde
- localStorage
- Jauges ne baissent que pendant le jeu

## Tech
- Three.js via CDN, même structure que le jeu aventure
- Sous-dossier `chat/`
- Tactile (mobile first pour Sophie)
