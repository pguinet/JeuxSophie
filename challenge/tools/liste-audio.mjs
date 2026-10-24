// Écrit « slug<TAB>mot » pour chaque mot de vocabulaire illustré.
import { VOCAB } from '../js/donnees/vocab.js';
import { slugAudio } from '../js/jeux.js';

for (const m of VOCAB.filter(x => x.image)) console.log(`${slugAudio(m.en)}\t${m.en}`);
