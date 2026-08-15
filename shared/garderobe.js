// Garde-robe partagée — le catalogue de tout ce qu'on peut porter dans le jeu
// de défilé : coiffures, hauts, bas, robes, chaussures, chapeaux, lunettes et
// accessoires spéciaux.
//
// Ce module ne connaît PAS Three.js : il sert aussi à fabriquer les menus
// (emoji + nom). Les formes 3D correspondantes sont dans `garderobe3d.js`.

// --- Palettes -------------------------------------------------------------

// Les teintes de peau proposées dans les cabines
export const PEAUX = ['#ffe0bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3317'];

// La grande palette des vêtements
export const COULEURS = [
    '#ffffff', '#f1f3f5', '#868e96', '#212529',
    '#ff5fa2', '#ffc9de', '#e03131', '#ff922b',
    '#ffd43b', '#94d82d', '#2f9e44', '#20c997',
    '#4dabf7', '#1971c2', '#9775fa', '#6741d9',
    '#f4a261', '#8a5a2b', '#ffe066', '#c0c0c0',
];

// Les couleurs de cheveux (naturelles puis fantaisie)
export const COULEURS_CHEVEUX = [
    '#2b1b0e', '#5b3a1a', '#8a5a2b', '#a0522d', '#e6b800', '#f5deb3',
    '#d9d9d9', '#ff5fa2', '#e03131', '#9775fa', '#4dabf7', '#20c997',
];

// --- Les rayons du magasin ------------------------------------------------
// Chaque rayon décrit un meuble de la grande pièce :
//   champ        : la case de la tenue qu'il modifie
//   champCouleur : la case de la couleur associée (facultatif)
//   palette      : 'couleurs' | 'cheveux' | 'peaux'
//   items        : { id, nom, emoji }

export const RAYONS = {
    peau: {
        titre: 'Les cabines de couleur',
        emoji: '🚪',
        champ: 'skin',
        palette: 'peaux',
        couleursSeulement: true,
        items: [],
    },

    coiffure: {
        titre: 'Les perruques',
        emoji: '💇',
        champ: 'hairStyle',
        champCouleur: 'hairColor',
        palette: 'cheveux',
        items: [
            { id: 'aucun', nom: 'Sans perruque', emoji: '🙅' },
            { id: 'longs', nom: 'Cheveux longs', emoji: '👩' },
            { id: 'ondules', nom: 'Longs ondulés', emoji: '🧜‍♀️' },
            { id: 'carre', nom: 'Carré', emoji: '💇‍♀️' },
            { id: 'courts', nom: 'Cheveux courts', emoji: '🧑' },
            { id: 'couettes', nom: 'Couettes', emoji: '👧' },
            { id: 'queue', nom: 'Queue de cheval', emoji: '🏃‍♀️' },
            { id: 'tresses', nom: 'Tresses', emoji: '👸' },
            { id: 'boucles', nom: 'Bouclés', emoji: '👩‍🦱' },
            { id: 'chignon', nom: 'Chignon', emoji: '💃' },
            { id: 'macarons', nom: 'Macarons', emoji: '🍡' },
            { id: 'crete', nom: 'Crête', emoji: '🤘' },
        ],
    },

    haut: {
        titre: 'Les hauts',
        emoji: '👕',
        champ: 'top',
        champCouleur: 'topColor',
        items: [
            { id: 'aucun', nom: 'Rien', emoji: '🙅' },
            { id: 'tshirt', nom: 'T-shirt', emoji: '👕' },
            { id: 'pull', nom: 'Pull', emoji: '🧶' },
            { id: 'chemise', nom: 'Chemise', emoji: '👔' },
            { id: 'debardeur', nom: 'Débardeur', emoji: '🎽' },
            { id: 'sweat', nom: 'Sweat à capuche', emoji: '🧥' },
            { id: 'veste', nom: 'Veste', emoji: '🥼' },
            { id: 'paillettes', nom: 'Haut à paillettes', emoji: '✨' },
            { id: 'marin', nom: 'Marinière', emoji: '⚓' },
        ],
    },

    bas: {
        titre: 'Les pantalons et jupes',
        emoji: '👖',
        champ: 'bottom',
        champCouleur: 'bottomColor',
        items: [
            { id: 'aucun', nom: 'Rien', emoji: '🙅' },
            { id: 'pantalon', nom: 'Pantalon', emoji: '👖' },
            { id: 'jean', nom: 'Jean', emoji: '👖' },
            { id: 'short', nom: 'Short', emoji: '🩳' },
            { id: 'jupe', nom: 'Jupe', emoji: '👗' },
            { id: 'jupe_longue', nom: 'Jupe longue', emoji: '🧕' },
            { id: 'jogging', nom: 'Jogging', emoji: '🏃' },
            { id: 'legging', nom: 'Legging', emoji: '🤸' },
            { id: 'tutu', nom: 'Tutu', emoji: '🩰' },
        ],
    },

    robe: {
        titre: 'Les robes',
        emoji: '👗',
        champ: 'robe',
        champCouleur: 'robeColor',
        items: [
            { id: 'aucune', nom: 'Pas de robe', emoji: '🙅' },
            { id: 'robe', nom: 'Robe', emoji: '👗' },
            { id: 'robe_longue', nom: 'Robe longue', emoji: '🥻' },
            { id: 'robe_princesse', nom: 'Robe de princesse', emoji: '👸' },
            { id: 'robe_paillettes', nom: 'Robe à paillettes', emoji: '✨' },
            { id: 'combinaison', nom: 'Combinaison', emoji: '🦸' },
            { id: 'kimono', nom: 'Kimono', emoji: '🎎' },
            { id: 'costume', nom: 'Costume', emoji: '🤵' },
        ],
    },

    chaussures: {
        titre: 'Les chaussures',
        emoji: '👟',
        champ: 'shoes',
        champCouleur: 'shoesColor',
        items: [
            { id: 'aucune', nom: 'Pieds nus', emoji: '🦶' },
            { id: 'baskets', nom: 'Baskets', emoji: '👟' },
            { id: 'bottes', nom: 'Bottes', emoji: '🥾' },
            { id: 'talons', nom: 'Talons', emoji: '👠' },
            { id: 'ballerines', nom: 'Ballerines', emoji: '🩰' },
            { id: 'sandales', nom: 'Sandales', emoji: '🩴' },
            { id: 'bottes_pluie', nom: 'Bottes de pluie', emoji: '👢' },
        ],
    },

    chapeau: {
        titre: 'Les chapeaux',
        emoji: '👒',
        champ: 'hat',
        champCouleur: 'hatColor',
        items: [
            { id: 'aucun', nom: 'Rien sur la tête', emoji: '🙅' },
            { id: 'couronne', nom: 'Couronne', emoji: '👑' },
            { id: 'diademe', nom: 'Diadème', emoji: '💎' },
            { id: 'chapeau', nom: 'Haut-de-forme', emoji: '🎩' },
            { id: 'paille', nom: 'Chapeau de paille', emoji: '👒' },
            { id: 'casquette', nom: 'Casquette', emoji: '🧢' },
            { id: 'bonnet', nom: 'Bonnet', emoji: '🎿' },
            { id: 'noeud', nom: 'Nœud', emoji: '🎀' },
            { id: 'fleur', nom: 'Fleur', emoji: '🌸' },
            { id: 'bandeau', nom: 'Bandeau', emoji: '💫' },
            { id: 'oreilles', nom: 'Oreilles de chat', emoji: '🐱' },
        ],
    },

    lunettes: {
        titre: 'Les lunettes',
        emoji: '🕶️',
        champ: 'glasses',
        champCouleur: 'glassesColor',
        items: [
            { id: 'aucune', nom: 'Sans lunettes', emoji: '🙅' },
            { id: 'rondes', nom: 'Lunettes rondes', emoji: '👓' },
            { id: 'soleil', nom: 'Lunettes de soleil', emoji: '🕶️' },
            { id: 'coeur', nom: 'Lunettes cœur', emoji: '😍' },
            { id: 'etoile', nom: 'Lunettes étoile', emoji: '⭐' },
        ],
    },

    accessoire: {
        titre: 'Les accessoires magiques',
        emoji: '✨',
        champ: 'accessoire',
        champCouleur: 'accColor',
        items: [
            { id: 'aucun', nom: 'Aucun', emoji: '🙅' },
            { id: 'cape', nom: 'Cape', emoji: '🦸' },
            { id: 'ailes', nom: 'Ailes de fée', emoji: '🧚' },
            { id: 'baguette', nom: 'Baguette magique', emoji: '🪄' },
            { id: 'collier', nom: 'Collier', emoji: '📿' },
            { id: 'sac', nom: 'Sac à main', emoji: '👜' },
            { id: 'echarpe', nom: 'Écharpe', emoji: '🧣' },
            { id: 'aureole', nom: 'Auréole', emoji: '😇' },
            { id: 'ballons', nom: 'Ballons', emoji: '🎈' },
        ],
    },
};

// --- La tenue de départ ---------------------------------------------------

export const TENUE_DEFAUT = {
    gender: 'fille',
    skin: '#f1c27d',
    hairStyle: 'longs', hairColor: '#5b3a1a',
    robe: 'aucune', robeColor: '#ff5fa2',
    top: 'tshirt', topColor: '#4dabf7',
    bottom: 'jean', bottomColor: '#1971c2',
    shoes: 'baskets', shoesColor: '#ffffff',
    hat: 'aucun', hatColor: '#ffd43b',
    glasses: 'aucune', glassesColor: '#212529',
    accessoire: 'aucun', accColor: '#e03131',
};

export function tenueVide() {
    return Object.assign({}, TENUE_DEFAUT);
}

// Récupère la palette d'un rayon
export function paletteDe(rayon) {
    if (rayon.palette === 'cheveux') return COULEURS_CHEVEUX;
    if (rayon.palette === 'peaux') return PEAUX;
    return COULEURS;
}

// Le nom lisible de ce qu'on porte dans un rayon (pour les résumés)
export function nomPorte(rayon, tenue) {
    const id = tenue[rayon.champ];
    const item = rayon.items.find((i) => i.id === id);
    return item ? item.nom : '';
}
