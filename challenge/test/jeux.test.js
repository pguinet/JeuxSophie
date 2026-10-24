// challenge/test/jeux.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JEUX, genererPartie, slugAudio } from '../js/jeux.js';
import { VOCAB } from '../js/donnees/vocab.js';
import { mulberry32 } from '../js/rng.js';

const ATTENDU = { quiz: 15, image: 10, ecoute: 10, phrases: 8, course: 60, culture: 10 };

test('les 6 jeux', () => {
    assert.deepEqual(JEUX.map(j => j.id).sort(), Object.keys(ATTENDU).sort());
    for (const j of JEUX) assert.ok(j.nom && j.emoji && j.couleur && ['qcm', 'phrases'].includes(j.type));
});

test('QCM : bon nombre, 4 choix distincts, une seule bonne réponse', () => {
    for (const j of JEUX.filter(x => x.type === 'qcm')) {
        for (let g = 1; g <= 50; g++) {
            const qs = genererPartie(j.id, mulberry32(g));
            assert.equal(qs.length, ATTENDU[j.id], j.id);
            for (const q of qs) {
                assert.ok(q.consigne);
                assert.equal(q.choix.length, 4);
                assert.equal(new Set(q.choix.map(c => c.texte)).size, 4, JSON.stringify(q));
                assert.equal(q.choix.filter(c => c.juste).length, 1);
            }
        }
    }
});

test('pas de doublon dans une partie (hors course)', () => {
    for (const id of ['quiz', 'image', 'ecoute', 'culture']) {
        for (let g = 1; g <= 50; g++) {
            const qs = genererPartie(id, mulberry32(g));
            const cles = qs.map(q => q.cle);
            assert.equal(new Set(cles).size, cles.length, id);
        }
    }
});

test('image et mot : emoji du mot juste, leurres du même thème', () => {
    const qs = genererPartie('image', mulberry32(9));
    for (const q of qs) {
        const juste = VOCAB.find(m => m.en === q.choix.find(c => c.juste).texte);
        assert.equal(q.visuel, juste.emoji);
        assert.ok(juste.image);
        for (const c of q.choix) assert.equal(VOCAB.find(m => m.en === c.texte).theme, juste.theme);
    }
});

test('j\'écoute : audio = mot juste, choix = emojis', () => {
    const qs = genererPartie('ecoute', mulberry32(4));
    for (const q of qs) {
        const juste = VOCAB.find(m => m.en === q.audio);
        assert.equal(q.choix.find(c => c.juste).texte, juste.emoji);
    }
});

test('phrases : 8 phrases mélangées', () => {
    for (let g = 1; g <= 50; g++) {
        const ps = genererPartie('phrases', mulberry32(g));
        assert.equal(ps.length, 8);
        for (const p of ps) {
            assert.deepEqual([...p.melange].sort(), [...p.mots].sort());
            assert.notDeepEqual(p.melange, p.mots);
        }
    }
});

test('slugAudio', () => {
    assert.equal(slugAudio('ice cream'), 'ice-cream');
    assert.equal(slugAudio('T-shirt'), 't-shirt');
    assert.equal(slugAudio("Mum's"), 'mum-s');
});
