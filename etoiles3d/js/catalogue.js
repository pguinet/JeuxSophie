// Ce que le magasin propose : des animaux (qui te suivent) et des décorations
// (qui apparaissent dans ton monde). Prix en pièces.
// Ce fichier ne contient QUE les infos texte — le dessin 3D est dans models.js.

// etoilesX = multiplicateur d'étoiles gagnées : plus l'animal est cher, plus il
// est fort (le moins cher x2, la licorne x10). On applique le meilleur des
// animaux possédés.
export const ANIMAUX = [
    { id: 'chien',    nom: 'Chien',    emoji: '🐶', prix: 30, vole: false, etoilesX: 2 },
    { id: 'chat',     nom: 'Chat',     emoji: '🐱', prix: 30, vole: false, etoilesX: 2 },
    { id: 'lapin',    nom: 'Lapin',    emoji: '🐰', prix: 35, vole: false, etoilesX: 3 },
    { id: 'oiseau',   nom: 'Oiseau',   emoji: '🐦', prix: 40, vole: true,  etoilesX: 4 },
    { id: 'papillon', nom: 'Papillon', emoji: '🦋', prix: 40, vole: true,  etoilesX: 4 },
    { id: 'licorne',  nom: 'Licorne',  emoji: '🦄', prix: 80, vole: false, etoilesX: 10 },
];

export const DECOS = [
    { id: 'fleurs',     nom: 'Fleurs',      emoji: '🌸', prix: 20 },
    { id: 'ballons',    nom: 'Ballons',     emoji: '🎈', prix: 25 },
    { id: 'guirlandes', nom: 'Guirlandes',  emoji: '🎉', prix: 25 },
    { id: 'arcenciel',  nom: 'Arc-en-ciel', emoji: '🌈', prix: 30 },
    { id: 'fontaine',   nom: 'Fontaine',    emoji: '⛲', prix: 50 },
    { id: 'chateau',    nom: 'Château',     emoji: '🏰', prix: 70 },
];
