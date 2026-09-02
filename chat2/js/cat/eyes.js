// Yeux du chat : globe, iris procédural (canvas), pupille en fente, cornée brillante, paupières animables.
import * as THREE from 'three';

function makeIrisTexture(hexColor) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const c = new THREE.Color(hexColor);
    const hsl = {}; c.getHSL(hsl);
    const col = (l, sat = hsl.s, a = 1) => `hsla(${hsl.h * 360}, ${sat * 100}%, ${l * 100}%, ${a})`;
    const r = size / 2;
    // Fond : dégradé radial (clair près de la pupille, plus sombre au limbe)
    const g = ctx.createRadialGradient(r, r, r * 0.15, r, r, r);
    g.addColorStop(0, col(Math.min(hsl.l + 0.25, 0.9)));
    g.addColorStop(0.6, col(hsl.l));
    g.addColorStop(0.92, col(Math.max(hsl.l - 0.25, 0.08)));
    g.addColorStop(1, 'rgba(20,10,5,1)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    // Fibres radiales
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 240; i++) {
        const a = (i / 240) * Math.PI * 2 + Math.random() * 0.02;
        const l0 = r * (0.18 + Math.random() * 0.15), l1 = r * (0.7 + Math.random() * 0.3);
        ctx.strokeStyle = Math.random() < 0.5 ? col(Math.min(hsl.l + 0.3, 0.95), hsl.s) : col(Math.max(hsl.l - 0.3, 0.05), hsl.s * 0.7);
        ctx.lineWidth = 0.6 + Math.random() * 1.6;
        ctx.beginPath(); ctx.moveTo(r + Math.cos(a) * l0, r + Math.sin(a) * l0); ctx.lineTo(r + Math.cos(a) * l1, r + Math.sin(a) * l1); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
}

/**
 * Crée un œil regardant vers +Z local. API : setBlink(t), setPupil(open), setSquint(v), lookAt(dx, dy).
 * @param {{radius:number, iris:string, lidColor:string}} opts
 */
export function createEye({ radius = 0.0125, iris = '#7fb069', lidColor = '#8a5a2b' }) {
    const group = new THREE.Group();
    const R = radius;

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 20),
        new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.35 }));
    group.add(sclera);

    // Iris : calotte sphérique légèrement en retrait (l'iris réel est derrière la cornée)
    const irisAngle = 0.62; // demi-angle de l'iris (rad) → iris large comme chez le chat
    const irisGeo = new THREE.SphereGeometry(R * 0.985, 32, 16, 0, Math.PI * 2, 0, irisAngle);
    // Remappe les UV de la calotte en disque pour la texture d'iris
    const uv = irisGeo.attributes.uv, pos = irisGeo.attributes.position;
    for (let i = 0; i < uv.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const rr = Math.hypot(x, z) / (R * 0.985 * Math.sin(irisAngle));
        const ang = Math.atan2(z, x);
        uv.setXY(i, 0.5 + 0.5 * rr * Math.cos(ang), 0.5 + 0.5 * rr * Math.sin(ang));
    }
    const irisMat = new THREE.MeshStandardMaterial({ map: makeIrisTexture(iris), roughness: 0.6, metalness: 0.0 });
    const irisMesh = new THREE.Mesh(irisGeo, irisMat);
    irisMesh.rotation.x = Math.PI / 2; // pôle +Y → +Z
    group.add(irisMesh);

    // Pupille : fente verticale (ellipse plate) posée sur l'iris
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(R * 0.42, 32),
        new THREE.MeshBasicMaterial({ color: 0x050308 }));
    pupil.position.z = R * 0.93;
    pupil.scale.x = 0.25;
    group.add(pupil);

    // Cornée : sphère transparente brillante qui attrape les reflets
    const cornea = new THREE.Mesh(new THREE.SphereGeometry(R * 1.04, 28, 20),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false }));
    group.add(cornea);

    // Paupières : calottes de fourrure sombre
    const lidMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(lidColor).multiplyScalar(0.55), roughness: 0.9 });
    const lidAngle = 0.95;
    const upperLid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.09, 28, 10, 0, Math.PI * 2, 0, lidAngle), lidMat);
    const lowerLid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.09, 28, 10, 0, Math.PI * 2, Math.PI - lidAngle, lidAngle), lidMat);
    const lids = new THREE.Group();
    lids.add(upperLid, lowerLid);
    group.add(lids);

    let blink = 0, squint = 0;
    const applyLids = () => {
        // Ouvert : la paupière supérieure couvre un peu le haut ; fermé : les deux bords se rejoignent devant (+Z)
        const close = Math.max(blink, squint * 0.55);
        const openUpper = 0.35, openLower = 0.15;
        const maxUpper = Math.PI / 2 - (Math.PI / 2 - lidAngle) + 0.05;
        upperLid.rotation.x = openUpper + (maxUpper - openUpper) * close;   // tourne vers +Z (vers le bas devant)
        lowerLid.rotation.x = -(openLower + (maxUpper - openLower) * close);
    };
    applyLids();

    return {
        group,
        setBlink(t) { blink = THREE.MathUtils.clamp(t, 0, 1); applyLids(); },
        setSquint(v) { squint = THREE.MathUtils.clamp(v, 0, 1); applyLids(); },
        setPupil(open) { pupil.scale.x = THREE.MathUtils.lerp(0.18, 0.95, THREE.MathUtils.clamp(open, 0, 1)); },
        /** Regard : petits angles (rad) horizontal/vertical, applique sur globe + iris + pupille. */
        look(dx, dy) { for (const m of [sclera, irisMesh, pupil]) m.rotation.set(m === irisMesh ? Math.PI / 2 - dy : -dy, dx, 0); },
        dispose() { irisMat.map.dispose(); [sclera, irisMesh, pupil, cornea, upperLid, lowerLid].forEach((m) => { m.geometry.dispose(); m.material.dispose(); }); },
    };
}
