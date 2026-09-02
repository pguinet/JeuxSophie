// Matériau de fourrure en couches (shells) : MeshStandardMaterial étendu par onBeforeCompile.
// La fonction injectFurShader est pure (manipulation de chaînes) et testée sous Node.
import * as THREE from 'three';
import { COATS } from './coats.js';

export const FUR_VERTEX_PARS = /* glsl */`
varying vec3 vFurPos;
varying vec3 vFurNormal;
uniform float uShellH;
uniform float uFurLength;
`;

export const FUR_FRAGMENT_PARS = /* glsl */`
varying vec3 vFurPos;
varying vec3 vFurNormal;
uniform float uShellH;
uniform float uShellCount;
uniform float uFurScale;
uniform float uRootShade;
uniform vec3 uBaseColor;
uniform vec3 uBellyColor;
uniform vec3 uStripeColor;
uniform float uStripeContrast;
uniform float uIsShell;

float furHash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float furNoise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(furHash(i), furHash(i + vec3(1, 0, 0)), f.x), mix(furHash(i + vec3(0, 1, 0)), furHash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(furHash(i + vec3(0, 0, 1)), furHash(i + vec3(1, 0, 1)), f.x), mix(furHash(i + vec3(0, 1, 1)), furHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float furFbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) { v += a * furNoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return v;
}
vec3 coatColor(vec3 p, vec3 n, float fbm) {
    // Ventre / menton / intérieur des pattes : normales vers le bas → couleur claire
    float down = smoothstep(-0.1, 0.9, -n.y);
    float bellyMask = down * smoothstep(0.30, 0.10, p.y + 0.06 * n.y);
    // Chaussettes et museau clairs
    bellyMask = max(bellyMask, smoothstep(0.02, 0.0, p.y - 0.035));
    bellyMask = max(bellyMask, smoothstep(0.29, 0.33, p.x) * smoothstep(0.31, 0.27, p.y) * 0.8);
    // Rayures « mackerel » : fines bandes verticales irrégulières descendant de la ligne dorsale,
    // interrompues par le bruit, absentes du ventre ; anneaux sur la queue ; ligne dorsale sombre.
    float warp = (fbm - 0.5) * 4.0;
    float body = sin(p.x * 150.0 + warp * 1.5 + p.y * 18.0);
    float tail = sin((p.x + p.y * 0.7) * 160.0 + warp);
    float isTail = smoothstep(-0.2, -0.3, p.x);
    float bands = smoothstep(0.55, 0.9, mix(body, tail, isTail));
    float breakup = smoothstep(0.35, 0.6, furNoise(p * 55.0 + 3.1));
    float upper = smoothstep(0.12, 0.26, p.y) * (1.0 - bellyMask);
    float dorsal = smoothstep(0.045, 0.0, abs(p.z)) * smoothstep(0.18, 0.26, p.y) * (1.0 - isTail) * 0.7;
    float stripes = max(bands * breakup * upper, dorsal) * (0.6 + 0.4 * n.y * n.y);
    vec3 base = uBaseColor * (1.0 + (fbm - 0.5) * 0.25);
    vec3 col = mix(base, uBellyColor, bellyMask);
    col = mix(col, uStripeColor, stripes * uStripeContrast);
    return col;
}
`;

export const FUR_VERTEX_MAIN = /* glsl */`
    vFurPos = position.xyz;
    vFurNormal = normal.xyz;
    transformed += objectNormal * (uShellH * uFurLength);
`;

export const FUR_FRAGMENT_MAIN = /* glsl */`
    {
        if (uIsShell > 0.5) {
            // Brins : une cellule 3D = un brin ; hauteur aléatoire par cellule, section qui s'affine vers la pointe.
            vec3 cell = vFurPos * uFurScale;
            float rnd = furHash(floor(cell));
            vec2 local = fract(cell.xz + cell.y * 0.37) - 0.5;
            float radial = length(local) * 2.0;
            float thickness = 1.0 - uShellH * 0.6;
            if (rnd < uShellH || radial > thickness) discard;
        }
        float fbm = furFbm(vFurPos * 12.0);
        vec3 furCol = coatColor(vFurPos, vFurNormal, fbm);
        // Ombrage de racine : les couches basses sont dans l'ombre des brins
        furCol *= (uIsShell > 0.5) ? mix(uRootShade, 1.0, uShellH) : uRootShade * 0.95;
        diffuseColor.rgb *= furCol;
    }
`;

/**
 * Injecte le shader de fourrure dans un objet shader Three (pur : ne touche qu'aux chaînes et aux uniforms).
 * @param {{vertexShader:string, fragmentShader:string, uniforms:object}} shader
 * @param {object} uniforms uniforms à fusionner ({ uShellH: {value}, ... })
 */
export function injectFurShader(shader, uniforms) {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${FUR_VERTEX_PARS}`)
        .replace('#include <skinning_vertex>', `#include <skinning_vertex>\n${FUR_VERTEX_MAIN}`);
    shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${FUR_FRAGMENT_PARS}`)
        .replace('#include <color_fragment>', `#include <color_fragment>\n${FUR_FRAGMENT_MAIN}`);
    return shader;
}

function coatUniforms(coat) {
    const c = COATS[coat] || COATS.tabby;
    return {
        uBaseColor: { value: new THREE.Color(c.base) },
        uBellyColor: { value: new THREE.Color(c.belly) },
        uStripeColor: { value: new THREE.Color(c.stripe) },
        uStripeContrast: { value: c.stripeContrast },
        uFurLength: { value: c.furLength },
    };
}

/**
 * Crée le matériau de peau (base) et les N matériaux de couches partageant le même programme.
 * @returns {{ base: THREE.MeshStandardMaterial, shells: THREE.MeshStandardMaterial[], setCoat(id), setShellCount(n) }}
 */
export function createFurMaterials(coatId, shellCount) {
    const shared = coatUniforms(coatId);
    const all = [];
    const make = (isShell, h) => {
        const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0.0 });
        const u = {
            ...shared,
            uShellH: { value: h },
            uShellCount: { value: shellCount },
            uFurScale: { value: 380.0 },
            uRootShade: { value: 0.55 },
            uIsShell: { value: isShell ? 1 : 0 },
        };
        m.onBeforeCompile = (shader) => injectFurShader(shader, u);
        m.customProgramCacheKey = () => (isShell ? 'fur-shell' : 'fur-base');
        m.userData.uniforms = u;
        m.castShadow = !isShell;
        all.push(m);
        return m;
    };
    const base = make(false, 0);
    const shells = [];
    for (let i = 1; i <= shellCount; i++) shells.push(make(true, i / shellCount));
    return {
        base, shells,
        setCoat(id) {
            const cu = coatUniforms(id);
            for (const m of all) for (const k of Object.keys(cu)) m.userData.uniforms[k].value = cu[k].value;
        },
    };
}
