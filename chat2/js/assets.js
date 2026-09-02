// Chargement des assets Poly Haven vendorisés (textures PBR, modèles glTF, HDRI) avec progression agrégée.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export class Assets {
    /**
     * @param {THREE.WebGLRenderer} renderer (pour le PMREM)
     * @param {{ base?: string, anisotropy?: number, onProgress?: (loaded:number, total:number, url:string)=>void }} opts
     */
    constructor(renderer, opts = {}) {
        this.renderer = renderer;
        this.base = opts.base ?? 'assets/';
        this.anisotropy = opts.anisotropy ?? 4;
        this.manager = new THREE.LoadingManager();
        this.manager.onProgress = (url, loaded, total) => opts.onProgress?.(loaded, total, url);
        this.texLoader = new THREE.TextureLoader(this.manager);
        this.gltfLoader = new GLTFLoader(this.manager);
        this.hdrLoader = new RGBELoader(this.manager);
        this.pmrem = new THREE.PMREMGenerator(renderer);
        this.pmrem.compileEquirectangularShader();
        this.cache = new Map();
    }

    _tex(url, { srgb = false, repeat = [1, 1] } = {}) {
        return new Promise((resolve, reject) => {
            this.texLoader.load(url, (t) => {
                t.wrapS = t.wrapT = THREE.RepeatWrapping;
                t.repeat.set(repeat[0], repeat[1]);
                t.anisotropy = this.anisotropy;
                if (srgb) t.colorSpace = THREE.SRGBColorSpace;
                resolve(t);
            }, undefined, reject);
        });
    }

    /**
     * Matériau PBR depuis une texture Poly Haven (diff + nor_gl + arm).
     * @returns {Promise<THREE.MeshStandardMaterial>}
     */
    async loadPBR(id, { repeat = [1, 1], res = '1k', roughness = 1, color = 0xffffff, normalScale = 1, extra = {} } = {}) {
        const dir = `${this.base}textures/${id}/${id}_`;
        const [map, normalMap, arm] = await Promise.all([
            this._tex(`${dir}diff_${res}.jpg`, { srgb: true, repeat }),
            this._tex(`${dir}nor_gl_${res}.jpg`, { repeat }),
            this._tex(`${dir}arm_${res}.jpg`, { repeat }),
        ]);
        return new THREE.MeshStandardMaterial({
            map, normalMap, aoMap: arm, roughnessMap: arm, metalnessMap: arm,
            roughness, metalness: 1, color, normalScale: new THREE.Vector2(normalScale, normalScale), ...extra,
        });
    }

    /** Modèle glTF Poly Haven ; retourne un clone du Group (le chargement est mis en cache). */
    async loadModel(id, res = '1k') {
        const key = `model:${id}:${res}`;
        if (!this.cache.has(key)) {
            this.cache.set(key, new Promise((resolve, reject) => {
                this.gltfLoader.load(`${this.base}models/${id}/${id}_${res}.gltf`, (g) => {
                    g.scene.traverse((o) => {
                        if (o.isMesh) {
                            o.castShadow = true; o.receiveShadow = true;
                            const mats = Array.isArray(o.material) ? o.material : [o.material];
                            for (const m of mats) { for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) if (m[k]) m[k].anisotropy = this.anisotropy; }
                        }
                    });
                    g.scene.name = id;
                    resolve(g.scene);
                }, undefined, reject);
            }));
        }
        const scene = await this.cache.get(key);
        return scene.clone(true);
    }

    /** HDRI équirectangulaire : { equirect (pour le ciel), env (PMREM pour l'éclairage) }. */
    async loadHDRI(file) {
        const key = `hdri:${file}`;
        if (!this.cache.has(key)) {
            this.cache.set(key, new Promise((resolve, reject) => {
                this.hdrLoader.load(`${this.base}hdri/${file}`, (tex) => {
                    tex.mapping = THREE.EquirectangularReflectionMapping;
                    const env = this.pmrem.fromEquirectangular(tex).texture;
                    resolve({ equirect: tex, env });
                }, undefined, reject);
            }));
        }
        return this.cache.get(key);
    }
}
