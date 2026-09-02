// Disposition du monde (mètres) partagée par la maison, le jardin, la navigation et la caméra. Module pur.
export const HOUSE = { minX: -7, maxX: -1, minZ: -2.5, maxZ: 2.5, wallH: 2.7, wallT: 0.15, floorY: 0.01 };
export const DOOR = { x: HOUSE.maxX, zMin: -0.5, zMax: 0.5, height: 2.1 };           // mur est, vers le jardin
export const WINDOW = { x: HOUSE.minX, zMin: -1.0, zMax: 1.0, yMin: 0.9, yMax: 2.3 }; // mur ouest
export const GARDEN = { min: -7.7, max: 7.7 };
export const POND = { x: 4.2, z: 1.6, rx: 1.3, rz: 0.9 };
export const PATH = { xMin: DOOR.x, xMax: 3.2, zMin: -0.55, zMax: 0.55 };

/** Emplacements où le chat se rend (position debout) et point regardé une fois arrivé. */
export const SPOTS = {
    bowl:  { at: [-1.9, -1.55], face: [-1.9, -1.9] },
    water: { at: [-2.4, -1.55], face: [-2.4, -1.9] },
    bed:   { at: [-5.6, 1.55], face: [-6.5, 1.55] },
    litter:{ at: [-1.9, 1.45], face: [-1.9, 1.9] },
    sofa:  { at: [-4.2, -1.1], face: [-4.2, -2.0] },
};

/** Définition de navigation pour Nav (nav.js). */
export const NAV_DEF = {
    zones: [
        { name: 'house', min: [HOUSE.minX + 0.35, HOUSE.minZ + 0.35], max: [HOUSE.maxX - 0.35, HOUSE.maxZ - 0.35] },
        { name: 'garden', min: [GARDEN.min + 0.4, GARDEN.min + 0.4], max: [GARDEN.max - 0.4, GARDEN.max - 0.4] },
    ],
    obstacles: [
        { type: 'rect', min: [HOUSE.minX - 0.3, HOUSE.minZ - 0.3], max: [HOUSE.maxX + 0.3, HOUSE.maxZ + 0.3], onlyZone: 'garden' }, // la maison vue du jardin
        { type: 'circle', c: [POND.x, POND.z], r: Math.max(POND.rx, POND.rz) + 0.15 },
        { type: 'circle', c: [3.8, -4.2], r: 0.45 },   // arbre 1
        { type: 'circle', c: [-4.5, 5.2], r: 0.45 },   // arbre 2
        { type: 'rect', min: [-5.3, -2.5], max: [-3.1, -1.65] },   // canapé
        { type: 'rect', min: [-4.75, -1.25], max: [-3.65, -0.55] }, // table basse
        { type: 'circle', c: [-6.45, -2.05], r: 0.35 },            // plante
        { type: 'rect', min: [-1.95, -2.5], max: [-1.25, -1.9] },  // arbre à chat (pied)
        { type: 'circle', c: [-5.9, -1.4], r: 0.3 },               // lampadaire
        { type: 'rect', min: [-2.95, 0.95], max: [-2.05, 1.75] },   // pouf
    ],
    door: { pos: [DOOR.x, 0], radius: 0.55, zones: ['house', 'garden'], dir: [1, 0] },
    margin: 0.12,
};
