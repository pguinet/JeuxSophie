// Sauvegarde locale : meilleurs scores (par thème ET par classe),
// classe choisie et réglage du son.

import { DEFAULT_LEVEL } from './questions.js';

const KEY = 'apprendre_save';

function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch { return {}; }
}

function persist(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* stockage indisponible */ }
}

const scoreKey = (themeId, level) => `${themeId}:${level}`;

export function getBest(themeId, level) {
    const d = load();
    return (d.best && d.best[scoreKey(themeId, level)]) || 0;
}

// Enregistre le score s'il bat le record (thème + classe). Renvoie true si nouveau record.
export function setBest(themeId, level, score) {
    const d = load();
    d.best = d.best || {};
    const k = scoreKey(themeId, level);
    if (score > (d.best[k] || 0)) {
        d.best[k] = score;
        persist(d);
        return true;
    }
    return false;
}

export function getLevel() {
    const d = load();
    return typeof d.level === 'number' ? d.level : DEFAULT_LEVEL;
}
export function setLevel(level) { const d = load(); d.level = level; persist(d); }

export function isMutedSaved() { return !!load().muted; }
export function setMutedSaved(m) { const d = load(); d.muted = m; persist(d); }
