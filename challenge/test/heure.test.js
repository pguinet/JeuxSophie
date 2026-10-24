import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heureEnAnglais, qHeure, choixHeure, horlogeSVG, anglesAiguilles } from '../js/heure.js';
import { mulberry32 } from '../js/rng.js';

test('expressions britanniques', () => {
    assert.equal(heureEnAnglais(3, 0), "It's three o'clock.");
    assert.equal(heureEnAnglais(7, 15), "It's quarter past seven.");
    assert.equal(heureEnAnglais(6, 30), "It's half past six.");
    assert.equal(heureEnAnglais(7, 40), "It's twenty to eight.");
    assert.equal(heureEnAnglais(12, 45), "It's quarter to one.");
    assert.equal(heureEnAnglais(11, 55), "It's five to twelve.");
    assert.equal(heureEnAnglais(9, 25), "It's twenty-five past nine.");
    assert.equal(heureEnAnglais(4, 35), "It's twenty-five to five.");
    assert.equal(heureEnAnglais(1, 5), "It's five past one.");
});

test('144 heures, 144 phrases différentes', () => {
    const s = new Set();
    for (let h = 1; h <= 12; h++) for (let m = 0; m < 60; m += 5) s.add(heureEnAnglais(h, m));
    assert.equal(s.size, 144);
});

test('qHeure : 4 choix distincts, un seul juste', () => {
    for (let g = 1; g <= 300; g++) {
        const q = qHeure(mulberry32(g));
        const [, h, m] = q.cle.split(':').map(Number);
        assert.equal(q.consigne, 'What time is it?');
        assert.ok(q.visuelSVG.startsWith('<svg'));
        assert.equal(q.choix.length, 4);
        assert.equal(new Set(q.choix.map(c => c.texte)).size, 4);
        assert.equal(q.choix.filter(c => c.juste).length, 1);
        assert.equal(q.choix.find(c => c.juste).texte, heureEnAnglais(h, m));
    }
});

// Lit l'angle des deux aiguilles dans le SVG : l'heure (noire, épaisse) et les minutes (rouges).
function anglesDansSVG(svg) {
    const heure = svg.match(/<line[^>]*stroke="#1e293b" stroke-width="8"[^>]*transform="rotate\(([\d.]+) 100 100\)"/);
    const minute = svg.match(/<line[^>]*stroke="#dc2626"[^>]*transform="rotate\(([\d.]+) 100 100\)"/);
    return { heures: Number(heure[1]), minutes: Number(minute[1]) };
}

test('angles des aiguilles', () => {
    assert.deepEqual(anglesAiguilles(3, 0), { heures: 90, minutes: 0 });
    assert.deepEqual(anglesAiguilles(6, 30), { heures: 195, minutes: 180 });
    assert.deepEqual(anglesAiguilles(12, 45), { heures: 22.5, minutes: 270 });
});

test('les aiguilles dessinées dans le SVG ont les bons angles', () => {
    assert.deepEqual(anglesDansSVG(horlogeSVG(3, 0)), { heures: 90, minutes: 0 });
    assert.deepEqual(anglesDansSVG(horlogeSVG(6, 30)), { heures: 195, minutes: 180 });
    assert.deepEqual(anglesDansSVG(horlogeSVG(12, 45)), { heures: 22.5, minutes: 270 });
});

const MOTS_H = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve'];
const MOTS_MIN = { 5: 'five', 10: 'ten', 15: 'quarter', 20: 'twenty', 25: 'twenty-five', 30: 'half' };

test('choixHeure : 144 heures, 4 choix distincts, un seul juste, piège past/to inversé', () => {
    for (let h = 1; h <= 12; h++) {
        for (let m = 0; m < 60; m += 5) {
            const choix = choixHeure(h, m, mulberry32(h * 100 + m));
            const textes = choix.map(c => c.texte);
            assert.equal(choix.length, 4, `${h}:${m}`);
            assert.equal(new Set(textes).size, 4, `${h}:${m} doublons`);
            assert.equal(choix.filter(c => c.juste).length, 1, `${h}:${m} un seul juste`);
            assert.equal(choix.find(c => c.juste).texte, heureEnAnglais(h, m));
            if (m !== 0 && m !== 30) {
                // Leurre attendu : même minutes, past et to inversés.
                const inverse = m < 30
                    ? `It's ${MOTS_MIN[m]} to ${MOTS_H[h]}.`
                    : `It's ${MOTS_MIN[60 - m]} past ${MOTS_H[h]}.`;
                assert.ok(textes.includes(inverse), `${h}:${m} leurre past/to inversé absent`);
            }
        }
    }
});
