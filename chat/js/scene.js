import * as THREE from 'three';

export function createScene(scene) {
    // Sol extérieur (jardin) — herbe verte
    const gardenGeo = new THREE.PlaneGeometry(10, 20);
    const gardenMat = new THREE.MeshStandardMaterial({ color: 0x4a9e4a });
    const garden = new THREE.Mesh(gardenGeo, gardenMat);
    garden.rotation.x = -Math.PI / 2;
    garden.position.set(5, 0, 0);
    scene.add(garden);

    // Sol intérieur (maison) — beige
    const floorGeo = new THREE.PlaneGeometry(10, 20);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xd4b896 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(-5, 0, 0);
    scene.add(floor);

    // Murs de la maison
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5e6d3 });

    // Mur arrière
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 0.2), wallMat);
    backWall.position.set(-5, 2, -10);
    scene.add(backWall);

    // Mur gauche
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 20), wallMat);
    leftWall.position.set(-10, 2, 0);
    scene.add(leftWall);

    // Mur droit (séparation maison/jardin) — demi-mur avec ouverture
    const rightWallTop = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 20), wallMat);
    rightWallTop.position.set(0, 3.25, 0);
    scene.add(rightWallTop);

    // Porte (ouverture dans le mur droit)
    const rightWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 7), wallMat);
    rightWallLeft.position.set(0, 1.25, -6.5);
    scene.add(rightWallLeft);

    const rightWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 7), wallMat);
    rightWallRight.position.set(0, 1.25, 6.5);
    scene.add(rightWallRight);

    // Mur du fond côté maison
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 0.2), wallMat);
    frontWall.position.set(-5, 2, 10);
    scene.add(frontWall);

    // Herbe dans le jardin — quelques touffes
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x2d7a2d });
    for (let i = 0; i < 15; i++) {
        const grass = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 4), grassMat);
        grass.position.set(
            1 + Math.random() * 8,
            0.2,
            -9 + Math.random() * 18
        );
        scene.add(grass);
    }

    // Arbre dans le jardin
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 2, 8), trunkMat);
    trunk.position.set(7, 1, -5);
    scene.add(trunk);

    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), leavesMat);
    leaves.position.set(7, 2.5, -5);
    scene.add(leaves);

    // Clôture du jardin
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x8b6914 });
    // Côté droit
    for (let z = -10; z <= 10; z += 2) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.1), fenceMat);
        post.position.set(10, 0.5, z);
        scene.add(post);
    }
    const fenceBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 20), fenceMat);
    fenceBar1.position.set(10, 0.3, 0);
    scene.add(fenceBar1);
    const fenceBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 20), fenceMat);
    fenceBar2.position.set(10, 0.7, 0);
    scene.add(fenceBar2);

    // Côté fond jardin
    for (let x = 0; x <= 10; x += 2) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.1), fenceMat);
        post.position.set(x, 0.5, -10);
        scene.add(post);
    }
    const fenceBar3 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.05, 0.05), fenceMat);
    fenceBar3.position.set(5, 0.3, -10);
    scene.add(fenceBar3);
    const fenceBar4 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.05, 0.05), fenceMat);
    fenceBar4.position.set(5, 0.7, -10);
    scene.add(fenceBar4);

    // Côté avant jardin
    for (let x = 0; x <= 10; x += 2) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.1), fenceMat);
        post.position.set(x, 0.5, 10);
        scene.add(post);
    }
    const fenceBar5 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.05, 0.05), fenceMat);
    fenceBar5.position.set(5, 0.3, 10);
    scene.add(fenceBar5);
    const fenceBar6 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.05, 0.05), fenceMat);
    fenceBar6.position.set(5, 0.7, 10);
    scene.add(fenceBar6);
}
