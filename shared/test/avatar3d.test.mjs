// Tests du personnage 3D (shared/avatar3d.js, corps3d.js, garderobe3d.js).
// Lancer : node --import ./shared/test/register.mjs --test shared/test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildAvatar3D, animerMarche, animerVie } from '../avatar3d.js';
import { D, BLOCS, TETE_ANCIENNE, boiteRonde, distanceCube, projeterSurCube } from '../corps3d.js';
import { geoJupe } from '../garderobe3d.js';
import { construireCheveux, NB_COUCHES } from '../cheveux3d.js';
import { DEFAULT_AVATAR, HAIR_BY_GENDER, OUTFIT_BY_GENDER, lookDepuisTenueSimple } from '../avatar.js';
import { RAYONS } from '../garderobe.js';

const boite = (o) => { o.updateMatrixWorld(true); return new THREE.Box3().setFromObject(o); };

test('boîte arrondie : dimensions exactes et mise en cache', () => {
    const g = boiteRonde(0.5, 0.3, 0.2, 0.05);
    g.computeBoundingBox();
    const t = new THREE.Vector3();
    g.boundingBox.getSize(t);
    assert.ok(Math.abs(t.x - 0.5) < 1e-6 && Math.abs(t.y - 0.3) < 1e-6 && Math.abs(t.z - 0.2) < 1e-6);
    assert.equal(boiteRonde(0.5, 0.3, 0.2, 0.05), g, 'même géométrie réutilisée');
});

test('corps en cubes : les jambes touchent le sol, les bras sont collés au torse', () => {
    const [, h] = BLOCS.jambe.taille;
    assert.ok(Math.abs(D.HANCHE_Y + BLOCS.jambe.centre[1] - h / 2) < 1e-9, 'bas des jambes à y = 0');
    const [bw] = BLOCS.bras.taille;
    assert.ok(Math.abs(D.EPAULE_X - bw / 2 - D.TORSE.w / 2) < 1e-9, 'bras contre le torse');
});

test('la tête cubique : la projection plaque la sphère sur le cube', () => {
    const a = TETE_ANCIENNE.CUBE;
    assert.ok(Math.abs(distanceCube(new THREE.Vector3(0, 0, 1)) - a) < 1e-9, 'face avant');
    assert.ok(distanceCube(new THREE.Vector3(1, 1, 1).normalize()) > a * 1.5, 'coins');
    // un point posé sur l'ancienne sphère, devant, arrive sur la face du cube
    const tete = new THREE.Group();
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.01), new THREE.MeshBasicMaterial());
    o.position.set(0, TETE_ANCIENNE.Y, TETE_ANCIENNE.R);
    tete.add(o);
    projeterSurCube(tete, [o]);
    o.geometry.computeBoundingBox();
    const c = new THREE.Vector3();
    o.geometry.boundingBox.getCenter(c);
    assert.ok(Math.abs(c.z - a) < 0.012, `z = ${c.z}`);
    assert.equal(o.parent, tete);
});

test('la jupe part de la taille (forme du bassin) et s\'évase jusqu\'à l\'ourlet', () => {
    const g = geoJupe(0.5, 0.88, 0.5, 0.36);
    g.computeBoundingBox();
    const b = g.boundingBox;
    assert.ok(Math.abs(b.max.y - 0.88) < 1e-6 && Math.abs(b.min.y - 0.5) < 1e-6);
    assert.ok(b.max.x > 0.3, 'ourlet plus large que la taille');
});

test('les cheveux : une surface lisse, + des couches de brins pour les frisés', () => {
    for (const style of ['longs', 'ondules', 'carre', 'courts', 'couettes', 'queue', 'tresses', 'boucles', 'chignon', 'macarons', 'crete']) {
        const g = new THREE.Group();
        const c = construireCheveux(g, style, '#5b3a1a');
        const meshes = c.children.filter((o) => o.isMesh && o.geometry === c.children[0].geometry);
        // les cheveux lisses n'ont qu'une surface ; frisés, ondulés et crête ont leurs couches de brins
        const attendu = ['ondules', 'boucles', 'crete'].includes(style) ? NB_COUCHES + 1 : 1;
        assert.equal(meshes.length, attendu, `${style} : ${attendu} surface(s)`);
        const pos = c.children[0].geometry.attributes.position;
        assert.ok(pos.count > 500, `${style} : ${pos.count} points`);
        for (let i = 0; i < pos.count; i++) assert.ok(Number.isFinite(pos.getY(i)), `${style} : point invalide`);
    }
    assert.equal(construireCheveux(new THREE.Group(), 'aucun', '#000'), null);
});

test('proportions Roblox classiques : pieds au sol, environ 2 m, tête ≈ 1/4 de la hauteur', () => {
    const a = buildAvatar3D({ ...DEFAULT_AVATAR, hairStyle: 'aucun' });
    const b = boite(a);
    assert.ok(Math.abs(b.min.y) < 0.01, `pieds au sol (min y = ${b.min.y})`);
    assert.ok(b.max.y > 1.9 && b.max.y < 2.1, `hauteur ${b.max.y}`);
    const ratio = D.TETE_COTE / b.max.y;
    assert.ok(ratio > 0.2 && ratio < 0.3, `tête = ${ratio.toFixed(2)} de la hauteur`);
});

test('la tenue simple se traduit en habits qui existent dans la garde-robe', () => {
    const ids = (rayon) => new Set(RAYONS[rayon].items.map((i) => i.id));
    const hauts = ids('haut'), bas = ids('bas'), robes = ids('robe'), chaussures = ids('chaussures');
    const toutes = new Set([...OUTFIT_BY_GENDER.fille, ...OUTFIT_BY_GENDER.garcon]);
    for (const outfit of toutes) {
        const l = lookDepuisTenueSimple({ ...DEFAULT_AVATAR, outfit });
        assert.ok(hauts.has(l.top), `${outfit} → haut ${l.top}`);
        assert.ok(bas.has(l.bottom), `${outfit} → bas ${l.bottom}`);
        assert.ok(robes.has(l.robe), `${outfit} → robe ${l.robe}`);
        assert.ok(chaussures.has(l.shoes), `${outfit} → chaussures ${l.shoes}`);
        assert.ok(l.robe !== 'aucune' || l.top !== 'aucun', `${outfit} : jamais tout nu`);
    }
});

test('chaque coiffure et chaque tenue simple se construisent', () => {
    for (const gender of ['fille', 'garcon']) {
        for (const hairStyle of HAIR_BY_GENDER[gender]) {
            for (const outfit of OUTFIT_BY_GENDER[gender]) {
                const a = buildAvatar3D({ ...DEFAULT_AVATAR, gender, hairStyle, outfit, hat: 'couronne', glasses: 'coeur', accessoire: 'ailes' });
                assert.ok(a.children.length > 5);
            }
        }
    }
});

test('chaque habit de la grande garde-robe se construit', () => {
    const champs = ['coiffure', 'haut', 'bas', 'robe', 'chaussures', 'chapeau', 'lunettes', 'accessoire'];
    for (const rayon of champs) {
        const r = RAYONS[rayon];
        for (const item of r.items) {
            const look = { top: 'tshirt', bottom: 'jean', robe: 'aucune', shoes: 'baskets', [r.champ]: item.id, [r.champCouleur || 'x']: '#4dabf7' };
            const a = buildAvatar3D({ ...DEFAULT_AVATAR, [r.champ]: item.id, look });
            const b = boite(a);
            assert.ok(Number.isFinite(b.max.y) && b.max.y < 2.6, `${rayon}/${item.id} : hauteur ${b.max.y}`);
            assert.ok(b.min.y > -0.02, `${rayon}/${item.id} : rien sous le sol (${b.min.y})`);
        }
    }
});

test('les pantalons et les manches suivent les membres', () => {
    const a = buildAvatar3D({ ...DEFAULT_AVATAR, look: { top: 'pull', topColor: '#fff', bottom: 'jean', bottomColor: '#00f', robe: 'aucune', shoes: 'bottes', shoesColor: '#000' } });
    const p = a.userData.parts;
    const couleur = (o) => '#' + o.material.color.getHexString();
    const bloc = (groupe) => groupe.children.find((o) => o.isMesh);
    assert.equal(couleur(bloc(p.leftLeg)), '#0000ff', 'la cuisse est peinte en jean');
    assert.equal(couleur(bloc(p.rightArm)), '#ffffff', 'le bras est peint comme le pull');
    assert.ok(p.leftLeg.children.filter((o) => o.isMesh).length >= 3, 'jambe : bloc + botte + semelle');
});

test('animerMarche balance bras et jambes en opposition ; force 0 = repos', () => {
    const a = buildAvatar3D(DEFAULT_AVATAR);
    const p = a.userData.parts;
    animerMarche(a, 1.0, 1);
    assert.ok(p.leftLeg.rotation.x !== 0 && Math.sign(p.leftLeg.rotation.x) === -Math.sign(p.rightLeg.rotation.x));
    assert.equal(Math.sign(p.leftArm.rotation.x), -Math.sign(p.leftLeg.rotation.x), 'bras opposé à la jambe');
    animerMarche(a, 1.0, 0);
    assert.equal(p.leftLeg.rotation.x, 0);
    assert.equal(p.rightArm.rotation.x, 0);
});

test('animerVie fait cligner les yeux puis les rouvre', () => {
    const a = buildAvatar3D(DEFAULT_AVATAR);
    // sous Node pas de canevas : on simule le visage dessiné (deux images)
    const v = { mat: { map: 'ouverts' }, tex: { ouverts: 'ouverts', fermes: 'fermes' }, prochainClin: 0.01, ferme: false };
    a.userData.visage = v;
    animerVie(a, 0, 0.05);
    assert.equal(v.mat.map, 'fermes', 'yeux fermés');
    for (let i = 0; i < 10; i++) animerVie(a, i * 0.05, 0.05);
    assert.equal(v.mat.map, 'ouverts', 'yeux rouverts');
    assert.ok(v.prochainClin > 1, 'prochain clignement programmé');
});
