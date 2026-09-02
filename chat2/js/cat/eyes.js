// Yeux du chat : globe, iris procédural (canvas), pupille en fente, cornée brillante, paupières animables.
import * as THREE from 'three';

/**
 * Texture d'iris : fibres radiales dessinées une fois (canvas statique), pupille en fente redessinée à la demande.
 * Retourne { texture, setPupil(open) }.
 */
function makeIrisTexture(hexColor) {
    const size = 256, r = size / 2;
    const base = document.createElement('canvas');
    base.width = base.height = size;
    const bctx = base.getContext('2d');
    const c = new THREE.Color(hexColor);
    const hsl = {}; c.getHSL(hsl);
    const col = (l, sat = hsl.s, a = 1) => `hsla(${hsl.h * 360}, ${sat * 100}%, ${l * 100}%, ${a})`;
    const g = bctx.createRadialGradient(r, r, r * 0.15, r, r, r);
    g.addColorStop(0, col(Math.min(hsl.l + 0.22, 0.9)));
    g.addColorStop(0.55, col(hsl.l));
    g.addColorStop(0.9, col(Math.max(hsl.l - 0.22, 0.08)));
    g.addColorStop(1, 'rgba(25,12,5,1)');
    bctx.fillStyle = g; bctx.fillRect(0, 0, size, size);
    bctx.globalAlpha = 0.35;
    for (let i = 0; i < 260; i++) {
        const a = (i / 260) * Math.PI * 2 + Math.random() * 0.02;
        const l0 = r * (0.1 + Math.random() * 0.15), l1 = r * (0.7 + Math.random() * 0.3);
        bctx.strokeStyle = Math.random() < 0.5 ? col(Math.min(hsl.l + 0.3, 0.95)) : col(Math.max(hsl.l - 0.3, 0.05), hsl.s * 0.7);
        bctx.lineWidth = 0.6 + Math.random() * 1.6;
        bctx.beginPath(); bctx.moveTo(r + Math.cos(a) * l0, r + Math.sin(a) * l0); bctx.lineTo(r + Math.cos(a) * l1, r + Math.sin(a) * l1); bctx.stroke();
    }
    bctx.globalAlpha = 1;

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    let last = -1;
    const setPupil = (open) => {
        open = Math.min(1, Math.max(0, open));
        if (Math.abs(open - last) < 0.02) return;
        last = open;
        ctx.drawImage(base, 0, 0);
        const w = r * (0.10 + 0.78 * open), h = r * (0.86 - 0.1 * open);
        // Fente verticale : ellipse avec bords doux
        ctx.fillStyle = '#060308';
        ctx.beginPath(); ctx.ellipse(r, r, w, h, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3; ctx.stroke();
        texture.needsUpdate = true;
    };
    setPupil(0.4);
    return { texture, setPupil };
}

/**
 * Crée un œil regardant vers +Z local. API : setBlink(t), setPupil(open), setSquint(v), lookAt(dx, dy).
 * @param {{radius:number, iris:string, lidColor:string}} opts
 */
export function createEye({ radius = 0.0125, iris = '#7fb069', lidColor = '#8a5a2b' }) {
    const group = new THREE.Group();
    const R = radius;

    const ball = new THREE.Group(); // globe oculaire pivotant (sclère + iris + pupille)
    group.add(ball);
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 20),
        new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.35 }));
    ball.add(sclera);

    // Iris : calotte sphérique posée juste au-dessus de la sclère (large comme chez le chat)
    const irisAngle = 0.66;
    const irisR = R * 1.004;
    const irisGeo = new THREE.SphereGeometry(irisR, 32, 16, 0, Math.PI * 2, 0, irisAngle);
    // Remappe les UV de la calotte en disque pour la texture d'iris
    const uv = irisGeo.attributes.uv, pos = irisGeo.attributes.position;
    for (let i = 0; i < uv.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const rr = Math.hypot(x, z) / (irisR * Math.sin(irisAngle));
        const ang = Math.atan2(z, x);
        uv.setXY(i, 0.5 + 0.5 * rr * Math.cos(ang), 0.5 + 0.5 * rr * Math.sin(ang));
    }
    const irisTex = makeIrisTexture(iris);
    const irisMat = new THREE.MeshStandardMaterial({ map: irisTex.texture, roughness: 0.55, metalness: 0.0 });
    const irisMesh = new THREE.Mesh(irisGeo, irisMat);
    irisMesh.rotation.x = Math.PI / 2; // pôle +Y → +Z
    ball.add(irisMesh);

    // Cornée : sphère transparente brillante qui attrape les reflets
    const cornea = new THREE.Mesh(new THREE.SphereGeometry(R * 1.04, 28, 20),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false }));
    group.add(cornea);

    // Paupières : calottes de fourrure sombre
    const lidMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(lidColor).multiplyScalar(0.55), roughness: 0.9 });
    const lidAngle = 0.9;
    const upperLid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.09, 28, 10, 0, Math.PI * 2, 0, lidAngle), lidMat);
    const lowerLid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.09, 28, 10, 0, Math.PI * 2, Math.PI - lidAngle, lidAngle), lidMat);
    const lids = new THREE.Group();
    lids.add(upperLid, lowerLid);
    group.add(lids);

    let blink = 0, squint = 0;
    const applyLids = () => {
        // Ouvert : la paupière supérieure couvre un peu le haut ; fermé : les deux bords se rejoignent devant (+Z)
        const close = Math.max(blink, squint * 0.6);
        // Ouvert : bord supérieur ~35° au-dessus de l'horizon de l'œil, bord inférieur ~45° en dessous (œil en amande bien ouvert)
        const openUpper = 0.16, openLower = 0.12;
        const closed = Math.PI / 2 - lidAngle + 0.06;       // bords qui se rejoignent devant
        upperLid.rotation.x = openUpper + (closed - openUpper) * close;    // +X : le bord avant descend
        lowerLid.rotation.x = -(openLower + (closed - openLower) * close); // −X : le bord avant monte
    };
    applyLids();

    return {
        group,
        setBlink(t) { blink = THREE.MathUtils.clamp(t, 0, 1); applyLids(); },
        setSquint(v) { squint = THREE.MathUtils.clamp(v, 0, 1); applyLids(); },
        setPupil(open) { irisTex.setPupil(open); },
        /** Regard : petits angles (rad) horizontal/vertical, applique sur globe + iris + pupille. */
        look(dx, dy) { ball.rotation.set(-dy, dx, 0); },
        dispose() { irisMat.map.dispose(); [sclera, irisMesh, cornea, upperLid, lowerLid].forEach((m) => { m.geometry.dispose(); m.material.dispose(); }); },
    };
}
