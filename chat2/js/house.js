// La maison : salon (parquet, murs plâtre, fenêtre, porte), meubles glTF, objets du chat.
import * as THREE from 'three';
import { HOUSE, DOOR, WINDOW, SPOTS } from './world-layout.js';

/** UV « monde » pour une BoxGeometry (texture répétée tous les `tile` mètres). */
export function boxWorldUV(geo, w, h, d, tile = 1.5) {
    const uv = geo.attributes.uv;
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
        const i = f * 4 + v;
        uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile);
    }
    return geo;
}

function box(w, h, d, material, tile) {
    const g = boxWorldUV(new THREE.BoxGeometry(w, h, d), w, h, d, tile);
    const m = new THREE.Mesh(g, material);
    m.castShadow = true; m.receiveShadow = true;
    return m;
}

/** Place un modèle : pied au sol (y = floorY), centre xz, rotation y, échelle optionnelle vers une taille cible. */
export function placeModel(model, x, z, rotY = 0, { floorY = 0, targetSize = null, axis = 'x' } = {}) {
    model.updateMatrixWorld(true);
    let bb = new THREE.Box3().setFromObject(model);
    if (targetSize) {
        const size = bb.getSize(new THREE.Vector3());
        const s = targetSize / size[axis];
        model.scale.multiplyScalar(s);
        model.updateMatrixWorld(true);
        bb = new THREE.Box3().setFromObject(model);
    }
    const center = bb.getCenter(new THREE.Vector3());
    model.position.x += x - center.x;
    model.position.z += z - center.z;
    model.position.y += floorY - bb.min.y;
    model.rotation.y = rotY;
    // La rotation change le centre : on recale
    model.updateMatrixWorld(true);
    const bb2 = new THREE.Box3().setFromObject(model);
    const c2 = bb2.getCenter(new THREE.Vector3());
    model.position.x += x - c2.x; model.position.z += z - c2.z;
    return bb2.getSize(new THREE.Vector3());
}

function noiseCanvasTexture(size, base, variation, repeat = 1) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d'); const img = ctx.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
        const n = (Math.random() - 0.5) * variation;
        img.data[i * 4] = base[0] + n; img.data[i * 4 + 1] = base[1] + n; img.data[i * 4 + 2] = base[2] + n; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/**
 * Construit la maison. Retourne { group, lampPosition, bulbMaterial, bowls: { food, water }, update(dt) }.
 */
export async function buildHouse(scene, assets, settings) {
    const group = new THREE.Group(); group.name = 'house';
    scene.add(group);
    const { minX, maxX, minZ, maxZ, wallH, wallT, floorY } = HOUSE;
    const W = maxX - minX, D = maxZ - minZ, cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

    const [floorMat, wallMat, rugMat, plankMat] = await Promise.all([
        assets.loadPBR('wood_floor_deck', { repeat: [W / 2, D / 2] }),
        assets.loadPBR('beige_wall_001', { repeat: [1, 1] }),
        assets.loadPBR('curly_teddy_checkered', { repeat: [2.2, 1.6], roughness: 1 }),
        assets.loadPBR('weathered_planks', { repeat: [1, 1] }),
    ]);

    // Sol
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(cx, floorY, cz); floor.receiveShadow = true;
    group.add(floor);

    // Murs (avec ouvertures porte / fenêtre)
    const walls = { north: [], south: [], east: [], west: [] };
    const wall = (side, w, h, d, x, y, z) => { const m = box(w, h, d, wallMat, 1.6); m.position.set(x, y, z); group.add(m); walls[side].push(m); return m; };
    wall('north', W + wallT, wallH, wallT, cx, wallH / 2, minZ - wallT / 2);
    wall('south', W + wallT, wallH, wallT, cx, wallH / 2, maxZ + wallT / 2);
    // Est (porte) : deux segments + linteau
    const dz1 = DOOR.zMin - minZ, dz2 = maxZ - DOOR.zMax;
    wall('east', wallT, wallH, dz1, maxX + wallT / 2, wallH / 2, minZ + dz1 / 2);
    wall('east', wallT, wallH, dz2, maxX + wallT / 2, wallH / 2, maxZ - dz2 / 2);
    wall('east', wallT, wallH - DOOR.height, DOOR.zMax - DOOR.zMin, maxX + wallT / 2, DOOR.height + (wallH - DOOR.height) / 2, (DOOR.zMin + DOOR.zMax) / 2);
    // Ouest (fenêtre) : côtés, allège, imposte
    const wz1 = WINDOW.zMin - minZ, wz2 = maxZ - WINDOW.zMax, ww = WINDOW.zMax - WINDOW.zMin;
    wall('west', wallT, wallH, wz1, minX - wallT / 2, wallH / 2, minZ + wz1 / 2);
    wall('west', wallT, wallH, wz2, minX - wallT / 2, wallH / 2, maxZ - wz2 / 2);
    wall('west', wallT, WINDOW.yMin, ww, minX - wallT / 2, WINDOW.yMin / 2, (WINDOW.zMin + WINDOW.zMax) / 2);
    wall('west', wallT, wallH - WINDOW.yMax, ww, minX - wallT / 2, WINDOW.yMax + (wallH - WINDOW.yMax) / 2, (WINDOW.zMin + WINDOW.zMax) / 2);

    // Plinthes et encadrements (bois peint)
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.5 });
    const trim = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), trimMat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; group.add(m); };
    trim(W, 0.1, 0.02, cx, floorY + 0.05, minZ + 0.01); trim(W, 0.1, 0.02, cx, floorY + 0.05, maxZ - 0.01);
    trim(0.02, 0.1, dz1, maxX - 0.01, floorY + 0.05, minZ + dz1 / 2); trim(0.02, 0.1, dz2, maxX - 0.01, floorY + 0.05, maxZ - dz2 / 2);
    trim(0.02, 0.1, D, minX + 0.01, floorY + 0.05, cz);
    // Porte : montants + traverse ; fenêtre : cadre + vitre + croisillon
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.45 });
    const frame = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat); m.position.set(x, y, z); m.castShadow = true; group.add(m); };
    frame(wallT + 0.06, DOOR.height, 0.08, maxX + wallT / 2, DOOR.height / 2, DOOR.zMin - 0.04);
    frame(wallT + 0.06, DOOR.height, 0.08, maxX + wallT / 2, DOOR.height / 2, DOOR.zMax + 0.04);
    frame(wallT + 0.06, 0.08, DOOR.zMax - DOOR.zMin + 0.16, maxX + wallT / 2, DOOR.height + 0.04, 0);
    const wy = (WINDOW.yMin + WINDOW.yMax) / 2, wh = WINDOW.yMax - WINDOW.yMin;
    frame(wallT + 0.06, wh + 0.12, 0.07, minX - wallT / 2, wy, WINDOW.zMin - 0.035);
    frame(wallT + 0.06, wh + 0.12, 0.07, minX - wallT / 2, wy, WINDOW.zMax + 0.035);
    frame(wallT + 0.06, 0.07, ww + 0.14, minX - wallT / 2, WINDOW.yMax + 0.035, (WINDOW.zMin + WINDOW.zMax) / 2);
    frame(wallT + 0.06, 0.07, ww + 0.14, minX - wallT / 2, WINDOW.yMin - 0.035, (WINDOW.zMin + WINDOW.zMax) / 2);
    frame(0.04, wh, 0.04, minX, wy, (WINDOW.zMin + WINDOW.zMax) / 2);
    frame(0.04, 0.04, ww, minX, wy, (WINDOW.zMin + WINDOW.zMax) / 2);
    const glassMat = settings.glassTransmission
        ? new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.95, roughness: 0.03, thickness: 0.02, ior: 1.5, transparent: true })
        : new THREE.MeshPhysicalMaterial({ color: 0xcfe4f2, transparent: true, opacity: 0.22, roughness: 0.03, metalness: 0, clearcoat: 1 });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), glassMat);
    glass.rotation.y = Math.PI / 2; glass.position.set(minX, wy, (WINDOW.zMin + WINDOW.zMax) / 2);
    group.add(glass); walls.west.push(glass);

    // Tapis
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.9), rugMat);
    rug.rotation.x = -Math.PI / 2; rug.position.set(-4.2, floorY + 0.008, -0.3); rug.receiveShadow = true;
    group.add(rug);

    // Meubles glTF
    const [sofa, table, plant, ottoman, bowlA, bowlB] = await Promise.all([
        assets.loadModel('Sofa_01'), assets.loadModel('CoffeeTable_01'), assets.loadModel('potted_plant_02'),
        assets.loadModel('Ottoman_01'), assets.loadModel('wooden_bowl_01'), assets.loadModel('wooden_bowl_01'),
    ]);
    placeModel(sofa, -4.2, -2.05, 0, { floorY });
    placeModel(table, -4.2, -0.9, 0, { floorY });
    placeModel(plant, -6.45, -2.05, 0.4, { floorY });
    placeModel(ottoman, -2.6, 0.9, 0.3, { floorY });
    for (const m of [sofa, table, plant, ottoman]) group.add(m);

    // Gamelles : bols en bois réduits (Ø 16 cm) + croquettes + eau
    const bowls = {};
    for (const [bowl, key, spot] of [[bowlA, 'food', SPOTS.bowl], [bowlB, 'water', SPOTS.water]]) {
        const size = placeModel(bowl, spot.face[0], spot.face[1], 0, { floorY, targetSize: 0.16, axis: 'x' });
        group.add(bowl);
        const top = floorY + size.y * 0.72;
        if (key === 'food') {
            const kibble = new THREE.InstancedMesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshStandardMaterial({ color: 0x6b3f1d, roughness: 0.9 }), 40);
            const mtx = new THREE.Matrix4();
            for (let i = 0; i < 40; i++) {
                const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.048;
                mtx.makeTranslation(spot.face[0] + Math.cos(a) * r, top - 0.012 + Math.random() * 0.012, spot.face[1] + Math.sin(a) * r);
                kibble.setMatrixAt(i, mtx);
            }
            kibble.castShadow = true; group.add(kibble); bowls.food = kibble;
        } else {
            const water = new THREE.Mesh(new THREE.CircleGeometry(0.058, 32), new THREE.MeshPhysicalMaterial({ color: 0x9fd3e8, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.8, clearcoat: 1 }));
            water.rotation.x = -Math.PI / 2; water.position.set(spot.face[0], top - 0.006, spot.face[1]);
            group.add(water); bowls.water = water;
        }
    }

    // Panier du chat : anneau en tissu + coussin
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 1 });
    const cushionMat = rugMat.clone(); cushionMat.map = rugMat.map.clone(); cushionMat.map.repeat.set(0.6, 0.6); cushionMat.map.needsUpdate = true; cushionMat.color = new THREE.Color(0xd8b8a0);
    const bed = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.075, 16, 40), bedMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.075; ring.castShadow = true; ring.receiveShadow = true;
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 40), cushionMat);
    cushion.position.y = 0.03; cushion.receiveShadow = true;
    bed.add(ring, cushion);
    bed.position.set(SPOTS.bed.face[0] + 0.15, floorY, SPOTS.bed.face[1]);
    group.add(bed);

    // Litière : bac gris + sable
    const litter = new THREE.Group();
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x6f7b86, roughness: 0.6 });
    const tw = 0.5, td = 0.38, th = 0.12, tt = 0.015;
    for (const [w, h, d, x, y, z] of [[tw, tt, td, 0, tt / 2, 0], [tw, th, tt, 0, th / 2, -td / 2], [tw, th, tt, 0, th / 2, td / 2], [tt, th, td, -tw / 2, th / 2, 0], [tt, th, td, tw / 2, th / 2, 0]]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), trayMat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; litter.add(m);
    }
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(tw - 2 * tt, td - 2 * tt), new THREE.MeshStandardMaterial({ map: noiseCanvasTexture(128, [214, 200, 170], 60, 2), roughness: 1 }));
    sand.rotation.x = -Math.PI / 2; sand.position.y = 0.06; sand.receiveShadow = true; litter.add(sand);
    litter.position.set(SPOTS.litter.face[0], floorY, SPOTS.litter.face[1] + 0.1);
    group.add(litter);

    // Arbre à chat : poteaux corde + plateformes moquette
    const tree = new THREE.Group();
    const ropeMat = new THREE.MeshStandardMaterial({ map: noiseCanvasTexture(64, [190, 165, 120], 50, 6), roughness: 1 });
    const carpetMat = new THREE.MeshStandardMaterial({ color: 0x9a8a78, roughness: 1 });
    const plat = (w, d, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), carpetMat); m.position.y = y; m.castShadow = true; m.receiveShadow = true; tree.add(m); };
    const post = (x, z, y0, y1) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, y1 - y0, 16), ropeMat); m.position.set(x, (y0 + y1) / 2, z); m.castShadow = true; tree.add(m); };
    plat(0.6, 0.5, 0.02); post(0, 0, 0.04, 0.5); plat(0.45, 0.4, 0.52); post(0.1, -0.08, 0.54, 1.0); plat(0.4, 0.4, 1.02); post(-0.1, 0.08, 1.04, 1.4); plat(0.36, 0.36, 1.42);
    tree.position.set(-1.6, floorY, -2.2);
    group.add(tree);

    // Lampadaire (procédural) près du canapé : pied + abat-jour émissif
    const lampGroup = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0x3b3a38, roughness: 0.4, metalness: 0.8 });
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.02, 24), metal); foot.position.y = 0.01;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.45, 12), metal); pole.position.y = 0.74;
    const bulbMaterial = new THREE.MeshStandardMaterial({ color: 0xfff1d8, emissive: 0xffc98a, emissiveIntensity: 0, roughness: 0.6, side: THREE.DoubleSide });
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.26, 32, 1, true), bulbMaterial); shade.position.y = 1.55;
    for (const m of [foot, pole, shade]) { m.castShadow = m !== shade; m.receiveShadow = true; }
    lampGroup.add(foot, pole, shade);
    lampGroup.position.set(-5.9, floorY, -1.4);
    group.add(lampGroup);
    const lampPosition = new THREE.Vector3(-5.9, floorY + 1.5, -1.4);

    return {
        group, lampPosition, bulbMaterial, bowls, plankMat, walls,
        update(_dt) { /* rien d'animé pour l'instant */ },
        /** Coussin luxe : panier plus douillet (velours pourpre, coussin épais). */
        upgradeBed() {
            ring.material = new THREE.MeshStandardMaterial({ color: 0x6b2f6e, roughness: 0.95 });
            cushion.material = new THREE.MeshStandardMaterial({ color: 0xf0d6e8, roughness: 1 });
            cushion.scale.y = 1.6; cushion.position.y = 0.048;
        },
        /** Masque le mur situé entre la caméra et la cible quand celle-ci est dans la maison. */
        updateWalls(camPos, targetPos) {
            const inside = targetPos.x > minX - 0.3 && targetPos.x < maxX + 0.3 && targetPos.z > minZ - 0.3 && targetPos.z < maxZ + 0.3;
            const hide = {
                north: inside && camPos.z < minZ, south: inside && camPos.z > maxZ,
                east: inside && camPos.x > maxX, west: inside && camPos.x < minX,
            };
            for (const [side, list] of Object.entries(walls)) for (const m of list) m.visible = !hide[side];
        },
    };
}
