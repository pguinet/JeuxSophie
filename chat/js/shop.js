export class Shop {
    constructor(container, hud) {
        this.container = container;
        this.hud = hud;
        this.onBuy = null;
        this.purchased = {};

        this.items = [
            { id: 'ball',       icon: '⚽', name: 'Balle',        price: 10, effect: 'bonheur +15', type: 'toy' },
            { id: 'mouse',      icon: '🐭', name: 'Souris jouet', price: 15, effect: 'bonheur +20', type: 'toy' },
            { id: 'fish',       icon: '🐟', name: 'Poisson',      price: 5,  effect: 'faim +40',    type: 'food' },
            { id: 'cushion_lux',icon: '💜', name: 'Coussin luxe', price: 30, effect: 'fatigue -40', type: 'upgrade' },
            { id: 'collar',     icon: '📿', name: 'Collier',      price: 20, effect: 'accessoire',  type: 'accessory' },
            { id: 'bow',        icon: '🎀', name: 'Noeud',        price: 10, effect: 'accessoire',  type: 'accessory' },
        ];

        this._buildButton();
        this._buildOverlay();
    }

    _buildButton() {
        this.shopBtn = document.createElement('div');
        Object.assign(this.shopBtn.style, {
            position: 'absolute',
            top: '8px',
            right: '80px',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.4)',
            border: '2px solid rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: '20',
            pointerEvents: 'auto',
        });
        this.shopBtn.textContent = '🛒';

        const handler = (e) => {
            if (e.type === 'touchstart') e.preventDefault();
            this._toggle();
        };
        this.shopBtn.addEventListener('touchstart', handler);
        this.shopBtn.addEventListener('click', handler);

        this.container.appendChild(this.shopBtn);
    }

    _buildOverlay() {
        this.overlay = document.createElement('div');
        Object.assign(this.overlay.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.8)',
            display: 'none',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '40',
            pointerEvents: 'auto',
            fontFamily: "'Segoe UI', Arial, sans-serif",
        });

        // Titre
        const title = document.createElement('div');
        Object.assign(title.style, {
            color: '#ffd700',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '15px',
        });
        title.textContent = '🛒 Boutique';
        this.overlay.appendChild(title);

        // Solde
        this.balanceText = document.createElement('div');
        Object.assign(this.balanceText.style, {
            color: '#ffd700',
            fontSize: '18px',
            marginBottom: '15px',
        });
        this.overlay.appendChild(this.balanceText);

        // Grille d'items
        const grid = document.createElement('div');
        Object.assign(grid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            maxWidth: '320px',
            padding: '0 10px',
        });

        this.itemEls = {};
        for (const item of this.items) {
            const card = document.createElement('div');
            Object.assign(card.style, {
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                border: '2px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
            });

            const icon = document.createElement('div');
            icon.textContent = item.icon;
            icon.style.fontSize = '28px';
            card.appendChild(icon);

            const name = document.createElement('div');
            Object.assign(name.style, { color: 'white', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' });
            name.textContent = item.name;
            card.appendChild(name);

            const price = document.createElement('div');
            Object.assign(price.style, { color: '#ffd700', fontSize: '12px' });
            price.textContent = `${item.price} 🪙`;
            card.appendChild(price);

            const effect = document.createElement('div');
            Object.assign(effect.style, { color: '#aaa', fontSize: '9px' });
            effect.textContent = item.effect;
            card.appendChild(effect);

            const buyHandler = (e) => {
                if (e.type === 'touchstart') e.preventDefault();
                this._buyItem(item, card);
            };
            card.addEventListener('touchstart', buyHandler);
            card.addEventListener('click', buyHandler);

            grid.appendChild(card);
            this.itemEls[item.id] = card;
        }

        this.overlay.appendChild(grid);

        // Bouton fermer
        const closeBtn = document.createElement('div');
        Object.assign(closeBtn.style, {
            color: 'white',
            fontSize: '18px',
            marginTop: '20px',
            padding: '8px 30px',
            background: 'rgba(200,50,30,0.6)',
            borderRadius: '8px',
            border: '2px solid rgba(255,255,255,0.5)',
            cursor: 'pointer',
        });
        closeBtn.textContent = 'Fermer';
        const closeHandler = (e) => {
            if (e.type === 'touchstart') e.preventDefault();
            this._toggle();
        };
        closeBtn.addEventListener('touchstart', closeHandler);
        closeBtn.addEventListener('click', closeHandler);
        this.overlay.appendChild(closeBtn);

        this.container.appendChild(this.overlay);
    }

    _toggle() {
        const visible = this.overlay.style.display === 'flex';
        this.overlay.style.display = visible ? 'none' : 'flex';
        if (!visible) {
            this._updateBalance();
        }
    }

    _updateBalance() {
        this.balanceText.textContent = `Tes pièces : ${this.hud.coins} 🪙`;
    }

    _buyItem(item, card) {
        if (this.hud.coins < item.price) {
            card.style.background = 'rgba(200,50,30,0.3)';
            setTimeout(() => { card.style.background = 'rgba(255,255,255,0.1)'; }, 300);
            return;
        }

        this.hud.coins -= item.price;
        this.hud.coinText.textContent = this.hud.coins.toString();
        this._updateBalance();

        // Animation achat
        card.style.background = 'rgba(50,200,50,0.3)';
        setTimeout(() => { card.style.background = 'rgba(255,255,255,0.1)'; }, 500);

        this.purchased[item.id] = (this.purchased[item.id] || 0) + 1;

        if (this.onBuy) this.onBuy(item);
    }

    getPurchased() {
        return { ...this.purchased };
    }

    loadPurchased(data) {
        if (data) this.purchased = { ...data };
    }
}
