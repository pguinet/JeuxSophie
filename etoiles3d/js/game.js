// Étoiles en 3D — le personnage de Sophie (le même que dans l'habillage) se
// promène dans un petit monde 3D et ramasse des étoiles. Déplacement au doigt
// (on touche le sol) ou aux flèches du clavier.

import * as THREE from 'three';
import { loadAvatar } from '../../shared/avatar.js';
import { buildAvatar3D } from '../../shared/avatar3d.js';

const scoreEl = document.getElementById('score');
const consigne = document.getElementById('consigne');

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

// --- Score ---
let score = 0;
function ramasse(star) {
    score++;
    scoreEl.textContent = '⭐ ' + score;
    if (consigne) consigne.style.display = 'none';
    placeStar(star);
}

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
const SPEED = 4.5;   // unités/s
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
