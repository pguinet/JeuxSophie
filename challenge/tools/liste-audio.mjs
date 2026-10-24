// Écrit « slug<TAB>texte » pour chaque mot illustré et chaque phrase (slug phrases/...).
import { VOCAB } from '../js/donnees/vocab.js';
import { PHRASES } from '../js/donnees/phrases.js';
import { slugAudio } from '../js/jeux.js';

for (const m of VOCAB.filter(x => x.image)) console.log(`${slugAudio(m.en)}\t${m.en}`);

const vues = new Set();
for (const p of PHRASES) {
    const slug = `phrases/${slugAudio(p.en)}`;
    if (vues.has(slug)) continue;
    vues.add(slug);
    console.log(`${slug}\t${p.en}`);
}
