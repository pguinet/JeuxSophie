export class HUD {
    constructor(container) {
        this.needs = {
            hunger:    { value: 80, icon: '🍖', label: 'Faim',     rate: -1 / 60 },
            thirst:    { value: 80, icon: '💧', label: 'Soif',     rate: -1.5 / 60 },
            happiness: { value: 80, icon: '😸', label: 'Bonheur',  rate: -0.8 / 60 },
            hygiene:   { value: 80, icon: '🧼', label: 'Propreté', rate: -0.5 / 60 },
            fatigue:   { value: 20, icon: '😴', label: 'Fatigue',  rate: 0.7 / 60 },
        };

        this.coins = 0;
        this.playTime = 0;
        this.lastCoinTime = 0;

        this.hudEl = document.createElement('div');
        Object.assign(this.hudEl.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            pointerEvents: 'none',
            zIndex: '20',
            fontFamily: "'Segoe UI', Arial, sans-serif",
        });
        container.appendChild(this.hudEl);

        this._buildBars();
        this._buildCoinCounter();
    }

    _buildBars() {
        this.barContainer = document.createElement('div');
        Object.assign(this.barContainer.style, {
            position: 'absolute',
            top: '8px',
            left: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
        });

        this.bars = {};
        for (const [key, need] of Object.entries(this.needs)) {
            const row = document.createElement('div');
            Object.assign(row.style, {
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(0,0,0,0.35)',
                borderRadius: '6px',
                padding: '2px 6px',
            });

            const icon = document.createElement('span');
            icon.textContent = need.icon;
            icon.style.fontSize = '14px';
            row.appendChild(icon);

            const barBg = document.createElement('div');
            Object.assign(barBg.style, {
                width: '90px',
                height: '8px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
                overflow: 'hidden',
            });

            const barFill = document.createElement('div');
            Object.assign(barFill.style, {
                width: '80%',
                height: '100%',
                background: '#2ecc40',
                borderRadius: '4px',
                transition: 'width 0.5s ease, background 0.3s ease',
            });
            barBg.appendChild(barFill);
            row.appendChild(barBg);

            const valueText = document.createElement('span');
            Object.assign(valueText.style, {
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                minWidth: '24px',
                textAlign: 'right',
            });
            valueText.textContent = '80';
            row.appendChild(valueText);

            this.barContainer.appendChild(row);
            this.bars[key] = { fill: barFill, text: valueText };
        }

        this.hudEl.appendChild(this.barContainer);
    }

    _buildCoinCounter() {
        const wrapper = document.createElement('div');
        Object.assign(wrapper.style, {
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(0,0,0,0.35)',
            borderRadius: '6px',
            padding: '4px 8px',
        });

        const coinIcon = document.createElement('span');
        coinIcon.textContent = '🪙';
        coinIcon.style.fontSize = '18px';
        wrapper.appendChild(coinIcon);

        this.coinText = document.createElement('span');
        Object.assign(this.coinText.style, {
            color: '#ffd700',
            fontSize: '18px',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        });
        this.coinText.textContent = '0';
        wrapper.appendChild(this.coinText);

        this.hudEl.appendChild(wrapper);
    }

    _getBarColor(key, value) {
        if (key === 'fatigue') {
            if (value < 40) return '#2ecc40';
            if (value < 70) return '#f39c12';
            return '#e74c3c';
        }
        if (value > 60) return '#2ecc40';
        if (value > 30) return '#f39c12';
        return '#e74c3c';
    }

    _updateBar(key) {
        const need = this.needs[key];
        const bar = this.bars[key];
        const pct = Math.max(0, Math.min(100, need.value));
        bar.fill.style.width = `${pct}%`;
        bar.fill.style.background = this._getBarColor(key, pct);
        bar.text.textContent = Math.round(pct);
    }

    update(delta) {
        for (const [key, need] of Object.entries(this.needs)) {
            need.value = Math.max(0, Math.min(100, need.value + need.rate * delta));
            this._updateBar(key);
        }

        // +1 pièce par minute de jeu
        this.playTime += delta;
        if (this.playTime - this.lastCoinTime >= 60) {
            this.lastCoinTime = this.playTime;
            this.addCoins(1);
        }
    }

    addCoins(n) {
        this.coins += n;
        this.coinText.textContent = this.coins.toString();
    }

    feed()  { this.needs.hunger.value = Math.min(100, this.needs.hunger.value + 25); this._updateBar('hunger'); }
    drink() { this.needs.thirst.value = Math.min(100, this.needs.thirst.value + 25); this._updateBar('thirst'); }
    pet()   { this.needs.happiness.value = Math.min(100, this.needs.happiness.value + 20); this._updateBar('happiness'); }
    wash()  { this.needs.hygiene.value = Math.min(100, this.needs.hygiene.value + 30); this._updateBar('hygiene'); }
    sleep() { this.needs.fatigue.value = Math.max(0, this.needs.fatigue.value - 30); this._updateBar('fatigue'); }

    getState() {
        const state = {};
        for (const [key, need] of Object.entries(this.needs)) {
            state[key] = need.value;
        }
        state.coins = this.coins;
        return state;
    }

    loadState(state) {
        for (const [key, need] of Object.entries(this.needs)) {
            if (state[key] !== undefined) need.value = state[key];
            this._updateBar(key);
        }
        if (state.coins !== undefined) {
            this.coins = state.coins;
            this.coinText.textContent = this.coins.toString();
        }
    }
}
