// Entité Chat : génère le maillage (SDF → marching cubes), le skinning et les couches de fourrure.
import * as THREE from 'three';
import { buildCatShapes, shapesBounds, createUnionSDF } from './sdf.js';
import { polygonize, taubinSmooth, computeNormals } from './marching-cubes.js';
import { computeSkinWeights } from './skin-weights.js';
import { BONE_INDEX } from './skeleton-def.js';
import { buildBones } from './skeleton.js';
import { createFurMaterials } from './fur-material.js';
import { DEFAULT_COAT, COATS } from './coats.js';
import { createEye } from './eyes.js';
import { createNose, createWhiskers } from './details.js';
import { CatAnimator } from './animator.js';
import { BONES } from './skeleton-def.js';

/** Génère la géométrie skinnée du chat. Pur calcul, ~250 ms à 6 mm. */
export const EYE_RADIUS = 0.0125;
const SKULL_CENTER = [0.255, 0.315, 0];

/** Direction unitaire du regard de chaque œil depuis le centre du crâne (avant, un peu haut, vers l'extérieur). */
export function eyeDirection(side) {
    const v = [0.70, 0.20, side * 0.62];
    const l = Math.hypot(...v);
    return v.map((c) => c / l);
}

/**
 * Trouve le centre des yeux : on marche depuis le centre du crâne le long de la direction du regard
 * jusqu'à la surface, puis on recule d'une fraction du rayon pour que l'œil soit enchâssé.
 */
export function computeEyePlacement(distance) {
    const eyes = [];
    for (const side of [1, -1]) {
        const dir = eyeDirection(side);
        let t = 0.02, d = -1;
        while (d < 0 && t < 0.2) { d = distance(SKULL_CENTER[0] + dir[0] * t, SKULL_CENTER[1] + dir[1] * t, SKULL_CENTER[2] + dir[2] * t); t += 0.0005; }
        const surf = t - 0.0005;
        const depth = surf - EYE_RADIUS * 0.62;
        eyes.push({ side, dir, center: [SKULL_CENTER[0] + dir[0] * depth, SKULL_CENTER[1] + dir[1] * depth, SKULL_CENTER[2] + dir[2] * depth] });
    }
    return eyes;
}

export function generateCatGeometry({ voxel = 0.006, smoothIterations = 3 } = {}) {
    const t0 = performance.now();
    const shapes = buildCatShapes();
    const eyes = computeEyePlacement(createUnionSDF(shapes).distance);
    // Orbites : on soustrait une sphère à peine plus grande que le globe
    const cuts = eyes.map((e) => ({ type: 'ellipsoid', c: e.center, radii: [EYE_RADIUS * 1.03, EYE_RADIUS * 1.03, EYE_RADIUS * 1.03], blend: 0.006 }));
    const sdf = createUnionSDF(shapes, cuts);
    const b = shapesBounds(shapes, 0.03);
    const res = [0, 1, 2].map((i) => Math.ceil((b.max[i] - b.min[i]) / voxel));
    const { positions, indices } = polygonize(sdf.distance, { min: b.min, max: b.max, res });
    taubinSmooth(positions, indices, smoothIterations);
    const normals = computeNormals(positions, indices);
    const { skinIndex, skinWeight } = computeSkinWeights(positions, shapes, BONE_INDEX, { k: 0.015 });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndex, 4));
    geometry.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeight, 4));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingSphere();
    geometry.userData.stats = { triangles: indices.length / 3, vertices: positions.length / 3, ms: performance.now() - t0, res };
    geometry.userData.eyes = eyes;
    return geometry;
}

export class Cat {
    /**
     * @param {THREE.Scene|THREE.Object3D} parent
     * @param {{coat?: string, shellCount?: number, voxel?: number}} opts
     */
    constructor(parent, opts = {}) {
        this.coat = opts.coat || DEFAULT_COAT;
        this.shellCount = opts.shellCount ?? 12;
        this.group = new THREE.Group();
        this.group.name = 'cat';
        parent.add(this.group);

        this.geometry = generateCatGeometry({ voxel: opts.voxel ?? 0.006 });
        this.stats = this.geometry.userData.stats;

        const { bones, root, byName } = buildBones();
        this.bones = bones; this.rootBone = root; this.bone = byName;

        const eyes = this.geometry.userData.eyes;
        this.materials = createFurMaterials(this.coat, this.shellCount, { eyeL: eyes[0].center, eyeR: eyes[1].center, nose: [0.322, 0.296, 0] });
        this.mesh = new THREE.SkinnedMesh(this.geometry, this.materials.base);
        this.mesh.name = 'cat-skin';
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.add(root);
        this.group.add(this.mesh);
        this.mesh.updateMatrixWorld(true);
        this.skeleton = new THREE.Skeleton(bones);
        this.mesh.bind(this.skeleton);

        this.shells = [];
        for (let i = 0; i < this.shellCount; i++) {
            const shell = new THREE.SkinnedMesh(this.geometry, this.materials.shells[i]);
            shell.name = `cat-fur-${i + 1}`;
            shell.castShadow = false;
            shell.receiveShadow = true;
            shell.frustumCulled = false;
            shell.bind(this.skeleton, this.mesh.bindMatrix);
            this.group.add(shell);
            this.shells.push(shell);
        }

        this._buildFace();
        this.animator = new CatAnimator(this);
        this.hitMesh = this.mesh;
    }

    /** Yeux, truffe et moustaches attachés à l'os de la tête (coordonnées de repos → locales à l'os). */
    _buildFace() {
        const head = this.bone.head;
        const headPos = BONES.find((b) => b.name === 'head').pos;
        const local = (x, y, z) => new THREE.Vector3(x - headPos[0], y - headPos[1], z - headPos[2]);
        const coat = COATS[this.coat] || COATS.tabby;
        this.eyes = [];
        for (const e of this.geometry.userData.eyes) {
            const eye = createEye({ radius: EYE_RADIUS, iris: coat.eye, lidColor: coat.base });
            eye.group.position.copy(local(...e.center));
            // L'axe +Z de l'œil regarde vers l'avant (+X), ouvert de ~20° vers l'extérieur, horizontal
            const flatDir = new THREE.Vector3(e.dir[0], 0, e.dir[2]).normalize();
            const yaw = Math.atan2(flatDir.x, flatDir.z);
            eye.group.rotation.set(0, yaw, 0);
            head.add(eye.group);
            this.eyes.push(eye);
        }
        this.nose = createNose();
        this.nose.position.copy(local(0.322, 0.296, 0));
        head.add(this.nose);
        this.whiskers = createWhiskers({ color: this.coat === 'black' ? 0x444444 : 0xf5f0e8 });
        this.whiskers.position.copy(local(0.306, 0.284, 0));
        head.add(this.whiskers);
    }

    /** Accessoires achetés : 'collar' (collier rouge) et 'bow' (nœud rose), attachés au cou. */
    setAccessories(owned) {
        if (this.accessories) { this.accessories.parent.remove(this.accessories); }
        this.accessories = new THREE.Group();
        const neckPos = BONES.find((b) => b.name === 'neck').pos;
        const local = (x, y, z) => new THREE.Vector3(x - neckPos[0], y - neckPos[1], z - neckPos[2]);
        if (owned.includes('collar')) {
            const collar = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.007, 12, 40), new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.45 }));
            collar.position.copy(local(0.195, 0.278, 0)); collar.rotation.y = Math.PI / 2; collar.rotation.x = 0.35; collar.scale.set(1, 0.92, 1);
            const bell = new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 12), new THREE.MeshStandardMaterial({ color: 0xe8c04a, roughness: 0.25, metalness: 0.9 }));
            bell.position.copy(local(0.235, 0.232, 0));
            collar.castShadow = bell.castShadow = true;
            this.accessories.add(collar, bell);
        }
        if (owned.includes('bow')) {
            const mat = new THREE.MeshStandardMaterial({ color: 0xff6fa8, roughness: 0.6 });
            const bow = new THREE.Group();
            for (const side of [1, -1]) {
                const loop = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), mat);
                loop.scale.set(0.55, 0.7, 1); loop.position.set(0, 0.004, side * 0.02); loop.castShadow = true; bow.add(loop);
            }
            const knot = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 10), mat); bow.add(knot);
            bow.position.copy(local(0.232, 0.245, 0));
            this.accessories.add(bow);
        }
        this.bone.neck.add(this.accessories);
    }

    setCoat(id) {
        this.coat = id; this.materials.setCoat(id);
        // Reconstruit le visage (couleur des yeux / moustaches)
        for (const e of this.eyes) { e.group.parent.remove(e.group); e.dispose(); }
        this.nose.parent.remove(this.nose); this.whiskers.parent.remove(this.whiskers);
        this._buildFace();
    }

    /** Active seulement les n premières couches (réglage qualité sans reconstruire). */
    setShellCount(n) {
        this.shells.forEach((s, i) => { s.visible = i < n; });
    }

    /**
     * @param {number} dt secondes
     * @param {object} behavior état de behavior.js (state, pos, heading, speed)
     * @param {{time:number, lightLevel?:number, lookAt?:THREE.Vector3}} ctx
     */
    update(dt, behavior, ctx = {}) {
        if (behavior) {
            this.group.position.x = behavior.pos[0];
            this.group.position.z = behavior.pos[1];
            this.group.rotation.y = behavior.heading - Math.PI / 2;
        }
        this.animator.update(dt, behavior, ctx);
    }

    dispose() {
        this.geometry.dispose();
        this.materials.base.dispose();
        this.materials.shells.forEach((m) => m.dispose());
        this.group.parent?.remove(this.group);
    }
}
