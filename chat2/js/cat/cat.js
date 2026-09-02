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
import { BONES } from './skeleton-def.js';

/** Génère la géométrie skinnée du chat. Pur calcul, ~250 ms à 6 mm. */
export function generateCatGeometry({ voxel = 0.006, smoothIterations = 3 } = {}) {
    const t0 = performance.now();
    const shapes = buildCatShapes();
    const sdf = createUnionSDF(shapes);
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

        this.materials = createFurMaterials(this.coat, this.shellCount);
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
    }

    /** Yeux, truffe et moustaches attachés à l'os de la tête (coordonnées de repos → locales à l'os). */
    _buildFace() {
        const head = this.bone.head;
        const headPos = BONES.find((b) => b.name === 'head').pos;
        const local = (x, y, z) => new THREE.Vector3(x - headPos[0], y - headPos[1], z - headPos[2]);
        const coat = COATS[this.coat] || COATS.tabby;
        this.eyes = [];
        for (const side of [1, -1]) {
            const eye = createEye({ radius: 0.0125, iris: coat.eye, lidColor: coat.base });
            eye.group.position.copy(local(0.2965, 0.323, side * 0.0365));
            // Regarde vers l'avant (+X) avec une ouverture de ~22° vers l'extérieur et un peu vers le bas
            eye.group.rotation.set(0, Math.PI / 2 - side * 0.38, 0, 'YXZ');
            eye.group.rotateX(0.08);
            head.add(eye.group);
            this.eyes.push(eye);
        }
        this.nose = createNose();
        this.nose.position.copy(local(0.3235, 0.296, 0));
        head.add(this.nose);
        this.whiskers = createWhiskers({ color: this.coat === 'black' ? 0x444444 : 0xf5f0e8 });
        this.whiskers.position.copy(local(0.306, 0.284, 0));
        head.add(this.whiskers);
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

    update(_dt) { /* animations : Task 9 */ }

    dispose() {
        this.geometry.dispose();
        this.materials.base.dispose();
        this.materials.shells.forEach((m) => m.dispose());
        this.group.parent?.remove(this.group);
    }
}
