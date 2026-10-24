// challenge/js/ecran-compte.js
// Création du compte (pseudo) puis éditeur d'avatar ; le même éditeur sert à modifier l'avatar.
import { PSEUDO_MAX, validerPseudo } from './save.js';
import { PEAUX, CHEVEUX, HABITS, FONDS, COIFFURES, LOOK_DEFAUT, avatarSVG, lookAleatoire, lookValide } from './avatar.js';
import * as audio from './audio.js';

const ONGLETS = [
    { cle: 'peau', titre: 'Peau', emoji: '🎨', palette: PEAUX },
    { cle: 'coiffure', titre: 'Coiffure', emoji: '💇' },
    { cle: 'cheveux', titre: 'Cheveux', emoji: '🌈', palette: CHEVEUX },
    { cle: 'haut', titre: 'Haut', emoji: '👕', palette: HABITS },
    { cle: 'bas', titre: 'Bas', emoji: '👖', palette: HABITS },
    { cle: 'fond', titre: 'Fond', emoji: '🖼️', palette: FONDS },
];
const GENRES = [{ id: 'fille', titre: '👧 Filles' }, { id: 'garcon', titre: '👦 Garçons' }];

function creer(tag, classe, texte) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texte != null) el.textContent = texte;
    return el;
}

// afficherCompte(app, { pseudo?, look?, onValider(pseudo, look), onAnnuler? })
// Sans pseudo : on commence par l'écran « Créer mon compte ». Avec : directement l'éditeur.
export function afficherCompte(app, { pseudo, look, onValider, onAnnuler }) {
    if (pseudo) afficherEditeur(app, pseudo, lookValide(look ?? LOOK_DEFAUT), { onValider, onAnnuler });
    else afficherPseudo(app, '', lookValide(look ?? LOOK_DEFAUT), { onValider });
}

function afficherPseudo(app, valeur, look, { onValider }) {
    const ecran = creer('div', 'ecran compte');
    const titre = creer('h1', 'titre-jeu', 'The Biggest Challenge');
    const sousTitre = creer('p', 'compte-intro', 'Entraîne-toi en anglais et grimpe dans le classement ! 🏆');
    const carte = creer('div', 'carte compte-carte');
    const etiquette = creer('label', 'compte-label', 'Choisis ton pseudo');
    const champ = creer('input', 'champ-pseudo');
    champ.id = 'pseudo';
    etiquette.htmlFor = 'pseudo';
    champ.type = 'text';
    champ.maxLength = PSEUDO_MAX;
    champ.autocomplete = 'off';
    champ.spellcheck = false;
    champ.placeholder = 'Ton pseudo';
    champ.value = valeur;
    const aide = creer('div', 'compte-aide', `${PSEUDO_MAX} lettres au maximum`);
    const suivant = creer('button', 'btn-gros btn-vert', 'Suivant ➜');
    carte.append(etiquette, champ, aide, suivant);
    ecran.append(titre, sousTitre, carte);
    app.replaceChildren(ecran);

    const majBouton = () => { suivant.disabled = validerPseudo(champ.value) === null; };
    const valider = () => {
        const p = validerPseudo(champ.value);
        if (p === null) return;
        audio.sfxClic();
        afficherEditeur(app, p, look, {
            onValider,
            onAnnuler: () => afficherPseudo(app, p, look, { onValider }),
            nouveau: true,
        });
    };
    champ.addEventListener('input', majBouton);
    champ.addEventListener('keydown', e => { if (e.key === 'Enter') valider(); });
    suivant.addEventListener('click', valider);
    majBouton();
    champ.focus();
}

function afficherEditeur(app, pseudo, lookDepart, { onValider, onAnnuler, nouveau = false }) {
    let look = { ...lookDepart };
    let onglet = 'peau';
    let genre = COIFFURES.find(c => c.id === look.coiffure).genre;

    const ecran = creer('div', 'ecran editeur');
    const entete = creer('div', 'editeur-entete');
    if (onAnnuler) {
        const retour = creer('button', 'btn-rond', nouveau ? '⬅️' : '🏠');
        retour.title = nouveau ? 'Changer de pseudo' : 'Retour sans changer';
        retour.addEventListener('click', () => { audio.sfxClic(); onAnnuler(); });
        entete.append(retour);
    }
    const titre = creer('h2', 'editeur-titre', nouveau ? 'Crée ton avatar' : 'Modifie ton avatar');
    entete.append(titre);

    const colonneApercu = creer('div', 'editeur-apercu');
    const apercu = creer('div', 'apercu-avatar');
    const nom = creer('div', 'apercu-pseudo', pseudo);   // textContent : pseudo saisi par l'enfant
    const boutonsApercu = creer('div', 'apercu-boutons');
    const de = creer('button', 'btn-gros btn-violet', '🎲 Au hasard');
    de.title = 'Un avatar au hasard';
    const cestMoi = creer('button', 'btn-gros btn-vert', 'C\'est moi ! ✨');
    boutonsApercu.append(de, cestMoi);
    colonneApercu.append(apercu, nom, boutonsApercu);

    const colonneChoix = creer('div', 'editeur-choix carte');
    const onglets = creer('div', 'onglets');
    const contenu = creer('div', 'onglet-contenu');
    colonneChoix.append(onglets, contenu);

    const corps = creer('div', 'editeur-corps');
    corps.append(colonneApercu, colonneChoix);
    ecran.append(entete, corps);
    app.replaceChildren(ecran);

    // L'aperçu et les vignettes sont du SVG produit par avatarSVG() : aucun texte saisi dedans.
    const majApercu = () => { apercu.innerHTML = avatarSVG(look, { taille: 300 }); };

    function majOnglets() {
        onglets.replaceChildren(...ONGLETS.map(o => {
            const b = creer('button', `onglet${o.cle === onglet ? ' actif' : ''}`);
            b.append(creer('span', 'onglet-emoji', o.emoji), creer('span', 'onglet-texte', o.titre));
            b.addEventListener('click', () => { audio.sfxClic(); onglet = o.cle; majOnglets(); majContenu(); });
            return b;
        }));
    }

    function choisir(cle, id) {
        audio.sfxClic();
        look = { ...look, [cle]: id };
        majApercu();
        majContenu();
    }

    function pastilles(o) {
        const grille = creer('div', 'pastilles');
        for (const c of o.palette) {
            const b = creer('button', `pastille-couleur${look[o.cle] === c.id ? ' choisie' : ''}`);
            b.style.background = c.couleur;
            b.title = c.id;
            b.addEventListener('click', () => choisir(o.cle, c.id));
            grille.append(b);
        }
        return grille;
    }

    function coiffures() {
        const bloc = creer('div', 'bloc-coiffures');
        const sous = creer('div', 'sous-onglets');
        for (const g of GENRES) {
            const b = creer('button', `sous-onglet${g.id === genre ? ' actif' : ''}`, g.titre);
            b.addEventListener('click', () => { audio.sfxClic(); genre = g.id; majContenu(); });
            sous.append(b);
        }
        const grille = creer('div', 'vignettes');
        for (const c of COIFFURES.filter(x => x.genre === genre)) {
            const b = creer('button', `vignette${look.coiffure === c.id ? ' choisie' : ''}`);
            const img = creer('div', 'vignette-img');
            img.innerHTML = avatarSVG({ ...look, coiffure: c.id }, { taille: 120 });
            b.append(img, creer('span', 'vignette-nom', c.nom));
            b.addEventListener('click', () => choisir('coiffure', c.id));
            grille.append(b);
        }
        bloc.append(sous, grille);
        return bloc;
    }

    function majContenu() {
        const o = ONGLETS.find(x => x.cle === onglet);
        contenu.replaceChildren(o.cle === 'coiffure' ? coiffures() : pastilles(o));
    }

    de.addEventListener('click', () => {
        audio.sfxClic();
        look = lookAleatoire();
        genre = COIFFURES.find(c => c.id === look.coiffure).genre;
        majApercu();
        majContenu();
        apercu.classList.remove('saute');
        void apercu.offsetWidth;   // relance l'animation
        apercu.classList.add('saute');
    });
    cestMoi.addEventListener('click', () => { audio.sfxClic(); onValider(pseudo, { ...look }); });

    majApercu();
    majOnglets();
    majContenu();
}
