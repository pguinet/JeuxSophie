// Jauges du chat — module pur (mêmes valeurs et taux que la v1).
export const NEED_DEFS = {
    hunger:    { icon: '🍖', label: 'Faim',     rate: -1 / 60,   initial: 80, goodHigh: true },
    thirst:    { icon: '💧', label: 'Soif',     rate: -1.5 / 60, initial: 80, goodHigh: true },
    happiness: { icon: '😸', label: 'Bonheur',  rate: -0.8 / 60, initial: 80, goodHigh: true },
    hygiene:   { icon: '🧼', label: 'Propreté', rate: -0.5 / 60, initial: 80, goodHigh: true },
    fatigue:   { icon: '😴', label: 'Fatigue',  rate: 0.7 / 60,  initial: 20, goodHigh: false },
};
export const NEED_KEYS = Object.keys(NEED_DEFS);

/** Effets des actions du joueur (deltas). */
export const ACTIONS = {
    feed:  { hunger: +30, happiness: +3 },
    drink: { thirst: +30 },
    pet:   { happiness: +20 },
    wash:  { hygiene: +40, happiness: -3 },
    sleep: { fatigue: -40, happiness: +2 },
};
export const ACTION_COOLDOWN = 3; // secondes

export const clamp100 = (v) => Math.max(0, Math.min(100, v));

export function createNeeds() {
    const n = {};
    for (const k of NEED_KEYS) n[k] = NEED_DEFS[k].initial;
    return n;
}

/** Fait évoluer les jauges de dt secondes (mutation + retour). */
export function tickNeeds(needs, dt) {
    for (const k of NEED_KEYS) needs[k] = clamp100(needs[k] + NEED_DEFS[k].rate * dt);
    return needs;
}

/** Applique une action ; retourne la liste des jauges modifiées. */
export function applyAction(needs, action) {
    const eff = ACTIONS[action];
    if (!eff) throw new Error(`action inconnue : ${action}`);
    const changed = [];
    for (const [k, d] of Object.entries(eff)) { needs[k] = clamp100(needs[k] + d); changed.push(k); }
    return changed;
}

/** Applique un effet arbitraire (objets de la boutique). */
export function applyEffect(needs, effect) {
    for (const [k, d] of Object.entries(effect || {})) if (k in needs) needs[k] = clamp100(needs[k] + d);
    return needs;
}

/** Note de bien-être 0..100 : moyenne des jauges (fatigue inversée). */
export function wellbeing(needs) {
    let sum = 0;
    for (const k of NEED_KEYS) sum += NEED_DEFS[k].goodHigh ? needs[k] : 100 - needs[k];
    return sum / NEED_KEYS.length;
}

/** Humeur affichée : 'happy' | 'ok' | 'sad' | 'sleepy' | 'hungry' | 'thirsty' | 'dirty'. */
export function mood(needs) {
    if (needs.fatigue > 85) return 'sleepy';
    if (needs.hunger < 25) return 'hungry';
    if (needs.thirst < 25) return 'thirsty';
    if (needs.hygiene < 25) return 'dirty';
    if (needs.happiness < 30) return 'sad';
    return wellbeing(needs) > 70 ? 'happy' : 'ok';
}

/** Couleur d'une jauge selon sa valeur « bonne » (0..1). */
export function needLevel(key, value) {
    return NEED_DEFS[key].goodHigh ? value / 100 : 1 - value / 100;
}
