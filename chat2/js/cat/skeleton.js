// Construction du squelette Three.js à partir de la définition pure (skeleton-def.js).
import * as THREE from 'three';
import { BONES, BONE_INDEX } from './skeleton-def.js';

/**
 * @returns {{ bones: THREE.Bone[], root: THREE.Bone, byName: Record<string, THREE.Bone>, rest: Record<string, THREE.Quaternion> }}
 */
export function buildBones() {
    const bones = BONES.map((def) => { const b = new THREE.Bone(); b.name = def.name; return b; });
    const byName = {};
    BONES.forEach((def, i) => {
        byName[def.name] = bones[i];
        if (def.parent) {
            const p = BONES[BONE_INDEX[def.parent]].pos;
            bones[BONE_INDEX[def.parent]].add(bones[i]);
            bones[i].position.set(def.pos[0] - p[0], def.pos[1] - p[1], def.pos[2] - p[2]);
        } else {
            bones[i].position.set(def.pos[0], def.pos[1], def.pos[2]);
        }
    });
    return { bones, root: bones[0], byName };
}
