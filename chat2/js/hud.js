// Jauges et pièces (panneau « verre » en haut à gauche).
import { NEED_DEFS, NEED_KEYS, needLevel } from './needs.js';

export class HUD {
    constructor(container) {
        this.root = document.createElement('div');
        this.root.className = 'glass panel hud';
        this.bars = {};
        for (const key of NEED_KEYS) {
            const def = NEED_DEFS[key];
            const row = document.createElement('div'); row.className = 'need-row';
            row.innerHTML = `<span class="need-icon">${def.icon}</span><span class="need-label">${def.label}</span><div class="need-bar"><div class="need-fill"></div></div>`;
            this.root.appendChild(row);
            this.bars[key] = { fill: row.querySelector('.need-fill'), row };
        }
        const coins = document.createElement('div'); coins.className = 'coins';
        coins.innerHTML = `<span class="coin-icon">🪙</span><span class="coin-value">0</span>`;
        this.root.appendChild(coins);
        this.coinValue = coins.querySelector('.coin-value');
        container.appendChild(this.root);
        this.lastCoins = -1;
    }

    update(needs, coins) {
        for (const key of NEED_KEYS) {
            const level = needLevel(key, needs[key]);
            const b = this.bars[key];
            b.fill.style.width = `${Math.round(level * 100)}%`;
            const hue = 8 + level * 110; // rouge → vert
            b.fill.style.background = `linear-gradient(90deg, hsl(${hue}, 85%, 55%), hsl(${hue + 15}, 90%, 62%))`;
            b.row.classList.toggle('alert', level < 0.25);
        }
        if (coins !== this.lastCoins) { this.coinValue.textContent = String(coins); this.lastCoins = coins; if (coins > 0) { this.coinValue.classList.remove('pop'); void this.coinValue.offsetWidth; this.coinValue.classList.add('pop'); } }
    }
}
