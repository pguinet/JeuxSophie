// challenge/test/jeux.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JEUX, THEMES_INTRUS, genererPartie, slugAudio } from '../js/jeux.js';
import { VOCAB, THEMES_VOCAB } from '../js/donnees/vocab.js';
import { CONTRAIRES } from '../js/donnees/contraires.js';
import { VRAIFAUX } from '../js/donnees/vraifaux.js';
import { mulberry32 } from '../js/rng.js';

const ATTENDU = { quiz: 15, image: 10, ecoute: 10, phrases: 8, course: 60, culture: 10, relier: 3,
    vraifaux: 15, intrus: 10, contraires: 12, heure: 10, pendu: 5, lettres: 8, ecoutephrases: 10, concours: 45 };
const FAMILLES = { mots: ['image', 'relier', 'intrus', 'contraires', 'pendu', 'lettres'],
    grammaire: ['phrases', 'vraifaux', 'heure'], ecoute: ['ecoute', 'ecoutephrases'],
    defis: ['quiz', 'course', 'culture', 'survie', 'concours'] };
const TYPES = { qcm: ['quiz', 'image', 'ecoute', 'course', 'culture', 'vraifaux', 'intrus', 'contraires', 'heure',
    'ecoutephrases', 'survie', 'concours'], phrases: ['phrases'], relier: ['relier'], pendu: ['pendu'],
lettres: ['lettres'] };
const norm = t => String(t).trim().toLowerCase();
// Les parties à graine sont coûteuses (leurres proches) : on les garde pour les tests sur 200 graines.
const cache = new Map();
const partie = (id, g) => {
    const k = `${id}:${g}`;
    if (!cache.has(k)) cache.set(k, genererPartie(id, mulberry32(g)));
    return cache.get(k);
};

test('16 jeux et leurs familles', () => {
    assert.equal(JEUX.length, 16);
    assert.equal(new Set(JEUX.map(j => j.id)).size, 16);
    for (const [f, ids] of Object.entries(FAMILLES)) {
        assert.deepEqual(JEUX.filter(j => j.famille === f).map(j => j.id).sort(), [...ids].sort());
    }
    for (const [t, ids] of Object.entries(TYPES)) {
        assert.deepEqual(JEUX.filter(j => j.type === t).map(j => j.id).sort(), [...ids].sort());
    }
    for (const j of JEUX) assert.ok(j.nom && j.emoji && j.couleur && j.aide, j.id);
    assert.equal(JEUX.find(j => j.id === 'survie').vies, 3);
});

test('tailles des parties', () => {
    for (const [id, n] of Object.entries(ATTENDU)) assert.equal(genererPartie(id, mulberry32(1)).length, n, id);
    assert.ok(genererPartie('survie', mulberry32(1)).length >= 150);
});

test('tous les QCM : choix distincts, une bonne réponse (200 graines)', () => {
    for (const j of JEUX.filter(x => x.type === 'qcm')) {
        for (let g = 1; g <= 200; g++) {
            for (const q of partie(j.id, g)) {
                assert.ok(q.consigne);
                assert.ok([1, 2, 3].includes(q.niveau), `${j.id} ${q.cle} niveau`);
                assert.ok(q.choix.length >= 2);
                assert.equal(new Set(q.choix.map(c => c.texte)).size, q.choix.length, `${j.id} ${q.cle}`);
                assert.equal(q.choix.filter(c => c.juste).length, 1, `${j.id} ${q.cle}`);
            }
        }
    }
});

test('QCM hors vrai/faux : 4 choix', () => {
    for (const j of JEUX.filter(x => x.type === 'qcm' && x.id !== 'vraifaux')) {
        for (const q of genererPartie(j.id, mulberry32(5))) {
            if (q.cle.startsWith('vf:')) continue;
            assert.equal(q.choix.length, 4, `${j.id} ${q.cle}`);
        }
    }
});

test('pas de doublon dans une partie (hors course)', () => {
    for (const id of ['quiz', 'image', 'ecoute', 'culture', 'vraifaux', 'intrus', 'contraires', 'heure',
        'ecoutephrases', 'concours']) {
        for (let g = 1; g <= 50; g++) {
            const cles = genererPartie(id, mulberry32(g)).map(q => q.cle);
            assert.equal(new Set(cles).size, cles.length, id);
        }
    }
});

// Données réelles : un leurre de vocabulaire ne doit jamais être une autre bonne réponse.
test('vocabulaire : aucun leurre n\'a le même anglais, français ou emoji que la bonne réponse (200 graines)', () => {
    const IMAGES = VOCAB.filter(m => m.image && m.emoji);
    for (const id of ['quiz', 'image', 'ecoute', 'course', 'survie', 'concours']) {
        for (let g = 1; g <= 200; g++) {
            for (const q of partie(id, g).filter(x => x.cle.startsWith('v:'))) {
                const parEmoji = Boolean(q.audio);
                const trouve = t => (parEmoji ? IMAGES.find(m => m.emoji === t) : VOCAB.find(m => m.en === t));
                const juste = trouve(q.choix.find(c => c.juste).texte);
                assert.ok(juste, `${id} ${q.cle}`);
                for (const c of q.choix.filter(x => !x.juste)) {
                    const m = trouve(c.texte);
                    assert.ok(m, `${id} ${c.texte}`);
                    assert.notEqual(norm(m.en), norm(juste.en), `${id} ${q.cle}`);
                    assert.notEqual(norm(m.fr), norm(juste.fr), `${id} ${q.cle} ${m.en}`);
                    if (m.emoji) assert.notEqual(m.emoji, juste.emoji, `${id} ${q.cle} ${m.en}`);
                }
            }
        }
    }
});

test('quiz : 5 vocabulaire, 4 grammaire, 2 pièges, 4 culture', () => {
    for (let g = 1; g <= 20; g++) {
        const qs = genererPartie('quiz', mulberry32(g));
        const n = p => qs.filter(q => q.cle.startsWith(p)).length;
        assert.deepEqual([n('v:'), n('g:'), n('pg:'), n('c:')], [5, 4, 2, 4]);
    }
});

test('course : vocabulaire et grammaire (pièges compris) en alternance', () => {
    let pieges = 0;
    for (let g = 1; g <= 20; g++) {
        const qs = genererPartie('course', mulberry32(g));
        qs.forEach((q, i) => assert.ok(i % 2 === 0 ? q.cle.startsWith('v:') : /^p?g:/.test(q.cle)));
        pieges += qs.filter(q => q.cle.startsWith('pg:')).length;
    }
    assert.ok(pieges > 0);
});

test('image et mot : emoji du mot juste, mots avec image', () => {
    for (let g = 1; g <= 20; g++) {
        for (const q of genererPartie('image', mulberry32(g))) {
            const juste = VOCAB.find(m => m.en === q.choix.find(c => c.juste).texte);
            assert.equal(q.visuel, juste.emoji);
            assert.ok(juste.image && juste.emoji);
            for (const c of q.choix) assert.ok(VOCAB.find(m => m.en === c.texte).image);
        }
    }
});

test('j\'écoute : audio = mot juste, choix = emojis', () => {
    for (let g = 1; g <= 20; g++) {
        for (const q of genererPartie('ecoute', mulberry32(g))) {
            const juste = VOCAB.find(m => m.en === q.audio);
            assert.ok(juste.image);
            assert.equal(q.choix.find(c => c.juste).texte, juste.emoji);
            assert.ok(q.choix.every(c => c.texte));
        }
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

test('grammaire et pièges : trou affiché ___ ou consigne « Choisis »', () => {
    let trous = 0, sansTrou = 0;
    for (let g = 1; g <= 30; g++) {
        for (const q of genererPartie('concours', mulberry32(g)).filter(x => /^p?g:/.test(x.cle))) {
            if (q.cle.includes('_')) {
                trous++;
                assert.equal(q.sousConsigne, 'Complète la phrase :');
                assert.ok(q.consigne.includes('___') && !/(^|[^_])_([^_]|$)/.test(q.consigne));
            } else {
                sansTrou++;
                assert.equal(q.sousConsigne, 'Choisis la bonne réponse :');
                assert.ok(q.cle.startsWith('pg:'));
            }
        }
    }
    assert.ok(trous > 0 && sansTrou > 0);
    assert.ok(genererPartie('culture', mulberry32(3)).every(q => q.sousConsigne === undefined));
});

test('vrai ou faux : Vrai puis Faux, explication', () => {
    for (const q of genererPartie('vraifaux', mulberry32(2))) {
        const v = VRAIFAUX.find(x => x.en === q.consigne);
        assert.deepEqual(q.choix.map(c => c.texte), ['✅ Vrai', '❌ Faux']);
        assert.equal(q.choix[0].juste, v.vrai);
        assert.equal(q.explication, v.explication);
        assert.equal(q.sousConsigne, 'Vrai ou faux ?');
        assert.equal(q.cle, `vf:${v.en}`);
    }
});

test('intrus : pas de mot polyvalent, un intrus d\'un autre thème', () => {
    assert.ok(THEMES_INTRUS.every(t => THEMES_VOCAB.includes(t)));
    for (let g = 1; g <= 200; g++) {
        for (const q of genererPartie('intrus', mulberry32(g))) {
            const mots = q.choix.map(c => VOCAB.find(m => m.en === c.texte));
            assert.ok(mots.every(m => m && !m.polyvalent));
            const intrus = mots[q.choix.findIndex(c => c.juste)];
            const autres = mots.filter(m => m !== intrus);
            assert.ok(autres.every(m => m.theme === autres[0].theme) && intrus.theme !== autres[0].theme);
            assert.ok(THEMES_INTRUS.includes(intrus.theme) && THEMES_INTRUS.includes(autres[0].theme));
            assert.equal(new Set(mots.map(m => m.fr)).size, 4);
        }
    }
});

test('contraires : l\'autre mot de la paire, leurres d\'autres paires', () => {
    for (let g = 1; g <= 200; g++) {
        for (const q of genererPartie('contraires', mulberry32(g))) {
            const mot = q.consigne.match(/^Quel est le contraire de « (.+) » \?$/)[1];
            const p = CONTRAIRES.find(x => x.a === mot || x.b === mot);
            assert.equal(q.choix.find(c => c.juste).texte, mot === p.a ? p.b : p.a);
            assert.equal(q.niveau, p.niveau);
            for (const c of q.choix.filter(x => !x.juste)) {
                assert.ok(![p.a, p.b].includes(c.texte));
                assert.ok(CONTRAIRES.some(x => x !== p && (x.a === c.texte || x.b === c.texte)));
            }
        }
    }
});

test('heure : 10 heures distinctes avec horloge', () => {
    for (let g = 1; g <= 50; g++) {
        const qs = genererPartie('heure', mulberry32(g));
        assert.equal(new Set(qs.map(q => q.cle)).size, 10);
        assert.ok(qs.every(q => q.visuelSVG.startsWith('<svg') && q.niveau === 2));
    }
});

test('relier : 3 manches de 5, mots et traductions uniques', () => {
    for (let g = 1; g <= 100; g++) {
        const ms = genererPartie('relier', mulberry32(g));
        const en = ms.flatMap(m => m.paires.map(p => p.en.toLowerCase()));
        const fr = ms.flatMap(m => m.paires.map(p => p.fr.toLowerCase()));
        assert.equal(new Set(en).size, 15);
        assert.equal(new Set(fr).size, 15);
        for (const m of ms) {
            assert.equal(m.paires.length, 5);
            assert.deepEqual([...m.gauche].sort(), m.paires.map(p => p.en).sort());
            assert.deepEqual([...m.droite].sort(), m.paires.map(p => p.fr).sort());
            for (const p of m.paires) assert.equal(VOCAB.find(x => x.en === p.en).fr, p.fr);
        }
    }
});

test('pendu et lettres : mots jouables', () => {
    for (let g = 1; g <= 100; g++) {
        for (const m of genererPartie('pendu', mulberry32(g))) {
            assert.match(m.en, /^[A-Za-z][A-Za-z -]{2,10}[A-Za-z]$/);
            assert.ok(m.fr);
            const v = VOCAB.find(x => x.en === m.en);
            assert.ok(v.niveau >= 2);
            if (v.image) assert.equal(m.emoji, v.emoji);
            else assert.equal(m.emoji, undefined);
        }
        for (const m of genererPartie('lettres', mulberry32(g))) {
            assert.match(m.en, /^[a-z]{4,11}$/i);
            assert.ok(VOCAB.find(x => x.en === m.en).niveau >= 2);
            assert.deepEqual([...m.melange].sort(), [...m.en.toLowerCase()].sort());
            assert.notEqual(m.melange.join(''), m.en.toLowerCase());
        }
    }
});

test('survie : niveaux croissants, pas de doublon', () => {
    for (let g = 1; g <= 30; g++) {
        const qs = genererPartie('survie', mulberry32(g));
        assert.equal(new Set(qs.slice(0, 150).map(q => q.cle)).size, 150);
        assert.ok(qs.slice(0, 10).every(q => q.niveau === 1));
        assert.ok(qs.slice(10, 25).every(q => q.niveau === 2));
        assert.ok(qs.slice(25, 150).every(q => q.niveau === 3));
    }
});

test('survie : types mélangés', () => {
    const qs = genererPartie('survie', mulberry32(7));
    const prefixes = new Set(qs.map(q => q.cle.split(':')[0]));
    for (const p of ['v', 'g', 'pg', 'c', 'ct', 'h', 'vf']) assert.ok(prefixes.has(p), p);
});

test('concours : répartition et clés uniques', () => {
    for (let g = 1; g <= 50; g++) {
        const qs = genererPartie('concours', mulberry32(g));
        const n = p => qs.filter(q => q.cle.startsWith(`${p}:`)).length;
        assert.deepEqual(['v', 'g', 'pg', 'c', 'h', 'ct', 'vf'].map(n), [12, 10, 6, 7, 4, 3, 3]);
        assert.equal(new Set(qs.map(q => q.cle)).size, 45);
    }
});

test('écoute de phrases : slug et traductions', () => {
    for (let g = 1; g <= 50; g++) {
        for (const q of genererPartie('ecoutephrases', mulberry32(g))) {
            assert.equal(q.slug, `phrases/${slugAudio(q.audio)}`);
            assert.equal(q.cle, `ep:${q.audio}`);
            assert.equal(new Set(q.choix.map(c => c.texte.toLowerCase())).size, 4);
        }
    }
});
