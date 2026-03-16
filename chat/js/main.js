import * as THREE from 'three';
import { createScene } from './scene.js';
import { Cat } from './cat.js';
import { ColorPicker } from './color-picker.js';
import { HUD } from './hud.js';
import { ActionBar } from './actions.js';
import { createFurniture } from './furniture.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { Shop } from './shop.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

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

const container = document.getElementById('game-container');

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

// Chat
const cat = new Cat(scene, 0xe87e24);
cat.group.position.set(-3, 0, 0);

// HUD
const hud = new HUD(container);

// Meubles
const furniturePos = createFurniture(scene);

// Actions
const actions = new ActionBar(container);

actions.on('feed', () => { hud.feed(); cat.playEat(furniturePos.bowl.x, furniturePos.bowl.z); });
actions.on('drink', () => { hud.drink(); cat.playEat(furniturePos.water.x, furniturePos.water.z); });
actions.on('pet', () => { hud.pet(); cat.playPet(); });
actions.on('wash', () => { hud.wash(); cat.playWash(); });
actions.on('sleep', () => { hud.sleep(); cat.playSleep(); });

// Boutique
const shop = new Shop(container, hud);
shop.onBuy = (item) => {
    if (item.id === 'ball' || item.id === 'mouse') {
        hud.needs.happiness.value = Math.min(100, hud.needs.happiness.value + (item.id === 'mouse' ? 20 : 15));
        cat.playPet();
    } else if (item.id === 'fish') {
        hud.needs.hunger.value = Math.min(100, hud.needs.hunger.value + 40);
    } else if (item.id === 'cushion_lux') {
        hud.needs.fatigue.value = Math.max(0, hud.needs.fatigue.value - 40);
    }
};

// Chargement sauvegarde ou choix de couleur
let catColor = 0xe87e24;
const saved = loadGame();
if (saved) {
    catColor = saved.color;
    cat.setColor(catColor);
    hud.loadState(saved.needs);
} else if (!hasSave()) {
    const picker = new ColorPicker(container);
    picker.onSelect = (hex) => {
        catColor = hex;
        cat.setColor(hex);
    };
}

// Auto-save toutes les 30s
setInterval(() => { saveGame(hud, catColor); }, 30000);

// Save à la fermeture
window.addEventListener('beforeunload', () => { saveGame(hud, catColor); });

// Textes flottants et particules
const floatingTexts = [];

function spawnFloatingText(text, color = '#fff') {
    const div = document.createElement('div');
    Object.assign(div.style, {
        position: 'absolute',
        color: color,
        fontSize: '20px',
        fontWeight: 'bold',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
        pointerEvents: 'none',
        zIndex: '25',
        transition: 'none',
        left: '50%',
        transform: 'translateX(-50%)',
    });
    div.textContent = text;
    container.appendChild(div);

    const startY = window.innerHeight * 0.4;
    div.style.top = startY + 'px';
    floatingTexts.push({ el: div, y: startY, life: 1.5 });
}

function updateFloatingTexts(delta) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y -= 40 * delta;
        ft.life -= delta;
        ft.el.style.top = ft.y + 'px';
        ft.el.style.opacity = Math.max(0, ft.life / 1.5).toString();
        if (ft.life <= 0) {
            ft.el.remove();
            floatingTexts.splice(i, 1);
        }
    }
}

// Ajouter "Miaou!" quand le chat a faim/soif
let lastMeowTime = 0;

// Particules coeurs pour caresses
const heartParticles = [];
function spawnHearts() {
    for (let i = 0; i < 5; i++) {
        const div = document.createElement('div');
        div.textContent = '❤️';
        Object.assign(div.style, {
            position: 'absolute',
            fontSize: '18px',
            pointerEvents: 'none',
            zIndex: '25',
            left: (40 + Math.random() * 20) + '%',
        });
        container.appendChild(div);
        const startY = window.innerHeight * 0.35 + Math.random() * 40;
        div.style.top = startY + 'px';
        heartParticles.push({ el: div, y: startY, x: -1 + Math.random() * 2, life: 1.2 + Math.random() * 0.5 });
    }
}

function updateHearts(delta) {
    for (let i = heartParticles.length - 1; i >= 0; i--) {
        const h = heartParticles[i];
        h.y -= 50 * delta;
        h.life -= delta;
        h.el.style.top = h.y + 'px';
        h.el.style.left = (parseFloat(h.el.style.left) + h.x * delta * 10) + '%';
        h.el.style.opacity = Math.max(0, h.life / 1.5).toString();
        if (h.life <= 0) {
            h.el.remove();
            heartParticles.splice(i, 1);
        }
    }
}

// Override caresser pour ajouter les coeurs
const originalPetCb = actions.callbacks['pet'];
actions.on('pet', () => {
    originalPetCb();
    spawnHearts();
    spawnFloatingText('Prrrrr... 😻', '#ff69b4');
    if (navigator.vibrate) navigator.vibrate(200);
});

// Boucle d'animation
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    cat.update(delta);
    hud.update(delta);
    updateFloatingTexts(delta);
    updateHearts(delta);

    // Miaou quand le chat a faim/soif
    lastMeowTime += delta;
    if (lastMeowTime > 8) {
        const needs = hud.needs;
        if (needs.hunger.value < 25 || needs.thirst.value < 25) {
            spawnFloatingText('Miaou! 🐱', '#ffaa00');
            lastMeowTime = 0;
        }
    }

    // Comportement autonome basé sur les jauges
    if (cat.state === 'idle') {
        const needs = hud.needs;
        if (needs.hunger.value < 20) {
            cat.walkTo(furniturePos.bowl.x, furniturePos.bowl.z);
        } else if (needs.thirst.value < 20) {
            cat.walkTo(furniturePos.water.x, furniturePos.water.z);
        } else if (needs.fatigue.value > 80) {
            cat.walkTo(furniturePos.cushion.x, furniturePos.cushion.z);
            cat._onArrival = () => { cat.playSleep(); };
        } else if (needs.happiness.value < 20) {
            // Chat triste : il s'assoit et ne bouge plus
            cat.state = 'sad';
            cat._resetLegs();
            cat.head.position.y = 0.55;
            setTimeout(() => {
                if (cat.state === 'sad') {
                    cat.state = 'idle';
                    cat.head.position.y = 0.65;
                    cat.idleTimer = 0;
                }
            }, 4000);
        }
    }

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
