// Choix de la robe au premier lancement (le chat 3D tourne derrière l'écran de choix).
import { COATS, COAT_IDS } from './cat/coats.js';

/**
 * @param {HTMLElement} container
 * @param {{ initial: string, canImportV1: boolean, onPreview(id), onConfirm(id), onImportV1() }} opts
 */
export function showColorPicker(container, opts) {
    const root = document.createElement('div');
    root.id = 'picker';
    root.innerHTML = `<h1>Choisis ton chat 🐈</h1>`;
    const list = document.createElement('div'); list.className = 'coat-list';
    let current = opts.initial;
    const buttons = {};
    for (const id of COAT_IDS) {
        const c = COATS[id];
        const b = document.createElement('button');
        b.className = 'glass coat-btn' + (id === current ? ' active' : '');
        b.innerHTML = `<div class="coat-swatch" style="background:${c.ui}"></div><div>${c.label}</div>`;
        b.addEventListener('click', () => { current = id; for (const [k, x] of Object.entries(buttons)) x.classList.toggle('active', k === id); opts.onPreview(id); });
        list.appendChild(b); buttons[id] = b;
    }
    root.appendChild(list);
    const ok = document.createElement('button'); ok.className = 'primary-btn'; ok.textContent = 'C\'est lui ! 💖';
    ok.addEventListener('click', () => { root.remove(); opts.onConfirm(current); });
    root.appendChild(ok);
    if (opts.canImportV1) {
        const imp = document.createElement('button'); imp.className = 'secondary-btn'; imp.textContent = 'Reprendre mon chat de la version 1 🐱';
        imp.addEventListener('click', () => { root.remove(); opts.onImportV1(); });
        root.appendChild(imp);
    }
    container.appendChild(root);
    return root;
}
