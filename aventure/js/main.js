import * as THREE from 'three';
import { createTerrain } from './terrain.js';
import { populateJungle } from './vegetation.js';
import { VirtualJoystick } from './joystick.js';
import { CameraControls } from './camera-controls.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

createTerrain(scene);
const vegetation = populateJungle(scene);

// Controls
const container = document.getElementById('game-container');
const joystick = new VirtualJoystick(container);
const cameraControls = new CameraControls(camera, canvas);

const MOVE_SPEED = 5;
const COLLISION_RADIUS = 1.5;
const clock = new THREE.Clock();

function checkCollision(newX, newZ) {
    for (const obj of vegetation) {
        const dx = newX - obj.position.x;
        const dz = newZ - obj.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < COLLISION_RADIUS) return true;
    }
    return false;
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Camera rotation
    cameraControls.update();

    // Player movement (relative to camera direction)
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

    // Keep player within terrain bounds
    camera.position.x = Math.max(-95, Math.min(95, camera.position.x));
    camera.position.z = Math.max(-95, Math.min(95, camera.position.z));

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
