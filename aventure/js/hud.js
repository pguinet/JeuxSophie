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

        // Build inventory bar
        this._buildInventory();
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

    _buildInventory() {
        this.healKits = 5;

        const bar = document.createElement('div');
        Object.assign(bar.style, {
            position: 'absolute',
            bottom: '15px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            pointerEvents: 'auto',
        });

        const slotStyle = {
            width: '60px',
            height: '60px',
            border: '2px solid rgba(255,255,255,0.6)',
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            WebkitUserSelect: 'none',
        };

        // Bouclier
        const shieldSlot = document.createElement('div');
        Object.assign(shieldSlot.style, slotStyle);
        shieldSlot.style.cursor = 'pointer';
        const shieldIcon = document.createElement('div');
        shieldIcon.textContent = '\uD83D\uDEE1\uFE0F';
        shieldIcon.style.fontSize = '28px';
        shieldSlot.appendChild(shieldIcon);
        const shieldLabel = document.createElement('div');
        shieldLabel.textContent = '1';
        Object.assign(shieldLabel.style, { color: 'white', fontSize: '11px', fontWeight: 'bold' });
        shieldSlot.appendChild(shieldLabel);
        bar.appendChild(shieldSlot);
        this.shieldSlot = shieldSlot;
        this.shieldLabel = shieldLabel;
        this.shieldCount = 1;
        this.shieldActive = false;

        shieldSlot.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._useShield();
        });
        shieldSlot.addEventListener('click', () => this._useShield());

        // Pistolet
        const gunSlot = document.createElement('div');
        Object.assign(gunSlot.style, slotStyle);
        gunSlot.style.cursor = 'pointer';
        const gunIcon = document.createElement('div');
        gunIcon.textContent = '\uD83D\uDD2B';
        gunIcon.style.fontSize = '28px';
        gunSlot.appendChild(gunIcon);
        const gunLabel = document.createElement('div');
        gunLabel.textContent = '\u221E';
        Object.assign(gunLabel.style, { color: 'white', fontSize: '11px', fontWeight: 'bold' });
        gunSlot.appendChild(gunLabel);
        bar.appendChild(gunSlot);
        this.gunSlot = gunSlot;

        // Kit de soin
        const healSlot = document.createElement('div');
        Object.assign(healSlot.style, slotStyle);
        healSlot.style.cursor = 'pointer';
        const healIcon = document.createElement('div');
        healIcon.textContent = '\u2764\uFE0F\u200D\uD83E\uDE79';
        healIcon.style.fontSize = '28px';
        healSlot.appendChild(healIcon);
        this.healLabel = document.createElement('div');
        this.healLabel.textContent = '5';
        Object.assign(this.healLabel.style, { color: 'white', fontSize: '11px', fontWeight: 'bold' });
        healSlot.appendChild(this.healLabel);
        bar.appendChild(healSlot);
        this.healSlot = healSlot;

        healSlot.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._useHealKit();
        });
        healSlot.addEventListener('click', () => this._useHealKit());

        this.hudEl.appendChild(bar);
    }

    _useShield() {
        if (this.shieldCount <= 0 || this.shieldActive) return;
        this.shieldActive = true;
        this.shieldCount--;
        this.shieldLabel.textContent = this.shieldCount.toString();
        this.shieldSlot.style.borderColor = '#44aaff';
        this.shieldSlot.style.boxShadow = '0 0 10px #44aaff';
        // Le bouclier dure 10 secondes et réduit les dégâts de moitié
        setTimeout(() => {
            this.shieldActive = false;
            this.shieldSlot.style.borderColor = 'rgba(255,255,255,0.6)';
            this.shieldSlot.style.boxShadow = 'none';
        }, 10000);
    }

    _useHealKit() {
        if (this.healKits <= 0 || this.health >= this.maxHealth) return;
        this.healKits--;
        this.healLabel.textContent = this.healKits.toString();
        this.updateHealth(30);
        // Animation
        this.healSlot.style.borderColor = '#22cc22';
        this.healSlot.style.boxShadow = '0 0 10px #22cc22';
        setTimeout(() => {
            this.healSlot.style.borderColor = 'rgba(255,255,255,0.6)';
            this.healSlot.style.boxShadow = 'none';
        }, 500);
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

        // Reset inventaire
        this.shieldCount = 1;
        this.shieldActive = false;
        this.shieldLabel.textContent = '1';
        this.shieldSlot.style.borderColor = 'rgba(255,255,255,0.6)';
        this.shieldSlot.style.boxShadow = 'none';
        this.healKits = 5;
        this.healLabel.textContent = '5';
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
