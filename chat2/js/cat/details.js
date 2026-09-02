// Détails du visage : truffe, moustaches, intérieur des oreilles.
import * as THREE from 'three';

export function createNose() {
    const geo = new THREE.SphereGeometry(0.0085, 20, 14);
    geo.scale(1, 0.62, 0.85);
    const mat = new THREE.MeshPhysicalMaterial({ color: 0x8d4a45, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.25 });
    const nose = new THREE.Mesh(geo, mat);
    nose.castShadow = false;
    return nose;
}

/**
 * Moustaches : 2 × n tubes fins légèrement courbés, attachés au museau. Retourne un Group.
 * Les moustaches partent des côtés du museau vers l'avant/extérieur et retombent un peu.
 */
export function createWhiskers({ count = 6, length = 0.075, color = 0xf5f0e8 } = {}) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, transparent: true, opacity: 0.85 });
    for (const side of [1, -1]) {
        for (let i = 0; i < count; i++) {
            const t = (i + 0.5) / count;                 // 0 = haut, 1 = bas
            const row = Math.floor(i / 2), col = i % 2;  // 3 rangées × 2
            const start = new THREE.Vector3(0.0, 0.006 - row * 0.006, side * (0.012 + col * 0.006));
            const dir = new THREE.Vector3(0.55 + col * 0.15, 0.25 - t * 0.55, side * (0.8 - col * 0.15)).normalize();
            const len = length * (0.85 + (col ? 0.25 : 0) + Math.random() * 0.1);
            const mid = start.clone().addScaledVector(dir, len * 0.5).add(new THREE.Vector3(0, 0.004 - t * 0.006, 0));
            const end = start.clone().addScaledVector(dir, len).add(new THREE.Vector3(0, -0.006 - t * 0.012, 0));
            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
            const geo = new THREE.TubeGeometry(curve, 8, 0.00045, 4, false);
            // Effilage : réduit le rayon vers l'extrémité
            const pos = geo.attributes.position;
            const pts = curve.getPoints(8);
            for (let v = 0; v < pos.count; v++) {
                const seg = Math.floor(v / 5); // (radialSegments + 1) sommets par anneau
                const k = seg / 8, center = pts[Math.min(seg, 8)];
                const px = pos.getX(v), py = pos.getY(v), pz = pos.getZ(v);
                const f = 1 - k * 0.75;
                pos.setXYZ(v, center.x + (px - center.x) * f, center.y + (py - center.y) * f, center.z + (pz - center.z) * f);
            }
            geo.computeVertexNormals();
            const m = new THREE.Mesh(geo, mat);
            m.castShadow = false;
            group.add(m);
        }
    }
    return group;
}

/** Intérieur d'oreille : fine calotte rosée posée sur la face avant de l'oreille. */
export function createInnerEar(color = 0xd9a0a0) {
    const geo = new THREE.SphereGeometry(0.017, 16, 12, 0, Math.PI, 0, Math.PI * 0.5);
    geo.scale(0.5, 1.25, 0.3);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = false;
    return m;
}
