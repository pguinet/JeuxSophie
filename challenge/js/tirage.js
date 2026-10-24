// Tirages « plus difficiles » : on favorise les niveaux 2 et 3, et on choisit
// des leurres qui ressemblent à la bonne réponse (même thème, orthographe proche).
import { shuffle } from './rng.js';

export const POIDS_DEFAUT = { 1: 0.2, 2: 0.45, 3: 0.35 };

// n éléments distincts ; le niveau de chaque tirage suit `poids`, renormalisé
// sur les niveaux qui ont encore des éléments.
export function tirerParNiveau(banque, n, rng = Math.random, poids = POIDS_DEFAUT) {
    const restes = new Map();
    for (const item of shuffle(banque, rng)) {
        const niv = item.niveau ?? 1;
        if (!restes.has(niv)) restes.set(niv, []);
        restes.get(niv).push(item);
    }
    const res = [];
    while (res.length < n) {
        const dispo = [...restes.keys()].filter(k => restes.get(k).length > 0);
        if (dispo.length === 0) break;
        const total = dispo.reduce((s, k) => s + (poids[k] ?? 0.1), 0);
        let r = rng() * total;
        let choisi = dispo[dispo.length - 1];
        for (const k of dispo) {
            r -= poids[k] ?? 0.1;
            if (r < 0) { choisi = k; break; }
        }
        res.push(restes.get(choisi).pop());
    }
    return res;
}

// Distance de Levenshtein (insertions, suppressions, substitutions).
export function distanceEdition(a, b) {
    const prec = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        let diag = prec[0];
        prec[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = prec[j];
            prec[j] = Math.min(prec[j] + 1, prec[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
            diag = tmp;
        }
    }
    return prec[b.length];
}

const norm = t => String(t ?? '').trim().toLowerCase();

// `n` leurres pour `mot`, pris dans `banque`, par ordre de priorité :
// même thème et (même niveau ou orthographe proche), puis même thème,
// puis orthographe proche, puis le reste. Jamais un mot qui aurait le même
// anglais, le même français ou le même emoji que le bon mot ou qu'un autre leurre.
export function leurresProches(mot, banque, n, rng = Math.random) {
    const proche = m => distanceEdition(norm(m.en), norm(mot.en)) <= 3;
    const rang = m => {
        if (m.theme === mot.theme && (m.niveau === mot.niveau || proche(m))) return 0;
        if (m.theme === mot.theme) return 1;
        if (proche(m)) return 2;
        return 3;
    };
    const tries = shuffle(banque, rng).map(m => [rang(m), m]).sort((x, y) => x[0] - y[0]);
    const vus = new Set([norm(mot.en), norm(mot.fr), mot.emoji]);
    const res = [];
    for (const [, m] of tries) {
        if (res.length === n) break;
        if (vus.has(norm(m.en)) || vus.has(norm(m.fr)) || (m.emoji && vus.has(m.emoji))) continue;
        vus.add(norm(m.en)); vus.add(norm(m.fr)); if (m.emoji) vus.add(m.emoji);
        res.push(m);
    }
    return res;
}
