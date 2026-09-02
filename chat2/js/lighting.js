// Cycle jour/nuit et éclairage : soleil (ombres), lune, ciel HDRI, environnement, lampe du salon, lucioles.
import * as THREE from 'three';
import { SkyDome } from './sky.js';

/** Horloge du cycle : t ∈ [0,1), 0 = minuit, 0.5 = midi. Démarre en fin d'après-midi. */
export class DayCycle {
    constructor(period = 720, start = 0.66) {
        this.period = period;
        this.t = start;
        this.paused = false;
    }
    update(dt) { if (!this.paused) this.t = (this.t + dt / this.period) % 1; }
    /** Élévation du soleil (rad) : max ~62° à midi, négatif la nuit. */
    get elevation() { return Math.sin((this.t - 0.25) * Math.PI * 2) * 1.08; }
    get azimuth() { return this.t * Math.PI * 2 + Math.PI; }
    /** 0 nuit … 1 plein jour (transition douce autour de l'horizon). */
    get dayFactor() { return THREE.MathUtils.smoothstep(this.elevation, -0.12, 0.22); }
    /** Facteur crépuscule (fort quand le soleil est bas, au-dessus ou juste sous l'horizon). */
    get duskFactor() { const e = this.elevation; return Math.max(0, 1 - Math.abs(e - 0.02) / 0.25); }
    get sunDirection() {
        const e = this.elevation, a = this.azimuth;
        return new THREE.Vector3(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a));
    }
}

export class Lighting {
    /**
     * @param {THREE.Scene} scene
     * @param {{ day: {equirect, env}, night: {equirect, env} }} hdri
     * @param {object} settings préréglage qualité
     */
    constructor(scene, hdri, settings) {
        this.scene = scene;
        this.hdri = hdri;
        this.cycle = new DayCycle();

        this.sky = new SkyDome(hdri.day.equirect, hdri.night.equirect);
        scene.add(this.sky.mesh);
        scene.environment = hdri.day.env;
        scene.environmentIntensity = 1;

        this.sun = new THREE.DirectionalLight(0xfff1dc, 3.2);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.set(settings.shadowMapSize, settings.shadowMapSize);
        const cam = this.sun.shadow.camera;
        cam.left = -9; cam.right = 9; cam.top = 9; cam.bottom = -9; cam.near = 1; cam.far = 40;
        this.sun.shadow.bias = -0.0004;
        this.sun.shadow.normalBias = 0.025;
        this.sun.shadow.radius = 3;
        this.sunTarget = new THREE.Object3D();
        scene.add(this.sunTarget);
        this.sun.target = this.sunTarget;
        scene.add(this.sun);

        this.moon = new THREE.DirectionalLight(0x8fa8d8, 0.0);
        this.moon.position.set(-6, 10, -4);
        scene.add(this.moon);

        this.hemi = new THREE.HemisphereLight(0xbcd4ff, 0x5a4a34, 0.35);
        scene.add(this.hemi);

        this.lamp = null;      // défini par setLamp()
        this.fireflies = null; // défini par setFirefliesArea()
        this.currentEnvIsDay = true;
        this._tint = new THREE.Color();
        this.update(0);
    }

    /** Lampe du salon : PointLight + ampoule émissive. */
    setLamp(position, bulbMaterial = null) {
        this.lamp = new THREE.PointLight(0xffc98a, 0, 7, 2);
        this.lamp.position.copy(position);
        this.scene.add(this.lamp);
        this.bulbMaterial = bulbMaterial;
    }

    /** Lucioles dans une zone rectangulaire du jardin (xz). */
    setFirefliesArea(minX, maxX, minZ, maxZ, count = 60) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        this.fireflyBase = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const x = minX + Math.random() * (maxX - minX), z = minZ + Math.random() * (maxZ - minZ), y = 0.2 + Math.random() * 1.1;
            this.fireflyBase.set([x, y, z], i * 3);
        }
        pos.set(this.fireflyBase);
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0xd8ff7a, size: 0.05, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
        this.fireflies = new THREE.Points(geo, mat);
        this.fireflies.frustumCulled = false;
        this.scene.add(this.fireflies);
    }

    /** Niveau de lumière ambiante 0..1 (pour la pupille du chat). */
    get lightLevel() { return this.cycle.dayFactor * 0.85 + (this.lamp && this.lamp.intensity > 0 ? 0.25 : 0.05); }

    update(dt) {
        const c = this.cycle;
        c.update(dt);
        const day = c.dayFactor, dusk = c.duskFactor, elev = c.elevation;
        const sunDir = c.sunDirection;

        // Soleil
        this.sun.position.copy(sunDir).multiplyScalar(25);
        this.sun.intensity = Math.max(0, Math.sin(Math.max(elev, 0))) * 3.4 * day + 0.001;
        this.sun.visible = elev > -0.03;
        const warm = THREE.MathUtils.clamp(1 - elev / 0.5, 0, 1); // 1 à l'horizon
        this.sun.color.setRGB(1, THREE.MathUtils.lerp(0.95, 0.62, warm), THREE.MathUtils.lerp(0.86, 0.35, warm));

        // Lune (contre-jour bleuté la nuit)
        this.moon.intensity = (1 - day) * 0.35;
        this.hemi.intensity = 0.15 + day * 0.3;

        // Environnement : bascule jour/nuit quand le soleil est sous l'horizon, intensité liée au jour
        const wantDay = elev > -0.02;
        if (wantDay !== this.currentEnvIsDay) { this.currentEnvIsDay = wantDay; this.scene.environment = wantDay ? this.hdri.day.env : this.hdri.night.env; }
        this.scene.environmentIntensity = wantDay ? 0.25 + day * 0.85 : 0.35;

        // Ciel : mix vers la nuit, teinte orangée au crépuscule
        this._tint.setRGB(1, THREE.MathUtils.lerp(1, 0.72, dusk), THREE.MathUtils.lerp(1, 0.5, dusk));
        this.sky.set({ mix: 1 - day, tint: this._tint, exposure: 0.85 + day * 0.35, sunDir, glow: dusk * 0.8 });

        // Lampe : s'allume quand il fait sombre
        if (this.lamp) {
            const on = 1 - THREE.MathUtils.smoothstep(elev, 0.02, 0.15);
            this.lamp.intensity = on * 18;
            if (this.bulbMaterial) this.bulbMaterial.emissiveIntensity = on * 3;
        }
        // Lucioles : la nuit seulement, dérive lente
        if (this.fireflies) {
            const night = 1 - day;
            this.fireflies.material.opacity = night * 0.9;
            this.fireflies.visible = night > 0.02;
            if (this.fireflies.visible) {
                const t = performance.now() / 1000, p = this.fireflies.geometry.attributes.position, b = this.fireflyBase;
                for (let i = 0; i < p.count; i++) {
                    p.setXYZ(i, b[i * 3] + Math.sin(t * 0.7 + i) * 0.25, b[i * 3 + 1] + Math.sin(t * 1.1 + i * 2.3) * 0.15, b[i * 3 + 2] + Math.cos(t * 0.5 + i * 1.7) * 0.25);
                }
                p.needsUpdate = true;
                this.fireflies.material.size = 0.04 + 0.02 * Math.sin(t * 3);
            }
        }
    }
}
