// Étoiles en 3D — le personnage de Sophie (le même que dans l'habillage) se
// promène dans un petit monde 3D et ramasse des étoiles. Déplacement au doigt
// (on touche le sol) ou aux flèches du clavier.

import * as THREE from 'three';
import { loadAvatar } from '../../shared/avatar.js';
import { buildAvatar3D } from '../../shared/avatar3d.js';
import { charger, sauver, renaitre } from './save.js';
import { initMagasin } from './shop.js';
import { ANIMAUX } from './catalogue.js';
import { buildAnimal, buildDeco, DECO_POS } from './models.js';

const scoreEl = document.getElementById('score');
const piecesEl = document.getElementById('pieces');
const consigne = document.getElementById('consigne');

// Sauvegarde (étoiles ramassées, pièces, animaux et décos achetés)
const etat = charger();

// --- Renderer / scène / caméra ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#8fd3f4');
scene.fog = new THREE.Fog('#8fd3f4', 22, 46);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);

// --- Lumières ---
scene.add(new THREE.HemisphereLight('#ffffff', '#8ed36a', 1.0));
const sun = new THREE.DirectionalLight('#fff6e0', 1.1);
sun.position.set(6, 12, 8);
scene.add(sun);

// --- Sol ---
const ground = new THREE.Mesh(
    new THREE.CircleGeometry(30, 48),
    new THREE.MeshStandardMaterial({ color: '#86cf63', roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Quelques arbres décoratifs
function makeTree(x, z) {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 1, 8),
        new THREE.MeshStandardMaterial({ color: '#8a5a2b', roughness: 1 }),
    );
    trunk.position.y = 0.5;
    const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 16, 12),
        new THREE.MeshStandardMaterial({ color: '#2f9e44', roughness: 1 }),
    );
    leaves.position.y = 1.35;
    t.add(trunk, leaves);
    t.position.set(x, 0, z);
    scene.add(t);
}
[[-9, -6], [8, -8], [-11, 5], [12, 4], [0, -13], [-6, 11], [7, 10]].forEach(([x, z]) => makeTree(x, z));

// --- Animaux (qui suivent) et décorations (posées dans le monde) ---
const animauxActifs = [];   // { id, group, vole }
const decosAnimees = [];    // groupes de décos avec une animation (ex. la fontaine)
const infosAnimal = {};
ANIMAUX.forEach((a) => { infosAnimal[a.id] = a; });

function ajouterAnimal(id) {
    const g = buildAnimal(id);
    if (!g) return;
    g.scale.setScalar(echellePourNiveau(niveauPourXp(etat.petXp)));   // taille selon le niveau
    scene.add(g);
    animauxActifs.push({ id, group: g, vole: !!(infosAnimal[id] && infosAnimal[id].vole) });
    majNiveauHud();   // afficher/mettre à jour la jauge de niveau
}

function ajouterDeco(id) {
    const g = buildDeco(id);
    if (!g) return;
    const p = DECO_POS[id] || { x: 0, z: 0 };
    g.position.set(p.x, 0, p.z);
    scene.add(g);
    if (g.userData && g.userData.update) decosAnimees.push(g);   // ex. l'eau de la fontaine
}

// --- Personnage ---
const player = buildAvatar3D(loadAvatar());
scene.add(player);
const parts = player.userData.parts;
let heading = 0;              // orientation (radians)

// Ombre douce sous le personnage (disque sombre)
const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.35, 24),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22 }),
);
shadow.rotation.x = -Math.PI / 2;
scene.add(shadow);

// --- Étoiles ---
function makeStarGeometry() {
    const shape = new THREE.Shape();
    const spikes = 5, outer = 0.45, inner = 0.2;
    for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false });
    geo.center();
    return geo;
}
const starGeo = makeStarGeometry();
const starMat = new THREE.MeshStandardMaterial({ color: '#ffd43b', metalness: 0.3, roughness: 0.35, emissive: '#7a5c00', emissiveIntensity: 0.35 });

const STAR_COUNT = 6;
const STAR_LIFE = 5000;   // bouge au bout de 5 s si pas ramassée
const AREA = 13;
const stars = [];
const rand = (min, max) => min + Math.random() * (max - min);

function placeStar(star) {
    star.mesh.position.set(rand(-AREA, AREA), 0.7, rand(-AREA, AREA));
    star.mesh.visible = true;
    star.placedAt = performance.now();
}
for (let i = 0; i < STAR_COUNT; i++) {
    const mesh = new THREE.Mesh(starGeo, starMat);
    scene.add(mesh);
    const star = { mesh, placedAt: 0 };
    placeStar(star);
    stars.push(star);
}

// --- Score (étoiles + pièces) ---
function majHud() {
    scoreEl.textContent = '⭐ ' + etat.etoiles;
    piecesEl.textContent = '🪙 ' + etat.pieces;
}

// --- Niveau des animaux ---
// Chaque étoile ramassée donne de l'expérience aux animaux ; à chaque niveau,
// ils grandissent. Il faut 5·N·(N-1) étoiles pour être au niveau N.
const CROISSANCE_PAR_NIVEAU = 0.07;   // +7 % de taille par niveau
const NIVEAU_MAX_TAILLE = 10;         // au-delà, ils ne grandissent plus
function niveauPourXp(xp) { let L = 1; while (5 * (L + 1) * L <= xp) L++; return L; }
function echellePourNiveau(L) { return 1 + Math.min(L - 1, NIVEAU_MAX_TAILLE) * CROISSANCE_PAR_NIVEAU; }

function appliquerTailleAnimaux() {
    const s = echellePourNiveau(niveauPourXp(etat.petXp));
    for (const a of animauxActifs) a.group.scale.setScalar(s);
}

// Multiplicateur d'étoiles = le meilleur (le plus fort) parmi les animaux
// possédés (les animaux chers valent plus : x2 pour le moins cher, x10 pour
// la licorne). Sans animal : x1.
function multiAnimaux() {
    let m = 1;
    for (const a of animauxActifs) {
        const info = infosAnimal[a.id];
        if (info && info.etoilesX > m) m = info.etoilesX;
    }
    return m;
}

// Bonus permanent gagné avec les Renaissances : ×2 par renaissance (×2, ×4, ×8…).
function bonusRenaissance() { return Math.pow(2, etat.renaissances || 0); }

// Multiplicateur total appliqué à chaque étoile ramassée.
function multiEtoiles() { return multiAnimaux() * bonusRenaissance(); }

function majNiveauHud() {
    const xp = etat.petXp;
    const L = niveauPourXp(xp);
    const base = 5 * L * (L - 1), suivant = 5 * (L + 1) * L;
    const frac = suivant > base ? (xp - base) / (suivant - base) : 0;
    const rn = etat.renaissances || 0;
    niveauTxt.textContent = '🐾 Niveau ' + L + '   ⭐ x' + multiEtoiles() + (rn > 0 ? '   ✨ ' + rn : '');
    niveauBarre.style.width = Math.round(frac * 100) + '%';
    niveauHud.style.display = (animauxActifs.length || rn > 0) ? 'block' : 'none';
}

// petit « +N » qui s'envole quand on ramasse (montre le multiplicateur)
function popupGain(gain) {
    const t = document.createElement('div');
    t.textContent = '+' + gain + ' ⭐';
    Object.assign(t.style, {
        position: 'fixed', top: '20vmin', left: '50%', zIndex: '15',
        transform: 'translateX(-50%)', color: '#ffe066', fontWeight: 'bold',
        fontSize: 'clamp(20px, 5vmin, 36px)', textShadow: '2px 2px 0 rgba(0,0,0,.4)',
        pointerEvents: 'none',
    });
    document.body.appendChild(t);
    t.animate(
        [{ transform: 'translate(-50%, 0)', opacity: 1 }, { transform: 'translate(-50%, -60px)', opacity: 0 }],
        { duration: 800, easing: 'ease-out' },
    );
    setTimeout(() => t.remove(), 820);
}
function feteNiveau(L) {
    const t = document.createElement('div');
    t.textContent = '🎉 Tes animaux passent au niveau ' + L + ' !';
    Object.assign(t.style, {
        position: 'fixed', top: '24vmin', left: '50%', transform: 'translateX(-50%)',
        zIndex: '20', background: 'rgba(255,146,43,.95)', color: '#fff', fontWeight: 'bold',
        padding: '2.4vmin 6vw', borderRadius: '22px', fontSize: 'clamp(16px, 4vmin, 28px)',
        boxShadow: '0 5px 0 rgba(0,0,0,.3)', textShadow: '1px 1px 0 rgba(0,0,0,.3)',
        pointerEvents: 'none', textAlign: 'center', maxWidth: '92vw',
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .5s'; t.style.opacity = '0'; }, 1700);
    setTimeout(() => t.remove(), 2300);
}

// jauge de niveau (créée dans le HUD, sous les compteurs)
const niveauHud = document.createElement('div');
Object.assign(niveauHud.style, {
    position: 'fixed', top: '12vmin', left: '50%', transform: 'translateX(-50%)',
    zIndex: '11', textAlign: 'center', color: '#fff', pointerEvents: 'none',
    textShadow: '1px 1px 0 rgba(0,0,0,.4)', display: 'none',
});
const niveauTxt = document.createElement('div');
Object.assign(niveauTxt.style, { fontSize: 'clamp(15px, 3.4vmin, 22px)', fontWeight: 'bold' });
const niveauBarreFond = document.createElement('div');
Object.assign(niveauBarreFond.style, {
    width: 'min(210px, 52vw)', height: '12px', background: 'rgba(0,0,0,.3)',
    borderRadius: '8px', margin: '0.6vmin auto 0', overflow: 'hidden',
});
const niveauBarre = document.createElement('div');
Object.assign(niveauBarre.style, {
    height: '100%', width: '0%', borderRadius: '8px', transition: 'width .3s',
    background: 'linear-gradient(90deg, #ffd43b, #ff922b)',
});
niveauBarreFond.appendChild(niveauBarre);
niveauHud.append(niveauTxt, niveauBarreFond);
document.body.appendChild(niveauHud);

function ramasse(star) {
    const gain = multiEtoiles();          // plus l'animal est cher, plus on gagne d'étoiles
    etat.etoiles += gain;
    const avant = niveauPourXp(etat.petXp);
    etat.petXp += gain;
    const apres = niveauPourXp(etat.petXp);
    sauver(etat);
    majHud();
    majNiveauHud();
    popupGain(gain);
    if (apres > avant) { appliquerTailleAnimaux(); feteNiveau(apres); }
    if (consigne) consigne.style.display = 'none';
    placeStar(star);
}
majHud();

// Recrée les animaux et décorations déjà achetés
etat.animaux.forEach(ajouterAnimal);
etat.decos.forEach(ajouterDeco);
appliquerTailleAnimaux();
majNiveauHud();

// Au départ, on aligne les animaux qui marchent en file derrière le joueur
// (qui regarde vers +Z) pour éviter qu'ils se superposent avant de bouger.
let rangDepart = 0;
for (const a of animauxActifs) {
    if (!a.vole) a.group.position.set(0, 0, -1.3 * (++rangDepart));
}

// Magasin (l'achat ajoute aussitôt l'objet dans le monde)
initMagasin({
    etat, sauver, majHud,
    onAchatAnimal: ajouterAnimal,
    onAchatDeco: ajouterDeco,
    onRenaissance: () => { renaitre(etat.renaissances); location.reload(); },
});

// --- Contrôles ---
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Cible au sol (clic / doigt) via raycast
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hit = new THREE.Vector3();
let target = null;

function pickGround(clientX, clientY) {
    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(groundPlane, hit)) {
        target = hit.clone();
    }
}
let pointerDown = false;
renderer.domElement.addEventListener('pointerdown', (e) => { pointerDown = true; pickGround(e.clientX, e.clientY); });
renderer.domElement.addEventListener('pointermove', (e) => { if (pointerDown) pickGround(e.clientX, e.clientY); });
window.addEventListener('pointerup', () => { pointerDown = false; });
window.addEventListener('pointercancel', () => { pointerDown = false; });

// --- Redimensionnement ---
function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);

// --- Boucle ---
const SPEED = 4.5;             // unités/s
const trail = [];              // fil des positions récentes du joueur
const TRAIL_MAX = 260;
const ESPACE = 16;             // écart (en images) entre chaque animal qui suit
let last = performance.now();
let walkPhase = 0;

function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // direction depuis le clavier (repère caméra : haut = loin)
    let dx = 0, dz = 0;
    if (keys['ArrowLeft']) dx -= 1;
    if (keys['ArrowRight']) dx += 1;
    if (keys['ArrowUp']) dz -= 1;
    if (keys['ArrowDown']) dz += 1;

    let moving = false;
    if (dx || dz) {
        target = null;   // le clavier reprend la main
        const len = Math.hypot(dx, dz);
        dx /= len; dz /= len;
        player.position.x += dx * SPEED * dt;
        player.position.z += dz * SPEED * dt;
        heading = Math.atan2(dx, dz);
        moving = true;
    } else if (target) {
        const ddx = target.x - player.position.x;
        const ddz = target.z - player.position.z;
        const dist = Math.hypot(ddx, ddz);
        if (dist > 0.08) {
            const step = Math.min(dist, SPEED * dt);
            player.position.x += (ddx / dist) * step;
            player.position.z += (ddz / dist) * step;
            heading = Math.atan2(ddx / dist, ddz / dist);
            moving = true;
        } else {
            target = null;
        }
    }

    // rester dans le terrain
    const limit = AREA + 2;
    player.position.x = Math.max(-limit, Math.min(limit, player.position.x));
    player.position.z = Math.max(-limit, Math.min(limit, player.position.z));

    // orientation douce
    player.rotation.y = heading;

    // animation de marche + petit rebond
    if (moving) {
        walkPhase += dt * 10;
        const sw = Math.sin(walkPhase) * 0.5;
        if (parts.leftLeg) parts.leftLeg.rotation.x = sw;
        if (parts.rightLeg) parts.rightLeg.rotation.x = -sw;
        if (parts.leftArm) parts.leftArm.rotation.x = -sw;
        if (parts.rightArm) parts.rightArm.rotation.x = sw;
        player.position.y = Math.abs(Math.sin(walkPhase)) * 0.05;
    } else {
        if (parts.leftLeg) parts.leftLeg.rotation.x *= 0.8;
        if (parts.rightLeg) parts.rightLeg.rotation.x *= 0.8;
        if (parts.leftArm) parts.leftArm.rotation.x *= 0.8;
        if (parts.rightArm) parts.rightArm.rotation.x *= 0.8;
        player.position.y = 0;
    }

    // ombre suit le personnage
    shadow.position.set(player.position.x, 0.02, player.position.z);

    // fil des positions du joueur, pour que les animaux suivent en file.
    // On n'ajoute un point que si le joueur avance : ainsi, à l'arrêt, les
    // animaux gardent leur place derrière lui au lieu de se rassembler dessus.
    if (moving) {
        trail.unshift({ x: player.position.x, z: player.position.z, h: heading });
        if (trail.length > TRAIL_MAX) trail.pop();
    }

    // animaux : ceux qui marchent suivent le joueur, ceux qui volent tournent autour
    let rangSol = 0;
    for (const a of animauxActifs) {
        if (a.vole) {
            const ang = now * 0.0016 + animauxActifs.indexOf(a) * 1.8;
            const R = 1.7;
            a.group.position.set(
                player.position.x + Math.cos(ang) * R,
                1.5 + Math.sin(now * 0.004 + a.id.length) * 0.25,
                player.position.z + Math.sin(ang) * R,
            );
            a.group.rotation.y = -ang + Math.PI / 2;
            const w = a.group.userData.parts && a.group.userData.parts.wings;
            if (w) { const f = Math.sin(now * 0.02) * 0.8; w[0].rotation.y = f; w[1].rotation.y = -f; }
        } else {
            const idx = Math.min(trail.length - 1, ESPACE * (rangSol + 1));
            const t = trail[idx];
            if (t) { a.group.position.x = t.x; a.group.position.z = t.z; a.group.rotation.y = t.h; }
            // petit saut quand le joueur bouge
            const hop = a.group.userData.hop || 0.06;
            a.group.position.y = moving ? Math.abs(Math.sin(walkPhase * 0.9 + rangSol)) * hop : 0;
            // oreilles qui rebondissent
            const ears = a.group.userData.parts && a.group.userData.parts.ears;
            if (ears) ears.forEach((e, k) => { e.rotation.x = moving ? Math.sin(walkPhase + k) * 0.2 : 0; });
            rangSol++;
        }
    }

    // décorations animées (l'eau de la fontaine)
    for (const d of decosAnimees) d.userData.update(now);

    // étoiles : rotation + collision + durée de vie
    for (const star of stars) {
        star.mesh.rotation.y += dt * 1.8;
        const d = Math.hypot(player.position.x - star.mesh.position.x, player.position.z - star.mesh.position.z);
        if (d < 0.9) { ramasse(star); continue; }
        if (now - star.placedAt > STAR_LIFE) placeStar(star);
    }

    // caméra derrière et au-dessus du personnage
    camera.position.set(player.position.x, 5, player.position.z + 7);
    camera.lookAt(player.position.x, 1.1, player.position.z);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
}
resize();
requestAnimationFrame(frame);
