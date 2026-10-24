// « What time is it? » : l'heure à l'anglaise (o'clock, quarter past, twenty to…)
// et une horloge dessinée en SVG.
import { shuffle, pick } from './rng.js';

const NOMBRES = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve'];
const MINUTES = { 5: 'five', 10: 'ten', 15: 'quarter', 20: 'twenty', 25: 'twenty-five', 30: 'half' };

const heureSuivante = h => (h === 12 ? 1 : h + 1);
const heurePrecedente = h => (h === 1 ? 12 : h - 1);

// h de 1 à 12, m multiple de 5 entre 0 et 55.
export function heureEnAnglais(h, m) {
    if (m === 0) return `It's ${NOMBRES[h]} o'clock.`;
    if (m <= 30) return `It's ${MINUTES[m]} past ${NOMBRES[h]}.`;
    return `It's ${MINUTES[60 - m]} to ${NOMBRES[heureSuivante(h)]}.`;
}

// Quatre choix, un seul juste. Les leurres « pièges » passent en premier
// (past/to inversé, minutes en miroir), puis on complète avec des voisins mélangés.
export function choixHeure(h, m, rng = Math.random) {
    const juste = heureEnAnglais(h, m);
    const pieges = [];
    if (m > 0 && m < 30) pieges.push(`It's ${MINUTES[m]} to ${NOMBRES[h]}.`);
    if (m > 30) pieges.push(`It's ${MINUTES[60 - m]} past ${NOMBRES[h]}.`);
    if (m !== 0 && m !== 30) pieges.push(heureEnAnglais(h, 60 - m));
    const voisins = [heureEnAnglais(heureSuivante(h), m), heureEnAnglais(heurePrecedente(h), m)];
    for (const d of [5, 10, -5, -10]) {
        const m2 = m + d;
        if (m2 >= 0 && m2 < 60) voisins.push(heureEnAnglais(h, m2));
    }
    const vus = new Set([juste]);
    const leurres = [...pieges, ...shuffle(voisins, rng)]
        .filter(t => !vus.has(t) && vus.add(t)).slice(0, 3);
    return shuffle([{ texte: juste, juste: true },
        ...leurres.map(t => ({ texte: t, juste: false }))], rng);
}

export function anglesAiguilles(h, m) {
    return { heures: (h % 12) * 30 + m * 0.5, minutes: m * 6 };
}

export function horlogeSVG(h, m) {
    const { heures, minutes } = anglesAiguilles(h, m);
    const graduations = Array.from({ length: 12 }, (_, i) => {
        const a = i * 30;
        return `<line x1="100" y1="18" x2="100" y2="${i % 3 === 0 ? 30 : 26}" stroke="#334155" stroke-width="${i % 3 === 0 ? 4 : 2}" transform="rotate(${a} 100 100)"/>`;
    }).join('');
    const chiffres = Array.from({ length: 12 }, (_, i) => {
        const n = i + 1, a = (n * 30 - 90) * Math.PI / 180;
        return `<text x="${(100 + 62 * Math.cos(a)).toFixed(1)}" y="${(100 + 62 * Math.sin(a) + 7).toFixed(1)}" text-anchor="middle" font-size="20" font-family="sans-serif" font-weight="bold" fill="#1e293b">${n}</text>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="horloge">
<circle cx="100" cy="100" r="92" fill="#fff" stroke="#1e3a8a" stroke-width="8"/>
${graduations}${chiffres}
<line x1="100" y1="100" x2="100" y2="60" stroke="#1e293b" stroke-width="8" stroke-linecap="round" transform="rotate(${heures} 100 100)"/>
<line x1="100" y1="100" x2="100" y2="44" stroke="#dc2626" stroke-width="5" stroke-linecap="round" transform="rotate(${minutes} 100 100)"/>
<circle cx="100" cy="100" r="7" fill="#1e293b"/>
</svg>`;
}

export function qHeure(rng = Math.random) {
    const h = 1 + Math.floor(rng() * 12);
    const m = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], rng);
    return { cle: `h:${h}:${m}`, consigne: 'What time is it?', visuelSVG: horlogeSVG(h, m),
        choix: choixHeure(h, m, rng) };
}
