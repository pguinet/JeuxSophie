import * as THREE from 'three';
import { createTerrain } from './terrain.js';
import { populateJungle } from './vegetation.js';
import { VirtualJoystick } from './joystick.js';
import { CameraControls } from './camera-controls.js';
import { Snake } from './snake.js';
import { Spider } from './spider.js';
import { Crocodile } from './crocodile.js';
import { Monkey } from './monkey.js';
import { Sword } from './sword.js';
import { HUD } from './hud.js';
import { QuestSystem } from './quests.js';
import { Player } from './player.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4a7c59);
scene.fog = new THREE.FogExp2(0x4a7c59, 0.025);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
    const px = player.group.position.x;
    const pz = player.group.position.z;

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
const player = new Player(scene);
const sword = new Sword(player.weaponMount);
const hud = new HUD(container);
const quests = new QuestSystem(container, hud);

// Camera third-person settings
const CAM_DISTANCE = 5;
const CAM_HEIGHT = 3;
const CAM_LOOK_HEIGHT = 1.4;

// Attack button
const attackBtn = document.createElement('div');
attackBtn.id = 'attack-btn';
attackBtn.textContent = '\u2694\uFE0F';
attackBtn.style.cssText = 'position:absolute; bottom:40px; right:40px; width:80px; height:80px; border-radius:50%; background:rgba(200,50,30,0.6); border:3px solid rgba(255,255,255,0.5); display:flex; align-items:center; justify-content:center; font-size:36px; z-index:15; pointer-events:auto; user-select:none; -webkit-user-select:none; transition:background 0.15s ease;';
container.appendChild(attackBtn);

// Bullets
const bullets = [];
const BULLET_SPEED = 40;
const BULLET_DAMAGE = 10;
const BULLET_MAX_DIST = 50;
const bulletGeo = new THREE.SphereGeometry(0.08, 6, 6);
const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

function shootBullet() {
    const bullet = new THREE.Mesh(bulletGeo, bulletMat);
    // Tirer depuis la position du joueur
    bullet.position.set(player.group.position.x, 1.2, player.group.position.z);
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraControls.yaw);
    bullet.userData.direction = dir;
    bullet.userData.distance = 0;
    scene.add(bullet);
    bullets.push(bullet);
}

function updateBullets(delta) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        const move = BULLET_SPEED * delta;
        b.position.addScaledVector(b.userData.direction, move);
        b.userData.distance += move;

        // Vérifier collision avec monstres
        let hit = false;
        for (const snake of snakes) {
            if (snake.isDead()) continue;
            const dx = b.position.x - snake.group.position.x;
            const dz = b.position.z - snake.group.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 1.5) {
                snake.takeDamage(BULLET_DAMAGE);
                if (snake.isDead() && !snake.coinAwarded) {
                    snake.coinAwarded = true;
                    hud.addCoins(5);
                    quests.onMonsterKilled(snake.monsterType);
                    quests.onCoinsCollected(hud.coins);
                }
                hit = true;
                break;
            }
        }

        if (hit || b.userData.distance > BULLET_MAX_DIST) {
            scene.remove(b);
            bullets.splice(i, 1);
        }
    }
}

// Changer l'arme quand on switch
hud.onGunToggle = (active) => {
    attackBtn.textContent = active ? '\uD83D\uDD2B' : '\u2694\uFE0F';
    sword.switchToGun(active);
};

attackBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (hud.gunActive) {
        shootBullet();
        sword.gunRecoil();
    } else {
        sword.attack(snakes, player.group.position, cameraControls.yaw);
        for (const snake of snakes) {
            if (snake.isDead() && !snake.coinAwarded) {
                snake.coinAwarded = true;
                hud.addCoins(5);
                quests.onMonsterKilled(snake.monsterType);
                quests.onCoinsCollected(hud.coins);
            }
        }
    }
    attackBtn.style.background = 'rgba(80,20,10,0.8)';
    setTimeout(() => {
        attackBtn.style.background = 'rgba(200,50,30,0.6)';
    }, 1000);
});

const MOVE_SPEED = 5;
const COLLISION_RADIUS = 1.5;
const clock = new THREE.Clock();
const DAMAGE_COOLDOWN = 1;
let damageCooldownTimer = 0;
let gameOver = false;
const HEAL_DELAY = 5;
let idleTimer = 0;
let playerIsIdle = true;

// Spawn monsters
const monsters = [];
function randomSpawnPos(minDist, maxDist) {
    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    return { x: Math.cos(angle) * dist, z: Math.sin(angle) * dist };
}

function spawnMonsters() {
    for (const m of monsters) {
        if (!m.isDead()) m.die();
    }
    monsters.length = 0;
    // 5 serpents
    for (let i = 0; i < 5; i++) {
        const { x, z } = randomSpawnPos(15, 55);
        monsters.push(new Snake(scene, x, z));
    }
    // 3 araignées
    for (let i = 0; i < 3; i++) {
        const { x, z } = randomSpawnPos(25, 60);
        monsters.push(new Spider(scene, x, z));
    }
    // 2 crocodiles
    for (let i = 0; i < 2; i++) {
        const { x, z } = randomSpawnPos(30, 70);
        monsters.push(new Crocodile(scene, x, z));
    }
    // 2 singes
    for (let i = 0; i < 2; i++) {
        const { x, z } = randomSpawnPos(20, 50);
        monsters.push(new Monkey(scene, x, z));
    }
}
spawnMonsters();
const snakes = monsters;

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
    player.group.position.set(0, 0, 0);
    cameraControls.yaw = 0;
    cameraControls.pitch = 0;
    hud.reset();
    quests.reset();
    spawnMonsters();
    damageCooldownTimer = 0;
}

function animate() {
    requestAnimationFrame(animate);
    if (gameOver) return;

    const delta = clock.getDelta();

    // Lire les contrôles tactiles (yaw/pitch)
    cameraControls.update();

    // Déplacement du joueur
    const dir = joystick.getDirection();
    playerIsIdle = (dir.x === 0 && dir.y === 0);
    if (!playerIsIdle) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraControls.yaw);
        const right = new THREE.Vector3(1, 0, 0);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraControls.yaw);

        const moveX = (right.x * dir.x + forward.x * (-dir.y)) * MOVE_SPEED * delta;
        const moveZ = (right.z * dir.x + forward.z * (-dir.y)) * MOVE_SPEED * delta;

        const newX = player.group.position.x + moveX;
        const newZ = player.group.position.z + moveZ;

        if (!checkCollision(newX, newZ)) {
            player.group.position.x = newX;
            player.group.position.z = newZ;
        }
    }

    player.group.position.x = Math.max(-95, Math.min(95, player.group.position.x));
    player.group.position.z = Math.max(-95, Math.min(95, player.group.position.z));

    // Mettre à jour le modèle du joueur (animation marche + rotation)
    player.update(delta, !playerIsIdle, cameraControls.yaw);

    // Caméra troisième personne : derrière et au-dessus du joueur
    const camOffsetX = Math.sin(cameraControls.yaw) * CAM_DISTANCE;
    const camOffsetZ = Math.cos(cameraControls.yaw) * CAM_DISTANCE;
    camera.position.x = player.group.position.x + camOffsetX;
    camera.position.z = player.group.position.z + camOffsetZ;
    camera.position.y = CAM_HEIGHT - cameraControls.pitch * 2;
    camera.lookAt(player.group.position.x, CAM_LOOK_HEIGHT, player.group.position.z);

    sword.update(delta, player.rightArm);
    updateBullets(delta);
    updateParticles(delta);

    // Régénération de vie quand immobile
    if (playerIsIdle && hud.health < hud.maxHealth) {
        idleTimer += delta;
        if (idleTimer >= HEAL_DELAY) {
            hud.updateHealth(10);
            idleTimer = 0;
        }
    } else if (!playerIsIdle) {
        idleTimer = 0;
    }

    damageCooldownTimer = Math.max(0, damageCooldownTimer - delta);
    for (const snake of snakes) {
        if (!snake.isDead()) {
            const attacking = snake.update(delta, player.group.position);
            if (attacking && damageCooldownTimer <= 0) {
                const dmg = hud.shieldActive ? Math.floor(snake.damage / 2) : snake.damage;
                const isDead = hud.updateHealth(-dmg);
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
