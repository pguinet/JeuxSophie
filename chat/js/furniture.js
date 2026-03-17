import * as THREE from 'three';

export function createFurniture(scene) {
    const positions = {};

    // ===== COIN REPAS (fond gauche de la maison) =====

    // Petit tapis sous les gamelles
    const matTrayGeo = new THREE.PlaneGeometry(1.4, 0.8, 1, 1);
    const matTrayMat = new THREE.MeshStandardMaterial({ color: 0xcc8866, roughness: 0.9 });
    const matTray = new THREE.Mesh(matTrayGeo, matTrayMat);
    matTray.rotation.x = -Math.PI / 2;
    matTray.position.set(-7, 0.005, -5.25);
    scene.add(matTray);

    // Gamelle nourriture — céramique rose avec motif
    const bowlOuterMat = new THREE.MeshPhysicalMaterial({
        color: 0xe85577,
        roughness: 0.3,
        clearcoat: 0.6,
    });
    const bowlInnerMat = new THREE.MeshPhysicalMaterial({
        color: 0xf8f0e8,
        roughness: 0.4,
        clearcoat: 0.4,
    });

    // Extérieur gamelle
    const bowlOuter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.22, 0.14, 16),
        bowlOuterMat
    );
    bowlOuter.position.set(-7, 0.07, -5.7);
    scene.add(bowlOuter);

    // Intérieur gamelle (creux)
    const bowlInner = new THREE.Mesh(
        new THREE.CylinderGeometry(0.23, 0.18, 0.06, 16),
        bowlInnerMat
    );
    bowlInner.position.set(-7, 0.12, -5.7);
    scene.add(bowlInner);

    // Croquettes dans la gamelle
    const kibbleMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c });
    for (let k = 0; k < 8; k++) {
        const angle = (k / 8) * Math.PI * 2;
        const kr = 0.06 + Math.random() * 0.08;
        const kibble = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 6, 4),
            kibbleMat
        );
        kibble.scale.y = 0.5;
        kibble.position.set(
            -7 + Math.cos(angle) * kr,
            0.14,
            -5.7 + Math.sin(angle) * kr
        );
        scene.add(kibble);
    }

    // Petit motif coeur sur la gamelle (décoration)
    const heartMat = new THREE.MeshStandardMaterial({ color: 0xffaacc });
    const heartDeco = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), heartMat);
    heartDeco.scale.set(1.2, 1, 0.3);
    heartDeco.position.set(-6.72, 0.08, -5.7);
    scene.add(heartDeco);

    positions.bowl = { x: -7, z: -5.7 };

    // Bol d'eau — céramique bleue
    const waterBowlMat = new THREE.MeshPhysicalMaterial({
        color: 0x4488cc,
        roughness: 0.3,
        clearcoat: 0.6,
    });
    const waterBowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.17, 0.12, 16),
        waterBowlMat
    );
    waterBowl.position.set(-7, 0.06, -4.8);
    scene.add(waterBowl);

    // Eau avec reflet
    const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.6,
        roughness: 0.05,
        metalness: 0.1,
        clearcoat: 1.0,
    });
    const water = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16),
        waterMat
    );
    water.position.set(-7, 0.11, -4.8);
    scene.add(water);

    // Petit poisson déco sur le bol
    const fishDeco = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshStandardMaterial({ color: 0xffcc44 }));
    fishDeco.scale.set(1.5, 0.8, 0.4);
    fishDeco.position.set(-6.78, 0.07, -4.8);
    scene.add(fishDeco);

    positions.water = { x: -7, z: -4.8 };

    // ===== PANIER / COUSSIN DOUILLET (coin droit fond) =====

    // Panier en osier
    const wickerMat = new THREE.MeshStandardMaterial({ color: 0xc49a6c, roughness: 0.9 });
    const wickerDarkMat = new THREE.MeshStandardMaterial({ color: 0xa07840, roughness: 0.9 });

    // Base du panier
    const basketBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.7, 0.08, 20),
        wickerMat
    );
    basketBase.position.set(-8, 0.04, 6);
    scene.add(basketBase);

    // Bord du panier en osier (tressé) — tore
    const basketRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.72, 0.1, 8, 20),
        wickerMat
    );
    basketRim.rotation.x = Math.PI / 2;
    basketRim.position.set(-8, 0.18, 6);
    scene.add(basketRim);

    // Deuxième anneau (tressage)
    const basketRim2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.68, 0.06, 6, 20),
        wickerDarkMat
    );
    basketRim2.rotation.x = Math.PI / 2;
    basketRim2.position.set(-8, 0.12, 6);
    scene.add(basketRim2);

    // Coussin moelleux dans le panier — très doux
    const cushionMat = new THREE.MeshPhysicalMaterial({
        color: 0xee7788,
        roughness: 0.95,
        clearcoat: 0.05,
    });
    const cushion = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.62, 0.12, 16),
        cushionMat
    );
    cushion.position.set(-8, 0.1, 6);
    scene.add(cushion);

    // Renflements du coussin (effet matelassé)
    const puffMat = new THREE.MeshPhysicalMaterial({ color: 0xff8899, roughness: 0.95 });
    for (let p = 0; p < 5; p++) {
        const angle = (p / 5) * Math.PI * 2;
        const puff = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 8, 6),
            puffMat
        );
        puff.scale.y = 0.35;
        puff.position.set(
            -8 + Math.cos(angle) * 0.28,
            0.12,
            6 + Math.sin(angle) * 0.28
        );
        scene.add(puff);
    }
    // Centre du coussin
    const cushCenter = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 6),
        new THREE.MeshPhysicalMaterial({ color: 0xffaabb, roughness: 0.95 })
    );
    cushCenter.scale.y = 0.4;
    cushCenter.position.set(-8, 0.14, 6);
    scene.add(cushCenter);

    // Petite couverture/plaid qui dépasse du panier
    const blanketMat = new THREE.MeshStandardMaterial({
        color: 0xeeddcc,
        roughness: 0.9,
        side: THREE.DoubleSide,
    });
    const blanketGeo = new THREE.PlaneGeometry(0.5, 0.6, 4, 4);
    // Ondulation du plaid
    const blanketVerts = blanketGeo.attributes.position;
    for (let i = 0; i < blanketVerts.count; i++) {
        const bx = blanketVerts.getX(i);
        const by = blanketVerts.getY(i);
        blanketVerts.setZ(i, Math.sin(bx * 5) * 0.03 + Math.cos(by * 4) * 0.02);
    }
    blanketGeo.computeVertexNormals();
    const blanket = new THREE.Mesh(blanketGeo, blanketMat);
    blanket.position.set(-8.55, 0.2, 6.3);
    blanket.rotation.set(-0.3, 0.4, 0.6);
    scene.add(blanket);

    positions.cushion = { x: -8, z: 6 };

    // ===== LITIÈRE PROPRE (coin discret) =====

    const litterMat = new THREE.MeshStandardMaterial({ color: 0x99aabb, roughness: 0.7 });
    const litterDarkMat = new THREE.MeshStandardMaterial({ color: 0x778899, roughness: 0.7 });

    // Bac à litière — plus joli, arrondi
    const litterBase = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.08, 0.9, 1, 1, 1),
        litterMat
    );
    litterBase.position.set(-3, 0.04, 8.5);
    scene.add(litterBase);

    // Bords arrondis
    for (const [lx, lz, w, d] of [
        [0, 0.45, 1.1, 0.08],
        [0, -0.45, 1.1, 0.08],
        [-0.55, 0, 0.08, 0.9],
        [0.55, 0, 0.08, 0.9],
    ]) {
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(w, 0.28, d),
            litterDarkMat
        );
        wall.position.set(-3 + lx, 0.18, 8.5 + lz);
        scene.add(wall);
    }

    // Sable propre
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 1 });
    const sand = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.75), sandMat);
    sand.position.set(-3, 0.07, 8.5);
    scene.add(sand);

    // Petite pelle déco à côté
    const scoopMat = new THREE.MeshStandardMaterial({ color: 0x44aadd });
    const scoopHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6),
        scoopMat
    );
    scoopHandle.position.set(-2.2, 0.15, 8.8);
    scoopHandle.rotation.z = 0.3;
    scene.add(scoopHandle);
    const scoopHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 4, 0, Math.PI),
        scoopMat
    );
    scoopHead.position.set(-2.25, 0.03, 8.8);
    scoopHead.rotation.x = -Math.PI / 2;
    scene.add(scoopHead);

    positions.litter = { x: -3, z: 8.5 };

    // ===== SOL MAISON — PARQUET =====
    // Lames de parquet pour donner de la texture
    const parquetColors = [0xd4b896, 0xccae88, 0xdcc0a0, 0xc8a478];
    // La maison va de x=-10 à x=0, z=-10 à z=10 (murs épais 0.2)
    // Intérieur utile : x=-9.8 à x=-0.1, z=-9.8 à z=9.8
    const plankW = 0.55;
    const plankH = 2.3;
    for (let px = -9.7; px <= -0.3; px += 0.6) {
        const row = Math.round(px / 0.6);
        const offset = row % 2 === 0 ? 1.15 : 0; // décalage demi-lame
        for (let pz = -9.8 + offset; pz < 9.8; pz += plankH) {
            // Clipper la lame aux bords de la pièce
            let zStart = Math.max(pz, -9.8);
            let zEnd = Math.min(pz + plankH, 9.8);
            const len = zEnd - zStart;
            if (len < 0.1) continue;
            const plankMat = new THREE.MeshStandardMaterial({
                color: parquetColors[Math.floor(Math.random() * parquetColors.length)],
                roughness: 0.7,
            });
            const plank = new THREE.Mesh(
                new THREE.PlaneGeometry(plankW, len),
                plankMat
            );
            plank.rotation.x = -Math.PI / 2;
            plank.position.set(px, 0.003, zStart + len / 2);
            scene.add(plank);
        }
    }

    // ===== TAPIS ROND DOUILLET (centre de la maison) =====
    const rugGeo = new THREE.CircleGeometry(1.8, 24);
    const rugMat = new THREE.MeshStandardMaterial({ color: 0xcc7755, roughness: 0.9 });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-5, 0.008, 0);
    scene.add(rug);

    // Motif du tapis — cercle intérieur
    const rugInner = new THREE.Mesh(
        new THREE.CircleGeometry(1.3, 20),
        new THREE.MeshStandardMaterial({ color: 0xdd9977, roughness: 0.9 })
    );
    rugInner.rotation.x = -Math.PI / 2;
    rugInner.position.set(-5, 0.01, 0);
    scene.add(rugInner);

    // Motif central
    const rugCenter = new THREE.Mesh(
        new THREE.CircleGeometry(0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0xeebb99, roughness: 0.9 })
    );
    rugCenter.rotation.x = -Math.PI / 2;
    rugCenter.position.set(-5, 0.012, 0);
    scene.add(rugCenter);

    // Franges du tapis
    const fringeMat = new THREE.MeshStandardMaterial({ color: 0xcc7755 });
    for (let a = 0; a < Math.PI * 2; a += 0.15) {
        const fringe = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.005, 0.15),
            fringeMat
        );
        fringe.position.set(
            -5 + Math.cos(a) * 1.85,
            0.005,
            Math.sin(a) * 1.85
        );
        fringe.rotation.y = -a + Math.PI / 2;
        scene.add(fringe);
    }

    // ===== ÉTAGÈRE MURALE =====
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xa07040, roughness: 0.8 });

    // Planche de l'étagère
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2, 0.06, 0.35), woodMat);
    shelf.position.set(-8, 2.2, -9.85);
    scene.add(shelf);

    // Supports de l'étagère
    for (const sx of [-8.8, -7.2]) {
        const bracket = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.3, 0.3),
            woodMat
        );
        bracket.position.set(sx, 2.05, -9.85);
        scene.add(bracket);
    }

    // Objets sur l'étagère
    // Petit cadre photo
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xddaa66 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.03), frameMat);
    frame.position.set(-8.5, 2.45, -9.83);
    scene.add(frame);
    const photo = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.27),
        new THREE.MeshStandardMaterial({ color: 0x88bbdd })
    );
    photo.position.set(-8.5, 2.45, -9.81);
    scene.add(photo);

    // Petite plante sur l'étagère
    const potMat = new THREE.MeshStandardMaterial({ color: 0xdd8855 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.12, 8), potMat);
    pot.position.set(-7.8, 2.3, -9.83);
    scene.add(pot);
    const potPlant = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x44aa55 })
    );
    potPlant.position.set(-7.8, 2.44, -9.83);
    potPlant.scale.y = 0.8;
    scene.add(potPlant);

    // Petit livre
    const bookMat = new THREE.MeshStandardMaterial({ color: 0xcc4455 });
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.08), bookMat);
    book.position.set(-7.4, 2.33, -9.83);
    book.rotation.z = 0.1;
    scene.add(book);

    // ===== FENÊTRE sur le mur gauche =====
    const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });

    // Cadre de la fenêtre
    const winX = -9.88;
    const winY = 2.2;
    const winZ = -3;
    for (const [wx, wy, ww, wh] of [
        [0, 0.55, 1.2, 0.06],   // haut
        [0, -0.55, 1.2, 0.06],  // bas
        [-0.6, 0, 0.06, 1.1],   // gauche
        [0.6, 0, 0.06, 1.1],    // droite
        [0, 0, 0.06, 1.1],      // croisillon vertical
        [0, 0, 1.2, 0.06],      // croisillon horizontal
    ]) {
        const wPiece = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, wh, ww),
            windowFrameMat
        );
        wPiece.position.set(winX, winY + wy, winZ + wx);
        scene.add(wPiece);
    }

    // Vitre (semi-transparente, bleutée)
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.25,
        roughness: 0.05,
        metalness: 0.1,
        clearcoat: 1.0,
    });
    const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(1.14, 1.04),
        glassMat
    );
    glass.rotation.y = Math.PI / 2;
    glass.position.set(winX + 0.01, winY, winZ);
    scene.add(glass);

    // Petits rideaux
    const curtainMat = new THREE.MeshStandardMaterial({
        color: 0xffeedd,
        roughness: 0.8,
        side: THREE.DoubleSide,
    });
    for (const side of [-1, 1]) {
        const curtainGeo = new THREE.PlaneGeometry(0.35, 1.2, 3, 6);
        // Ondulation des rideaux
        const cVerts = curtainGeo.attributes.position;
        for (let ci = 0; ci < cVerts.count; ci++) {
            const cx = cVerts.getX(ci);
            cVerts.setZ(ci, Math.sin(cx * 8) * 0.03);
        }
        curtainGeo.computeVertexNormals();

        const curtain = new THREE.Mesh(curtainGeo, curtainMat);
        curtain.rotation.y = Math.PI / 2;
        curtain.position.set(winX + 0.03, winY, winZ + side * 0.5);
        scene.add(curtain);
    }

    // ===== JOUETS PAR TERRE =====

    // Petite balle rouge
    const ballMat = new THREE.MeshPhysicalMaterial({
        color: 0xff4444,
        roughness: 0.3,
        clearcoat: 0.5,
    });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), ballMat);
    ball.position.set(-4, 0.08, 2);
    scene.add(ball);

    // Souris jouet
    const mouseMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const mouseBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 6),
        mouseMat
    );
    mouseBody.scale.z = 1.8;
    mouseBody.position.set(-6, 0.06, 1.5);
    mouseBody.rotation.y = 0.7;
    scene.add(mouseBody);
    // Queue de la souris jouet
    const mouseTailMat = new THREE.MeshStandardMaterial({ color: 0xff88aa });
    const mouseTail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.003, 0.15, 4),
        mouseTailMat
    );
    mouseTail.position.set(-5.9, 0.06, 1.6);
    mouseTail.rotation.z = Math.PI / 2;
    mouseTail.rotation.y = 0.7;
    scene.add(mouseTail);

    // Pelote de laine
    const yarnMat = new THREE.MeshStandardMaterial({ color: 0x6699ee });
    const yarn = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), yarnMat);
    yarn.position.set(-3.5, 0.1, -1.5);
    scene.add(yarn);
    // Fil qui traîne
    const threadMat = new THREE.MeshStandardMaterial({ color: 0x6699ee });
    const threadPoints = [];
    for (let ti = 0; ti < 8; ti++) {
        threadPoints.push(new THREE.Vector3(
            -3.5 + ti * 0.12 + Math.sin(ti) * 0.05,
            0.01,
            -1.5 + ti * 0.08 + Math.cos(ti) * 0.04
        ));
    }
    const threadCurve = new THREE.CatmullRomCurve3(threadPoints);
    const threadGeo = new THREE.TubeGeometry(threadCurve, 12, 0.005, 4, false);
    const thread = new THREE.Mesh(threadGeo, threadMat);
    scene.add(thread);

    // ===== LUMIÈRE CHAUDE INTÉRIEURE =====
    const warmLight = new THREE.PointLight(0xffddaa, 0.6, 12);
    warmLight.position.set(-5, 3.5, 0);
    scene.add(warmLight);

    // Petite lampe au plafond (abat-jour)
    const lampShadeMat = new THREE.MeshStandardMaterial({
        color: 0xffeedd,
        roughness: 0.7,
        side: THREE.DoubleSide,
    });
    const lampShade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.4, 0.3, 12, 1, true),
        lampShadeMat
    );
    lampShade.position.set(-5, 3.5, 0);
    scene.add(lampShade);

    // Fil de la lampe
    const lampWire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.5, 4),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    lampWire.position.set(-5, 3.8, 0);
    scene.add(lampWire);

    // ===== PLINTHE (bas des murs) =====
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0xf0dcc0, roughness: 0.8 });

    // Plinthe mur gauche
    const plinthL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 19.8), plinthMat);
    plinthL.position.set(-9.88, 0.06, 0);
    scene.add(plinthL);

    // Plinthe mur fond
    const plinthB = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.12, 0.04), plinthMat);
    plinthB.position.set(-5, 0.06, -9.88);
    scene.add(plinthB);

    // Plinthe mur avant
    const plinthF = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.12, 0.04), plinthMat);
    plinthF.position.set(-5, 0.06, 9.88);
    scene.add(plinthF);

    // ===== ARBRE À CHAT (dans le jardin) =====
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, roughness: 0.9 });
    const carpetMat = new THREE.MeshStandardMaterial({ color: 0xcc6644, roughness: 0.85 });

    // Poteau principal (corde enroulée)
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 8), poleMat);
    pole.position.set(5, 1.25, 3);
    scene.add(pole);

    // Rayures de corde sur le poteau
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd4c090, roughness: 1 });
    for (let ry = 0.2; ry < 2.4; ry += 0.15) {
        const rope = new THREE.Mesh(
            new THREE.TorusGeometry(0.13, 0.015, 4, 12),
            ropeMat
        );
        rope.rotation.x = Math.PI / 2;
        rope.position.set(5, ry, 3);
        scene.add(rope);
    }

    // Plateforme basse avec bord
    const platform1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16), carpetMat);
    platform1.position.set(5, 1, 3);
    scene.add(platform1);

    // Plateforme haute
    const platform2 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 16), carpetMat);
    platform2.position.set(5, 2, 3);
    scene.add(platform2);

    // Petit poteau secondaire
    const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), poleMat);
    pole2.position.set(5.5, 0.6, 3.3);
    scene.add(pole2);

    // Jouet suspendu à la plateforme haute (balle pendante)
    const hangWire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.25, 4),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    hangWire.position.set(5.3, 1.83, 3);
    scene.add(hangWire);
    const hangBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 6),
        new THREE.MeshPhysicalMaterial({ color: 0xff6644, roughness: 0.3, clearcoat: 0.5 })
    );
    hangBall.position.set(5.3, 1.68, 3);
    scene.add(hangBall);

    // Base
    const catTreeBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.2), carpetMat);
    catTreeBase.position.set(5, 0.05, 3);
    scene.add(catTreeBase);

    positions.catTree = { x: 5, z: 3 };

    return positions;
}
