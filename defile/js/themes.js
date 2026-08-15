// Les thèmes du défilé et la façon de noter une tenue.
//
// Chaque thème dit ce qu'il aime : les habits, les chaussures, ce qu'on met
// sur la tête, les accessoires et les couleurs. Plus la tenue colle au thème,
// plus les juges donnent d'étoiles.

export const THEMES = [
    {
        id: 'princesse', nom: 'Princesse', emoji: '👑',
        astuce: 'Une belle robe, une couronne et des chaussures brillantes !',
        aime: {
            robe: ['robe_princesse', 'robe_longue', 'robe_paillettes', 'robe'],
            bottom: ['jupe_longue', 'tutu'],
            top: ['paillettes'],
            shoes: ['talons', 'ballerines'],
            hat: ['couronne', 'diademe'],
            accessoire: ['baguette', 'collier'],
            hairStyle: ['chignon', 'longs', 'tresses'],
        },
        couleurs: ['#ff5fa2', '#ffc9de', '#9775fa', '#6741d9', '#ffd43b', '#ffffff', '#ffe066'],
    },
    {
        id: 'plage', nom: 'Journée à la plage', emoji: '🏖️',
        astuce: 'Il fait chaud ! Pense au short et aux lunettes de soleil.',
        aime: {
            top: ['debardeur', 'tshirt', 'marin'],
            bottom: ['short'],
            robe: [],
            shoes: ['sandales', 'aucune'],
            hat: ['paille', 'casquette', 'bandeau'],
            glasses: ['soleil'],
            accessoire: ['sac'],
            hairStyle: ['queue', 'couettes', 'carre'],
        },
        couleurs: ['#4dabf7', '#20c997', '#ffd43b', '#ff922b', '#ffffff', '#f4a261'],
    },
    {
        id: 'froid', nom: 'Grand froid', emoji: '❄️',
        astuce: 'Brrr ! Un gros pull, un bonnet et des bottes bien chaudes.',
        aime: {
            top: ['pull', 'sweat', 'veste'],
            bottom: ['pantalon', 'jean', 'legging'],
            shoes: ['bottes', 'bottes_pluie'],
            hat: ['bonnet'],
            accessoire: ['echarpe'],
            hairStyle: ['longs', 'boucles', 'tresses'],
        },
        couleurs: ['#ffffff', '#f1f3f5', '#4dabf7', '#1971c2', '#868e96', '#c0c0c0'],
    },
    {
        id: 'super', nom: 'Super-héros', emoji: '🦸',
        astuce: 'Une cape, une combinaison et des bottes : à toi de sauver le monde !',
        aime: {
            robe: ['combinaison'],
            top: ['paillettes', 'tshirt'],
            bottom: ['legging', 'pantalon'],
            shoes: ['bottes'],
            hat: ['bandeau'],
            glasses: ['soleil', 'etoile'],
            accessoire: ['cape'],
        },
        couleurs: ['#e03131', '#1971c2', '#4dabf7', '#ffd43b', '#212529', '#2f9e44'],
    },
    {
        id: 'anniversaire', nom: "Fête d'anniversaire", emoji: '🎂',
        astuce: 'On fait la fête ! Des paillettes, des ballons et plein de couleurs.',
        aime: {
            robe: ['robe', 'robe_paillettes'],
            top: ['paillettes'],
            bottom: ['tutu', 'jupe'],
            shoes: ['ballerines', 'talons'],
            hat: ['couronne', 'noeud'],
            accessoire: ['ballons', 'collier'],
            glasses: ['coeur', 'etoile'],
        },
        couleurs: ['#ff5fa2', '#ffd43b', '#4dabf7', '#94d82d', '#9775fa', '#ff922b', '#ffc9de'],
    },
    {
        id: 'fee', nom: 'Fée magique', emoji: '🧚',
        astuce: 'Des ailes, une baguette magique et un tutu qui vole !',
        aime: {
            robe: ['robe_paillettes', 'robe'],
            top: ['paillettes', 'debardeur'],
            bottom: ['tutu'],
            shoes: ['ballerines'],
            hat: ['diademe', 'fleur', 'bandeau'],
            accessoire: ['ailes', 'baguette', 'aureole'],
            hairStyle: ['boucles', 'longs', 'chignon'],
        },
        couleurs: ['#ffc9de', '#ff5fa2', '#9775fa', '#20c997', '#ffe066', '#ffffff'],
    },
    {
        id: 'jardin', nom: 'Printemps au jardin', emoji: '🌸',
        astuce: 'Des fleurs, une jolie jupe et un chapeau de paille.',
        aime: {
            robe: ['robe'],
            top: ['tshirt', 'debardeur', 'chemise'],
            bottom: ['jupe', 'jupe_longue', 'short'],
            shoes: ['ballerines', 'sandales', 'bottes_pluie'],
            hat: ['fleur', 'paille', 'bandeau'],
            accessoire: ['sac'],
            hairStyle: ['tresses', 'couettes', 'longs'],
        },
        couleurs: ['#94d82d', '#2f9e44', '#ffc9de', '#ff5fa2', '#ffd43b', '#ffffff'],
    },
    {
        id: 'rock', nom: 'Star du rock', emoji: '🎸',
        astuce: 'Du noir, une veste, un jean et des bottes. Ça envoie !',
        aime: {
            top: ['veste', 'tshirt', 'sweat'],
            bottom: ['jean', 'pantalon', 'legging'],
            shoes: ['bottes'],
            hat: ['chapeau', 'casquette', 'bandeau'],
            glasses: ['soleil'],
            accessoire: ['collier', 'echarpe'],
            hairStyle: ['crete', 'boucles', 'carre'],
        },
        couleurs: ['#212529', '#868e96', '#e03131', '#c0c0c0', '#6741d9'],
    },
    {
        id: 'chic', nom: 'Grande soirée chic', emoji: '💍',
        astuce: 'Une robe longue, un collier et des talons : très élégant !',
        aime: {
            robe: ['robe_longue', 'robe_paillettes', 'costume', 'kimono'],
            top: ['chemise', 'paillettes'],
            bottom: ['jupe_longue', 'pantalon'],
            shoes: ['talons'],
            hat: ['diademe', 'couronne'],
            accessoire: ['collier', 'sac', 'echarpe'],
            hairStyle: ['chignon', 'longs', 'queue'],
        },
        couleurs: ['#212529', '#ffd43b', '#c0c0c0', '#e03131', '#6741d9', '#ffffff'],
    },
    {
        id: 'sport', nom: 'Championne de sport', emoji: '🏃',
        astuce: 'Un jogging, des baskets et une casquette pour courir vite !',
        aime: {
            top: ['debardeur', 'sweat', 'tshirt'],
            bottom: ['jogging', 'short', 'legging'],
            shoes: ['baskets'],
            hat: ['casquette', 'bandeau'],
            hairStyle: ['queue', 'couettes'],
        },
        couleurs: ['#94d82d', '#ff922b', '#4dabf7', '#ffffff', '#e03131', '#20c997'],
    },
    {
        id: 'chat', nom: 'Petit chat mignon', emoji: '🐱',
        astuce: 'Des oreilles de chat, du rose et des ballerines. Trop chou !',
        aime: {
            robe: ['robe'],
            top: ['tshirt', 'pull', 'debardeur'],
            bottom: ['tutu', 'jupe', 'short'],
            shoes: ['ballerines', 'baskets'],
            hat: ['oreilles', 'noeud'],
            glasses: ['coeur'],
            accessoire: ['collier'],
        },
        couleurs: ['#ffc9de', '#ff5fa2', '#ffffff', '#f1f3f5', '#ffe066'],
    },
    {
        id: 'nuit', nom: 'Nuit magique', emoji: '🌙',
        astuce: 'Du violet, des étoiles et une cape mystérieuse…',
        aime: {
            robe: ['robe_longue', 'robe_paillettes', 'kimono'],
            top: ['veste', 'paillettes'],
            bottom: ['jupe_longue', 'legging'],
            shoes: ['bottes', 'talons'],
            hat: ['chapeau', 'diademe'],
            glasses: ['etoile'],
            accessoire: ['cape', 'baguette', 'aureole'],
        },
        couleurs: ['#6741d9', '#9775fa', '#212529', '#1971c2', '#ffd43b', '#c0c0c0'],
    },
];

// Tire un thème au hasard, différent du précédent quand c'est possible
export function tirerTheme(sauf) {
    const choix = THEMES.filter((t) => t.id !== sauf);
    return choix[Math.floor(Math.random() * choix.length)];
}

// --- La notation ----------------------------------------------------------

// Les pièces qui comptent pour la couleur
const PIECES_COULEUR = [
    ['robe', 'robeColor'], ['top', 'topColor'], ['bottom', 'bottomColor'],
    ['shoes', 'shoesColor'], ['hat', 'hatColor'], ['accessoire', 'accColor'],
];
const RIEN = ['aucun', 'aucune', undefined, null, ''];
const porte = (v) => !RIEN.includes(v);

// Renvoie { etoiles (1 à 5), points, sur, details[] }
export function noter(theme, tenue) {
    const aime = theme.aime || {};
    const details = [];
    let points = 0;
    const SUR = 10;

    const dansAime = (champ) => (aime[champ] || []).includes(tenue[champ]);

    // 1. La tenue principale (3 points)
    const aRobe = porte(tenue.robe) && tenue.robe !== 'aucune';
    const aHaut = porte(tenue.top);
    const aBas = porte(tenue.bottom);
    if (aRobe && dansAime('robe')) {
        points += 3; details.push({ ok: true, texte: 'La robe va parfaitement avec le thème !' });
    } else if (!aRobe && (dansAime('top') || dansAime('bottom'))) {
        const deux = dansAime('top') && dansAime('bottom');
        points += deux ? 3 : 2;
        details.push({ ok: true, texte: deux ? 'Le haut ET le bas collent au thème !' : 'Une pièce va bien avec le thème.' });
    } else if (aRobe || (aHaut && aBas)) {
        points += 1; details.push({ ok: false, texte: 'La tenue est complète, mais pas vraiment dans le thème.' });
    } else {
        details.push({ ok: false, texte: 'Il manque des habits ! Un haut ET un bas, ou une robe.' });
    }

    // 2. Les chaussures (1,5 point)
    if (dansAime('shoes')) {
        points += 1.5; details.push({ ok: true, texte: 'Les chaussures sont parfaites !' });
    } else if (porte(tenue.shoes)) {
        points += 0.5; details.push({ ok: false, texte: "D'autres chaussures iraient mieux." });
    } else {
        details.push({ ok: false, texte: 'Pieds nus… il manque des chaussures !' });
    }

    // 3. Sur la tête : chapeau + coiffure (2 points)
    if (dansAime('hat')) {
        points += 1.5; details.push({ ok: true, texte: 'Bravo pour ce qu\'il y a sur la tête !' });
    } else if (porte(tenue.hat)) {
        points += 0.5;
    }
    if (dansAime('hairStyle')) {
        points += 0.5; details.push({ ok: true, texte: 'La coiffure est bien choisie.' });
    }

    // 4. Accessoires et lunettes (1,5 point)
    if (dansAime('accessoire')) {
        points += 1; details.push({ ok: true, texte: "L'accessoire est top !" });
    } else if (porte(tenue.accessoire)) {
        points += 0.4;
    }
    if (dansAime('glasses')) {
        points += 0.5; details.push({ ok: true, texte: 'Les lunettes sont bien vues !' });
    } else if (porte(tenue.glasses)) {
        points += 0.2;
    }

    // 5. Les couleurs (2 points)
    const couleurs = theme.couleurs || [];
    let piecesPortees = 0, piecesJustes = 0;
    for (const [champ, champCouleur] of PIECES_COULEUR) {
        if (!porte(tenue[champ])) continue;
        piecesPortees++;
        if (couleurs.includes(tenue[champCouleur])) piecesJustes++;
    }
    if (piecesPortees > 0) {
        const part = piecesJustes / piecesPortees;
        points += part * 2;
        if (part >= 0.7) details.push({ ok: true, texte: 'Les couleurs sont super bien assorties !' });
        else if (part >= 0.34) details.push({ ok: false, texte: 'Quelques couleurs du thème en plus seraient jolies.' });
        else details.push({ ok: false, texte: 'Essaie les couleurs du thème !' });
    }

    points = Math.max(0, Math.min(SUR, points));
    // 1 étoile minimum : on encourage toujours
    const etoiles = Math.max(1, Math.min(5, Math.round((points / SUR) * 5)));
    return { etoiles, points: Math.round(points * 10) / 10, sur: SUR, details };
}

// --- Les juges ------------------------------------------------------------

export const JUGES = [
    { nom: 'Lila', emoji: '👩‍🎤', couleur: '#ff5fa2' },
    { nom: 'Max', emoji: '🧑‍🎨', couleur: '#4dabf7' },
    { nom: 'Rosie', emoji: '👵', couleur: '#9775fa' },
];

const PHRASES = {
    5: ['MAGNIFIQUE ! 😍', 'La plus belle du défilé ! 🌟', 'Waouh, quelle classe ! 👏'],
    4: ['Très joli ! 😊', "J'adore cette tenue ! 💖", 'Presque parfait ! ✨'],
    3: ['Pas mal du tout ! 🙂', 'Ça me plaît bien. 👍', 'Jolie tenue !'],
    2: ['Il manque un petit truc… 🤔', 'On peut faire mieux ! 💪', 'Pas tout à fait le thème.'],
    1: ['Hmm, ce n\'est pas le thème ! 😅', 'Réessaie, tu vas y arriver ! 🌈', 'Courage, la prochaine sera mieux !'],
};

// Les notes des trois juges (elles tournent autour de la vraie note)
export function notesDesJuges(etoiles) {
    const variations = [0, 1, -1];
    return JUGES.map((juge, i) => {
        const n = Math.max(1, Math.min(5, etoiles + (i === 0 ? 0 : variations[i % 3])));
        const liste = PHRASES[n];
        return { juge, note: n, phrase: liste[Math.floor(Math.random() * liste.length)] };
    });
}
