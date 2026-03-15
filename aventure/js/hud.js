export class HUD {
    constructor(container) {
        this.maxHealth = 100;
        this.health = 100;
        this.coins = 0;

        // Main HUD overlay
        this.hudEl = document.createElement('div');
        this.hudEl.id = 'hud-overlay';
        Object.assign(this.hudEl.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '20',
            fontFamily: "'Segoe UI', Arial, sans-serif",
        });
        container.appendChild(this.hudEl);

        // Build health bar
        this._buildHealthBar();

        // Build coin counter
        this._buildCoinCounter();

        // Build damage flash overlay
        this._buildDamageFlash();
    }

    _buildHealthBar() {
        const wrapper = document.createElement('div');
        Object.assign(wrapper.style, {
            position: 'absolute',
            top: '10px',
            left: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        });

        // Heart emoji
        const heart = document.createElement('span');
        heart.textContent = '\u2764\uFE0F';
        heart.style.fontSize = '22px';
        wrapper.appendChild(heart);

        // Health bar container
        const barContainer = document.createElement('div');
        Object.assign(barContainer.style, {
            width: '200px',
            height: '25px',
            border: '2px solid white',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            position: 'relative',
        });

        // Health bar fill
        this.healthBarFill = document.createElement('div');
        Object.assign(this.healthBarFill.style, {
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to right, #2ecc40, #01ff70)',
            borderRadius: '10px',
            transition: 'width 0.3s ease, background 0.3s ease',
        });
        barContainer.appendChild(this.healthBarFill);

        wrapper.appendChild(barContainer);

        // Health text
        this.healthText = document.createElement('span');
        Object.assign(this.healthText.style, {
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
        });
        this.healthText.textContent = '100/100';
        wrapper.appendChild(this.healthText);

        this.hudEl.appendChild(wrapper);
    }

    _buildCoinCounter() {
        const wrapper = document.createElement('div');
        Object.assign(wrapper.style, {
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
        });

        const coinEmoji = document.createElement('span');
        coinEmoji.textContent = '\uD83E\uDE99';
        coinEmoji.style.fontSize = '26px';
        wrapper.appendChild(coinEmoji);

        this.coinText = document.createElement('span');
        Object.assign(this.coinText.style, {
            color: '#ffd700',
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
        });
        this.coinText.textContent = '0';
        wrapper.appendChild(this.coinText);

        this.hudEl.appendChild(wrapper);
    }

    _buildDamageFlash() {
        this.damageFlash = document.createElement('div');
        Object.assign(this.damageFlash.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'red',
            opacity: '0',
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
        });
        this.hudEl.appendChild(this.damageFlash);
    }

    updateHealth(amount) {
        this.health = Math.max(0, Math.min(this.maxHealth, this.health + amount));

        const pct = this.health / this.maxHealth;
        this.healthBarFill.style.width = `${pct * 100}%`;

        // Color based on health percentage
        if (pct > 0.6) {
            this.healthBarFill.style.background = 'linear-gradient(to right, #2ecc40, #01ff70)';
        } else if (pct > 0.3) {
            this.healthBarFill.style.background = 'linear-gradient(to right, #f1c40f, #f39c12)';
        } else {
            this.healthBarFill.style.background = 'linear-gradient(to right, #e74c3c, #c0392b)';
        }

        this.healthText.textContent = `${Math.round(this.health)}/${this.maxHealth}`;

        if (amount < 0) {
            this.showDamageFlash();
        }

        return this.health <= 0;
    }

    addCoins(amount) {
        this.coins += amount;
        this.coinText.textContent = `${this.coins}`;

        // Scale-up animation
        this.coinText.style.transform = 'scale(1.4)';
        setTimeout(() => {
            this.coinText.style.transform = 'scale(1)';
        }, 200);
    }

    reset() {
        this.health = this.maxHealth;
        this.coins = 0;

        this.healthBarFill.style.width = '100%';
        this.healthBarFill.style.background = 'linear-gradient(to right, #2ecc40, #01ff70)';
        this.healthText.textContent = `${this.maxHealth}/${this.maxHealth}`;
        this.coinText.textContent = '0';
        this.damageFlash.style.opacity = '0';
    }

    showDamageFlash() {
        this.damageFlash.style.opacity = '0.3';
        setTimeout(() => {
            this.damageFlash.style.opacity = '0';
        }, 50);
    }
}
