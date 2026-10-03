// Habille ton personnage — atelier d'habillage, en 3D.
// Le personnage 3D vient du module partagé shared/avatar3d.js (le même que
// dans les jeux). Ici : la scène (podium qui tourne au doigt) et le panneau de
// personnalisation.

import * as THREE from 'three';
import {
    SKINS, HAIR_COLORS, OUTFIT_COLORS, FACES, BG_COLORS,
    HAIR_BY_GENDER, OUTFIT_BY_GENDER, LABELS,
    loadAvatar, saveAvatar,
} from '../../shared/avatar.js';
import { buildAvatar3D, animerVie } from '../../shared/avatar3d.js';
import { animerAccessoires } from '../../shared/garderobe3d.js';

const app = document.getElementById('app');

const state = loadAvatar();

// ===========================================================================
//  Panneau de personnalisation
// ===========================================================================
// `zoom` : la caméra s'approche du visage pour les onglets de la tête
const CATS = [
    { id: 'gender', tab: '🧒 Qui ?', styleKey: 'gender', styles: ['fille', 'garcon'] },
    { id: 'skin', tab: '👤 Peau', colorKey: 'skin', colors: SKINS },
    { id: 'face', tab: '😊 Visage', styleKey: 'face', styles: FACES, zoom: true },
    { id: 'hair', tab: '💇 Cheveux', styleKey: 'hairStyle', stylesByGender: HAIR_BY_GENDER, colorKey: 'hairColor', colors: HAIR_COLORS, zoom: true },
    { id: 'outfit', tab: '👗 Tenue', styleKey: 'outfit', stylesByGender: OUTFIT_BY_GENDER, colorKey: 'outfitColor', colors: OUTFIT_COLORS },
    { id: 'hat', tab: '👑 Chapeau', styleKey: 'hat', styles: ['aucun', 'couronne', 'chapeau', 'casquette', 'bonnet', 'noeud', 'fleur'], zoom: true },
    { id: 'glasses', tab: '👓 Lunettes', styleKey: 'glasses', styles: ['aucune', 'rondes', 'soleil', 'coeur', 'etoile'], zoom: true },
    { id: 'accessoire', tab: '✨ Accessoire', styleKey: 'accessoire', styles: ['aucun', 'cape', 'ailes', 'baguette', 'collier'] },
    { id: 'bg', tab: '🎨 Fond', colorKey: 'bg', colors: BG_COLORS },
];

let activeCat = 'gender';
let optsEl, tabEls = {};

// Choisir fille/garçon recale la coiffure et la tenue sur une option de ce genre
function applyGender(g) {
    state.gender = g;
    if (!HAIR_BY_GENDER[g].includes(state.hairStyle)) state.hairStyle = HAIR_BY_GENDER[g][0];
    if (!OUTFIT_BY_GENDER[g].includes(state.outfit)) state.outfit = OUTFIT_BY_GENDER[g][0];
}

function changed() {
    saveAvatar(state);
    scene3d.rebatir();
    renderOptions();
}

function renderOptions() {
    optsEl.innerHTML = '';
    const cat = CATS.find(c => c.id === activeCat);
    const styleList = cat.stylesByGender ? cat.stylesByGender[state.gender] : cat.styles;

    if (styleList) {
        for (const st of styleList) {
            const b = document.createElement('button');
            b.className = 'opt' + (state[cat.styleKey] === st ? ' active' : '');
            b.textContent = LABELS[st] || st;
            b.addEventListener('click', () => {
                if (cat.id === 'gender') applyGender(st);
                else state[cat.styleKey] = st;
                changed();
            });
            optsEl.appendChild(b);
        }
    }
    if (cat.colors) {
        for (const col of cat.colors) {
            const b = document.createElement('button');
            b.className = 'swatch' + (state[cat.colorKey] === col ? ' active' : '');
            b.style.background = col;
            b.addEventListener('click', () => { state[cat.colorKey] = col; changed(); });
            optsEl.appendChild(b);
        }
    }
}

function selectCat(id) {
    activeCat = id;
    for (const [cid, el] of Object.entries(tabEls)) el.classList.toggle('active', cid === id);
    scene3d.zoomer(!!CATS.find(c => c.id === id).zoom);
    renderOptions();
}

function surprise() {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    state.gender = pick(['fille', 'garcon']);
    state.skin = pick(SKINS);
    state.face = pick(FACES);
    state.hairStyle = pick(HAIR_BY_GENDER[state.gender]);
    state.hairColor = pick(HAIR_COLORS);
    state.outfit = pick(OUTFIT_BY_GENDER[state.gender]);
    state.outfitColor = pick(OUTFIT_COLORS);
    state.hat = pick(['aucun', 'couronne', 'chapeau', 'casquette', 'bonnet', 'noeud', 'fleur']);
    state.glasses = pick(['aucune', 'rondes', 'soleil', 'coeur', 'etoile']);
    state.accessoire = pick(['aucun', 'cape', 'ailes', 'baguette', 'collier']);
    state.bg = pick(BG_COLORS);
    changed();
}

// ===========================================================================
//  La scène 3D : le personnage sur un podium, qu'on fait tourner au doigt
// ===========================================================================
function creerScene3D(conteneur) {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    conteneur.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

    scene.add(new THREE.HemisphereLight('#ffffff', '#b9a6c9', 1.5));
    const soleil = new THREE.DirectionalLight('#fff4e6', 1.9);
    soleil.position.set(2.5, 5, 4);
    soleil.castShadow = true;
    soleil.shadow.mapSize.set(1024, 1024);
    Object.assign(soleil.shadow.camera, { left: -1.5, right: 1.5, top: 3, bottom: -0.5 });
    scene.add(soleil);
    const contre = new THREE.DirectionalLight('#d0e4ff', 0.8);   // lumière de contour, derrière
    contre.position.set(-3, 3, -4);
    scene.add(contre);

    // le podium rond
    const podium = new THREE.Group();
    const socle = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.12, 48),
        new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }));
    socle.position.y = -0.06;
    socle.receiveShadow = true;
    const liseré = new THREE.Mesh(new THREE.TorusGeometry(0.775, 0.018, 8, 64),
        new THREE.MeshStandardMaterial({ color: '#d6336c', roughness: 0.4 }));
    liseré.rotation.x = Math.PI / 2;
    liseré.position.y = -0.03;
    podium.add(socle, liseré);
    scene.add(podium);

    // --- le personnage ---
    const pivot = new THREE.Group();        // c'est lui qui tourne au doigt
    scene.add(pivot);
    let avatar = null;
    let saut = 0;                           // petit saut de joie quand on change un habit

    function jeter(objet) {
        objet.traverse((o) => {
            if (o.geometry) o.geometry.dispose();
            if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        });
    }
    function rebatir() {
        if (avatar) { pivot.remove(avatar); jeter(avatar); }
        avatar = buildAvatar3D(state);
        avatar.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        pivot.add(avatar);
        scene.background = new THREE.Color(state.bg);
        saut = 1;
    }

    // --- tourner au doigt / à la souris ---
    let angle = 0, vitesseAngle = 0, glisse = null;
    const el = renderer.domElement;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => { glisse = { x: e.clientX }; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
        if (!glisse) return;
        const dx = e.clientX - glisse.x;
        glisse.x = e.clientX;
        vitesseAngle = dx * 0.012;
        angle += vitesseAngle;
    });
    const lacher = () => { glisse = null; };
    el.addEventListener('pointerup', lacher);
    el.addEventListener('pointercancel', lacher);

    // --- caméra : tout le corps, ou zoom sur le visage ---
    const vues = {
        corps: { pos: new THREE.Vector3(0, 1.3, 4.7), cible: new THREE.Vector3(0, 1.05, 0) },
        visage: { pos: new THREE.Vector3(0, 1.88, 2.3), cible: new THREE.Vector3(0, 1.74, 0) },
    };
    let vue = vues.corps;
    const camPos = vue.pos.clone(), camCible = vue.cible.clone();

    function redimensionner() {
        const w = conteneur.clientWidth || 1, h = conteneur.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // sur un écran très étroit, on recule pour que le personnage tienne
        camera.fov = w / h < 0.6 ? 40 : 30;
        camera.updateProjectionMatrix();
    }
    new ResizeObserver(redimensionner).observe(conteneur);
    redimensionner();

    let avant = performance.now();
    function boucle(now) {
        const dt = Math.min(0.05, (now - avant) / 1000);
        avant = now;
        const t = now / 1000;

        // quand on ne touche plus, ça ralentit puis ça tourne tout doucement
        if (!glisse) {
            vitesseAngle *= 0.92;
            angle += vitesseAngle + dt * 0.25;
        }
        pivot.rotation.y = angle;

        if (avatar) {
            animerVie(avatar, t, dt);
            animerAccessoires(avatar.userData.animes, t);
            // petit saut + léger balancement des bras
            saut = Math.max(0, saut - dt * 2.2);
            avatar.position.y = Math.sin(saut * Math.PI) * 0.12;
            const p = avatar.userData.parts;
            p.leftArm.rotation.z = -Math.sin(saut * Math.PI) * 0.5;
            p.rightArm.rotation.z = Math.sin(saut * Math.PI) * 0.5;
            p.leftArm.rotation.x = Math.sin(t * 1.3) * 0.04;
            p.rightArm.rotation.x = -Math.sin(t * 1.3) * 0.04;
        }

        camPos.lerp(vue.pos, 1 - Math.pow(0.02, dt));
        camCible.lerp(vue.cible, 1 - Math.pow(0.02, dt));
        camera.position.copy(camPos);
        camera.lookAt(camCible);

        renderer.render(scene, camera);
        requestAnimationFrame(boucle);
    }
    requestAnimationFrame(boucle);

    return {
        rebatir,
        zoomer(oui) { vue = oui ? vues.visage : vues.corps; },
    };
}

// ===========================================================================
//  La page
// ===========================================================================
let scene3d;

function render() {
    app.innerHTML = '';

    const topbar = document.createElement('div');
    topbar.className = 'topbar';
    const home = document.createElement('a');
    home.className = 'icon-btn';
    // La maison ramène toujours au menu « Mon monde ».
    home.href = '../monde/';
    home.textContent = '🏠';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = 'Habille ton personnage';
    const dice = document.createElement('button');
    dice.className = 'icon-btn';
    dice.textContent = '🎲';
    dice.title = 'Surprise !';
    dice.addEventListener('click', surprise);
    topbar.append(home, title, dice);

    const main = document.createElement('div');
    main.className = 'main';
    const stageEl = document.createElement('div');
    stageEl.className = 'stage';
    const astuce = document.createElement('div');
    astuce.className = 'astuce';
    astuce.textContent = '👆 Fais-moi tourner !';
    stageEl.appendChild(astuce);

    const controls = document.createElement('div');
    controls.className = 'controls';
    const tabs = document.createElement('div');
    tabs.className = 'tabs';
    tabEls = {};
    for (const cat of CATS) {
        const t = document.createElement('button');
        t.className = 'tab' + (cat.id === activeCat ? ' active' : '');
        t.textContent = cat.tab;
        t.addEventListener('click', () => selectCat(cat.id));
        tabEls[cat.id] = t;
        tabs.appendChild(t);
    }
    optsEl = document.createElement('div');
    optsEl.className = 'options';
    controls.append(tabs, optsEl);

    main.append(stageEl, controls);
    app.append(topbar, main);

    scene3d = creerScene3D(stageEl);
    scene3d.rebatir();
    renderOptions();
}

render();
