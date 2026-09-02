// Sauvegarde — module pur (stockage injectable) avec migration depuis la v1 (« Mon Chat »).
import { createNeeds, NEED_KEYS, clamp100 } from './needs.js';
import { createWallet } from './shop-logic.js';
import { COAT_IDS, DEFAULT_COAT, coatFromV1Color } from './cat/coats.js';

export const SAVE_KEY = 'monchat2_save';
export const V1_KEY = 'monchat_save';
export const SAVE_VERSION = 2;

export function createState(coat = DEFAULT_COAT) {
    return { version: SAVE_VERSION, coat, name: 'Minou', needs: createNeeds(), wallet: createWallet(), savedAt: 0, dayTime: 0.66 };
}

export function serialize(state) {
    return JSON.stringify({ ...state, version: SAVE_VERSION, savedAt: Date.now() });
}

/** Valide et complète un JSON de sauvegarde v2 ; retourne null si inutilisable. */
export function deserialize(json) {
    let raw;
    try { raw = JSON.parse(json); } catch { return null; }
    if (!raw || typeof raw !== 'object' || raw.version !== SAVE_VERSION) return null;
    const s = createState(COAT_IDS.includes(raw.coat) ? raw.coat : DEFAULT_COAT);
    if (typeof raw.name === 'string' && raw.name.trim()) s.name = raw.name.slice(0, 20);
    if (raw.needs) for (const k of NEED_KEYS) if (Number.isFinite(raw.needs[k])) s.needs[k] = clamp100(raw.needs[k]);
    if (raw.wallet) {
        if (Number.isFinite(raw.wallet.coins)) s.wallet.coins = Math.max(0, Math.floor(raw.wallet.coins));
        if (Array.isArray(raw.wallet.owned)) s.wallet.owned = raw.wallet.owned.filter((x) => typeof x === 'string');
        if (Number.isFinite(raw.wallet.playTime)) s.wallet.playTime = raw.wallet.playTime;
    }
    if (Number.isFinite(raw.dayTime)) s.dayTime = ((raw.dayTime % 1) + 1) % 1;
    if (Number.isFinite(raw.savedAt)) s.savedAt = raw.savedAt;
    return s;
}

/**
 * Migration v1 : { color (hex number), needs: {hunger…}, coins, playTime, owned: [...] } — champs tolérés absents.
 * Retourne un état v2 ou null.
 */
export function migrateV1(json) {
    let raw;
    try { raw = JSON.parse(json); } catch { return null; }
    if (!raw || typeof raw !== 'object') return null;
    const coat = raw.color !== undefined ? coatFromV1Color(raw.color) : DEFAULT_COAT;
    const s = createState(coat);
    const needs = raw.needs || {};
    for (const k of NEED_KEYS) {
        const v = typeof needs[k] === 'object' ? needs[k]?.value : needs[k];
        if (Number.isFinite(v)) s.needs[k] = clamp100(v);
    }
    if (Number.isFinite(raw.coins)) s.wallet.coins = Math.max(0, Math.floor(raw.coins));
    if (Number.isFinite(raw.playTime)) s.wallet.playTime = raw.playTime;
    if (Array.isArray(raw.owned)) s.wallet.owned = raw.owned.filter((x) => typeof x === 'string');
    return s;
}

/** Façade de stockage : { load(), save(state), hasV1(), loadV1(), clear() }. */
export function createStorage(storage) {
    const get = (k) => { try { return storage.getItem(k); } catch { return null; } };
    return {
        load() { const j = get(SAVE_KEY); return j ? deserialize(j) : null; },
        save(state) { try { storage.setItem(SAVE_KEY, serialize(state)); return true; } catch { return false; } },
        hasV1() { return !!get(V1_KEY); },
        loadV1() { const j = get(V1_KEY); return j ? migrateV1(j) : null; },
        clear() { try { storage.removeItem(SAVE_KEY); } catch { /* ignore */ } },
    };
}
