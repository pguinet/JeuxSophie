// Caméra orbitale : souris/tactile via OrbitControls, flèches du clavier, suivi doux du chat, clic sur le chat.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class CameraRig {
    constructor(camera, domElement, { onPet } = {}) {
        this.camera = camera;
        this.controls = new OrbitControls(camera, domElement);
        const c = this.controls;
        c.enableDamping = true; c.dampingFactor = 0.08;
        c.enablePan = false;
        c.minDistance = 1.1; c.maxDistance = 11;
        c.minPolarAngle = 0.12; c.maxPolarAngle = 1.48;
        c.rotateSpeed = 0.7; c.zoomSpeed = 0.9;
        this.target = new THREE.Vector3(0, 0.3, 0);
        this.follow = null;   // Object3D suivi (le chat)
        this.followHeight = 0.28;
        this.keys = new Set();
        this.raycaster = new THREE.Raycaster();
        this.raycaster.layers.set(1);
        this.hitObjects = [];
        this.onPet = onPet;
        window.addEventListener('keydown', (e) => { if (e.key.startsWith('Arrow') || e.key === '+' || e.key === '-') { this.keys.add(e.key); e.preventDefault(); } });
        window.addEventListener('keyup', (e) => this.keys.delete(e.key));
        // Clic / tap court sur le chat
        let downPos = null;
        domElement.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; });
        domElement.addEventListener('pointerup', (e) => {
            if (!downPos) return;
            const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
            downPos = null;
            if (moved > 8) return;
            const ndc = new THREE.Vector2((e.clientX / domElement.clientWidth) * 2 - 1, -(e.clientY / domElement.clientHeight) * 2 + 1);
            this.raycaster.setFromCamera(ndc, this.camera);
            const hits = this.raycaster.intersectObjects(this.hitObjects, true);
            if (hits.length) this.onPet?.(hits[0]);
        });
    }

    /** Place la caméra à une position initiale agréable autour de la cible. */
    setInitial(target, distance = 3.2, azimuth = 0.9, elevation = 0.55) {
        this.target.copy(target);
        this.controls.target.copy(target);
        this.camera.position.set(
            target.x + Math.sin(azimuth) * Math.cos(elevation) * distance,
            target.y + Math.sin(elevation) * distance,
            target.z + Math.cos(azimuth) * Math.cos(elevation) * distance,
        );
        this.controls.update();
    }

    update(dt) {
        // Suivi doux du chat : la cible glisse vers lui, la caméra suit en conservant son décalage
        if (this.follow) {
            const goal = this.follow.position.clone(); goal.y += this.followHeight;
            const k = 1 - Math.pow(2, -dt / 0.35);
            const delta = goal.clone().sub(this.controls.target).multiplyScalar(k);
            this.controls.target.add(delta);
            this.camera.position.add(delta);
        }
        // Clavier : rotation / zoom
        if (this.keys.size) {
            const offset = this.camera.position.clone().sub(this.controls.target);
            const sph = new THREE.Spherical().setFromVector3(offset);
            const rot = 1.6 * dt;
            if (this.keys.has('ArrowLeft')) sph.theta += rot;
            if (this.keys.has('ArrowRight')) sph.theta -= rot;
            if (this.keys.has('ArrowUp')) sph.phi -= rot * 0.6;
            if (this.keys.has('ArrowDown')) sph.phi += rot * 0.6;
            if (this.keys.has('+')) sph.radius *= 1 - dt;
            if (this.keys.has('-')) sph.radius *= 1 + dt;
            sph.phi = THREE.MathUtils.clamp(sph.phi, this.controls.minPolarAngle, this.controls.maxPolarAngle);
            sph.radius = THREE.MathUtils.clamp(sph.radius, this.controls.minDistance, this.controls.maxDistance);
            this.camera.position.copy(this.controls.target).add(offset.setFromSpherical(sph));
        }
        this.controls.update();
        // Ne jamais passer sous le sol
        if (this.camera.position.y < 0.15) this.camera.position.y = 0.15;
    }
}
