// Définition pure du squelette du chat : positions absolues au repos (mètres), cohérentes avec sdf.js.
// L'ordre du tableau = index d'os utilisé par skinIndex.
export const BONES = [
    { name: 'root',   parent: null,     pos: [-0.17, 0.19, 0] },       // bassin
    { name: 'spine1', parent: 'root',   pos: [-0.09, 0.195, 0] },
    { name: 'spine2', parent: 'spine1', pos: [0.0, 0.20, 0] },
    { name: 'chest',  parent: 'spine2', pos: [0.10, 0.205, 0] },
    { name: 'neck',   parent: 'chest',  pos: [0.16, 0.235, 0] },
    { name: 'head',   parent: 'neck',   pos: [0.235, 0.29, 0] },
    { name: 'earL',   parent: 'head',   pos: [0.245, 0.345, 0.035] },
    { name: 'earR',   parent: 'head',   pos: [0.245, 0.345, -0.035] },
    { name: 'tail1',  parent: 'root',   pos: [-0.25, 0.22, 0] },
    { name: 'tail2',  parent: 'tail1',  pos: [-0.31, 0.25, 0.005] },
    { name: 'tail3',  parent: 'tail2',  pos: [-0.365, 0.285, 0.012] },
    { name: 'tail4',  parent: 'tail3',  pos: [-0.405, 0.33, 0.02] },
    { name: 'tail5',  parent: 'tail4',  pos: [-0.43, 0.38, 0.03] },
    { name: 'tail6',  parent: 'tail5',  pos: [-0.44, 0.43, 0.04] },
    { name: 'legFL_up',   parent: 'chest',     pos: [0.10, 0.19, 0.055] },
    { name: 'legFL_low',  parent: 'legFL_up',  pos: [0.095, 0.11, 0.055] },
    { name: 'legFL_foot', parent: 'legFL_low', pos: [0.095, 0.03, 0.055] },
    { name: 'legFR_up',   parent: 'chest',     pos: [0.10, 0.19, -0.055] },
    { name: 'legFR_low',  parent: 'legFR_up',  pos: [0.095, 0.11, -0.055] },
    { name: 'legFR_foot', parent: 'legFR_low', pos: [0.095, 0.03, -0.055] },
    { name: 'legBL_up',   parent: 'root',      pos: [-0.19, 0.20, 0.06] },
    { name: 'legBL_low',  parent: 'legBL_up',  pos: [-0.145, 0.11, 0.06] },
    { name: 'legBL_foot', parent: 'legBL_low', pos: [-0.175, 0.03, 0.06] },
    { name: 'legBR_up',   parent: 'root',      pos: [-0.19, 0.20, -0.06] },
    { name: 'legBR_low',  parent: 'legBR_up',  pos: [-0.145, 0.11, -0.06] },
    { name: 'legBR_foot', parent: 'legBR_low', pos: [-0.175, 0.03, -0.06] },
];

export const BONE_INDEX = Object.fromEntries(BONES.map((b, i) => [b.name, i]));

/** Longueurs des segments de patte (haut, bas) pour l'IK, calculées depuis les positions au repos. */
export function legLengths(prefix) {
    const up = BONES[BONE_INDEX[`${prefix}_up`]].pos, low = BONES[BONE_INDEX[`${prefix}_low`]].pos, foot = BONES[BONE_INDEX[`${prefix}_foot`]].pos;
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    return { upper: d(up, low), lower: d(low, foot) };
}
