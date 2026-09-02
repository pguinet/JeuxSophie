// Robes du chat : couleurs (hex CSS) et paramètres de motif utilisés par le shader de fourrure.
export const COATS = {
    tabby:  { label: 'Tigré roux', base: '#c27a34', belly: '#f1e0c4', stripe: '#6e3d16', stripeContrast: 0.65, furLength: 0.010, eye: '#7fb069', ui: '#d98a3a' },
    black:  { label: 'Noir',       base: '#1a171c', belly: '#2b272e', stripe: '#0b0a0c', stripeContrast: 0.0,  furLength: 0.010, eye: '#e0b040', ui: '#2b2830' },
    grey:   { label: 'Gris',       base: '#7c7e86', belly: '#d9d9de', stripe: '#43444c', stripeContrast: 0.45, furLength: 0.010, eye: '#c9d65a', ui: '#8a8c94' },
    white:  { label: 'Blanc',      base: '#f3efe6', belly: '#ffffff', stripe: '#e6e0d4', stripeContrast: 0.0,  furLength: 0.011, eye: '#6fb3e0', ui: '#f0ece2' },
    ginger: { label: 'Roux',       base: '#d68b3c', belly: '#f6e3c6', stripe: '#b8702a', stripeContrast: 0.15, furLength: 0.010, eye: '#e2a63a', ui: '#e0953f' },
};
export const COAT_IDS = Object.keys(COATS);
export const DEFAULT_COAT = 'tabby';

/** Correspondance couleur hex v1 (Mon Chat) → robe v2. */
export function coatFromV1Color(hex) {
    const map = { 0xe87e24: 'tabby', 0x222222: 'black', 0x888888: 'grey', 0xf5f5f5: 'white', 0xb5651d: 'ginger' };
    if (typeof hex === 'string') hex = parseInt(hex.replace('#', ''), 16);
    if (hex in map) return map[hex];
    // Sinon : robe la plus proche par luminance
    const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 60) return 'black';
    if (lum > 220) return 'white';
    if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20) return 'grey';
    return r > g * 1.4 ? 'tabby' : 'ginger';
}
