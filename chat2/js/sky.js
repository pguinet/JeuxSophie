// Dôme de ciel : mélange de deux HDRI équirectangulaires (jour / nuit) avec teinte crépusculaire.
import * as THREE from 'three';

export class SkyDome {
    constructor(dayTex, nightTex) {
        this.uniforms = {
            tDay: { value: dayTex }, tNight: { value: nightTex },
            uMix: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) }, uExposure: { value: 1 },
            uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunGlow: { value: 0 },
        };
        const mat = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            side: THREE.BackSide, depthWrite: false, fog: false,
            vertexShader: /* glsl */`
                varying vec3 vDir;
                void main() {
                    vec4 wp = modelMatrix * vec4(position, 1.0);
                    vDir = normalize(wp.xyz - cameraPosition);
                    gl_Position = projectionMatrix * viewMatrix * wp;
                    gl_Position.z = gl_Position.w * 0.99999; // toujours au fond
                }`,
            fragmentShader: /* glsl */`
                #include <common>
                uniform sampler2D tDay; uniform sampler2D tNight;
                uniform float uMix; uniform vec3 uTint; uniform float uExposure;
                uniform vec3 uSunDir; uniform float uSunGlow;
                varying vec3 vDir;
                void main() {
                    vec3 d = normalize(vDir);
                    vec2 uv = equirectUv(d); // fournie par <common>
                    vec3 day = texture2D(tDay, uv).rgb;
                    vec3 night = texture2D(tNight, uv).rgb * 1.6;
                    vec3 col = mix(day, night, uMix) * uTint * uExposure;
                    // Halo du soleil (couchant) pour lier le ciel HDR à la position réelle du soleil
                    float s = max(dot(d, uSunDir), 0.0);
                    col += vec3(1.0, 0.55, 0.25) * pow(s, 60.0) * uSunGlow;
                    gl_FragColor = vec4(col, 1.0);
                    #include <tonemapping_fragment>
                    #include <colorspace_fragment>
                }`,
            toneMapped: true,
        });
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(180, 48, 24), mat);
        this.mesh.name = 'sky';
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = -10;
    }

    /** mix 0 = jour, 1 = nuit ; tint = couleur multiplicative ; exposure ; sunDir unitaire ; glow 0..1 */
    set({ mix, tint, exposure, sunDir, glow }) {
        if (mix !== undefined) this.uniforms.uMix.value = mix;
        if (tint) this.uniforms.uTint.value.copy(tint);
        if (exposure !== undefined) this.uniforms.uExposure.value = exposure;
        if (sunDir) this.uniforms.uSunDir.value.copy(sunDir);
        if (glow !== undefined) this.uniforms.uSunGlow.value = glow;
    }
}
