// Visionneuse de développement du chat : ?coat=tabby&shells=12&voxel=0.006&view=side|front|top|iso|3q&wire=1&state=idle
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Cat } from './cat/cat.js';
import { COAT_IDS } from './cat/coats.js';

const q = new URLSearchParams(location.search);
const info = document.getElementById('info');
window.onerror = (m, src, line) => { if (!String(m).includes('__stop__')) info.textContent = `ERREUR ${m} (${src}:${line})`; };

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfd3d8);
scene.add(new THREE.HemisphereLight(0xdde8ff, 0x776655, 1.6));
const sun = new THREE.DirectionalLight(0xfff0dd, 3.2);
sun.position.set(1.2, 2.2, 1.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = sun.shadow.camera.bottom = -1;
sun.shadow.camera.right = sun.shadow.camera.top = 1;
sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 6;
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.01;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xcfe0ff, 0.8); fill.position.set(-2, 1, -1.5); scene.add(fill);

const ground = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.9 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
scene.add(new THREE.GridHelper(1.2, 12, 0x999999, 0xaaaaaa));

if (q.get('only') === 'eye') {
    const { createEye } = await import('./cat/eyes.js');
    const eye = createEye({ radius: 0.0125, iris: '#7fb069', lidColor: '#c27a34' });
    eye.group.position.set(0, 0.3, 0);
    eye.group.rotation.y = parseFloat(q.get('yaw') || '0');
    eye.setSquint(parseFloat(q.get('squint') || '0'));
    eye.setBlink(parseFloat(q.get('blink') || '0'));
    scene.add(eye.group);
    const cam = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.001, 10);
    cam.position.set(0.02, 0.31, 0.07); cam.lookAt(0, 0.3, 0);
    info.textContent = 'œil seul';
    renderer.setAnimationLoop(() => renderer.render(scene, cam));
    throw new Error('__stop__');
}
const coat = COAT_IDS.includes(q.get('coat')) ? q.get('coat') : 'tabby';
const shells = q.has('shells') ? parseInt(q.get('shells'), 10) : 12;
const voxel = q.has('voxel') ? parseFloat(q.get('voxel')) : 0.006;
const cat = new Cat(scene, { coat, shellCount: shells, voxel });
if (q.get('wire') === '1') cat.mesh.material = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true });
if (q.get('skin') === '1') { cat.setShellCount(0); cat.mesh.material = new THREE.MeshStandardMaterial({ color: 0xc08050, roughness: 0.8 }); }
const s = cat.stats;
info.textContent = `robe ${coat} | couches ${shells} | voxel ${voxel} m | grille ${s.res.join('x')}\n${s.triangles} triangles, ${s.vertices} sommets, généré en ${s.ms.toFixed(0)} ms`;

const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.02, 50);
const target = q.get('view') === 'face' ? new THREE.Vector3(0.28, 0.30, 0) : new THREE.Vector3(-0.03, 0.22, 0);
const view = q.get('view') || '3q';
const D = 1.35;
const views = { side: [0, 0.22, D], front: [D, 0.24, 0], top: [0.0, D, 0.001], iso: [D * 0.7, 0.7, D * 0.7], '3q': [D * 0.75, 0.42, D * 0.6], back: [-D, 0.3, 0.2], face: [0.62, 0.38, 0.28] };
camera.position.set(...(views[view] || views['3q']));
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(target); controls.update();

const state = q.get('state') || 'idle';
const fakeBehavior = { state, pos: [0, 0], heading: Math.PI / 2, speed: state === 'walk' ? 0.35 : 0 };
if (state === 'walk') fakeBehavior.state = 'wander';
const lookAt = q.get('look') === '1' ? camera.position : null;
let last = performance.now();
// Pré-avance l'animation pour que la capture montre la pose stabilisée
for (let i = 0; i < 120; i++) cat.update(1 / 60, fakeBehavior, { time: i / 60, lookAt, lightLevel: 0.7 });
renderer.setAnimationLoop(() => {
    const now = performance.now(); const dt = (now - last) / 1000; last = now;
    cat.update(dt, fakeBehavior, { time: now / 1000, lookAt, lightLevel: 0.7 });
    controls.update(); renderer.render(scene, camera);
});
