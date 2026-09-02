// Calcul automatique des poids de skinning à partir des formes SDF : chaque forme appartient à un os,
// un sommet est influencé par les formes proches (poids exp(-d/k)), 4 os max, normalisé.
import { shapeDistance } from './sdf.js';

/**
 * @param {Float32Array|number[]} positions xyz aplatis
 * @param {Array} shapes formes SDF avec champ `bone`
 * @param {Record<string, number>} boneIndex nom d'os → index
 * @param {{k?: number, maxBones?: number}} opts k = portée de fusion (m)
 * @returns {{skinIndex: Uint16Array, skinWeight: Float32Array}}
 */
export function computeSkinWeights(positions, shapes, boneIndex, opts = {}) {
    const k = opts.k ?? 0.02;
    const maxBones = opts.maxBones ?? 4;
    const n = positions.length / 3;
    const skinIndex = new Uint16Array(n * 4);
    const skinWeight = new Float32Array(n * 4);
    const shapeBone = shapes.map((s) => {
        if (!(s.bone in boneIndex)) throw new Error(`os inconnu pour une forme : ${s.bone}`);
        return boneIndex[s.bone];
    });
    const perBone = new Map();
    const p = [0, 0, 0];
    for (let v = 0; v < n; v++) {
        p[0] = positions[v * 3]; p[1] = positions[v * 3 + 1]; p[2] = positions[v * 3 + 2];
        perBone.clear();
        for (let i = 0; i < shapes.length; i++) {
            const d = Math.max(shapeDistance(shapes[i], p), 0);
            if (d > k * 6) continue; // contribution négligeable (< e^-6)
            const w = Math.exp(-d / k);
            const b = shapeBone[i];
            perBone.set(b, (perBone.get(b) || 0) + w);
        }
        let entries = [...perBone.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxBones);
        if (entries.length === 0) entries = [[0, 1]]; // sommet orphelin : rattaché à la racine
        let sum = 0;
        for (const e of entries) sum += e[1];
        for (let j = 0; j < 4; j++) {
            skinIndex[v * 4 + j] = j < entries.length ? entries[j][0] : 0;
            skinWeight[v * 4 + j] = j < entries.length ? entries[j][1] / sum : 0;
        }
    }
    return { skinIndex, skinWeight };
}
