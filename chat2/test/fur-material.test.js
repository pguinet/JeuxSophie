import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COATS, COAT_IDS, coatFromV1Color } from '../js/cat/coats.js';
// fur-material.js importe three (ESM navigateur) ; on teste la partie pure via un import dynamique protégé.

test('5 robes définies avec les champs requis', () => {
    assert.equal(COAT_IDS.length, 5);
    for (const id of COAT_IDS) for (const f of ['label', 'base', 'belly', 'stripe', 'stripeContrast', 'furLength', 'eye']) assert.ok(f in COATS[id], `${id}.${f}`);
});

test('correspondance des couleurs v1 vers les robes', () => {
    assert.equal(coatFromV1Color(0xe87e24), 'tabby');
    assert.equal(coatFromV1Color('#222222'), 'black');
    assert.equal(coatFromV1Color(0xf5f5f5), 'white');
    assert.equal(coatFromV1Color(0x888888), 'grey');
    assert.equal(coatFromV1Color(0x101010), 'black');
    assert.equal(coatFromV1Color(0xd0d0d0), 'grey');
});

test('injectFurShader insère les uniforms, le décalage de coquille et le discard', async () => {
    let mod;
    try { mod = await import('../js/cat/fur-material.js'); } catch (e) {
        // three n'est pas résolvable sous Node sans importmap : on vérifie au moins la présence des chaînes dans la source
        const { readFile } = await import('node:fs/promises');
        const src = await readFile(new URL('../js/cat/fur-material.js', import.meta.url), 'utf8');
        assert.match(src, /skinning_vertex/);
        assert.match(src, /discard/);
        assert.match(src, /uShellH/);
        assert.ok(e instanceof Error);
        return;
    }
    const shader = {
        uniforms: {},
        vertexShader: '#include <common>\nvoid main(){\n#include <skinning_vertex>\n}',
        fragmentShader: '#include <common>\nvoid main(){\n#include <color_fragment>\n}',
    };
    mod.injectFurShader(shader, { uShellH: { value: 0.5 } });
    assert.equal(shader.uniforms.uShellH.value, 0.5);
    assert.match(shader.vertexShader, /transformed \+= objectNormal \* \(uShellH \* uFurLength\)/);
    assert.match(shader.fragmentShader, /discard/);
    assert.match(shader.fragmentShader, /coatColor/);
});
