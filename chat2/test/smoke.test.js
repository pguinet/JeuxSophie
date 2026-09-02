import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test("l'importmap de chat2 expose three et three/addons/", async () => {
    const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /"three":\s*"\/vendor\/three@0\.170\.0\/three\.module\.js"/);
    assert.match(html, /"three\/addons\/":\s*"\/vendor\/three@0\.170\.0\/examples\/jsm\/"/);
});
