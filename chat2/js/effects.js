// Effets d'interface : textes flottants et cœurs projetés depuis une position 3D.
import * as THREE from 'three';

export class Effects {
    constructor(container, camera) {
        this.container = container;
        this.camera = camera;
        this.layer = document.createElement('div');
        this.layer.className = 'fx-layer';
        container.appendChild(this.layer);
        this._v = new THREE.Vector3();
    }

    _toScreen(pos) {
        this._v.copy(pos).project(this.camera);
        return [(this._v.x * 0.5 + 0.5) * this.container.clientWidth, (-this._v.y * 0.5 + 0.5) * this.container.clientHeight];
    }

    /** Texte qui monte et s'efface (ex. « Miaou ! », « +30 »). */
    text(pos, str, color = '#fff') {
        const [x, y] = this._toScreen(pos);
        const el = document.createElement('div');
        el.className = 'fx-text'; el.textContent = str; el.style.left = `${x}px`; el.style.top = `${y}px`; el.style.color = color;
        this.layer.appendChild(el);
        setTimeout(() => el.remove(), 1400);
    }

    /** Pluie de cœurs (ou autre emoji). */
    burst(pos, emoji = '💗', count = 6) {
        const [x, y] = this._toScreen(pos);
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'fx-heart'; el.textContent = emoji;
            el.style.left = `${x + (Math.random() - 0.5) * 80}px`; el.style.top = `${y + (Math.random() - 0.5) * 30}px`;
            el.style.animationDelay = `${Math.random() * 0.3}s`; el.style.fontSize = `${18 + Math.random() * 14}px`;
            this.layer.appendChild(el);
            setTimeout(() => el.remove(), 1800);
        }
    }
}
