import * as THREE from 'three';
import { createScene } from './scene.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Ciel bleu clair

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 12, 18);
camera.lookAt(0, 0, 0);

// Lumières
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(10, 15, 10);
dirLight.castShadow = true;
scene.add(dirLight);

const ambientLight = new THREE.AmbientLight(0x606060);
scene.add(ambientLight);

// Créer la scène (maison + jardin)
createScene(scene);

// Contrôle orbital tactile (rotation autour de la scène)
let orbitAngle = 0;
const orbitRadius = 20;
const orbitHeight = 12;
let touchId = null;
let lastTouchX = 0;

canvas.addEventListener('touchstart', (e) => {
    if (touchId !== null) return;
    const touch = e.changedTouches[0];
    touchId = touch.identifier;
    lastTouchX = touch.clientX;
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
    if (touchId === null) return;
    for (const touch of e.changedTouches) {
        if (touch.identifier === touchId) {
            const deltaX = touch.clientX - lastTouchX;
            orbitAngle += deltaX * 0.005;
            lastTouchX = touch.clientX;
            break;
        }
    }
}, { passive: true });

const onTouchEnd = (e) => {
    for (const touch of e.changedTouches) {
        if (touch.identifier === touchId) {
            touchId = null;
            break;
        }
    }
};
canvas.addEventListener('touchend', onTouchEnd, { passive: true });
canvas.addEventListener('touchcancel', onTouchEnd, { passive: true });

// Souris pour debug desktop
let mouseDown = false;
canvas.addEventListener('mousedown', (e) => { mouseDown = true; lastTouchX = e.clientX; });
canvas.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;
    const deltaX = e.clientX - lastTouchX;
    orbitAngle += deltaX * 0.005;
    lastTouchX = e.clientX;
});
canvas.addEventListener('mouseup', () => { mouseDown = false; });

// Boucle d'animation
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Caméra orbitale
    camera.position.x = Math.sin(orbitAngle) * orbitRadius;
    camera.position.z = Math.cos(orbitAngle) * orbitRadius;
    camera.position.y = orbitHeight;
    camera.lookAt(0, 1, 0);

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
