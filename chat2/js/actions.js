// Barre d'actions (bas de l'écran) : 5 boutons ronds avec temps de recharge.
import { ACTION_COOLDOWN } from './needs.js';

const BUTTONS = [
    { id: 'feed', icon: '🍖', label: 'Nourrir' },
    { id: 'drink', icon: '💧', label: 'À boire' },
    { id: 'pet', icon: '🤗', label: 'Caresser' },
    { id: 'wash', icon: '🧼', label: 'Laver' },
    { id: 'sleep', icon: '😴', label: 'Dodo' },
];

export class ActionBar {
    constructor(container, onAction) {
        this.root = document.createElement('div');
        this.root.className = 'action-bar';
        this.cooldowns = {};
        this.buttons = {};
        for (const b of BUTTONS) {
            const wrap = document.createElement('div'); wrap.className = 'action';
            const btn = document.createElement('button'); btn.className = 'glass round-btn action-btn'; btn.textContent = b.icon; btn.title = b.label;
            const ring = document.createElement('div'); ring.className = 'cooldown'; btn.appendChild(ring);
            const label = document.createElement('div'); label.className = 'action-label'; label.textContent = b.label;
            wrap.append(btn, label);
            this.root.appendChild(wrap);
            this.buttons[b.id] = { btn, ring };
            this.cooldowns[b.id] = 0;
            btn.addEventListener('click', () => {
                if (this.cooldowns[b.id] > 0) return;
                this.cooldowns[b.id] = ACTION_COOLDOWN;
                btn.classList.add('cooling');
                onAction(b.id);
            });
        }
        container.appendChild(this.root);
    }

    update(dt) {
        for (const id of Object.keys(this.cooldowns)) {
            if (this.cooldowns[id] <= 0) continue;
            this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);
            const frac = this.cooldowns[id] / ACTION_COOLDOWN;
            const { btn, ring } = this.buttons[id];
            ring.style.background = `conic-gradient(rgba(0,0,0,.45) ${frac * 360}deg, transparent 0deg)`;
            if (this.cooldowns[id] === 0) { btn.classList.remove('cooling'); ring.style.background = 'none'; }
        }
    }
}
