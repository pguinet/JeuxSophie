import * as THREE from 'three';
import { createTerrain } from './terrain.js';
import { populateJungle } from './vegetation.js';
import { VirtualJoystick } from './joystick.js';
import { CameraControls } from './camera-controls.js';
import { Snake } from './snake.js';
import { Sword } from './sword.js';
import { HUD } from './hud.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4a7c59);
scene.fog = new THREE.FogExp2(0x4a7c59, 0.025);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0);
scene.add(camera);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

createTerrain(scene);
const vegetation = populateJungle(scene);

// Floating particles (insects / pollen)
const PARTICLE_COUNT = 200;
const PARTICLE_SPREAD = 30;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
const particleVelocities = new Float32Array(PARTICLE_COUNT * 3);

for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    particlePositions[i3]     = (Math.random() - 0.5) * PARTICLE_SPREAD * 2;
    particlePositions[i3 + 1] = Math.random() * 6;
    particlePositions[i3 + 2] = (Math.random() - 0.5) * PARTICLE_SPREAD * 2;
    particleVelocities[i3]     = (Math.random() - 0.5) * 0.3;
    particleVelocities[i3 + 1] = 0.1 + Math.random() * 0.2;
    particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.3;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

const particleMaterial = new THREE.PointsMaterial({
    color: 0xc8e550,
    size: 0.05,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

function updateParticles(delta) {
    const positions = particleGeometry.attributes.position.array;
    const px = camera.position.x;
    const pz = camera.position.z;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        positions[i3]     += particleVelocities[i3] * delta;
        positions[i3 + 1] += particleVelocities[i3 + 1] * delta;
        positions[i3 + 2] += particleVelocities[i3 + 2] * delta;

        // Wrap around player when too far
        if (positions[i3] - px > PARTICLE_SPREAD)  positions[i3] -= PARTICLE_SPREAD * 2;
        if (positions[i3] - px < -PARTICLE_SPREAD) positions[i3] += PARTICLE_SPREAD * 2;
        if (positions[i3 + 1] > 7) positions[i3 + 1] = 0;
        if (positions[i3 + 1] < 0) positions[i3 + 1] = 7;
        if (positions[i3 + 2] - pz > PARTICLE_SPREAD)  positions[i3 + 2] -= PARTICLE_SPREAD * 2;
        if (positions[i3 + 2] - pz < -PARTICLE_SPREAD) positions[i3 + 2] += PARTICLE_SPREAD * 2;

        // Random drift
        particleVelocities[i3]     += (Math.random() - 0.5) * 0.05;
        particleVelocities[i3 + 2] += (Math.random() - 0.5) * 0.05;
        particleVelocities[i3]     = Math.max(-0.5, Math.min(0.5, particleVelocities[i3]));
        particleVelocities[i3 + 2] = Math.max(-0.5, Math.min(0.5, particleVelocities[i3 + 2]));
    }

    particleGeometry.attributes.position.needsUpdate = true;
}

// Controls
const container = document.getElementById('game-container');
const joystick = new VirtualJoystick(container);
const cameraControls = new CameraControls(camera, canvas);
const sword = new Sword(camera);
const hud = new HUD(container);

// Attack button
const attackBtn = document.createElement('div');
attackBtn.id = 'attack-btn';
attackBtn.textContent = '\u2694\uFE0F';
attackBtn.style.cssText = 'position:absolute; bottom:40px; right:40px; width:80px; height:80px; border-radius:50%; background:rgba(200,50,30,0.6); border:3px solid rgba(255,255,255,0.5); display:flex; align-items:center; justify-content:center; font-size:36px; z-index:15; pointer-events:auto; user-select:none; -webkit-user-select:none;';
container.appendChild(attackBtn);

attackBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    sword.attack(snakes, camera.position, cameraControls.yaw);
    for (const snake of snakes) {
        if (snake.isDead() && !snake.coinAwarded) {
            snake.coinAwarded = true;
            hud.addCoins(5);
        }
    }
});

const MOVE_SPEED = 5;
const COLLISION_RADIUS = 1.5;
const clock = new THREE.Clock();
const DAMAGE_COOLDOWN = 1;
let damageCooldownTimer = 0;
let gameOver = false;

// Spawn snakes
const snakes = [];
function spawnSnakes() {
    for (const s of snakes) {
        if (!s.isDead()) s.die();
    }
    snakes.length = 0;
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 40;
        const sx = Math.cos(angle) * dist;
        const sz = Math.sin(angle) * dist;
        snakes.push(new Snake(scene, sx, sz));
    }
}
spawnSnakes();

function checkCollision(newX, newZ) {
    for (const obj of vegetation) {
        const dx = newX - obj.position.x;
        const dz = newZ - obj.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < COLLISION_RADIUS) return true;
    }
    return false;
}

// Game Over overlay
const gameOverEl = document.createElement('div');
gameOverEl.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:none; flex-direction:column; align-items:center; justify-content:center; z-index:30; pointer-events:auto;';

const gameOverTitle = document.createElement('div');
gameOverTitle.textContent = 'GAME OVER';
gameOverTitle.style.cssText = 'color:red; font-size:48px; font-weight:bold; text-shadow:2px 2px 4px black; font-family:sans-serif;';
gameOverEl.appendChild(gameOverTitle);

const finalScore = document.createElement('div');
finalScore.style.cssText = 'color:gold; font-size:28px; margin:20px 0; font-family:sans-serif;';
gameOverEl.appendChild(finalScore);

const replayBtn = document.createElement('div');
replayBtn.textContent = 'Rejouer';
replayBtn.style.cssText = 'background:rgba(50,150,50,0.8); color:white; font-size:24px; padding:15px 40px; border-radius:10px; border:2px solid white; cursor:pointer; font-family:sans-serif;';
gameOverEl.appendChild(replayBtn);

container.appendChild(gameOverEl);

replayBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    restartGame();
});
replayBtn.addEventListener('click', restartGame);

function restartGame() {
    gameOver = false;
    gameOverEl.style.display = 'none';
    camera.position.set(0, 1.6, 0);
    cameraControls.yaw = 0;
    cameraControls.pitch = 0;
    hud.reset();
    spawnSnakes();
    damageCooldownTimer = 0;
}

function animate() {
    requestAnimationFrame(animate);
    if (gameOver) return;

    const delta = clock.getDelta();

    cameraControls.update();

    const dir = joystick.getDirection();
    if (dir.x !== 0 || dir.y !== 0) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraControls.yaw);
        const right = new THREE.Vector3(1, 0, 0);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraControls.yaw);

        const moveX = (right.x * dir.x + forward.x * (-dir.y)) * MOVE_SPEED * delta;
        const moveZ = (right.z * dir.x + forward.z * (-dir.y)) * MOVE_SPEED * delta;

        const newX = camera.position.x + moveX;
        const newZ = camera.position.z + moveZ;

        if (!checkCollision(newX, newZ)) {
            camera.position.x = newX;
            camera.position.z = newZ;
        }
    }

    camera.position.x = Math.max(-95, Math.min(95, camera.position.x));
    camera.position.z = Math.max(-95, Math.min(95, camera.position.z));

    sword.update(delta);
    updateParticles(delta);

    damageCooldownTimer = Math.max(0, damageCooldownTimer - delta);
    for (const snake of snakes) {
        if (!snake.isDead()) {
            const attacking = snake.update(delta, camera.position);
            if (attacking && damageCooldownTimer <= 0) {
                const isDead = hud.updateHealth(-snake.damage);
                damageCooldownTimer = DAMAGE_COOLDOWN;
                if (isDead) {
                    gameOver = true;
                    finalScore.textContent = 'Pi\u00e8ces r\u00e9colt\u00e9es : ' + hud.coins + ' \uD83E\uDE99';
                    gameOverEl.style.display = 'flex';
                }
            }
        }
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
