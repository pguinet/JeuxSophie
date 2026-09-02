// Boutique (interface) : liste des objets, achat, affichage des pièces.
import { ITEMS, canBuy, buy } from './shop-logic.js';

export class Shop {
    /**
     * @param {HTMLElement} container
     * @param {object} wallet état pur (shop-logic)
     * @param {(item) => void} onBuy
     */
    constructor(container, wallet, onBuy) {
        this.wallet = wallet;
        this.onBuy = onBuy;
        this.btn = document.createElement('button');
        this.btn.className = 'glass round-btn shop-btn'; this.btn.textContent = '🛒'; this.btn.title = 'Boutique';
        container.appendChild(this.btn);
        this.panel = document.createElement('div');
        this.panel.className = 'glass panel shop-panel'; this.panel.hidden = true;
        this.panel.innerHTML = `<div class="panel-title">Boutique 🛒</div><div class="shop-coins">🪙 <span class="shop-coin-value">0</span></div>`;
        this.coinEl = this.panel.querySelector('.shop-coin-value');
        this.rows = {};
        for (const item of ITEMS) {
            const row = document.createElement('div'); row.className = 'shop-item';
            row.innerHTML = `<div class="shop-icon">${item.icon}</div><div><div class="shop-name">${item.name}</div><div class="shop-desc">${item.desc}</div></div><button class="buy-btn">${item.price} 🪙</button>`;
            const b = row.querySelector('.buy-btn');
            b.addEventListener('click', () => {
                const bought = buy(this.wallet, item.id);
                if (bought) { this.onBuy(bought); this.refresh(); }
            });
            this.panel.appendChild(row);
            this.rows[item.id] = { row, btn: b };
        }
        container.appendChild(this.panel);
        this.btn.addEventListener('click', () => { this.panel.hidden = !this.panel.hidden; if (!this.panel.hidden) this.refresh(); });
        this.refresh();
    }

    refresh() {
        this.coinEl.textContent = String(this.wallet.coins);
        for (const item of ITEMS) {
            const { row, btn } = this.rows[item.id];
            const check = canBuy(this.wallet, item.id);
            btn.disabled = !check.ok;
            row.classList.toggle('owned', check.reason === 'déjà acheté');
            btn.textContent = check.reason === 'déjà acheté' ? 'Acheté ✓' : `${item.price} 🪙`;
        }
    }

    close() { this.panel.hidden = true; }
}
