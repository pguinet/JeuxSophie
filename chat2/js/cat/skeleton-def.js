// Définition pure du squelette du chat : positions absolues au repos (mètres), cohérentes avec sdf.js.
// L'ordre du tableau = index d'os utilisé par skinIndex.
import { LEG_JOINTS, TAIL_JOINTS } from './sdf.js';

const leg = (prefix, parent) => {
    const j = LEG_JOINTS[prefix];
    return [
        { name: `${prefix}_up`, parent, pos: j.hip },
        { name: `${prefix}_low`, parent: `${prefix}_up`, pos: j.knee },
        { name: `${prefix}_foot`, parent: `${prefix}_low`, pos: j.foot },
    ];
};

export const BONES = [
    { name: 'root',   parent: null,     pos: [-0.17, 0.21, 0] },       // bassin
    { name: 'spine1', parent: 'root',   pos: [-0.09, 0.215, 0] },
    { name: 'spine2', parent: 'spine1', pos: [0.0, 0.22, 0] },
    { name: 'chest',  parent: 'spine2', pos: [0.10, 0.225, 0] },
    { name: 'neck',   parent: 'chest',  pos: [0.15, 0.255, 0] },
    { name: 'head',   parent: 'neck',   pos: [0.225, 0.30, 0] },
    { name: 'earL',   parent: 'head',   pos: [0.24, 0.35, 0.03] },
    { name: 'earR',   parent: 'head',   pos: [0.24, 0.35, -0.03] },
    ...TAIL_JOINTS.slice(0, 6).map((pos, i) => ({ name: `tail${i + 1}`, parent: i === 0 ? 'root' : `tail${i}`, pos })),
    ...leg('legFL', 'chest'), ...leg('legFR', 'chest'), ...leg('legBL', 'root'), ...leg('legBR', 'root'),
];

export const BONE_INDEX = Object.fromEntries(BONES.map((b, i) => [b.name, i]));

/** Longueurs des segments de patte (haut, bas) pour l'IK, calculées depuis les positions au repos. */
export function legLengths(prefix) {
    const up = BONES[BONE_INDEX[`${prefix}_up`]].pos, low = BONES[BONE_INDEX[`${prefix}_low`]].pos, foot = BONES[BONE_INDEX[`${prefix}_foot`]].pos;
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    return { upper: d(up, low), lower: d(low, foot) };
}
