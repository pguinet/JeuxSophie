// Défilé de mode — on t'annonce un thème, tu cours dans la grande salle pour
// t'habiller (cabines, perruques, étagères, accessoires magiques), puis tu vas
// défiler sur le podium devant trois juges qui te donnent des étoiles.

import * as THREE from 'three';
import { buildAvatar3D } from '../../shared/avatar3d.js';
import { animerAccessoires } from '../../shared/garderobe3d.js';
import { construireSalle, animerSalle, SALLE } from './salle.js';
import { construirePodium, animerPodium, montrerNotes, cacherNotes, PODIUM } from './podium.js';
import { tirerTheme, noter, notesDesJuges } from './themes.js';
import { charger, sauver } from './save.js';
import { initPanneau } from './panneau.js';
import { initResultat } from './resultat.js';

// --- Le HUD (écrit dans index.html) ---
const elTheme = document.getElementById('theme');
const elAstuce = document.getElementById('astuce');
const elChrono = document.getElementById('chrono');
const elEtoiles = document.getElementById('etoiles');
const elConsigne = document.getElementById('consigne');
const btnDefiler = document.getElementById('defiler');
const btnRetour = document.getElementById('retour');

// --- Sauvegarde et tenue ---
const etat = charger();
const tenue = etat.tenue;

// --- Renderer / scène / caméra ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const CIEL_SALLE = new THREE.Color('#ffd9e8');
const CIEL_PODIUM = new THREE.Color('#1a0f2b');
scene.background = CIEL_SALLE.clone();

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);

const ambiance = new THREE.HemisphereLight('#ffffff', '#ffd4e5', 1.15);
const lampe = new THREE.DirectionalLight('#fff6e0', 0.9);
lampe.position.set(5, 12, 8);
scene.add(ambiance, lampe);

// Lumière de jour dans la salle, lumière tamisée pour le spectacle
function eclairage(spectacleEnCours) {
    ambiance.intensity = spectacleEnCours ? 0.32 : 1.15;
    lampe.intensity = spectacleEnCours ? 0.25 : 0.9;
}

// --- La salle et le podium ---
const salle = construireSalle(scene);
const spectacle = construirePodium(scene);

// --- Le personnage ---
let player = null;
let parts = null;
let animesAvatar = [];

// Libère la mémoire du personnage précédent avant d'en fabriquer un nouveau
function jeter(objet) {
    objet.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            for (const m of mats) { if (m.map) m.map.dispose(); m.dispose(); }
        }
    });
}

function rebatirAvatar() {
    const pos = player ? player.position.clone() : new THREE.Vector3(0, 0, 6);
    const rot = player ? player.rotation.y : Math.PI;
    if (player) { scene.remove(player); jeter(player); }

    player = buildAvatar3D({
        gender: tenue.gender,
        skin: tenue.skin,
        hairStyle: tenue.hairStyle,
        hairColor: tenue.hairColor,
        look: tenue,
    });
    player.position.copy(pos);
    player.rotation.y = rot;
    scene.add(player);
    parts = player.userData.parts;
    animesAvatar = player.userData.animes || [];
}
rebatirAvatar();

// Ombre douce sous le personnage
const ombre = new THREE.Mesh(
    new THREE.CircleGeometry(0.4, 24),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.18 }),
);
ombre.rotation.x = -Math.PI / 2;
scene.add(ombre);

// --- Les menus ---
const panneau = initPanneau({
    getTenue: () => tenue,
    onChange: (champ, valeur) => {
        tenue[champ] = valeur;
        // Mettre une robe enlève le haut et le bas, et inversement
        if (champ === 'robe' && valeur !== 'aucune') { tenue.top = 'aucun'; tenue.bottom = 'aucun'; }
        if ((champ === 'top' || champ === 'bottom') && valeur !== 'aucun') tenue.robe = 'aucune';
        rebatirAvatar();
        etat.tenue = tenue;
        sauver(etat);
    },
});

const resultat = initResultat({
    onRejouer: () => nouveauTheme(),
    onHabiller: () => retourSalle(),
});

// ===========================================================================
//  Le déroulement de la partie
// ===========================================================================

const DUREE = 240;            // 4 minutes pour préparer sa tenue
const HAUT_PODIUM = 0.41;     // hauteur du tapis du podium
let phase = 'habillage';      // habillage | marche | pose | notes
let theme = null;
let tempsRestant = DUREE;
let chronoActif = true;

function majEtoiles() {
    elEtoiles.textContent = '⭐ ' + etat.etoiles;
}

function nouveauTheme() {
    theme = tirerTheme(theme && theme.id);
    tempsRestant = DUREE;
    chronoActif = true;
    retourSalle();
    elTheme.textContent = theme.emoji + ' ' + theme.nom;
    elAstuce.textContent = theme.astuce;
    dire('Habille-toi pour le thème « ' + theme.nom + ' » ! Clique sur les meubles. 👗');
}

function retourSalle() {
    phase = 'habillage';
    cacherNotes(spectacle);
    scene.background.copy(CIEL_SALLE);
    salle.groupe.visible = true;
    spectacle.groupe.visible = false;
    eclairage(false);
    player.position.set(0, 0, SALLE.profondeur / 2 - 5.5);
    player.rotation.y = Math.PI;
    cible = null;
    meubleVise = null;
    btnDefiler.style.display = '';
    elChrono.style.display = '';
}

let consigneTimer = null;
function dire(texte, duree = 4200) {
    elConsigne.textContent = texte;
    elConsigne.style.opacity = '1';
    clearTimeout(consigneTimer);
    if (duree) consigneTimer = setTimeout(() => { elConsigne.style.opacity = '0'; }, duree);
}

// --- Le défilé ---
let tempsPhase = 0;

function lancerDefile() {
    if (phase !== 'habillage') return;
    panneau.fermer();
    phase = 'marche';
    tempsPhase = 0;
    chronoActif = false;
    btnDefiler.style.display = 'none';
    elChrono.style.display = 'none';
    scene.background.copy(CIEL_PODIUM);
    salle.groupe.visible = false;
    spectacle.groupe.visible = true;
    eclairage(true);
    player.position.set(0, HAUT_PODIUM, PODIUM.z0);
    player.rotation.y = 0;         // il avance vers les juges (+z)
    cible = null;
    dire('À toi de jouer ! Défile bien droite… ✨', 3000);
}

function finirDefile() {
    phase = 'notes';
    const note = noter(theme, tenue);
    const notes = notesDesJuges(note.etoiles);
    montrerNotes(spectacle, notes);

    etat.etoiles += note.etoiles;
    etat.defiles += 1;
    const record = note.etoiles > etat.meilleur;
    if (record) etat.meilleur = note.etoiles;
    etat.tenue = tenue;
    sauver(etat);
    majEtoiles();

    setTimeout(() => {
        resultat.montrer({
            theme,
            etoiles: note.etoiles,
            notes,
            details: note.details,
            totalEtoiles: etat.etoiles,
            meilleur: etat.meilleur,
            record,
        });
    }, 1400);
}

// ===========================================================================
//  Les contrôles
// ===========================================================================

const raycaster = new THREE.Raycaster();
const pointeur = new THREE.Vector2();
const planSol = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const point = new THREE.Vector3();
let cible = null;          // là où le personnage se rend
let meubleVise = null;     // le meuble qu'il va ouvrir en arrivant

function cliquer(clientX, clientY) {
    if (phase !== 'habillage' || panneau.estOuvert() || resultat.estOuvert()) return;

    pointeur.x = (clientX / window.innerWidth) * 2 - 1;
    pointeur.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointeur, camera);

    // d'abord : est-ce qu'on a touché un meuble ?
    const impacts = raycaster.intersectObjects(salle.meubles, true);
    if (impacts.length) {
        let o = impacts[0].object;
        while (o && !o.userData.rayon) o = o.parent;
        if (o) {
            meubleVise = o;
            cible = new THREE.Vector3(o.userData.accueil.x, 0, o.userData.accueil.z);
            dire('On y va ! ' + o.userData.titre, 2200);
            return;
        }
    }

    // sinon : on marche vers l'endroit touché au sol
    if (raycaster.ray.intersectPlane(planSol, point)) {
        cible = point.clone();
        meubleVise = null;
    }
}

let doigtBaisse = false;
renderer.domElement.addEventListener('pointerdown', (e) => { doigtBaisse = true; cliquer(e.clientX, e.clientY); });
renderer.domElement.addEventListener('pointermove', (e) => { if (doigtBaisse && !meubleVise) cliquer(e.clientX, e.clientY); });
window.addEventListener('pointerup', () => { doigtBaisse = false; });
window.addEventListener('pointercancel', () => { doigtBaisse = false; });

const clavier = {};
window.addEventListener('keydown', (e) => {
    clavier[e.key] = true;
    if (e.key === 'Escape') panneau.fermer();
});
window.addEventListener('keyup', (e) => { clavier[e.key] = false; });

btnDefiler.addEventListener('click', lancerDefile);
btnRetour.addEventListener('click', () => { location.href = '../monde/jouer.html'; });

function redimensionner() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', redimensionner);

// ===========================================================================
//  La boucle du jeu
// ===========================================================================

const VITESSE = 5.2;
const LIM_X = SALLE.largeur / 2 - 1.6;
const LIM_Z = SALLE.profondeur / 2 - 1.6;
let dernier = performance.now();
let pasDeMarche = 0;

function balancerBras(sw) {
    if (parts.leftLeg) parts.leftLeg.rotation.x = sw;
    if (parts.rightLeg) parts.rightLeg.rotation.x = -sw;
    if (parts.leftArm) parts.leftArm.rotation.x = -sw;
    if (parts.rightArm) parts.rightArm.rotation.x = sw;
}

function frame(now) {
    const dt = Math.min(0.05, (now - dernier) / 1000);
    dernier = now;
    const t = now / 1000;
    let bouge = false;

    if (phase === 'habillage') {
        // --- Déplacement au clavier ---
        let dx = 0, dz = 0;
        if (clavier['ArrowLeft'] || clavier['q']) dx -= 1;
        if (clavier['ArrowRight'] || clavier['d']) dx += 1;
        if (clavier['ArrowUp'] || clavier['z']) dz -= 1;
        if (clavier['ArrowDown'] || clavier['s']) dz += 1;

        if (dx || dz) {
            cible = null; meubleVise = null;
            const l = Math.hypot(dx, dz);
            player.position.x += (dx / l) * VITESSE * dt;
            player.position.z += (dz / l) * VITESSE * dt;
            player.rotation.y = Math.atan2(dx / l, dz / l);
            bouge = true;
        } else if (cible) {
            const ddx = cible.x - player.position.x;
            const ddz = cible.z - player.position.z;
            const dist = Math.hypot(ddx, ddz);
            const arret = meubleVise ? 0.35 : 0.1;
            if (dist > arret) {
                const pas = Math.min(dist, VITESSE * dt);
                player.position.x += (ddx / dist) * pas;
                player.position.z += (ddz / dist) * pas;
                player.rotation.y = Math.atan2(ddx / dist, ddz / dist);
                bouge = true;
            } else {
                // arrivé : on ouvre le meuble (ou on lance le défilé)
                if (meubleVise) {
                    const rayon = meubleVise.userData.rayon;
                    const m = meubleVise;
                    meubleVise = null;
                    // se tourner vers le meuble
                    player.rotation.y = Math.atan2(m.position.x - player.position.x, m.position.z - player.position.z);
                    if (rayon === 'podium') lancerDefile();
                    else panneau.ouvrir(rayon);
                }
                cible = null;
            }
        }

        // rester dans la salle
        player.position.x = Math.max(-LIM_X, Math.min(LIM_X, player.position.x));
        player.position.z = Math.max(-LIM_Z, Math.min(LIM_Z, player.position.z));
        player.position.y = 0;

        // --- Le chrono ---
        if (chronoActif && !panneau.estOuvert()) {
            tempsRestant -= dt;
            if (tempsRestant <= 0) { tempsRestant = 0; lancerDefile(); }
        }
        const mn = Math.floor(tempsRestant / 60);
        const sc = Math.floor(tempsRestant % 60);
        elChrono.textContent = '⏱️ ' + mn + ':' + String(sc).padStart(2, '0');
        elChrono.style.color = tempsRestant < 30 ? '#ff6b6b' : '#fff';

        // --- Caméra : derrière et au-dessus, en regardant vers le magasin ---
        camera.position.set(player.position.x, 5.2, player.position.z + 8);
        camera.lookAt(player.position.x, 1.4, player.position.z - 2.5);

    } else if (phase === 'marche') {
        // le personnage remonte le podium tout seul
        tempsPhase += dt;
        player.position.z += 2.6 * dt;
        player.rotation.y = 0;
        bouge = true;
        if (player.position.z >= PODIUM.z1) {
            player.position.z = PODIUM.z1;
            phase = 'pose';
            tempsPhase = 0;
        }
        // caméra posée au bout du podium : on le voit arriver de loin
        const avance = (player.position.z - PODIUM.z0) / (PODIUM.z1 - PODIUM.z0);
        camera.position.set(0, 3 - avance * 0.6, PODIUM.z1 + 5.5);
        camera.lookAt(0, 1.3, player.position.z);

    } else if (phase === 'pose') {
        // il tourne sur lui-même pour montrer sa tenue
        tempsPhase += dt;
        player.rotation.y = tempsPhase * 1.8;
        balancerBras(0);
        // petit salut avec les bras
        if (parts.leftArm) parts.leftArm.rotation.z = 0.2 + Math.sin(tempsPhase * 3) * 0.35;
        if (parts.rightArm) parts.rightArm.rotation.z = -0.2 - Math.sin(tempsPhase * 3) * 0.35;

        // la caméra tourne autour de lui
        const a = tempsPhase * 0.5;
        camera.position.set(Math.sin(a) * 4.2, 2.2, player.position.z + Math.cos(a) * 4.2);
        camera.lookAt(0, 1.15, player.position.z);

        if (tempsPhase > 4) finirDefile();

    } else {   // notes : on recule pour voir les juges lever leurs pancartes
        camera.position.set(3.4, 3.2, PODIUM.z1 - 2.5);
        camera.lookAt(0, 1.2, PODIUM.zJuges + 1);
        player.rotation.y += dt * 0.5;
    }

    // --- Animation de la marche ---
    const solY = phase === 'habillage' ? 0 : HAUT_PODIUM;
    if (bouge) {
        pasDeMarche += dt * 10;
        balancerBras(Math.sin(pasDeMarche) * 0.5);
        player.position.y = solY + Math.abs(Math.sin(pasDeMarche)) * 0.05;
    } else if (phase !== 'pose') {
        balancerBras(0);
        player.position.y = solY;
    }

    // --- Décors vivants ---
    ombre.position.set(player.position.x, 0.02, player.position.z);
    ombre.visible = phase === 'habillage';
    if (phase === 'habillage') animerSalle(salle.animes, t);
    else animerPodium(spectacle, t);
    animerAccessoires(animesAvatar, t);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
}

// --- C'est parti ! ---
majEtoiles();
nouveauTheme();
redimensionner();
requestAnimationFrame(frame);
