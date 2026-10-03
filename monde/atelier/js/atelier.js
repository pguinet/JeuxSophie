// L'atelier de création de Sophie : elle décrit un habit au petit assistant,
// le voit sur son personnage en 3D, dessine dessus, l'enregistre dans « Mes
// créations » et peut le porter dans tous ses jeux.
//
// Le « cerveau » (comprendre une description, la collection) est dans
// shared/createur.js ; la 3D des créations dans shared/creation3d.js.

import * as THREE from 'three';
import { loadAvatar, saveAvatar } from '../../../shared/avatar.js';
import { buildAvatar3D, animerVie } from '../../../shared/avatar3d.js';
import { animerAccessoires } from '../../../shared/garderobe3d.js';
import {
    comprendre, TYPES, chargerCreations, enregistrerCreation, supprimerCreation, porter,
} from '../../../shared/createur.js';
import { peindreTissu } from '../../../shared/creation3d.js';

const $ = (id) => document.getElementById(id);

let base = loadAvatar();          // le personnage de Sophie, tel qu'il est sauvegardé
let creation = null;              // la création en cours (ou null)
let avatar = null;

// ===========================================================================
//  La scène 3D
// ===========================================================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('scene').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#fbeaf3');
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
scene.add(new THREE.HemisphereLight('#ffffff', '#b9a6c9', 1.5));
const soleil = new THREE.DirectionalLight('#fff4e6', 1.8);
soleil.position.set(2.5, 5, 4);
scene.add(soleil);
const contre = new THREE.DirectionalLight('#d0e4ff', 0.7);
contre.position.set(-3, 3, -4);
scene.add(contre);

const socle = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.85, 0.12, 48), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }));
socle.position.y = -0.06;
scene.add(socle);
const pivot = new THREE.Group();
scene.add(pivot);

function jeter(objet) {
    objet.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        for (const m of mats) m.dispose();
    });
}

// Ce qu'on montre : le personnage de Sophie qui porte la création en cours
function rebatir() {
    if (avatar) { pivot.remove(avatar); jeter(avatar); }
    const etat = creation && creation.type ? porter(base, creation) : base;
    avatar = buildAvatar3D(etat);
    pivot.add(avatar);
    // pour un chapeau, on regarde la tête
    if (!dessinEnCours) vue = creation && TYPES[creation.type]?.categorie === 'chapeau' ? VUES.tete : VUES.corps;
}

// tourner au doigt
let angle = 0.35, vitesse = 0, glisse = null;
const el = renderer.domElement;
el.addEventListener('pointerdown', (e) => { glisse = e.clientX; el.setPointerCapture(e.pointerId); });
el.addEventListener('pointermove', (e) => {
    if (glisse === null) return;
    vitesse = (e.clientX - glisse) * 0.012;
    angle += vitesse;
    glisse = e.clientX;
});
el.addEventListener('pointerup', () => { glisse = null; });
el.addEventListener('pointercancel', () => { glisse = null; });

// la caméra s'approche de l'endroit où l'on dessine
const VUES = {
    corps: { pos: new THREE.Vector3(0, 1.3, 5.2), cible: new THREE.Vector3(0, 1.0, 0) },
    torse: { pos: new THREE.Vector3(0, 1.3, 3.8), cible: new THREE.Vector3(0, 1.12, 0) },
    jambes: { pos: new THREE.Vector3(0, 0.7, 3.6), cible: new THREE.Vector3(0, 0.45, 0) },
    jupe: { pos: new THREE.Vector3(0, 0.75, 3.2), cible: new THREE.Vector3(0, 0.6, 0) },
    tete: { pos: new THREE.Vector3(0, 1.95, 2.6), cible: new THREE.Vector3(0, 1.72, 0) },
};
let vue = VUES.corps;
const camPos = vue.pos.clone(), camCible = vue.cible.clone();
let dessinEnCours = false;           // en mode dessin, le personnage se tourne vers nous

function redimensionner() {
    const w = $('scene').clientWidth || 1, h = $('scene').clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.7 ? 40 : 30;
    camera.updateProjectionMatrix();
}
new ResizeObserver(redimensionner).observe($('scene'));
redimensionner();

let avant = performance.now(), recomposer = false;
function boucle(now) {
    const dt = Math.min(0.05, (now - avant) / 1000);
    avant = now;
    const t = now / 1000;
    if (dessinEnCours && glisse === null) {
        angle += (0 - ((angle + Math.PI) % (Math.PI * 2) - Math.PI)) * Math.min(1, dt * 4);    // revient de face
    } else if (glisse === null) {
        vitesse *= 0.92;
        angle += vitesse + dt * 0.25;
    }
    pivot.rotation.y = angle;
    if (avatar) {
        animerVie(avatar, t, dt);
        animerAccessoires(avatar.userData.animes, t);
        if (recomposer) { avatar.userData.recomposer(); recomposer = false; }
    }
    camPos.lerp(vue.pos, 1 - Math.pow(0.02, dt));
    camCible.lerp(vue.cible, 1 - Math.pow(0.02, dt));
    camera.position.copy(camPos);
    camera.lookAt(camCible);
    renderer.render(scene, camera);
    requestAnimationFrame(boucle);
}
requestAnimationFrame(boucle);

// ===========================================================================
//  Petits messages
// ===========================================================================
let minuterieBulle = null;
function bulle(texte) {
    const b = $('bulle');
    b.textContent = texte;
    b.classList.remove('cache');
    clearTimeout(minuterieBulle);
    minuterieBulle = setTimeout(() => b.classList.add('cache'), 2600);
}

// ===========================================================================
//  Le petit assistant
// ===========================================================================
function message(qui, texte) {
    const m = document.createElement('div');
    m.className = `message ${qui}`;
    m.textContent = texte;
    $('chat').appendChild(m);
    $('chat').scrollTop = $('chat').scrollHeight;
}

const IDEES_DEPART = ['une robe rose avec des étoiles', 'un t-shirt bleu à manches longues', 'un pantalon noir', 'une jupe violette à fleurs', 'une couronne dorée', 'un bonnet rose à pois'];
const IDEES_SUITE = ['en violet', 'avec des cœurs', 'à rayures blanches', 'à paillettes', 'plutôt une jupe', 'sans motif'];
function idees() {
    const zone = $('idees');
    zone.innerHTML = '';
    for (const texte of creation && creation.type ? IDEES_SUITE : IDEES_DEPART) {
        const b = document.createElement('button');
        b.className = 'idee';
        b.type = 'button';
        b.textContent = texte;
        b.addEventListener('click', () => parler(texte));
        zone.appendChild(b);
    }
}

function parler(texte) {
    texte = texte.trim();
    if (!texte) return;
    message('sophie', texte);
    const r = comprendre(texte, creation);
    if (r.compris) {
        // le dessin de Sophie n'est jamais perdu, même si elle change d'habit
        if (creation && creation.dessin) r.creation.dessin = creation.dessin;
        creation = r.creation;
        rebatir();
    }
    message('assistant', r.reponse);
    majBoutons();
    idees();
}

$('form-chat').addEventListener('submit', (e) => {
    e.preventDefault();
    parler($('saisie').value);
    $('saisie').value = '';
});

function majBoutons() {
    const ok = !!(creation && creation.type);
    $('btn-dessiner').disabled = !ok || !TYPES[creation.type].zone;
    $('btn-enregistrer').disabled = !ok;
    $('btn-porter').disabled = !ok;
}

// ===========================================================================
//  Le dessin
// ===========================================================================
const fond = $('fond'), feuille = $('dessin');
const fx = fond.getContext('2d'), dx = feuille.getContext('2d', { willReadFrequently: true });
const COULEURS_PINCEAU = ['#212529', '#ffffff', '#e03131', '#ff922b', '#ffd43b', '#40c057', '#20c997', '#339af0',
    '#1c3f94', '#9775fa', '#cc5de8', '#ff5fa2', '#ffc9de', '#8a5a2b', '#f2c94c', '#868e96'];
const TAMPONS = ['⭐', '❤️', '🌸', '🦋', '🐱', '🌈', '✨', '👑', '🍓', '🦄'];
const pinceau = { couleur: '#212529', taille: 14, outil: 'pinceau', tampon: null };
let historique = [];

function sauverEtape() {
    historique.push(dx.getImageData(0, 0, 512, 512));
    if (historique.length > 20) historique.shift();
}
function auChangement() { recomposer = true; }

// le fond de la feuille : le tissu, et le repère de la zone
function peindreFond() {
    if (!creation) return;
    const zone = TYPES[creation.type].zone;
    peindreTissu(fx, 512, 512, creation, 512 / 0.76);
    fx.strokeStyle = 'rgba(0,0,0,0.25)';
    fx.setLineDash([10, 8]);
    fx.lineWidth = 3;
    if (zone === 'jambes') {
        fx.beginPath(); fx.moveTo(256, 0); fx.lineTo(256, 512); fx.stroke();
    } else if (zone === 'torse') {
        // l'endroit du cou
        fx.beginPath(); fx.arc(256, 0, 60, 0, Math.PI); fx.stroke();
    }
    fx.setLineDash([]);
}

function point(e) {
    const r = feuille.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 512, y: ((e.clientY - r.top) / r.height) * 512 };
}
let trace = null;
feuille.addEventListener('pointerdown', (e) => {
    feuille.setPointerCapture(e.pointerId);
    const p = point(e);
    sauverEtape();
    if (pinceau.outil === 'tampon') {
        dx.font = `${pinceau.taille * 4}px serif`;
        dx.textAlign = 'center';
        dx.textBaseline = 'middle';
        dx.fillText(pinceau.tampon, p.x, p.y);
        auChangement();
        return;
    }
    if (pinceau.outil === 'texte') {
        const t = $('texte').value.trim();
        if (!t) { historique.pop(); bulle('Écris d\'abord ton texte 🔤'); return; }
        dx.font = `bold ${pinceau.taille * 3.5}px 'Comic Sans MS', sans-serif`;
        dx.textAlign = 'center';
        dx.textBaseline = 'middle';
        dx.fillStyle = pinceau.couleur;
        dx.fillText(t, p.x, p.y);
        auChangement();
        return;
    }
    trace = p;
    tracer(p, p);
});
feuille.addEventListener('pointermove', (e) => {
    if (!trace) return;
    const p = point(e);
    tracer(trace, p);
    trace = p;
});
const finTrace = () => { trace = null; };
feuille.addEventListener('pointerup', finTrace);
feuille.addEventListener('pointercancel', finTrace);

function tracer(a, b) {
    dx.globalCompositeOperation = pinceau.outil === 'gomme' ? 'destination-out' : 'source-over';
    dx.strokeStyle = pinceau.couleur;
    dx.lineWidth = pinceau.outil === 'gomme' ? pinceau.taille * 2 : pinceau.taille;
    dx.lineCap = 'round';
    dx.lineJoin = 'round';
    dx.beginPath();
    dx.moveTo(a.x, a.y);
    dx.lineTo(b.x + 0.01, b.y);
    dx.stroke();
    dx.globalCompositeOperation = 'source-over';
    auChangement();
}

// --- la boîte à outils ---
function bouton(parent, contenu, quandClic, classe = 'outil') {
    const b = document.createElement('button');
    b.className = classe;
    b.type = 'button';
    if (classe === 'pastille') b.style.background = contenu; else b.textContent = contenu;
    b.addEventListener('click', quandClic);
    parent.appendChild(b);
    return b;
}
function activer(b) {
    for (const x of document.querySelectorAll('#panneau-dessin .actif')) x.classList.remove('actif');
    b.classList.add('actif');
}
const pastilles = [];
for (const c of COULEURS_PINCEAU) {
    const b = bouton($('couleurs'), c, () => {
        pinceau.couleur = c;
        if (pinceau.outil === 'gomme' || pinceau.outil === 'tampon') pinceau.outil = 'pinceau';
        activer(b);
    }, 'pastille');
    pastilles.push(b);
}
const outils = [
    ['✏️ Fin', () => { pinceau.outil = 'pinceau'; pinceau.taille = 6; }],
    ['🖌️ Moyen', () => { pinceau.outil = 'pinceau'; pinceau.taille = 14; }],
    ['🖍️ Gros', () => { pinceau.outil = 'pinceau'; pinceau.taille = 32; }],
    ['🧽 Gomme', () => { pinceau.outil = 'gomme'; }],
];
for (const [nom, faire] of outils) {
    const b = bouton($('outils'), nom, () => { faire(); activer(b); });
}
for (const t of TAMPONS) {
    const b = bouton($('tampons'), t, () => { pinceau.outil = 'tampon'; pinceau.tampon = t; activer(b); });
}
$('btn-texte').addEventListener('click', () => {
    if (!$('texte').value.trim()) { bulle('Écris d\'abord ton texte 🔤'); return; }
    pinceau.outil = 'texte';
    activer($('btn-texte'));
    bulle('Touche la feuille pour poser ton texte 👆');
});
$('btn-annuler').addEventListener('click', () => {
    const etape = historique.pop();
    if (etape) { dx.putImageData(etape, 0, 0); auChangement(); }
});
$('btn-effacer').addEventListener('click', () => {
    sauverEtape();
    dx.clearRect(0, 0, 512, 512);
    auChangement();
});

function ouvrirDessin() {
    if (!creation || !TYPES[creation.type].zone) return;
    creation.dessin = feuille;            // en direct sur le personnage
    peindreFond();
    rebatir();
    $('panneau-chat').classList.add('cache');
    $('panneau-dessin').classList.remove('cache');
    vue = VUES[TYPES[creation.type].zone] || VUES.corps;
    dessinEnCours = true;
    if (!document.querySelector('#panneau-dessin .actif')) activer(pastilles[0]);
}
function fermerDessin() {
    $('panneau-dessin').classList.add('cache');
    $('panneau-chat').classList.remove('cache');
    vue = VUES.corps;
    dessinEnCours = false;
}
$('btn-dessiner').addEventListener('click', ouvrirDessin);
$('btn-fini').addEventListener('click', () => {
    fermerDessin();
    rebatir();
    message('assistant', 'Trop beau ton dessin ! 🎨 N\'oublie pas d\'appuyer sur 💾 Enregistrer.');
});

function dessinVide() {
    const px = dx.getImageData(0, 0, 512, 512).data;
    for (let i = 3; i < px.length; i += 16) if (px[i] > 0) return false;
    return true;
}
// Recharge un dessin enregistré (image) dans la feuille
function chargerDessin(dessin) {
    dx.clearRect(0, 0, 512, 512);
    historique = [];
    if (!dessin) return;
    const img = new Image();
    img.onload = () => { dx.drawImage(img, 0, 0, 512, 512); auChangement(); };
    img.src = dessin;
}

// ===========================================================================
//  Enregistrer, porter, mes créations
// ===========================================================================
function versSauvegarde(c) {
    return { ...c, dessin: c.dessin && c.dessin === feuille ? (dessinVide() ? null : feuille.toDataURL('image/png')) : c.dessin };
}
function enregistrer() {
    if (!creation || !creation.type) return null;
    const garde = enregistrerCreation(versSauvegarde(creation));
    if (!garde) { bulle('Oups, plus de place pour enregistrer 😢 Supprime une ancienne création.'); return null; }
    creation.id = garde.id;
    creation.nom = garde.nom;
    // si le personnage la porte déjà, il porte la nouvelle version
    if (base.porte) {
        for (const cle of ['haut', 'bas', 'chapeau']) if (base.porte[cle] && base.porte[cle].id === garde.id) base.porte[cle] = garde;
        saveAvatar(base);
    }
    return garde;
}
$('btn-enregistrer').addEventListener('click', () => {
    if (enregistrer()) bulle('Enregistré dans 👕 Mes créations ! 💾');
});
function porterCreation(c) {
    base = porter(base, c);
    saveAvatar(base);
}
$('btn-porter').addEventListener('click', () => {
    const garde = enregistrer();
    if (!garde) return;
    porterCreation(garde);
    bulle('Ton personnage la porte dans tous tes jeux ! 🧍✨');
});
$('btn-nouveau').addEventListener('click', () => {
    creation = null;
    chargerDessin(null);
    rebatir();
    majBoutons();
    idees();
    message('assistant', 'On recommence ! ✨ Décris-moi ton nouvel habit.');
});

// --- la fenêtre « Mes créations » ---
function vignette(c) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 160;
    const x = cv.getContext('2d');
    peindreTissu(x, 160, 160, c, 160 / 0.76);
    if (c.dessin) {
        const img = new Image();
        img.onload = () => x.drawImage(img, 0, 0, 160, 160);
        img.src = c.dessin;
    }
    return cv;
}
function estPortee(c) {
    return !!base.porte && ['haut', 'bas', 'chapeau'].some((cle) => base.porte[cle] && base.porte[cle].id === c.id);
}
function afficherCollection() {
    const grille = $('grille');
    grille.innerHTML = '';
    const liste = chargerCreations();
    if (!liste.length) {
        grille.innerHTML = '<div class="vide">Pas encore de création 🧵<br>Décris un habit à l\'assistant, puis appuie sur 💾 Enregistrer !</div>';
        return;
    }
    for (const c of liste) {
        const carte = document.createElement('div');
        carte.className = 'carte';
        carte.appendChild(vignette(c));
        const nom = document.createElement('div');
        nom.className = 'nom';
        nom.textContent = c.nom;
        carte.appendChild(nom);
        if (estPortee(c)) {
            const p = document.createElement('div');
            p.className = 'portee';
            p.textContent = '🧍 Portée';
            carte.appendChild(p);
        }
        const boutons = document.createElement('div');
        boutons.className = 'boutons';
        if (estPortee(c)) {
            bouton(boutons, 'Enlever', () => {
                const porte = { ...base.porte };
                for (const cle of ['haut', 'bas', 'chapeau']) if (porte[cle] && porte[cle].id === c.id) delete porte[cle];
                base = { ...base, porte };
                saveAvatar(base);
                rebatir();
                afficherCollection();
            }, 'action porter');
        } else {
            bouton(boutons, '🧍 Porter', () => { porterCreation(c); rebatir(); afficherCollection(); bulle('Ton personnage la porte ! ✨'); }, 'action porter');
        }
        bouton(boutons, '✏️ Modifier', () => {
            creation = { ...c };
            chargerDessin(c.dessin);
            if (c.dessin) creation.dessin = feuille;
            rebatir();
            majBoutons();
            idees();
            $('collection').classList.add('cache');
            message('assistant', `On modifie ta ${c.nom} ! Dis-moi ce que tu veux changer, ou dessine avec 🖌️.`);
        }, 'action dessiner');
        const suppr = bouton(boutons, '🗑️', () => {
            // deux appuis pour supprimer (pas de fenêtre de confirmation)
            if (suppr.dataset.sur !== '1') { suppr.dataset.sur = '1'; suppr.textContent = 'Sûre ?'; return; }
            supprimerCreation(c.id);
            if (estPortee(c)) {
                const porte = { ...base.porte };
                for (const cle of ['haut', 'bas', 'chapeau']) if (porte[cle] && porte[cle].id === c.id) delete porte[cle];
                base = { ...base, porte };
                saveAvatar(base);
                rebatir();
            }
            afficherCollection();
        }, 'action nouveau');
        carte.appendChild(boutons);
        grille.appendChild(carte);
    }
}
$('btn-collection').addEventListener('click', () => { afficherCollection(); $('collection').classList.remove('cache'); });
$('btn-fermer').addEventListener('click', () => $('collection').classList.add('cache'));

// ===========================================================================
//  Au démarrage
// ===========================================================================
rebatir();
majBoutons();
idees();
message('assistant', 'Coucou Sophie ! 👋 Je suis ton assistant de mode. Décris-moi l\'habit ou le chapeau que tu veux créer, par exemple : « une robe rose avec des étoiles jaunes » ou « une casquette bleue à rayures ». ✨');
