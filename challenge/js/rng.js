// Hasard à graine : mêmes tirages à chaque fois pour une même graine
// (classement des joueurs inventés, tests).

export function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// FNV-1a 32 bits.
export function hashString(s) {
    let h = 2166136261;
    for (const c of s) {
        h ^= c.codePointAt(0);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

export function pick(arr, rng = Math.random) {
    return arr[Math.floor(rng() * arr.length)];
}

export function shuffle(arr, rng = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function sample(arr, n, rng = Math.random) {
    return shuffle(arr, rng).slice(0, n);
}
