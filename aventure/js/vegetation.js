import * as THREE from 'three';

/**
 * Génère une couleur avec une légère variation aléatoire.
 * @param {number} baseColor - Couleur de base (hex)
 * @param {number} variation - Amplitude de variation (0-1)
 * @returns {THREE.Color}
 */
function randomColorVariation(baseColor, variation = 0.08) {
    const color = new THREE.Color(baseColor);
    const hsl = {};
    color.getHSL(hsl);
    hsl.h += (Math.random() - 0.5) * variation;
    hsl.s = THREE.MathUtils.clamp(hsl.s + (Math.random() - 0.5) * variation, 0, 1);
    hsl.l = THREE.MathUtils.clamp(hsl.l + (Math.random() - 0.5) * variation, 0, 1);
    color.setHSL(hsl.h, hsl.s, hsl.l);
    return color;
}

/**
 * Crée un arbre classique avec tronc et feuillage sphérique.
 * @param {number} x
 * @param {number} z
 * @returns {THREE.Group}
 */
export function createTree(x, z) {
    const group = new THREE.Group();

    const trunkHeight = 4 + Math.random() * 2;
    const trunkRadius = 0.25 + Math.random() * 0.1;
    const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, trunkHeight, 8);
    const trunkMat = new THREE.MeshLambertMaterial({
        color: randomColorVariation(0x8B4513),
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    const foliageRadius = 2 + Math.random() * 1;
    const foliageGeo = new THREE.SphereGeometry(foliageRadius, 8, 8);
    const foliageMat = new THREE.MeshLambertMaterial({
        color: randomColorVariation(0x228B22),
    });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = trunkHeight + foliageRadius * 0.6;
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    group.add(foliage);

    group.position.set(x, 0, z);
    return group;
}

/**
 * Crée un palmier avec tronc légèrement incliné et feuilles en cône.
 * @param {number} x
 * @param {number} z
 * @returns {THREE.Group}
 */
export function createPalm(x, z) {
    const group = new THREE.Group();

    const trunkHeight = 6 + Math.random() * 3;
    const trunkRadius = 0.15 + Math.random() * 0.05;
    const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.6, trunkRadius, trunkHeight, 8);
    const trunkMat = new THREE.MeshLambertMaterial({
        color: randomColorVariation(0xA0522D),
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Plusieurs feuilles en cône aplati, disposées en étoile
    const leafCount = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < leafCount; i++) {
        const leafGeo = new THREE.ConeGeometry(2, 3, 4);
        const leafMat = new THREE.MeshLambertMaterial({
            color: randomColorVariation(0x2E8B57),
        });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.scale.set(1, 0.3, 0.5);
        leaf.position.y = trunkHeight;

        const angle = (i / leafCount) * Math.PI * 2;
        leaf.position.x = Math.cos(angle) * 1.2;
        leaf.position.z = Math.sin(angle) * 1.2;
        leaf.rotation.z = -Math.cos(angle) * 0.8;
        leaf.rotation.x = Math.sin(angle) * 0.8;

        leaf.castShadow = true;
        group.add(leaf);
    }

    // Légère inclinaison aléatoire du palmier
    group.rotation.x = (Math.random() - 0.5) * 0.15;
    group.rotation.z = (Math.random() - 0.5) * 0.15;

    group.position.set(x, 0, z);
    return group;
}

/**
 * Crée un buisson (sphère aplatie).
 * @param {number} x
 * @param {number} z
 * @returns {THREE.Mesh}
 */
export function createBush(x, z) {
    const radius = 0.5 + Math.random() * 0.5;
    const geo = new THREE.SphereGeometry(radius, 8, 6);
    const mat = new THREE.MeshLambertMaterial({
        color: randomColorVariation(0x006400),
    });
    const bush = new THREE.Mesh(geo, mat);
    bush.scale.y = 0.6;
    bush.position.set(x, radius * 0.6 * 0.5, z);
    bush.castShadow = true;
    bush.receiveShadow = true;
    return bush;
}

/**
 * Génère une position aléatoire sur le terrain en évitant la zone de spawn.
 * @param {number} clearRadius - Rayon de la zone libre autour de l'origine
 * @returns {{x: number, z: number}}
 */
function randomPosition(clearRadius = 5) {
    let x, z;
    do {
        x = (Math.random() - 0.5) * 180; // -90 à 90
        z = (Math.random() - 0.5) * 180;
    } while (Math.sqrt(x * x + z * z) < clearRadius);
    return { x, z };
}

/**
 * Peuple la scène avec de la végétation procédurale.
 * @param {THREE.Scene} scene
 * @returns {THREE.Object3D[]} Tableau de tous les objets de végétation (pour la détection de collision)
 */
export function populateJungle(scene) {
    const vegetation = [];

    // Arbres (~40)
    for (let i = 0; i < 40; i++) {
        const { x, z } = randomPosition();
        const tree = createTree(x, z);
        scene.add(tree);
        vegetation.push(tree);
    }

    // Palmiers (~15)
    for (let i = 0; i < 15; i++) {
        const { x, z } = randomPosition();
        const palm = createPalm(x, z);
        scene.add(palm);
        vegetation.push(palm);
    }

    // Buissons (~60)
    for (let i = 0; i < 60; i++) {
        const { x, z } = randomPosition();
        const bush = createBush(x, z);
        scene.add(bush);
        vegetation.push(bush);
    }

    return vegetation;
}
