import * as THREE from 'three';

export function createScene(scene) {
    const animated = { update: null };
    const clock = new THREE.Clock();

    // ===== SOL INTÉRIEUR (maison) — base sous le parquet =====
    const floorGeo = new THREE.PlaneGeometry(10, 20);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xc8a478, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(-5, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // ===== SOL JARDIN — herbe avec variations =====
    // Base herbe
    const gardenGeo = new THREE.PlaneGeometry(10, 20, 40, 80);
    // Légères ondulations du terrain
    const gardenVerts = gardenGeo.attributes.position;
    for (let i = 0; i < gardenVerts.count; i++) {
        const x = gardenVerts.getX(i);
        const y = gardenVerts.getY(i);
        gardenVerts.setZ(i, (Math.sin(x * 2) * Math.cos(y * 1.5) * 0.08));
    }
    gardenGeo.computeVertexNormals();

    const gardenMat = new THREE.MeshStandardMaterial({
        color: 0x3d8c3d,
        roughness: 0.95,
    });
    const garden = new THREE.Mesh(gardenGeo, gardenMat);
    garden.rotation.x = -Math.PI / 2;
    garden.position.set(5, 0, 0);
    garden.receiveShadow = true;
    scene.add(garden);

    // Taches d'herbe plus claire/foncée pour variation
    for (let i = 0; i < 25; i++) {
        const patchGeo = new THREE.CircleGeometry(0.3 + Math.random() * 0.5, 8);
        const shade = 0.15 + Math.random() * 0.25;
        const patchMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(shade, 0.45 + Math.random() * 0.15, shade * 0.8),
            roughness: 1,
        });
        const patch = new THREE.Mesh(patchGeo, patchMat);
        patch.rotation.x = -Math.PI / 2;
        patch.position.set(1 + Math.random() * 8, 0.005, -9 + Math.random() * 18);
        scene.add(patch);
    }

    // Petit chemin de terre/dalles dans le jardin
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xc4a882, roughness: 0.9 });
    for (let i = -3; i <= 3; i++) {
        const stone = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25 + Math.random() * 0.1, 0.3, 0.04, 8),
            pathMat
        );
        stone.position.set(0.6 + Math.random() * 0.3, 0.02, i * 1.3 + Math.random() * 0.3);
        stone.rotation.y = Math.random() * Math.PI;
        scene.add(stone);
    }

    // ===== MURS MAISON — couleur chaleureuse =====
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5e6d3, roughness: 0.85 });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 0.2), wallMat);
    backWall.position.set(-5, 2, -10);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 20), wallMat);
    leftWall.position.set(-10, 2, 0);
    scene.add(leftWall);

    const rightWallTop = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 20), wallMat);
    rightWallTop.position.set(0, 3.25, 0);
    scene.add(rightWallTop);

    const rightWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 7), wallMat);
    rightWallLeft.position.set(0, 1.25, -6.5);
    scene.add(rightWallLeft);

    const rightWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 7), wallMat);
    rightWallRight.position.set(0, 1.25, 6.5);
    scene.add(rightWallRight);

    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 0.2), wallMat);
    frontWall.position.set(-5, 2, 10);
    scene.add(frontWall);

    // ===== HERBES HAUTES ANIMÉES =====
    const grassBlades = [];
    const grassColors = [0x2d7a2d, 0x3a9a3a, 0x228822, 0x44aa44, 0x1e6b1e];

    for (let i = 0; i < 80; i++) {
        const gx = 1.2 + Math.random() * 8.3;
        const gz = -9.2 + Math.random() * 18.4;
        const height = 0.15 + Math.random() * 0.35;
        const colorIdx = Math.floor(Math.random() * grassColors.length);

        // Brin d'herbe — forme de cône aplati
        const bladeGeo = new THREE.ConeGeometry(0.03 + Math.random() * 0.02, height, 3);
        const bladeMat = new THREE.MeshStandardMaterial({
            color: grassColors[colorIdx],
            roughness: 0.8,
        });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.set(gx, height * 0.5, gz);
        blade.rotation.z = (Math.random() - 0.5) * 0.3;
        blade._baseRotZ = blade.rotation.z;
        blade._phase = Math.random() * Math.PI * 2;
        blade._speed = 1.5 + Math.random() * 1.5;
        blade._amplitude = 0.05 + Math.random() * 0.1;
        scene.add(blade);
        grassBlades.push(blade);
    }

    // ===== FLEURS =====
    const flowerTypes = [
        { petalColor: 0xff6699, centerColor: 0xffee44, size: 0.08 }, // Rose
        { petalColor: 0xffaacc, centerColor: 0xffdd00, size: 0.06 }, // Rose clair
        { petalColor: 0xff4444, centerColor: 0xff8800, size: 0.07 }, // Rouge
        { petalColor: 0xaa66ff, centerColor: 0xffff66, size: 0.07 }, // Violet
        { petalColor: 0xffff55, centerColor: 0xcc8800, size: 0.06 }, // Jaune
        { petalColor: 0x6699ff, centerColor: 0xffffaa, size: 0.06 }, // Bleu
        { petalColor: 0xffffff, centerColor: 0xffee44, size: 0.08 }, // Marguerite
    ];

    const flowers = [];
    for (let i = 0; i < 30; i++) {
        const fx = 1.5 + Math.random() * 8;
        const fz = -9 + Math.random() * 18;
        const type = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];

        const flowerGroup = new THREE.Group();
        flowerGroup.position.set(fx, 0, fz);

        // Tige
        const stemH = 0.15 + Math.random() * 0.2;
        const stemGeo = new THREE.CylinderGeometry(0.008, 0.01, stemH, 4);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x228833 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = stemH * 0.5;
        flowerGroup.add(stem);

        // Petite feuille sur la tige
        const leafGeo = new THREE.SphereGeometry(0.03, 6, 4);
        leafGeo.scale(1.5, 0.3, 1);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x33aa44 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0.02, stemH * 0.35, 0);
        leaf.rotation.z = -0.5;
        flowerGroup.add(leaf);

        // Pétales (5-7 pétales en cercle)
        const petalCount = 5 + Math.floor(Math.random() * 3);
        const petalMat = new THREE.MeshStandardMaterial({
            color: type.petalColor,
            roughness: 0.6,
        });
        for (let p = 0; p < petalCount; p++) {
            const angle = (p / petalCount) * Math.PI * 2;
            const petalGeo = new THREE.SphereGeometry(type.size, 6, 4);
            petalGeo.scale(1.3, 0.3, 0.8);
            const petal = new THREE.Mesh(petalGeo, petalMat);
            petal.position.set(
                Math.cos(angle) * type.size * 0.8,
                stemH + 0.01,
                Math.sin(angle) * type.size * 0.8
            );
            petal.rotation.y = -angle;
            flowerGroup.add(petal);
        }

        // Centre de la fleur
        const centerGeo = new THREE.SphereGeometry(type.size * 0.5, 8, 6);
        centerGeo.scale(1, 0.5, 1);
        const centerMat = new THREE.MeshStandardMaterial({
            color: type.centerColor,
            roughness: 0.4,
        });
        const center = new THREE.Mesh(centerGeo, centerMat);
        center.position.y = stemH + 0.02;
        flowerGroup.add(center);

        flowerGroup._phase = Math.random() * Math.PI * 2;
        flowerGroup._speed = 1 + Math.random();
        scene.add(flowerGroup);
        flowers.push(flowerGroup);
    }

    // ===== ARBRES (2 arbres variés) =====
    const trees = [];

    function createTree(x, z, height, leavesRadius, trunkColor, leavesColor) {
        const tGroup = new THREE.Group();
        tGroup.position.set(x, 0, z);

        // Tronc avec légère courbure
        const trunkMat = new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 0.9 });
        const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, height, 8);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = height * 0.5;
        tGroup.add(trunk);

        // Racines visibles
        for (let r = 0; r < 4; r++) {
            const angle = (r / 4) * Math.PI * 2 + Math.random() * 0.5;
            const rootGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.5, 5);
            const root = new THREE.Mesh(rootGeo, trunkMat);
            root.position.set(Math.cos(angle) * 0.2, 0.1, Math.sin(angle) * 0.2);
            root.rotation.z = Math.cos(angle) * 0.8;
            root.rotation.x = Math.sin(angle) * 0.8;
            tGroup.add(root);
        }

        // Feuillage — plusieurs sphères pour un look naturel
        const leavesMat = new THREE.MeshStandardMaterial({
            color: leavesColor,
            roughness: 0.7,
        });
        const leavesPositions = [
            [0, height + leavesRadius * 0.3, 0, leavesRadius],
            [-leavesRadius * 0.4, height - 0.1, leavesRadius * 0.3, leavesRadius * 0.7],
            [leavesRadius * 0.5, height, -leavesRadius * 0.2, leavesRadius * 0.65],
            [0, height + leavesRadius * 0.8, leavesRadius * 0.2, leavesRadius * 0.5],
        ];
        const leavesGroup = new THREE.Group();
        for (const [lx, ly, lz, lr] of leavesPositions) {
            const darker = new THREE.Color(leavesColor).lerp(new THREE.Color(0x000000), Math.random() * 0.15);
            const lMat = new THREE.MeshStandardMaterial({ color: darker, roughness: 0.7 });
            const leafBall = new THREE.Mesh(new THREE.SphereGeometry(lr, 10, 8), lMat);
            leafBall.position.set(lx, ly, lz);
            leafBall.scale.y = 0.8;
            leavesGroup.add(leafBall);
        }
        tGroup.add(leavesGroup);
        tGroup._leavesGroup = leavesGroup;
        tGroup._phase = Math.random() * Math.PI * 2;

        scene.add(tGroup);
        trees.push(tGroup);
        return tGroup;
    }

    createTree(7, -5, 2.2, 1.3, 0x6b4226, 0x228b22);
    createTree(3, -8, 1.6, 1.0, 0x7a5230, 0x2d9b2d);
    // Petit buisson/arbuste
    createTree(8.5, 2, 0.5, 0.8, 0x5a3a1a, 0x33aa33);

    // ===== BUISSONS =====
    const bushColors = [0x2a7e2a, 0x339933, 0x267326];
    for (let i = 0; i < 6; i++) {
        const bx = 1.5 + Math.random() * 8;
        const bz = -9 + Math.random() * 18;
        const bushGroup = new THREE.Group();
        bushGroup.position.set(bx, 0, bz);

        const bushCount = 2 + Math.floor(Math.random() * 3);
        for (let b = 0; b < bushCount; b++) {
            const radius = 0.2 + Math.random() * 0.25;
            const bColor = bushColors[Math.floor(Math.random() * bushColors.length)];
            const bushMat = new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.8 });
            const bushBall = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 6), bushMat);
            bushBall.position.set((Math.random() - 0.5) * 0.3, radius * 0.6, (Math.random() - 0.5) * 0.3);
            bushBall.scale.y = 0.7;
            bushGroup.add(bushBall);
        }
        scene.add(bushGroup);
    }

    // ===== CLÔTURE EN BOIS RÉALISTE =====
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.85 });
    const fenceDarkMat = new THREE.MeshStandardMaterial({ color: 0x6b4e0e, roughness: 0.9 });

    function createFenceSection(startX, startZ, endX, endZ) {
        const dist = Math.sqrt((endX - startX) ** 2 + (endZ - startZ) ** 2);
        const posts = Math.ceil(dist / 1.8);

        for (let i = 0; i <= posts; i++) {
            const t = i / posts;
            const x = startX + (endX - startX) * t;
            const z = startZ + (endZ - startZ) * t;

            // Poteau avec variation de hauteur
            const postH = 0.9 + Math.random() * 0.15;
            const post = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, postH, 0.1),
                i % 2 === 0 ? fenceMat : fenceDarkMat
            );
            post.position.set(x, postH * 0.5, z);
            scene.add(post);

            // Pointe du poteau
            const cap = new THREE.Mesh(
                new THREE.ConeGeometry(0.06, 0.1, 4),
                fenceMat
            );
            cap.position.set(x, postH + 0.05, z);
            scene.add(cap);
        }

        // Barres horizontales
        const angle = Math.atan2(endZ - startZ, endX - startX);
        for (const h of [0.3, 0.65]) {
            const bar = new THREE.Mesh(
                new THREE.BoxGeometry(dist, 0.06, 0.04),
                fenceMat
            );
            bar.position.set(
                (startX + endX) / 2,
                h,
                (startZ + endZ) / 2
            );
            bar.rotation.y = -angle;
            scene.add(bar);
        }
    }

    createFenceSection(10, -10, 10, 10);  // Droite
    createFenceSection(0.2, -10, 10, -10);   // Fond
    createFenceSection(0.2, 10, 10, 10);    // Avant

    // ===== PIERRES DÉCORATIVES =====
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.95 });
    const rockDarkMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.95 });
    for (let i = 0; i < 10; i++) {
        const rx = 1.5 + Math.random() * 8;
        const rz = -9 + Math.random() * 18;
        const rSize = 0.05 + Math.random() * 0.12;
        const rockGeo = new THREE.DodecahedronGeometry(rSize, 0);
        const rock = new THREE.Mesh(rockGeo, Math.random() > 0.5 ? rockMat : rockDarkMat);
        rock.position.set(rx, rSize * 0.4, rz);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.scale.y = 0.5 + Math.random() * 0.3;
        scene.add(rock);
    }

    // ===== PAPILLONS ANIMÉS =====
    const butterflies = [];
    const butterflyColors = [0xff88cc, 0xffaa44, 0x88bbff, 0xffff66, 0xaa66ff, 0xff6666];

    for (let i = 0; i < 5; i++) {
        const bGroup = new THREE.Group();
        const bColor = butterflyColors[Math.floor(Math.random() * butterflyColors.length)];
        const wingMat = new THREE.MeshStandardMaterial({
            color: bColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
        });

        // Ailes (2 triangles)
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.bezierCurveTo(0.06, 0.04, 0.1, 0.06, 0.08, 0);
        wingShape.bezierCurveTo(0.1, -0.04, 0.06, -0.03, 0, 0);
        const wingGeo = new THREE.ShapeGeometry(wingShape);

        const leftWing = new THREE.Mesh(wingGeo, wingMat);
        bGroup.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeo, wingMat);
        rightWing.scale.x = -1;
        bGroup.add(rightWing);

        // Corps
        const bodyGeo = new THREE.CylinderGeometry(0.004, 0.003, 0.04, 4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const bBody = new THREE.Mesh(bodyGeo, bodyMat);
        bBody.rotation.x = Math.PI / 2;
        bGroup.add(bBody);

        bGroup.position.set(
            2 + Math.random() * 7,
            0.8 + Math.random() * 1.5,
            -8 + Math.random() * 16
        );

        bGroup._centerX = bGroup.position.x;
        bGroup._centerZ = bGroup.position.z;
        bGroup._centerY = bGroup.position.y;
        bGroup._phase = Math.random() * Math.PI * 2;
        bGroup._speed = 0.5 + Math.random() * 0.8;
        bGroup._radius = 1 + Math.random() * 2;
        bGroup._leftWing = leftWing;
        bGroup._rightWing = rightWing;

        scene.add(bGroup);
        butterflies.push(bGroup);
    }

    // ===== PETITE MARE / POINT D'EAU =====
    const pondGeo = new THREE.CircleGeometry(0.8, 16);
    const pondMat = new THREE.MeshStandardMaterial({
        color: 0x3388bb,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.3,
    });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(8, 0.01, -2);
    scene.add(pond);

    // Bord de la mare avec petites pierres
    for (let a = 0; a < Math.PI * 2; a += 0.4) {
        const pr = 0.8 + Math.random() * 0.15;
        const pStone = new THREE.Mesh(
            new THREE.SphereGeometry(0.06 + Math.random() * 0.05, 6, 4),
            rockMat
        );
        pStone.position.set(
            8 + Math.cos(a) * pr,
            0.03,
            -2 + Math.sin(a) * pr
        );
        pStone.scale.y = 0.5;
        scene.add(pStone);
    }

    // Nénuphar sur la mare
    const lilyMat = new THREE.MeshStandardMaterial({ color: 0x33aa44, side: THREE.DoubleSide });
    const lilyGeo = new THREE.CircleGeometry(0.12, 8);
    const lily1 = new THREE.Mesh(lilyGeo, lilyMat);
    lily1.rotation.x = -Math.PI / 2;
    lily1.position.set(8.15, 0.02, -1.85);
    scene.add(lily1);
    const lily2 = new THREE.Mesh(lilyGeo.clone(), lilyMat);
    lily2.rotation.x = -Math.PI / 2;
    lily2.position.set(7.75, 0.02, -2.2);
    lily2.scale.set(0.8, 0.8, 0.8);
    scene.add(lily2);

    // Petite fleur sur nénuphar
    const lilyFlowerMat = new THREE.MeshStandardMaterial({ color: 0xffccee });
    const lilyFlower = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), lilyFlowerMat);
    lilyFlower.position.set(8.15, 0.04, -1.85);
    lilyFlower.scale.y = 0.5;
    scene.add(lilyFlower);

    // ===== NUAGES ANIMÉS =====
    const clouds = [];
    for (let i = 0; i < 4; i++) {
        const cloudGroup = new THREE.Group();
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.75,
            roughness: 1,
        });

        const puffCount = 3 + Math.floor(Math.random() * 3);
        for (let p = 0; p < puffCount; p++) {
            const puffSize = 0.8 + Math.random() * 1.2;
            const puff = new THREE.Mesh(new THREE.SphereGeometry(puffSize, 8, 6), cloudMat);
            puff.position.set(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.8
            );
            puff.scale.y = 0.4;
            cloudGroup.add(puff);
        }

        cloudGroup.position.set(
            -15 + Math.random() * 30,
            12 + Math.random() * 5,
            -10 + Math.random() * 10
        );
        cloudGroup._speed = 0.15 + Math.random() * 0.2;

        scene.add(cloudGroup);
        clouds.push(cloudGroup);
    }

    // ===== LUCIOLES / PARTICULES LUMINEUSES =====
    const fireflies = [];
    for (let i = 0; i < 12; i++) {
        const ffMat = new THREE.MeshStandardMaterial({
            color: 0xffffaa,
            emissive: 0xffff66,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.8,
        });
        const ff = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 4), ffMat);
        ff.position.set(
            1.5 + Math.random() * 8,
            0.3 + Math.random() * 1.5,
            -9 + Math.random() * 18
        );
        ff._phase = Math.random() * Math.PI * 2;
        ff._baseY = ff.position.y;
        ff._baseX = ff.position.x;
        ff._baseZ = ff.position.z;
        ff._mat = ffMat;
        scene.add(ff);
        fireflies.push(ff);
    }

    // ===== LUMIÈRE DU SOLEIL PLUS CHAUDE =====
    const sunLight = new THREE.PointLight(0xffeedd, 0.4, 30);
    sunLight.position.set(5, 8, 0);
    scene.add(sunLight);

    // Lumière douce verte pour le jardin (réflexion herbe)
    const bounceLight = new THREE.PointLight(0x88cc88, 0.15, 15);
    bounceLight.position.set(5, 0.5, 0);
    scene.add(bounceLight);

    // ===== ANIMATION =====
    animated.update = (delta) => {
        const t = clock.getElapsedTime();

        // Herbes qui bougent au vent
        for (const blade of grassBlades) {
            blade.rotation.z = blade._baseRotZ +
                Math.sin(t * blade._speed + blade._phase) * blade._amplitude;
        }

        // Fleurs qui se balancent doucement
        for (const flower of flowers) {
            flower.rotation.z = Math.sin(t * flower._speed + flower._phase) * 0.06;
            flower.rotation.x = Math.cos(t * flower._speed * 0.7 + flower._phase) * 0.04;
        }

        // Arbres — feuillage qui bouge
        for (const tree of trees) {
            if (tree._leavesGroup) {
                tree._leavesGroup.rotation.z = Math.sin(t * 0.5 + tree._phase) * 0.03;
                tree._leavesGroup.rotation.x = Math.cos(t * 0.3 + tree._phase) * 0.02;
                // Léger changement de scale pour effet "respiration"
                const breathe = 1 + Math.sin(t * 0.8 + tree._phase) * 0.015;
                tree._leavesGroup.scale.set(breathe, 1, breathe);
            }
        }

        // Papillons qui volent
        for (const b of butterflies) {
            const bt = t * b._speed + b._phase;
            b.position.x = b._centerX + Math.sin(bt) * b._radius;
            b.position.z = b._centerZ + Math.cos(bt * 0.7) * b._radius * 0.6;
            b.position.y = b._centerY + Math.sin(bt * 2) * 0.3;
            // Battement d'ailes
            const wingAngle = Math.sin(t * 12 + b._phase) * 0.7;
            b._leftWing.rotation.y = wingAngle;
            b._rightWing.rotation.y = -wingAngle;
            // Orientation dans la direction du mouvement
            b.rotation.y = bt + Math.PI * 0.5;
        }

        // Nuages qui dérivent
        for (const cloud of clouds) {
            cloud.position.x += cloud._speed * delta;
            if (cloud.position.x > 20) cloud.position.x = -20;
        }

        // Lucioles qui flottent et clignotent
        for (const ff of fireflies) {
            const ft = t + ff._phase;
            ff.position.x = ff._baseX + Math.sin(ft * 0.8) * 0.3;
            ff.position.y = ff._baseY + Math.sin(ft * 1.2) * 0.2;
            ff.position.z = ff._baseZ + Math.cos(ft * 0.6) * 0.3;
            ff._mat.opacity = 0.3 + Math.sin(ft * 3) * 0.5;
            ff._mat.emissiveIntensity = 0.3 + Math.sin(ft * 3) * 0.7;
        }

        // Mare — léger scintillement
        pondMat.opacity = 0.65 + Math.sin(t * 2) * 0.05;
    };

    return animated;
}
