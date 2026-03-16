const SAVE_KEY = 'monchat_save';

export function saveGame(hud, catColor) {
    const state = {
        color: catColor,
        needs: hud.getState(),
        timestamp: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
}
