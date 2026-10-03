// Tests du petit assistant de l'atelier de création (shared/createur.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    comprendre, normaliser, nommer, TYPES, COULEURS, chargerCreations, enregistrerCreation,
    supprimerCreation, porter, couleurContraste,
} from '../createur.js';
import { RAYONS } from '../garderobe.js';

// Un faux localStorage
function memoire() {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

test('normaliser : minuscules, sans accents ni ponctuation', () => {
    assert.equal(normaliser('Une ROBE dorée, avec des Cœurs !'), ' une robe doree avec des coeurs ');
});

test('« une robe rose avec des étoiles jaunes »', () => {
    const { creation: c, compris } = comprendre('une robe rose avec des étoiles jaunes');
    assert.ok(compris);
    assert.equal(c.type, 'robe');
    assert.equal(c.couleur, COULEURS.rose);
    assert.equal(c.motif, 'etoiles');
    assert.equal(c.couleurMotif, COULEURS.jaune);
    assert.equal(c.nom, 'robe rose à étoiles');
});

test('féminins, pluriels et couleurs en deux mots', () => {
    assert.equal(comprendre('une chemise blanche').creation.couleur, COULEURS.blanc);
    assert.equal(comprendre('un jean bleu foncé').creation.couleur, COULEURS['bleu fonce']);
    assert.equal(comprendre('des leggings violets').creation.type, 'legging');
    assert.equal(comprendre('un t-shirt vert clair').creation.couleur, COULEURS['vert clair']);
});

test('les manches longues, les robes et jupes longues', () => {
    assert.equal(comprendre('un t-shirt noir à manches longues').creation.type, 'manches_longues');
    assert.equal(comprendre('une robe bleue longue').creation.type, 'robe_longue');
    assert.equal(comprendre('une longue jupe').creation.type, 'jupe_longue');
    assert.equal(comprendre('une robe de princesse').creation.type, 'robe_princesse');
});

test('on peut modifier petit à petit', () => {
    let c = comprendre('un pull rouge').creation;
    c = comprendre('en vert', c).creation;
    assert.equal(c.type, 'pull');
    assert.equal(c.couleur, COULEURS.vert);
    c = comprendre('avec des coeurs roses', c).creation;
    assert.equal(c.motif, 'coeurs');
    assert.equal(c.couleurMotif, COULEURS.rose);
    c = comprendre('plutôt une jupe', c).creation;
    assert.equal(c.type, 'jupe');
    assert.equal(c.couleur, COULEURS.vert, 'la couleur est gardée');
    c = comprendre('sans motif', c).creation;
    assert.equal(c.motif, null);
});

test('deux couleurs sans « avec » : la 2e va au motif', () => {
    const c = comprendre('un t-shirt bleu blanc à rayures').creation;
    assert.equal(c.motif, 'rayures');
    assert.equal(c.couleur, COULEURS.bleu);
    assert.equal(c.couleurMotif, COULEURS.blanc);
});

test('sans habit, l\'assistant demande gentiment', () => {
    const r = comprendre('bonjour !');
    assert.equal(r.compris, false);
    assert.match(r.reponse, /robe/);
});

test('un motif sans couleur prend une couleur qui se voit', () => {
    assert.equal(couleurContraste('#212529'), '#ffffff');
    assert.equal(couleurContraste('#ffd43b'), '#212529');
    assert.equal(comprendre('une robe noire avec des étoiles').creation.couleurMotif, '#ffffff');
});

test('chaque habit et chapeau de l\'assistant existe dans la garde-robe 3D', () => {
    const tous = new Set(['haut', 'bas', 'robe', 'chapeau'].flatMap((r) => RAYONS[r].items.map((i) => i.id)));
    for (const id of Object.keys(TYPES)) assert.ok(tous.has(id), id);
});

test('nommer accorde la couleur', () => {
    assert.equal(nommer({ type: 'robe', nomCouleur: 'blanc' }), 'robe blanche');
    assert.equal(nommer({ type: 'pull', nomCouleur: 'blanc', motif: 'pois' }), 'pull blanc à pois');
});

test('la collection : enregistrer, remplacer, supprimer', () => {
    const st = memoire();
    const c = enregistrerCreation(comprendre('une robe rose').creation, st);
    assert.ok(c.id);
    enregistrerCreation({ ...c, couleur: '#000000' }, st);
    assert.equal(chargerCreations(st).length, 1);
    assert.equal(chargerCreations(st)[0].couleur, '#000000');
    supprimerCreation(c.id, st);
    assert.equal(chargerCreations(st).length, 0);
});

test('porter : une robe enlève le bas, un bas enlève la robe', () => {
    const robe = comprendre('une robe').creation, jupe = comprendre('une jupe').creation, pull = comprendre('un pull').creation;
    let e = porter({}, pull);
    e = porter(e, jupe);
    assert.equal(e.porte.haut.type, 'pull');
    assert.equal(e.porte.bas.type, 'jupe');
    e = porter(e, robe);
    assert.equal(e.porte.bas, undefined);
    e = porter(e, jupe);
    assert.equal(e.porte.haut, undefined);
});

test('le personnage 3D porte une création (haut + bas, ou robe)', async () => {
    const THREE = await import('three');
    const { buildAvatar3D } = await import('../avatar3d.js');
    const { DEFAULT_AVATAR } = await import('../avatar.js');
    const couleur = (o) => '#' + o.material.color.getHexString();
    const pull = comprendre('un pull vert').creation, jupe = comprendre('une jupe rouge').creation;
    const a = buildAvatar3D({ ...DEFAULT_AVATAR, porte: { haut: pull, bas: jupe } });
    let torse = null;
    a.traverse((o) => { if (o.isMesh && o.position.y > 1.1 && o.position.y < 1.2 && o.parent === a && !torse) torse = o; });
    assert.equal(couleur(torse), COULEURS.vert);
    let rouge = 0;
    a.traverse((o) => { if (o.isMesh && o.material.color && couleur(o) === COULEURS.rouge) rouge++; });
    assert.ok(rouge >= 1, 'la jupe rouge est là');
    const robe = buildAvatar3D({ ...DEFAULT_AVATAR, porte: { haut: comprendre('une robe violette').creation } });
    assert.ok(new THREE.Box3().setFromObject(robe).max.y > 1.9);
});

test('les chapeaux : l\'assistant les reconnaît, et « une robe avec un nœud » reste une robe', () => {
    assert.equal(comprendre('une couronne dorée').creation.type, 'couronne');
    assert.equal(comprendre('un chapeau rose à pois').creation.type, 'paille');
    assert.equal(comprendre('un haut de forme noir').creation.type, 'chapeau');
    assert.equal(comprendre('des oreilles de chat blanches').creation.type, 'oreilles');
    assert.equal(comprendre('une casquette bleue à rayures').creation.motif, 'rayures');
    assert.equal(comprendre('une robe avec un noeud').creation.type, 'robe');
    assert.equal(comprendre('une jupe à fleurs').creation.type, 'jupe');
});

test('porter un chapeau ne touche pas aux habits', () => {
    const robe = comprendre('une robe').creation, bonnet = comprendre('un bonnet').creation;
    const e = porter(porter({}, robe), bonnet);
    assert.equal(e.porte.haut.type, 'robe');
    assert.equal(e.porte.chapeau.type, 'bonnet');
});
