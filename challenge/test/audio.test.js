import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choisirSource, estMuet, setMuet } from '../js/audio.js';

test('choix de la source de prononciation', () => {
    assert.equal(choisirSource({ fichierOk: true, voixAnglaise: false }), 'fichier');
    assert.equal(choisirSource({ fichierOk: false, voixAnglaise: true }), 'voix');
    assert.equal(choisirSource({ fichierOk: false, voixAnglaise: false }), 'texte');
});

test('sourdine sans contexte audio (Node)', () => {
    setMuet(true);
    assert.equal(estMuet(), true);
    setMuet(false);
    assert.equal(estMuet(), false);
});

test('un fichier audio exactement par mot illustré', async () => {
    const { readdirSync } = await import('node:fs');
    const { VOCAB } = await import('../js/donnees/vocab.js');
    const { slugAudio } = await import('../js/jeux.js');
    const attendus = VOCAB.filter(m => m.image).map(m => `${slugAudio(m.en)}.ogg`).sort();
    const presents = readdirSync(new URL('../audio/', import.meta.url)).sort();
    assert.deepEqual(presents, attendus);
});
