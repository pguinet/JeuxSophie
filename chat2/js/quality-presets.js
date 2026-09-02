// Préréglages de qualité graphique — module pur (détection et ajustement testables sous Node).
export const PRESETS = {
    low:    { label: 'Faible', shadowMapSize: 1024, shells: 6,  pixelRatioCap: 1.0, bloom: false, grassCount: 3000,  msaa: 0, voxel: 0.008, shadowType: 'pcf',     anisotropy: 2, glassTransmission: false },
    medium: { label: 'Moyen',  shadowMapSize: 2048, shells: 12, pixelRatioCap: 1.5, bloom: true,  grassCount: 9000,  msaa: 2, voxel: 0.006, shadowType: 'pcfsoft', anisotropy: 4, glassTransmission: false },
    high:   { label: 'Élevé',  shadowMapSize: 2048, shells: 20, pixelRatioCap: 2.0, bloom: true,  grassCount: 20000, msaa: 4, voxel: 0.005, shadowType: 'pcfsoft', anisotropy: 8, glassTransmission: true },
};
export const PRESET_ORDER = ['low', 'medium', 'high'];

/**
 * Devine un préréglage de départ à partir d'informations sur la machine.
 * @param {{ renderer?: string, deviceMemory?: number, hardwareConcurrency?: number, isMobile?: boolean, maxTextureSize?: number }} info
 */
export function detectPreset(info = {}) {
    const r = (info.renderer || '').toLowerCase();
    if (info.isMobile) return 'low';
    if (/swiftshader|llvmpipe|software|basic render/.test(r)) return 'low';
    if (/nvidia|geforce|rtx|radeon rx|radeon pro|apple m[1-9]/.test(r)) return 'high';
    if (/intel|iris|uhd|hd graphics|radeon|vega|adreno|mali/.test(r)) return 'medium';
    if ((info.deviceMemory || 8) <= 4 || (info.hardwareConcurrency || 8) <= 2) return 'low';
    return 'medium';
}

/**
 * Ajuste le préréglage selon les FPS mesurés sur une fenêtre stable. Ne monte jamais tout seul
 * (éviter l'oscillation) ; descend d'un cran si < minFps.
 */
export function adjustPreset(current, fps, minFps = 40) {
    const i = PRESET_ORDER.indexOf(current);
    if (i < 0) return 'medium';
    if (fps < minFps && i > 0) return PRESET_ORDER[i - 1];
    return current;
}

/** Moyenne glissante de FPS : { push(dt) → fps moyen sur `window` échantillons, ready }. */
export function createFpsMeter(windowSize = 120) {
    const samples = [];
    return {
        push(dt) {
            if (dt <= 0 || dt > 1) return;
            samples.push(dt);
            if (samples.length > windowSize) samples.shift();
        },
        get ready() { return samples.length >= windowSize; },
        get fps() { if (!samples.length) return 0; const avg = samples.reduce((a, b) => a + b, 0) / samples.length; return 1 / avg; },
        reset() { samples.length = 0; },
    };
}
