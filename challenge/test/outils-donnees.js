// Outils partagés pour les tests de banques de données (QCM, niveaux de difficulté).
// Ce fichier n'appelle pas test() : il est seulement importé par les fichiers *.test.js.
import assert from 'node:assert/strict';

export function verifierQcm(items, min, nbThemes, themesPermis) {
    assert.ok(items.length >= min, `au moins ${min} questions (${items.length})`);
    for (const q of items) {
        assert.ok(q.question && q.bonne && q.theme, JSON.stringify(q));
        if (themesPermis) assert.ok(themesPermis.includes(q.theme), `thème inconnu : ${q.theme}`);
        assert.equal(q.leurres.length, 3, q.question);
        const toutes = [q.bonne, ...q.leurres].map(s => s.toLowerCase());
        assert.equal(new Set(toutes).size, 4, `réponses distinctes : ${q.question}`);
    }
    assert.ok(new Set(items.map(q => q.theme)).size >= nbThemes);
}

export function verifierNiveaux(items, nom, partNiveau3 = 0.35) {
    for (const q of items) {
        assert.ok([1, 2, 3].includes(q.niveau), `${nom} : niveau invalide (${q.niveau}) : ${q.question ?? q.en ?? q.a}`);
    }
    const nbNiveau3 = items.filter(q => q.niveau === 3).length;
    assert.ok(
        nbNiveau3 / items.length >= partNiveau3,
        `${nom} : part de niveau 3 trop faible (${nbNiveau3}/${items.length})`,
    );
}
