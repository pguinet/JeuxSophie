// Mon Chat 2 — point d'entrée : chargement, scène, post-traitement, boucle.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Assets } from './assets.js';
import { QualityManager } from './quality.js';
import { Lighting } from './lighting.js';
import { buildHouse } from './house.js';
import { buildGarden } from './garden.js';
import { Cat } from './cat/cat.js';
import { createBehavior, stepBehavior, requestAction } from './cat/behavior.js';
import { Nav } from './nav.js';
import { NAV_DEF, SPOTS } from './world-layout.js';
import { CameraRig } from './camera.js';
import { createNeeds, tickNeeds } from './needs.js';
import { createStorage, createState } from './save.js';
import { tickWallet } from './shop-logic.js';

THREE.Cache.enabled = true;
const params = new URLSearchParams(location.search);
const debug = params.get('debug') === '1';
const nofx = params.get('nofx') === '1'; // captures headless rapides : sans ombres ni bloom

const canvas = document.getElementById('game-canvas');
const container = document.getElementById('game-container');
const loadingEl = document.getElementById('loading');
const loadingFill = document.getElementById('loading-fill');
const loadingText = document.getElementById('loading-text');
const setLoading = (frac, text) => { loadingFill.style.width = `${Math.round(frac * 100)}%`; if (text) loadingText.textContent = text; };

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = !nofx;

const quality = new QualityManager(renderer);
if (params.get('q')) quality.set(params.get('q'), { manual: false });
quality.applyToRenderer();
let settings = quality.settings;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.05, 250);

// ---------- Chargement ----------
const storage = createStorage(localStorage);
const state = storage.load() || createState(params.get('coat') || undefined);
if (params.get('coat')) state.coat = params.get('coat');

const assets = new Assets(renderer, { anisotropy: settings.anisotropy, onProgress: (l, t) => setLoading(0.05 + 0.6 * (l / Math.max(t, 1)), 'Chargement des décors…') });

async function boot() {
    setLoading(0.02, 'Préparation…');
    const [hdriDay, hdriNight, house, garden] = await Promise.all([
        assets.loadHDRI('kloofendal_48d_partly_cloudy_puresky_2k.hdr'),
        assets.loadHDRI('moonless_golf_1k.hdr'),
        buildHouse(scene, assets, settings),
        buildGarden(scene, assets, settings),
    ]);
    setLoading(0.7, 'Le chat arrive…');
    await new Promise((r) => setTimeout(r, 30));

    const lighting = new Lighting(scene, { day: hdriDay, night: hdriNight }, settings);
    lighting.cycle.t = state.dayTime ?? 0.66;
    if (params.has('time')) { lighting.cycle.t = parseFloat(params.get('time')); lighting.cycle.paused = params.get('pause') === '1'; }
    lighting.setLamp(house.lampPosition, house.bulbMaterial);
    lighting.setFirefliesArea(...garden.fireflyArea);

    const cat = new Cat(scene, { coat: state.coat, shellCount: settings.shells, voxel: settings.voxel });
    const nav = new Nav(NAV_DEF);
    const behavior = createBehavior(-3.2, 0.4);
    behavior.heading = Math.PI / 2;
    const spots = {
        bowl: SPOTS.bowl.at, bowlFace: SPOTS.bowl.face, water: SPOTS.water.at, waterFace: SPOTS.water.face,
        bed: SPOTS.bed.at, bedFace: SPOTS.bed.face, litter: SPOTS.litter.at,
        randomPoint: (rng) => nav.randomPoint(rng, Math.random() < 0.6 ? 'house' : 'garden'),
        clamp: (n, p) => nav.clamp(n, p), route: (a, b) => nav.route(a, b),
    };
    // Zone de clic sur le chat (invisible : calque 1)
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshBasicMaterial());
    hit.position.set(-0.03, 0.22, 0); hit.layers.set(1); cat.group.add(hit);

    const rig = new CameraRig(camera, canvas, { onPet: () => doAction('pet') });
    rig.hitObjects = [hit];
    rig.follow = cat.group;
    rig.setInitial(new THREE.Vector3(behavior.pos[0], 0.28, behavior.pos[1]), 3.4, 0.7, 0.5);
    if (params.has('cam')) { const [x, y, z] = params.get('cam').split(',').map(Number); camera.position.set(x, y, z); rig.follow = null; rig.controls.target.set(...(params.get('look') || '-3,0.3,0').split(',').map(Number)); rig.controls.update(); }

    // ---------- Post-traitement ----------
    let composer = null;
    function buildComposer() {
        const w = window.innerWidth, h = window.innerHeight;
        const target = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: settings.msaa });
        composer = new EffectComposer(renderer, target);
        composer.addPass(new RenderPass(scene, camera));
        if (settings.bloom && !nofx) { const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.22, 0.5, 0.92); composer.addPass(bloom); }
        composer.addPass(new OutputPass());
    }
    buildComposer();
    quality.onChange((s) => { settings = s; buildComposer(); cat.setShellCount(s.shells); lighting.sun.shadow.mapSize.set(s.shadowMapSize, s.shadowMapSize); lighting.sun.shadow.map?.dispose(); lighting.sun.shadow.map = null; });
    quality.buildMenu(container);

    // ---------- Jeu ----------
    const needs = state.needs || createNeeds();
    const wallet = state.wallet;
    const rng = Math.random;
    function doAction(kind) {
        const map = { feed: 'eat', drink: 'drink', pet: 'pet', wash: 'groom', sleep: 'sleep' };
        requestAction(behavior, map[kind] || kind, spots);
    }
    window.__chat2 = { cat, behavior, needs, wallet, lighting, doAction, quality, renderer, scene, camera }; // pour le débogage
    let saveTimer = 0;
    function save() { state.needs = needs; state.wallet = wallet; state.coat = cat.coat; state.dayTime = lighting.cycle.t; storage.save(state); }
    window.addEventListener('beforeunload', save);

    const debugEl = debug ? Object.assign(document.createElement('div'), { id: 'debug' }) : null;
    if (debugEl) container.appendChild(debugEl);

    // ---------- Boucle ----------
    setLoading(1, 'C\'est prêt !');
    loadingEl.classList.add('hidden');
    const clock = new THREE.Clock();
    let time = 0, frames = 0, fpsAcc = 0, fpsShown = 0;
    const lookAt = new THREE.Vector3();
    renderer.setAnimationLoop(() => {
        const dt = Math.min(clock.getDelta(), 0.1);
        time += dt;
        lighting.update(dt);
        garden.update(dt, time);
        house.update(dt);
        tickNeeds(needs, dt);
        tickWallet(wallet, dt);
        stepBehavior(behavior, needs, dt, rng, spots);
        cat.update(dt, behavior, { time, lightLevel: lighting.lightLevel, lookAt: lookAt.copy(camera.position) });
        rig.update(dt);
        quality.tick(dt);
        saveTimer += dt; if (saveTimer > 30) { saveTimer = 0; save(); }
        composer.render();
        if (debugEl) {
            frames++; fpsAcc += dt;
            if (fpsAcc > 0.5) { fpsShown = frames / fpsAcc; frames = 0; fpsAcc = 0; }
            debugEl.textContent = `${fpsShown.toFixed(0)} fps | ${quality.preset} | draw ${renderer.info.render.calls} tri ${(renderer.info.render.triangles / 1000).toFixed(0)}k | chat ${behavior.state} ${behavior.pos.map((v) => v.toFixed(1))} | t=${lighting.cycle.t.toFixed(3)} | gen ${cat.stats.ms.toFixed(0)} ms ${cat.stats.triangles} tri`;
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });
}

boot().catch((err) => {
    console.error(err);
    setLoading(1, `Oups, une erreur : ${err.message}`);
});
