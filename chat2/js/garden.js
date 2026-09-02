// Le jardin : pelouse PBR + brins d'herbe instanciés (vent), allée, arbres/arbustes/fleurs glTF, clôture, bassin, rochers.
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { HOUSE, GARDEN, POND, PATH } from './world-layout.js';
import { placeModel, boxWorldUV } from './house.js';

function bladeTexture() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 64, 128);
    const g = ctx.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, '#3f6a22'); g.addColorStop(0.6, '#6d9a35'); g.addColorStop(1, '#a9c95a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(22, 128); ctx.quadraticCurveTo(26, 40, 32, 2); ctx.quadraticCurveTo(38, 40, 42, 128); ctx.closePath(); ctx.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function normalNoiseTexture(size = 256) {
    // Carte de normales douce (ondulations) pour l'eau du bassin
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d'); const img = ctx.createImageData(size, size);
    const h = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        let v = 0;
        for (const [fx, fy, a] of [[3, 5, 1], [7, 2, 0.5], [11, 13, 0.25]]) v += a * Math.sin((x * fx + y * fy * 0.7) / size * Math.PI * 2 + Math.cos(y * fx / size * Math.PI * 2));
        h[y * size + x] = v;
    }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const l = h[y * size + ((x + size - 1) % size)], r = h[y * size + ((x + 1) % size)], u = h[((y + size - 1) % size) * size + x], d = h[((y + 1) % size) * size + x];
        const nx = (l - r) * 0.5, ny = (u - d) * 0.5, nz = 1;
        const len = Math.hypot(nx, ny, nz); const i = (y * size + x) * 4;
        img.data[i] = 128 + nx / len * 127; img.data[i + 1] = 128 + ny / len * 127; img.data[i + 2] = 128 + nz / len * 127; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function rockGeometry(r, seed) {
    const g = new THREE.IcosahedronGeometry(r, 2);
    const p = g.attributes.position;
    let s = seed;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const off = [rnd() * 10, rnd() * 10, rnd() * 10];
    for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const n = 1 + 0.22 * Math.sin(x * 9 + off[0]) * Math.cos(z * 7 + off[1]) + 0.12 * Math.sin(y * 13 + off[2]);
        p.setXYZ(i, x * n, y * n * 0.7, z * n);
    }
    g.computeVertexNormals();
    return g;
}

const inHouseFootprint = (x, z) => x > HOUSE.minX - 0.4 && x < HOUSE.maxX + 0.4 && z > HOUSE.minZ - 0.4 && z < HOUSE.maxZ + 0.4;
const inPath = (x, z) => x > PATH.xMin - 0.1 && x < PATH.xMax + 0.1 && z > PATH.zMin - 0.1 && z < PATH.zMax + 0.1;
const inPond = (x, z) => ((x - POND.x) / (POND.rx + 0.35)) ** 2 + ((z - POND.z) / (POND.rz + 0.35)) ** 2 < 1;

/**
 * Construit le jardin. Retourne { group, update(dt), fireflyArea }.
 */
export async function buildGarden(scene, assets, settings) {
    const group = new THREE.Group(); group.name = 'garden';
    scene.add(group);
    const size = GARDEN.max - GARDEN.min;

    const [grassMat, pathMat, plankMat] = await Promise.all([
        assets.loadPBR('leafy_grass', { repeat: [size / 2.2, size / 2.2] }),
        assets.loadPBR('cobblestone_02', { repeat: [(PATH.xMax - PATH.xMin) / 1.2, (PATH.zMax - PATH.zMin) / 1.2] }),
        assets.loadPBR('weathered_planks', { repeat: [1, 1] }),
    ]);

    // Pelouse
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(size + 4, size + 4), grassMat);
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.name = 'ground';
    group.add(ground);

    // Allée
    const path = new THREE.Mesh(new THREE.PlaneGeometry(PATH.xMax - PATH.xMin, PATH.zMax - PATH.zMin), pathMat);
    path.rotation.x = -Math.PI / 2; path.position.set((PATH.xMin + PATH.xMax) / 2, 0.012, 0); path.receiveShadow = true;
    group.add(path);

    // Brins d'herbe instanciés (2 quads croisés) avec vent
    const blade = BufferGeometryUtils.mergeGeometries([
        new THREE.PlaneGeometry(0.07, 0.24, 1, 3).translate(0, 0.12, 0),
        new THREE.PlaneGeometry(0.07, 0.24, 1, 3).translate(0, 0.12, 0).rotateY(Math.PI / 2),
    ]);
    const grassUniforms = { uTime: { value: 0 }, uWind: { value: 0.16 } };
    const bladeMat = new THREE.MeshStandardMaterial({ map: bladeTexture(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
    bladeMat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, grassUniforms);
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uWind;')
            .replace('#include <begin_vertex>', `#include <begin_vertex>
                #ifdef USE_INSTANCING
                float ph = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 1.3;
                #else
                float ph = 0.0;
                #endif
                float sway = sin(uTime * 1.6 + ph) * 0.6 + sin(uTime * 2.9 + ph * 1.9) * 0.3;
                float k = transformed.y * transformed.y * 6.0;
                transformed.x += sway * uWind * k;
                transformed.z += cos(uTime * 1.1 + ph) * uWind * 0.4 * k;`);
    };
    const count = settings.grassCount;
    const grass = new THREE.InstancedMesh(blade, bladeMat, count);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), axis = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    let placed = 0, tries = 0;
    while (placed < count && tries < count * 10) {
        tries++;
        const x = GARDEN.min + Math.random() * size, z = GARDEN.min + Math.random() * size;
        if (inHouseFootprint(x, z) || inPath(x, z) || inPond(x, z)) continue;
        q.setFromAxisAngle(axis, Math.random() * Math.PI);
        const sc = 0.7 + Math.random() * 0.7;
        s.set(sc, sc * (0.8 + Math.random() * 0.5), sc);
        p.set(x, 0, z);
        grass.setMatrixAt(placed, m.compose(p, q, s));
        color.setHSL(0.24 + Math.random() * 0.05, 0.45 + Math.random() * 0.2, 0.42 + Math.random() * 0.2);
        grass.setColorAt(placed, color);
        placed++;
    }
    grass.count = placed;
    grass.castShadow = settings.shells >= 12; // pas d'ombres d'herbe en qualité faible
    grass.receiveShadow = true;
    grass.frustumCulled = false;
    group.add(grass);

    // Clôture : poteaux, lisses, planches instanciées
    const fenceGroup = new THREE.Group();
    const postMat = plankMat;
    const F = GARDEN.max, H = 1.05;
    const plankGeo = boxWorldUV(new THREE.BoxGeometry(0.09, 0.95, 0.025), 0.09, 0.95, 0.025, 1);
    const plankCount = Math.ceil((F * 2) / 0.125) * 4;
    const planks = new THREE.InstancedMesh(plankGeo, plankMat, plankCount);
    let pi = 0;
    const sides = [[[-F, -F], [F, -F]], [[F, -F], [F, F]], [[F, F], [-F, F]], [[-F, F], [-F, -F]]];
    for (const [[x0, z0], [x1, z1]] of sides) {
        const len = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / len, uz = (z1 - z0) / len;
        const ang = Math.atan2(ux, uz);
        // Lisses
        for (const y of [0.35, 0.8]) {
            const rail = new THREE.Mesh(boxWorldUV(new THREE.BoxGeometry(0.04, 0.07, len), 0.04, 0.07, len, 1), postMat);
            rail.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); rail.rotation.y = ang; rail.castShadow = true; rail.receiveShadow = true; fenceGroup.add(rail);
        }
        // Poteaux
        for (let d = 0; d <= len + 0.01; d += 1.92) {
            const post = new THREE.Mesh(boxWorldUV(new THREE.BoxGeometry(0.11, H + 0.1, 0.11), 0.11, H + 0.1, 0.11, 1), postMat);
            post.position.set(x0 + ux * Math.min(d, len), (H + 0.1) / 2, z0 + uz * Math.min(d, len)); post.castShadow = true; post.receiveShadow = true; fenceGroup.add(post);
        }
        // Planches
        for (let d = 0.08; d < len && pi < plankCount; d += 0.125) {
            q.setFromAxisAngle(axis, ang + (Math.random() - 0.5) * 0.02);
            p.set(x0 + ux * d, 0.5 + (Math.random() - 0.5) * 0.02, z0 + uz * d);
            s.set(1, 0.98 + Math.random() * 0.06, 1);
            planks.setMatrixAt(pi++, m.compose(p, q, s));
        }
    }
    planks.count = pi; planks.castShadow = true; planks.receiveShadow = true;
    fenceGroup.add(planks);
    group.add(fenceGroup);

    // Bassin : bassin de boue + eau réfléchissante + rochers
    const pond = new THREE.Group();
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.85, 0.32, 48), new THREE.MeshStandardMaterial({ color: 0x3a3126, roughness: 1 }));
    bed.scale.set(POND.rx, 1, POND.rz); bed.position.y = -0.155; bed.receiveShadow = true;
    const waterNormals = normalNoiseTexture();
    waterNormals.repeat.set(3, 2);
    const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x2c5d66, roughness: 0.06, metalness: 0.0, transparent: true, opacity: 0.86,
        normalMap: waterNormals, normalScale: new THREE.Vector2(0.35, 0.35), clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.3,
    });
    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 64), waterMat);
    water.scale.set(POND.rx, POND.rz, 1); water.rotation.x = -Math.PI / 2; water.position.y = 0.004; water.receiveShadow = true;
    pond.add(bed, water);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x7d7a72, roughness: 0.95 });
    const rockMatDark = new THREE.MeshStandardMaterial({ color: 0x5f5d58, roughness: 0.95 });
    for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + Math.random() * 0.2;
        const r = 0.12 + Math.random() * 0.14;
        const rock = new THREE.Mesh(rockGeometry(r, 1000 + i), Math.random() < 0.5 ? rockMat : rockMatDark);
        rock.position.set(Math.cos(a) * (POND.rx + 0.08), r * 0.35, Math.sin(a) * (POND.rz + 0.08));
        rock.rotation.set(Math.random(), Math.random() * 3, Math.random());
        rock.castShadow = true; rock.receiveShadow = true; pond.add(rock);
    }
    pond.position.set(POND.x, 0, POND.z);
    group.add(pond);

    // Végétation glTF
    const [tree, shrub, gazania, dandelion, tuft] = await Promise.all([
        assets.loadModel('quiver_tree_02'), assets.loadModel('shrub_02'), assets.loadModel('flower_gazania'), assets.loadModel('dandelion_01'), assets.loadModel('grass_medium_01'),
    ]);
    const put = (model, x, z, rot, opts) => { const c = model.clone(true); placeModel(c, x, z, rot, opts); group.add(c); return c; };
    put(tree, 3.8, -4.2, 0.3, { targetSize: 3.4, axis: 'y' });
    put(tree, -4.5, 5.2, 2.1, { targetSize: 3.0, axis: 'y' });
    for (const [x, z] of [[6.6, -6.4], [-6.6, 6.5], [6.5, 6.3], [1.5, -6.6], [-6.4, -6.2]]) put(shrub, x, z, Math.random() * 6, { targetSize: 0.9 + Math.random() * 0.4, axis: 'y' });
    for (let i = 0; i < 10; i++) {
        let x, z, k = 0;
        do { x = GARDEN.min + 1 + Math.random() * (size - 2); z = GARDEN.min + 1 + Math.random() * (size - 2); k++; } while ((inHouseFootprint(x, z) || inPath(x, z) || inPond(x, z)) && k < 50);
        put(i % 2 ? gazania : dandelion, x, z, Math.random() * 6, { targetSize: 0.22 + Math.random() * 0.1, axis: 'y' });
    }
    for (let i = 0; i < 14; i++) {
        let x, z, k = 0;
        do { x = GARDEN.min + 0.8 + Math.random() * (size - 1.6); z = GARDEN.min + 0.8 + Math.random() * (size - 1.6); k++; } while ((inHouseFootprint(x, z) || inPath(x, z) || inPond(x, z)) && k < 50);
        put(tuft, x, z, Math.random() * 6, { targetSize: 0.3 + Math.random() * 0.15, axis: 'y' });
    }

    return {
        group,
        fireflyArea: [HOUSE.maxX + 0.5, GARDEN.max - 0.5, GARDEN.min + 0.5, GARDEN.max - 0.5],
        update(dt, time) {
            grassUniforms.uTime.value = time;
            waterNormals.offset.x = time * 0.012; waterNormals.offset.y = time * 0.008;
        },
    };
}
