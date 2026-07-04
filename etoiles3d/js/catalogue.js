// Ce que le magasin propose : des animaux (qui te suivent) et des décorations
// (qui apparaissent dans ton monde). Prix en pièces.
// Ce fichier ne contient QUE les infos texte — le dessin 3D est dans models.js.

export const ANIMAUX = [
    { id: 'chien',    nom: 'Chien',    emoji: '🐶', prix: 30, vole: false },
    { id: 'chat',     nom: 'Chat',     emoji: '🐱', prix: 30, vole: false },
    { id: 'lapin',    nom: 'Lapin',    emoji: '🐰', prix: 35, vole: false },
    { id: 'oiseau',   nom: 'Oiseau',   emoji: '🐦', prix: 40, vole: true },
    { id: 'papillon', nom: 'Papillon', emoji: '🦋', prix: 40, vole: true },
    { id: 'licorne',  nom: 'Licorne',  emoji: '🦄', prix: 80, vole: false },
];

export const DECOS = [
    { id: 'fleurs',     nom: 'Fleurs',      emoji: '🌸', prix: 20 },
    { id: 'ballons',    nom: 'Ballons',     emoji: '🎈', prix: 25 },
    { id: 'guirlandes', nom: 'Guirlandes',  emoji: '🎉', prix: 25 },
    { id: 'arcenciel',  nom: 'Arc-en-ciel', emoji: '🌈', prix: 30 },
    { id: 'fontaine',   nom: 'Fontaine',    emoji: '⛲', prix: 50 },
    { id: 'chateau',    nom: 'Château',     emoji: '🏰', prix: 70 },
];
