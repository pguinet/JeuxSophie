// Marching cubes sur un champ de distance signé — module pur (sans three), testable sous Node.
// Convention identique à three/examples/jsm/objects/MarchingCubes.js (tables de Paul Bourke) :
// on échantillonne field = -d pour que l'intérieur (d < 0) soit « haut », ce qui donne des normales sortantes.
import { edgeTable, triTable } from './mc-tables.js';

/**
 * Extrait la surface iso d'un SDF.
 * @param {(x:number,y:number,z:number)=>number} sdf distance signée (négative à l'intérieur)
 * @param {{min:number[], max:number[], res:number[]|number, iso?:number}} opts
 * @returns {{positions: Float32Array, indices: Uint32Array, vertexCount: number}}
 */
export function polygonize(sdf, opts) {
    const { min, max } = opts;
    const res = Array.isArray(opts.res) ? opts.res : [opts.res, opts.res, opts.res];
    const iso = opts.iso ?? 0;
    const [nx, ny, nz] = res;
    const sx = (max[0] - min[0]) / nx, sy = (max[1] - min[1]) / ny, sz = (max[2] - min[2]) / nz;
    const NX = nx + 1, NY = ny + 1, NZ = nz + 1;

    // 1. Échantillonnage du champ (inversé : intérieur positif)
    const field = new Float32Array(NX * NY * NZ);
    const idx = (i, j, k) => (i * NY + j) * NZ + k;
    // Le SDF étant 1-Lipschitz, un échantillon à distance |d| garantit qu'aucune traversée de surface
    // n'a lieu dans les floor(|d|/sz) - 1 échantillons suivants : on les remplit avec la même valeur (même signe).
    for (let i = 0; i < NX; i++) {
        const x = min[0] + i * sx;
        for (let j = 0; j < NY; j++) {
            const y = min[1] + j * sy;
            for (let k = 0; k < NZ;) {
                const d = sdf(x, y, min[2] + k * sz);
                const base = idx(i, j, k);
                field[base] = -d;
                const skip = Math.min(Math.floor(Math.abs(d) / sz) - 1, NZ - 1 - k);
                for (let s = 1; s <= skip; s++) field[base + s] = -d;
                k += 1 + Math.max(skip, 0);
            }
        }
    }

    // 2. Parcours des cellules, sommets soudés par arête
    const positions = [];
    const indices = [];
    const edgeVertex = new Map(); // clé d'arête → index de sommet
    const cornerOffsets = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
    // Arêtes de Bourke : [cornerA, cornerB]
    const edgeCorners = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const edgeIdx = new Int32Array(12);
    const f = new Float32Array(8);

    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
        let cubeIndex = 0;
        for (let c = 0; c < 8; c++) {
            const o = cornerOffsets[c];
            f[c] = field[idx(i + o[0], j + o[1], k + o[2])];
            if (f[c] < iso) cubeIndex |= 1 << c;
        }
        const edges = edgeTable[cubeIndex];
        if (edges === 0) continue;
        for (let e = 0; e < 12; e++) {
            if (!(edges & (1 << e))) continue;
            const [ca, cb] = edgeCorners[e];
            const oa = cornerOffsets[ca], ob = cornerOffsets[cb];
            // Clé unique : coin « bas » de l'arête + axe
            const ai = i + Math.min(oa[0], ob[0]), aj = j + Math.min(oa[1], ob[1]), ak = k + Math.min(oa[2], ob[2]);
            const axis = oa[0] !== ob[0] ? 0 : oa[1] !== ob[1] ? 1 : 2;
            const key = idx(ai, aj, ak) * 3 + axis;
            let v = edgeVertex.get(key);
            if (v === undefined) {
                const fa = f[ca], fb = f[cb];
                let t = (fb - fa) === 0 ? 0.5 : (iso - fa) / (fb - fa);
                t = t < 0 ? 0 : t > 1 ? 1 : t;
                positions.push(
                    min[0] + (i + oa[0] + (ob[0] - oa[0]) * t) * sx,
                    min[1] + (j + oa[1] + (ob[1] - oa[1]) * t) * sy,
                    min[2] + (k + oa[2] + (ob[2] - oa[2]) * t) * sz,
                );
                v = positions.length / 3 - 1;
                edgeVertex.set(key, v);
            }
            edgeIdx[e] = v;
        }
        const base = cubeIndex * 16;
        for (let t = 0; t < 16 && triTable[base + t] !== -1; t += 3) {
            const a = edgeIdx[triTable[base + t]], b = edgeIdx[triTable[base + t + 1]], c = edgeIdx[triTable[base + t + 2]];
            if (a === b || b === c || a === c) continue; // triangle dégénéré (sommets confondus)
            indices.push(a, b, c);
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), vertexCount: positions.length / 3 };
}

/** Voisinage (liste d'adjacence) d'un maillage indexé. */
export function buildAdjacency(vertexCount, indices) {
    const adj = Array.from({ length: vertexCount }, () => new Set());
    for (let t = 0; t < indices.length; t += 3) {
        const a = indices[t], b = indices[t + 1], c = indices[t + 2];
        adj[a].add(b); adj[a].add(c); adj[b].add(a); adj[b].add(c); adj[c].add(a); adj[c].add(b);
    }
    return adj.map((s) => Array.from(s));
}

/**
 * Lissage de Taubin (λ|μ) : lisse sans rétrécir. Modifie `positions` en place et le retourne.
 * lambda ≈ 0.5, mu ≈ -0.53.
 */
export function taubinSmooth(positions, indices, iterations = 3, lambda = 0.5, mu = -0.53) {
    const n = positions.length / 3;
    const adj = buildAdjacency(n, indices);
    const tmp = new Float32Array(positions.length);
    const step = (factor) => {
        for (let v = 0; v < n; v++) {
            const nb = adj[v];
            if (nb.length === 0) { tmp[v * 3] = positions[v * 3]; tmp[v * 3 + 1] = positions[v * 3 + 1]; tmp[v * 3 + 2] = positions[v * 3 + 2]; continue; }
            let ax = 0, ay = 0, az = 0;
            for (const u of nb) { ax += positions[u * 3]; ay += positions[u * 3 + 1]; az += positions[u * 3 + 2]; }
            ax /= nb.length; ay /= nb.length; az /= nb.length;
            tmp[v * 3] = positions[v * 3] + factor * (ax - positions[v * 3]);
            tmp[v * 3 + 1] = positions[v * 3 + 1] + factor * (ay - positions[v * 3 + 1]);
            tmp[v * 3 + 2] = positions[v * 3 + 2] + factor * (az - positions[v * 3 + 2]);
        }
        positions.set(tmp);
    };
    for (let it = 0; it < iterations; it++) { step(lambda); step(mu); }
    return positions;
}

/** Normales par sommet pondérées par l'aire des faces. */
export function computeNormals(positions, indices) {
    const normals = new Float32Array(positions.length);
    for (let t = 0; t < indices.length; t += 3) {
        const a = indices[t] * 3, b = indices[t + 1] * 3, c = indices[t + 2] * 3;
        const abx = positions[b] - positions[a], aby = positions[b + 1] - positions[a + 1], abz = positions[b + 2] - positions[a + 2];
        const acx = positions[c] - positions[a], acy = positions[c + 1] - positions[a + 1], acz = positions[c + 2] - positions[a + 2];
        const nx = aby * acz - abz * acy, ny = abz * acx - abx * acz, nz = abx * acy - aby * acx;
        for (const v of [a, b, c]) { normals[v] += nx; normals[v + 1] += ny; normals[v + 2] += nz; }
    }
    for (let v = 0; v < normals.length; v += 3) {
        const l = Math.hypot(normals[v], normals[v + 1], normals[v + 2]) || 1;
        normals[v] /= l; normals[v + 1] /= l; normals[v + 2] /= l;
    }
    return normals;
}

/** Volume signé (positif si les faces sont orientées vers l'extérieur). */
export function signedVolume(positions, indices) {
    let vol = 0;
    for (let t = 0; t < indices.length; t += 3) {
        const a = indices[t] * 3, b = indices[t + 1] * 3, c = indices[t + 2] * 3;
        const ax = positions[a], ay = positions[a + 1], az = positions[a + 2];
        const bx = positions[b], by = positions[b + 1], bz = positions[b + 2];
        const cx = positions[c], cy = positions[c + 1], cz = positions[c + 2];
        vol += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
    }
    return vol / 6;
}

/** Statistiques d'arêtes : { open, nonManifold } (0 et 0 pour une surface fermée propre). */
export function edgeStats(indices) {
    const count = new Map();
    for (let t = 0; t < indices.length; t += 3) {
        const tri = [indices[t], indices[t + 1], indices[t + 2]];
        for (let e = 0; e < 3; e++) {
            const a = tri[e], b = tri[(e + 1) % 3];
            const key = a < b ? a * 4294967296 + b : b * 4294967296 + a;
            count.set(key, (count.get(key) || 0) + 1);
        }
    }
    let open = 0, nonManifold = 0;
    for (const c of count.values()) { if (c === 1) open++; else if (c > 2) nonManifold++; }
    return { open, nonManifold, edges: count.size };
}
