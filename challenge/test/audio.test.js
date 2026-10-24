import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choisirSource, estMuet, prononcer, setMuet } from '../js/audio.js';

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

// Stubs des API navigateur ; les globales sont restaurées après chaque test.
async function avecStubs({ comportement, voix = false }, fn) {
    const sauve = ['Audio', 'speechSynthesis', 'SpeechSynthesisUtterance']
        .map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]);
    const dites = [];
    globalThis.Audio = class {
        constructor(src) { this.src = src; this.ecouteurs = {}; this.pause = () => { this.pause.appele = true; }; }
        addEventListener(nom, f) { this.ecouteurs[nom] = f; }
        play() {
            if (comportement === 'playing') this.ecouteurs.playing();
            if (comportement === 'error') this.ecouteurs.error();
            if (comportement === 'rejet') return Promise.reject(new Error('NotAllowedError'));
            return Promise.resolve();
        }
    };
    globalThis.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
    globalThis.speechSynthesis = {
        getVoices: () => (voix ? [{ lang: 'en-GB' }] : []),
        cancel() {},
        speak(u) { dites.push(u.text); },
    };
    try {
        await fn(dites);
    } finally {
        setMuet(false);
        for (const [k, d] of sauve) {
            if (d) Object.defineProperty(globalThis, k, d); else delete globalThis[k];
        }
    }
}

test('prononcer : lecture réussie -> fichier', async () => {
    await avecStubs({ comportement: 'playing' }, async () => {
        assert.equal(await prononcer('dog', 'dog', 50), 'fichier');
    });
});

test('prononcer : fichier en erreur -> texte sans voix, voix avec voix', async () => {
    await avecStubs({ comportement: 'error' }, async () => {
        assert.equal(await prononcer('dog', 'dog', 50), 'texte');
    });
    await avecStubs({ comportement: 'error', voix: true }, async dites => {
        assert.equal(await prononcer('dog', 'dog', 50), 'voix');
        assert.deepEqual(dites, ['dog']);
    });
});

test('prononcer : play() rejeté (autoplay) -> repli', async () => {
    await avecStubs({ comportement: 'rejet' }, async () => {
        assert.equal(await prononcer('dog', 'dog', 50), 'texte');
    });
    await avecStubs({ comportement: 'rejet', voix: true }, async () => {
        assert.equal(await prononcer('dog', 'dog', 50), 'voix');
    });
});

test('prononcer : aucun événement -> repli après le délai', async () => {
    await avecStubs({ comportement: 'rien' }, async () => {
        assert.equal(await prononcer('dog', 'dog', 30), 'texte');
    });
});

test('prononcer : sourdine -> muet', async () => {
    await avecStubs({ comportement: 'playing' }, async () => {
        setMuet(true);
        assert.equal(await prononcer('dog', 'dog', 50), 'muet');
    });
});

test('prononcer : un appel remplacé est annulé sans repli tardif', async () => {
    await avecStubs({ comportement: 'rien', voix: true }, async dites => {
        const pendants = [];
        const AudioBase = globalThis.Audio;
        globalThis.Audio = class extends AudioBase {
            constructor(src) {
                super(src);
                this.pause = () => pendants.shift()?.(); // pause() fait rejeter le play() en attente
            }
            play() {
                return new Promise((_, rejeter) => pendants.push(() => rejeter(new Error('AbortError'))));
            }
        };
        const premier = prononcer('ancien', 'ancien', 40);
        const second = prononcer('nouveau', 'nouveau', 40);
        assert.equal(await premier, 'muet');
        assert.equal(await second, 'voix');
        await new Promise(r => setTimeout(r, 120));
        assert.deepEqual(dites, ['nouveau']);
    });
});
