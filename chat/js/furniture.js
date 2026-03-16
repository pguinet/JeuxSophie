import * as THREE from 'three';

export function createFurniture(scene) {
    const positions = {};

    // Gamelle (rouge)
    const bowlMat = new THREE.MeshStandardMaterial({ color: 0xcc3333 });
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.12, 12), bowlMat);
    bowl.position.set(-7, 0.06, -6);
    scene.add(bowl);
    // Nourriture dans la gamelle
    const foodMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c });
    const food = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12), foodMat);
    food.position.set(-7, 0.13, -6);
    scene.add(food);
    positions.bowl = { x: -7, z: -6 };

    // Bol d'eau (bleu)
    const waterBowlMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    const waterBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.1, 12), waterBowlMat);
    waterBowl.position.set(-7, 0.05, -4.5);
    scene.add(waterBowl);
    // Eau
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x66aaff, transparent: true, opacity: 0.7 });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 12), waterMat);
    water.position.set(-7, 0.1, -4.5);
    scene.add(water);
    positions.water = { x: -7, z: -4.5 };

    // Coussin (rouge/violet, arrondi)
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0x9944aa });
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 0.15, 16), cushionMat);
    cushion.position.set(-8, 0.08, 6);
    scene.add(cushion);
    // Bord relevé
    const cushionRimMat = new THREE.MeshStandardMaterial({ color: 0x7733aa });
    const cushionRim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 8, 16), cushionRimMat);
    cushionRim.rotation.x = Math.PI / 2;
    cushionRim.position.set(-8, 0.15, 6);
    scene.add(cushionRim);
    positions.cushion = { x: -8, z: 6 };

    // Litière (gris, boîte ouverte)
    const litterMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    // Fond
    const litterBase = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 0.8), litterMat);
    litterBase.position.set(-3, 0.025, 8);
    scene.add(litterBase);
    // Murs de la litière
    const litterWall1 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.25, 0.05), litterMat);
    litterWall1.position.set(-3, 0.15, 8.4);
    scene.add(litterWall1);
    const litterWall2 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.25, 0.05), litterMat);
    litterWall2.position.set(-3, 0.15, 7.6);
    scene.add(litterWall2);
    const litterWall3 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 0.8), litterMat);
    litterWall3.position.set(-3.5, 0.15, 8);
    scene.add(litterWall3);
    // Sable
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xd4c49a });
    const sand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.7), sandMat);
    sand.position.set(-3, 0.08, 8);
    scene.add(sand);
    positions.litter = { x: -3, z: 8 };

    // Arbre à chat (dans le jardin)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xb8860b });
    const carpetMat = new THREE.MeshStandardMaterial({ color: 0xcc6644 });

    // Poteau principal
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 8), poleMat);
    pole.position.set(5, 1.25, 3);
    scene.add(pole);

    // Plateforme basse
    const platform1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 12), carpetMat);
    platform1.position.set(5, 1, 3);
    scene.add(platform1);

    // Plateforme haute
    const platform2 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 12), carpetMat);
    platform2.position.set(5, 2, 3);
    scene.add(platform2);

    // Petit poteau secondaire
    const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), poleMat);
    pole2.position.set(5.5, 0.6, 3.3);
    scene.add(pole2);

    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.2), carpetMat);
    base.position.set(5, 0.05, 3);
    scene.add(base);

    positions.catTree = { x: 5, z: 3 };

    return positions;
}
