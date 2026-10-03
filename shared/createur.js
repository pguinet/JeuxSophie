// L'atelier de création — la partie « cerveau », sans Three.js ni page web :
//   - `comprendre(texte, creation)` : le petit assistant lit une description
//     (« une robe rose avec des étoiles jaunes ») et fabrique / modifie une
//     création ;
//   - la collection « Mes créations » (sauvegarde locale).
//
// Une création = { id, nom, type, couleur, motif, couleurMotif, brillant, dessin }
//   type    : un habit du catalogue (tshirt, manches_longues, robe, jupe, pantalon…)
//   motif   : null | 'etoiles' | 'coeurs' | 'pois' | 'rayures' | 'carreaux' | 'fleurs'
//   dessin  : image (data URL) dessinée par Sophie, ou null

export const CLE_CREATIONS = 'mes_creations';

// --- Les habits que l'assistant connaît ----------------------------------
// categorie : 'haut' | 'bas' | 'robe' (une robe remplace le haut ET le bas)
// zone      : où va le dessin ('torse', 'jambes', 'jupe') ou null (pas de dessin)
export const TYPES = {
    tshirt: { nom: 't-shirt', categorie: 'haut', zone: 'torse', genre: 'm' },
    manches_longues: { nom: 't-shirt à manches longues', categorie: 'haut', zone: 'torse', genre: 'm' },
    pull: { nom: 'pull', categorie: 'haut', zone: 'torse', genre: 'm' },
    sweat: { nom: 'sweat à capuche', categorie: 'haut', zone: 'torse', genre: 'm' },
    chemise: { nom: 'chemise', categorie: 'haut', zone: 'torse', genre: 'f' },
    debardeur: { nom: 'débardeur', categorie: 'haut', zone: 'torse', genre: 'm' },
    veste: { nom: 'veste', categorie: 'haut', zone: 'torse', genre: 'f' },
    robe: { nom: 'robe', categorie: 'robe', zone: 'torse', genre: 'f' },
    robe_longue: { nom: 'robe longue', categorie: 'robe', zone: 'torse', genre: 'f' },
    robe_princesse: { nom: 'robe de princesse', categorie: 'robe', zone: 'torse', genre: 'f' },
    combinaison: { nom: 'combinaison', categorie: 'robe', zone: 'torse', genre: 'f' },
    kimono: { nom: 'kimono', categorie: 'robe', zone: 'torse', genre: 'm' },
    jupe: { nom: 'jupe', categorie: 'bas', zone: 'jupe', genre: 'f' },
    jupe_longue: { nom: 'jupe longue', categorie: 'bas', zone: 'jupe', genre: 'f' },
    tutu: { nom: 'tutu', categorie: 'bas', zone: null, genre: 'm' },
    pantalon: { nom: 'pantalon', categorie: 'bas', zone: 'jambes', genre: 'm' },
    jean: { nom: 'jean', categorie: 'bas', zone: 'jambes', genre: 'm' },
    jogging: { nom: 'jogging', categorie: 'bas', zone: 'jambes', genre: 'm' },
    legging: { nom: 'legging', categorie: 'bas', zone: 'jambes', genre: 'm' },
    short: { nom: 'short', categorie: 'bas', zone: null, genre: 'm' },
    // les chapeaux (pas de dessin, mais couleur et motif)
    paille: { nom: 'chapeau', categorie: 'chapeau', zone: null, genre: 'm' },
    chapeau: { nom: 'haut-de-forme', categorie: 'chapeau', zone: null, genre: 'm' },
    casquette: { nom: 'casquette', categorie: 'chapeau', zone: null, genre: 'f' },
    bonnet: { nom: 'bonnet', categorie: 'chapeau', zone: null, genre: 'm' },
    couronne: { nom: 'couronne', categorie: 'chapeau', zone: null, genre: 'f' },
    diademe: { nom: 'diadème', categorie: 'chapeau', zone: null, genre: 'm' },
    noeud: { nom: 'nœud', categorie: 'chapeau', zone: null, genre: 'm' },
    fleur: { nom: 'fleur dans les cheveux', categorie: 'chapeau', zone: null, genre: 'f' },
    bandeau: { nom: 'bandeau', categorie: 'chapeau', zone: null, genre: 'm' },
    oreilles: { nom: 'oreilles de chat', categorie: 'chapeau', zone: null, genre: 'f' },
};

// Les mots → habit (dans l'ordre : les expressions longues d'abord)
const MOTS_TYPES = [
    ['haut de forme', 'chapeau'], ['chapeau haut', 'chapeau'],
    ['robe de princesse', 'robe_princesse'], ['robe princesse', 'robe_princesse'],
    ['robe longue', 'robe_longue'], ['longue robe', 'robe_longue'],
    ['jupe longue', 'jupe_longue'], ['longue jupe', 'jupe_longue'],
    ['manches longues', 'manches_longues'], ['manche longue', 'manches_longues'],
    ['sweat', 'sweat'], ['capuche', 'sweat'], ['hoodie', 'sweat'],
    ['tee shirt', 'tshirt'], ['t shirt', 'tshirt'], ['teeshirt', 'tshirt'], ['tshirt', 'tshirt'], ['tee', 'tshirt'],
    ['debardeur', 'debardeur'], ['top', 'debardeur'], ['chemise', 'chemise'], ['veste', 'veste'], ['blouson', 'veste'],
    ['pull', 'pull'], ['gilet', 'pull'], ['haut', 'tshirt'],
    ['robe', 'robe'], ['combinaison', 'combinaison'], ['salopette', 'combinaison'], ['kimono', 'kimono'],
    ['jupe', 'jupe'], ['tutu', 'tutu'], ['pantalon', 'pantalon'], ['jean', 'jean'], ['jogging', 'jogging'],
    ['survetement', 'jogging'], ['legging', 'legging'], ['calecon', 'legging'], ['short', 'short'], ['bermuda', 'short'],
    // les chapeaux viennent après les habits : « une robe avec un nœud » reste une robe
    ['chapeau de paille', 'paille'], ['capeline', 'paille'], ['oreilles de chat', 'oreilles'], ['oreille de chat', 'oreilles'],
    ['serre tete', 'bandeau'], ['bandeau', 'bandeau'], ['fleur dans les cheveux', 'fleur'], ['barrette', 'fleur'],
    ['diademe', 'diademe'], ['tiare', 'diademe'], ['couronne', 'couronne'], ['casquette', 'casquette'],
    ['bonnet', 'bonnet'], ['noeud', 'noeud'], ['chapeau', 'paille'],
];

// Les couleurs (forme simple, sans accent ; on accepte féminin et pluriel)
export const COULEURS = {
    rose: '#ff5fa2', fuchsia: '#e64980', rouge: '#e03131', orange: '#ff922b', jaune: '#ffd43b',
    vert: '#40c057', 'vert clair': '#94d82d', 'vert fonce': '#2b8a3e', turquoise: '#20c997',
    bleu: '#339af0', 'bleu clair': '#74c0fc', 'bleu ciel': '#74c0fc', 'bleu fonce': '#1c3f94', marine: '#1c3f94',
    violet: '#9775fa', mauve: '#cc5de8', lilas: '#d0bfff', blanc: '#ffffff', noir: '#212529', gris: '#868e96',
    marron: '#8a5a2b', beige: '#e9d8b4', dore: '#f2c94c', or: '#f2c94c', argent: '#ced4da', argente: '#ced4da',
};
// Les variantes d'écriture → forme simple
const FORMES = {
    roses: 'rose', rouges: 'rouge', oranges: 'orange', jaunes: 'jaune', verte: 'vert', vertes: 'vert', verts: 'vert',
    bleue: 'bleu', bleues: 'bleu', bleus: 'bleu', violette: 'violet', violettes: 'violet', violets: 'violet',
    mauves: 'mauve', blanche: 'blanc', blanches: 'blanc', blancs: 'blanc', noire: 'noir', noires: 'noir', noirs: 'noir',
    grise: 'gris', grises: 'gris', doree: 'dore', dorees: 'dore', dores: 'dore', argentee: 'argente',
    argentees: 'argente', turquoises: 'turquoise', beiges: 'beige', marrons: 'marron', fuchsias: 'fuchsia',
    claire: 'clair', claires: 'clair', clairs: 'clair', foncee: 'fonce', foncees: 'fonce', fonces: 'fonce',
};

// Les motifs
export const MOTIFS = { etoiles: 'étoiles', coeurs: 'cœurs', pois: 'pois', rayures: 'rayures', carreaux: 'carreaux', fleurs: 'fleurs' };
const MOTS_MOTIFS = [
    ['etoile', 'etoiles'], ['coeur', 'coeurs'], ['pois', 'pois'], ['rond', 'pois'], ['point', 'pois'],
    ['rayure', 'rayures'], ['raye', 'rayures'], ['ligne', 'rayures'], ['carreau', 'carreaux'], ['quadrille', 'carreaux'],
    ['fleur', 'fleurs'], ['fleuri', 'fleurs'],
];

// Met le texte en minuscules, sans accents ni ponctuation, pour comparer facilement
export function normaliser(texte) {
    return ` ${String(texte || '')
        .toLowerCase()
        .replace(/œ/g, 'oe')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()} `;
}

// Les mots du texte, avec les couleurs et les motifs repérés (et leur position)
function analyser(texte) {
    const n = normaliser(texte);
    const mots = n.trim().split(' ').map((m) => FORMES[m] || m);
    const t = ` ${mots.join(' ')} `;

    let type = null;
    for (const [mot, id] of MOTS_TYPES) {
        if (t.includes(` ${mot} `) || t.includes(` ${mot}s `)) { type = id; break; }
    }
    // « robe … longue », « jupe … longue », « t-shirt … manches longues »
    if (type === 'robe' && / longue /.test(t)) type = 'robe_longue';
    if (type === 'jupe' && / longue /.test(t)) type = 'jupe_longue';
    if ((type === 'tshirt' || type === null) && /manches? longues?/.test(t)) type = 'manches_longues';

    // couleurs (en essayant d'abord « bleu clair », « vert foncé »…)
    const couleurs = [];
    for (let i = 0; i < mots.length; i++) {
        const deux = `${mots[i]} ${mots[i + 1] || ''}`;
        if (COULEURS[deux]) { couleurs.push({ i, nom: deux }); i++; continue; }
        if (COULEURS[mots[i]] && !(mots[i] === 'or' && mots[i - 1] !== 'en')) couleurs.push({ i, nom: mots[i] });
    }
    let motif = null, iMotif = -1;
    for (let i = 0; i < mots.length && !motif; i++) {
        for (const [mot, id] of MOTS_MOTIFS) {
            if (mots[i] === mot || mots[i] === `${mot}s` || mots[i] === `${mot}x` || mots[i] === `${mot}es`) { motif = id; iMotif = i; break; }
        }
    }
    return {
        type, couleurs, motif, iMotif,
        sansMotif: / sans (motif|dessin|rien) | uni | unie /.test(t),
        brillant: / (paillettes?|brillante?s?|scintillante?s?) /.test(t),
        effacer: / (efface|recommence|nouveau|nouvelle) /.test(t),
    };
}

const accorder = (type, masc, fem) => (TYPES[type]?.genre === 'f' ? fem : masc);
const NOM_COULEUR = (nom) => nom.replace('fonce', 'foncé').replace('dore', 'doré').replace('argente', 'argenté');
const COULEUR_F = { blanc: 'blanche', violet: 'violette', vert: 'verte', bleu: 'bleue', noir: 'noire', gris: 'grise', dore: 'dorée', argente: 'argentée' };

// Le nom d'une création, en bon français (« robe rose à étoiles jaunes »)
export function nommer(c) {
    const t = TYPES[c.type];
    if (!t) return 'création';
    let nom = t.nom;
    if (c.nomCouleur) {
        const f = t.genre === 'f' ? (COULEUR_F[c.nomCouleur] || c.nomCouleur) : c.nomCouleur;
        nom += ` ${NOM_COULEUR(f)}`;
    }
    if (c.motif) nom += ` à ${MOTIFS[c.motif]}`;
    if (c.brillant) nom += ' à paillettes';
    return nom;
}

// Une couleur de motif qui se voit bien sur la couleur du tissu
export function couleurContraste(hex) {
    const v = parseInt(hex.slice(1), 16);
    const l = ((v >> 16) & 255) * 0.299 + ((v >> 8) & 255) * 0.587 + (v & 255) * 0.114;
    if (l <= 150) return '#ffffff';
    return hex.toLowerCase() === '#ffffff' ? '#ff5fa2' : '#212529';
}

export function nouvelleCreation() {
    return { id: null, nom: '', type: null, couleur: '#ff5fa2', nomCouleur: null, motif: null, couleurMotif: null, nomCouleurMotif: null, brillant: false, dessin: null };
}

// --- Le petit assistant ----------------------------------------------------
// Retourne { creation, reponse, compris } : la création mise à jour (une copie)
// et ce que l'assistant répond.
export function comprendre(texte, actuelle = null) {
    const a = analyser(texte);
    const c = actuelle && !a.effacer ? { ...actuelle } : nouvelleCreation();
    const avant = JSON.stringify(c);

    if (a.type) {
        // changer d'habit garde les couleurs mais pas le dessin s'il n'a plus de place
        if (c.type && TYPES[c.type].zone !== TYPES[a.type].zone) c.dessin = null;
        c.type = a.type;
    }
    // couleurs : celles placées après le motif (« étoiles jaunes ») vont au motif
    const tissu = [], motif = [];
    for (const col of a.couleurs) (a.iMotif >= 0 && col.i > a.iMotif ? motif : tissu).push(col);
    if (tissu.length > 1 && !motif.length && (a.motif || c.motif)) motif.push(tissu.pop());
    if (tissu.length) { c.couleur = COULEURS[tissu[0].nom]; c.nomCouleur = tissu[0].nom; }
    if (a.motif) c.motif = a.motif;
    if (a.sansMotif) { c.motif = null; c.couleurMotif = null; c.nomCouleurMotif = null; }
    if (motif.length) { c.couleurMotif = COULEURS[motif[0].nom]; c.nomCouleurMotif = motif[0].nom; }
    if (c.motif && !c.couleurMotif) c.couleurMotif = couleurContraste(c.couleur);
    if (a.brillant) c.brillant = true;

    if (!c.type) {
        return {
            creation: c, compris: false,
            reponse: "Je n'ai pas compris quel habit tu veux 🤔. Essaie par exemple : « une robe rose », « un t-shirt bleu avec des étoiles » ou « un pantalon noir ».",
        };
    }
    const rien = JSON.stringify(c) === avant;
    c.nom = nommer(c);
    const article = accorder(c.type, 'un', 'une');
    const pret = accorder(c.type, 'Le voilà', 'La voilà');
    let reponse;
    if (rien) {
        reponse = `Hmm, je n'ai rien changé 🤔. Tu peux me dire une couleur (« en vert »), un motif (« avec des cœurs »), ou un autre habit (« plutôt une jupe »).`;
    } else if (!actuelle || !actuelle.type || a.effacer) {
        const dessin = TYPES[c.type].zone ? ', ou dessiner dessus avec 🖌️' : '';
        reponse = `${pret} : ${article} ${c.nom} ! ✨ Tu peux ${accorder(c.type, 'le', 'la')} changer en me parlant (« en violet », « avec des fleurs »)${dessin}.`;
    } else {
        reponse = `C'est fait : ${article} ${c.nom} ! 😊`;
    }
    return { creation: c, reponse, compris: true };
}

// --- La collection « Mes créations » -------------------------------------
export function chargerCreations(stockage = globalThis.localStorage) {
    try { return JSON.parse(stockage.getItem(CLE_CREATIONS)) || []; } catch { return []; }
}
function ecrire(liste, stockage) {
    try { stockage.setItem(CLE_CREATIONS, JSON.stringify(liste)); return true; } catch { return false; }
}
// Ajoute ou remplace (même id) ; retourne la création enregistrée, ou null si la mémoire est pleine
export function enregistrerCreation(c, stockage = globalThis.localStorage) {
    const liste = chargerCreations(stockage);
    const copie = { ...c, id: c.id || `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`, nom: c.nom || nommer(c) };
    const i = liste.findIndex((x) => x.id === copie.id);
    if (i >= 0) liste[i] = copie; else liste.push(copie);
    return ecrire(liste, stockage) ? copie : null;
}
export function supprimerCreation(id, stockage = globalThis.localStorage) {
    ecrire(chargerCreations(stockage).filter((x) => x.id !== id), stockage);
}

// Ce que le personnage porte : { haut, bas, chapeau } (une robe se met dans `haut`)
export function porter(etat, c) {
    const porte = { ...(etat.porte || {}) };
    const cat = TYPES[c.type]?.categorie;
    if (cat === 'chapeau') {
        porte.chapeau = c;
    } else if (cat === 'bas') {
        porte.bas = c;
        if (porte.haut && TYPES[porte.haut.type]?.categorie === 'robe') delete porte.haut;
    } else {
        porte.haut = c;
        if (cat === 'robe') delete porte.bas;
    }
    return { ...etat, porte };
}
